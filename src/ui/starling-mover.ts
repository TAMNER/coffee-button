/**
 * Per-press Starling transfers (ticket 20). DOM glue over
 * src/domain/starling-mover.ts, which holds the tested behaviour.
 *  - At boot: with a Starling link stored, ctx.mover becomes a StarlingMover
 *    (else the LedgerMover stays) and the waiting queue drains.
 *  - Every return to the app drains the queue again.
 *  - Undo inside the window cancels the scheduled transfer.
 *  - A banner on the cup while Starling has rejected the token.
 */
import { StarlingClient } from "../domain/starling";
import { moverFor, StarlingMover } from "../domain/starling-mover";
import { onStart, type AppContext } from "./app";
import { registerCupExtra, UNDO_MS, type CupContext } from "./cup";

/**
 * The cup's toast timer starts a few milliseconds before the mover's (the
 * mover first writes the press), and an undo tapped at the last instant
 * reaches the mover only after the ledger delete. The grace keeps the transfer
 * firing strictly after any undo could land.
 */
const UNDO_GRACE_MS = 500;

const changeListeners = new Set<() => void>();

/** Called after every transfer attempt (and on link changes) so views can redraw. Returns an unsubscribe. */
export function onStarlingChange(fn: () => void): () => void {
  changeListeners.add(fn);
  return () => changeListeners.delete(fn);
}

function notifyChange(): void {
  for (const fn of changeListeners) {
    try {
      fn();
    } catch (err) {
      console.error("Starling change listener failed", err);
    }
  }
}

function makeStarlingMover(ctx: AppContext): StarlingMover {
  return new StarlingMover(
    ctx.store,
    (link) => new StarlingClient((input, init) => fetch(input, init), link.relayUrl, link.token),
    { undoMs: UNDO_MS + UNDO_GRACE_MS, onSettled: notifyChange },
  );
}

let installing: Promise<void> = Promise.resolve();

/**
 * Installs a StarlingMover now if the phone is linked and it is not already
 * installed, then drains. Used at boot, on every return to the app, and right
 * after Settings links a Space, so a link made mid-session moves the very next press.
 */
export function useStarlingMoverIfLinked(ctx: AppContext): Promise<void> {
  // Serialised, so boot and an early visibilitychange never build two movers.
  installing = installing.then(async () => {
    if (!(ctx.mover instanceof StarlingMover)) {
      ctx.mover = await moverFor(ctx.store, ctx.mover, () => makeStarlingMover(ctx));
    }
    if (ctx.mover instanceof StarlingMover) await ctx.mover.drain();
    else notifyChange();
  }).catch((err) => console.error("Could not start Starling transfers", err));
  return installing;
}

onStart((ctx) => {
  void useStarlingMoverIfLinked(ctx);
  ctx.bus.on("undo", ({ pressId }) => ctx.mover.cancel?.({ pressId }));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void useStarlingMoverIfLinked(ctx);
  });
});

export const AUTH_BANNER_TEXT = "Starling rejected the token. Reconnect in Settings.";

function mountAuthBanner(el: HTMLElement, ctx: CupContext): () => void {
  const banner = document.createElement("p");
  banner.className = "starling-auth-banner";
  banner.setAttribute("role", "status");
  banner.textContent = AUTH_BANNER_TEXT;
  banner.hidden = true;
  el.append(banner);
  let alive = true;
  const refresh = async () => {
    const { starling, starlingAuthFailed } = await ctx.store.getSettings();
    if (alive) banner.hidden = !(starling && starlingAuthFailed);
  };
  void refresh();
  const off = onStarlingChange(() => void refresh());
  return () => {
    alive = false;
    off();
  };
}

registerCupExtra(mountAuthBanner);
