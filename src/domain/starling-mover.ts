/**
 * Per-press Starling Space transfers (ticket 20).
 */
import { StarlingAuthError, StarlingRateLimited } from "./starling";
import type { MoneyMover, MoveRef, MoveResult } from "./money-mover";
import type { Press, PressTransfer, StarlingLink, Store } from "./store";

/** Error names and messages from starling.ts never carry the token or request details. */
function errorText(err: unknown): string {
  return err instanceof Error ? err.message || err.name : "Unknown error";
}

/** How long to wait after a 429 that carried no usable Retry-After. */
export const RATE_LIMIT_FALLBACK_MS = 60_000;

const isWaiting = (p: Press) => p.transfer?.state === "waiting";

/** How many presses still have money to move. */
export function waitingCount(presses: readonly Press[]): number {
  return presses.filter(isWaiting).length;
}

/** Pence still to move into the Space. */
export function waitingTotal(presses: readonly Press[]): number {
  return presses.filter(isWaiting).reduce((sum, p) => sum + p.pricePence, 0);
}

/** The part of StarlingClient the mover needs (duck-typed so tests pass a fake). */
export interface StarlingTransfers {
  addMoney(accountUid: string, spaceUid: string, transferUid: string, amountPence: number, reference: string): Promise<unknown>;
}

/** setTimeout and clearTimeout, injectable for tests. */
export interface Timers {
  set(fn: () => void, ms: number): unknown;
  clear(handle: unknown): void;
}

export const browserTimers: Timers = {
  set: (fn, ms) => setTimeout(fn, ms),
  clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export interface StarlingMoverOptions {
  timers?: Timers;
  newUid?: () => string;
  /** How long the undo toast stays up; the transfer fires when it closes. */
  undoMs?: number;
}

/**
 * A MoneyMover that moves each press's price into the linked Starling Space
 * once the press survives the undo window. The queue is the presses
 * themselves: a press marked waiting is retried until moved or failed.
 */
export class StarlingMover implements MoneyMover {
  private readonly timers: Timers;
  private readonly newUid: () => string;
  private readonly undoMs: number;
  private chain: Promise<void> = Promise.resolve();
  /** Presses still inside their undo window, with the timer that closes it. */
  private readonly pending = new Map<string, unknown>();
  /** The timer that resumes the queue after a 429, while one is armed. */
  private backoff: unknown;

  constructor(
    private readonly store: Store,
    private readonly clientFor: (link: StarlingLink) => StarlingTransfers,
    opts: StarlingMoverOptions = {},
  ) {
    this.timers = opts.timers ?? browserTimers;
    this.newUid = opts.newUid ?? (() => crypto.randomUUID());
    this.undoMs = opts.undoMs ?? 5000;
  }

  /** Called right after the press is recorded: marks it waiting and arms the undo-window timer. */
  async move(_amountPence: number, ref: MoveRef): Promise<MoveResult> {
    try {
      await this.schedule(ref.pressId);
    } catch (err) {
      return { ok: false, error: err instanceof Error && err.message ? err.message : "Could not schedule the transfer" };
    }
    return { ok: true };
  }

  async schedule(pressId: string): Promise<void> {
    const press = await this.store.presses.get(pressId);
    if (!press) return;
    if (!press.transfer) {
      press.transfer = { state: "waiting", transferUid: this.newUid() };
      await this.store.presses.put(press);
    }
    this.pending.set(
      pressId,
      this.timers.set(() => {
        this.pending.delete(pressId);
        void this.drain();
      }, this.undoMs),
    );
  }

  /** Undo inside the window: the transfer never fires. The ledger's undo deletes the press itself. */
  cancel(ref: MoveRef): void {
    this.timers.clear(this.pending.get(ref.pressId));
    this.pending.delete(ref.pressId);
  }

  /** Moves every waiting press whose undo window has closed, oldest first, one at a time. */
  drain(): Promise<void> {
    this.chain = this.chain.then(() => this.runQueue()).catch((err) => console.error("Starling queue failed", err));
    return this.chain;
  }

  private async runQueue(): Promise<void> {
    const { starling: link, starlingAuthFailed } = await this.store.getSettings();
    // After a 401/403 nothing is tried until the link is saved again.
    if (!link || starlingAuthFailed) return;
    // Starling asked us to slow down; the back-off timer resumes the queue.
    if (this.backoff !== undefined) return;
    const client = this.clientFor(link);
    const queue = (await this.store.presses.list())
      .filter((p) => isWaiting(p) && !this.pending.has(p.id))
      .sort((a, b) => a.at - b.at);
    for (const press of queue) {
      if (!(await this.fire(client, link, press))) return;
    }
  }

  /** One attempt at one press. Resolves false when the queue should stop for now. */
  private async fire(client: StarlingTransfers, link: StarlingLink, press: Press): Promise<boolean> {
    const transfer = press.transfer!;
    const item = await this.store.items.get(press.itemId);
    const attempts = (transfer.attempts ?? 0) + 1;
    const save = (next: Partial<PressTransfer>) =>
      this.store.presses.put({ ...press, transfer: { transferUid: transfer.transferUid, state: "waiting", attempts, ...next } });
    try {
      await client.addMoney(
        link.accountUid,
        link.spaceUid,
        transfer.transferUid,
        press.pricePence,
        `Coffee Button: ${item?.name ?? press.itemId}`,
      );
    } catch (err) {
      if (err instanceof StarlingAuthError) {
        await save({ state: "failed", lastError: errorText(err) });
        await this.store.putSettings({ ...(await this.store.getSettings()), starlingAuthFailed: true });
        return false;
      }
      if (err instanceof StarlingRateLimited) {
        await save({ lastError: errorText(err) });
        this.timers.clear(this.backoff);
        this.backoff = this.timers.set(() => {
          this.backoff = undefined;
          void this.drain();
        }, err.retryAfterMs ?? RATE_LIMIT_FALLBACK_MS);
        return false;
      }
      // Offline, relay down (5xx) or anything unexpected: stays waiting for the next launch or return.
      await save({ lastError: errorText(err) });
      return false;
    }
    await save({ state: "moved" });
    return true;
  }

  /** Resolves once every queued transfer attempt has settled. */
  idle(): Promise<void> {
    return this.chain;
  }
}
