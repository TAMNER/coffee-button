import { describe, expect, it } from "vitest";
import { LedgerMover, type MoneyMover } from "./money-mover";

/**
 * The MoneyMover contract every implementation must pass. The ledger is the
 * only V1 implementation; a Starling Space mover (DESIGN.md, deferred) would be
 * added to this list.
 */
const movers: { name: string; make(): MoneyMover }[] = [{ name: "LedgerMover", make: () => new LedgerMover() }];

describe.each(movers)("MoneyMover contract: $name", ({ make }) => {
  it("resolves (never rejects) to { ok: true } or { ok: false, error } for a £3.50 press", async () => {
    const result = await make().move(350, { pressId: "p1" });

    const shapeOk = result.ok === true ? Object.keys(result).length === 1 : typeof result.error === "string" && result.error.length > 0;
    expect(shapeOk).toBe(true);
  });
});

describe("LedgerMover", () => {
  it("reports ok: the press is already in the ledger, so there is nothing to move", async () => {
    expect(await new LedgerMover().move(350, { pressId: "p1" })).toEqual({ ok: true });
  });
});
