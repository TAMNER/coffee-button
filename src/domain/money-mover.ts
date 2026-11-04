export interface MoveRef {
  pressId: string;
}

export type MoveResult = { ok: true } | { ok: false; error: string };

/**
 * Moves real money when a press happens. LedgerMover is a no-op (money is
 * settled monthly by hand); StarlingMover (src/domain/starling-mover.ts) moves
 * each press into a Starling Space once its undo window closes.
 */
export interface MoneyMover {
  move(amountPence: number, ref: MoveRef): Promise<MoveResult>;
  /** The press was undone inside its undo window: nothing must move for it. */
  cancel?(ref: MoveRef): void;
}

/** The ledger already holds the press; nothing else to do. */
export class LedgerMover implements MoneyMover {
  async move(_amountPence: number, _ref: MoveRef): Promise<MoveResult> {
    return { ok: true };
  }
}
