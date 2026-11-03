export interface MoveRef {
  pressId: string;
}

export type MoveResult = { ok: true } | { ok: false; error: string };

/**
 * Moves real money when a press happens. The ledger is the only V1
 * implementation: money is settled monthly by hand, so moving is a no-op.
 * A Starling Space mover is a documented future implementation (see DESIGN.md).
 */
export interface MoneyMover {
  move(amountPence: number, ref: MoveRef): Promise<MoveResult>;
}

/** The ledger already holds the press; nothing else to do. */
export class LedgerMover implements MoneyMover {
  async move(_amountPence: number, _ref: MoveRef): Promise<MoveResult> {
    return { ok: true };
  }
}
