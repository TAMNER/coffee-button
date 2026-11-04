import { describe, expect, it } from "vitest";
import { LedgerMover, type MoneyMover } from "./money-mover";
import { StarlingMover } from "./starling-mover";
import { MemoryStore } from "./store";

/**
 * The MoneyMover contract every implementation must pass: the ledger and the
 * Starling Space mover (ticket 20).
 */
const movers: { name: string; make(): MoneyMover }[] = [
  { name: "LedgerMover", make: () => new LedgerMover() },
  {
    name: "StarlingMover",
    make: () => new StarlingMover(new MemoryStore(), () => ({ addMoney: async () => ({}) }), { timers: { set: () => 0, clear: () => {} } }),
  },
];

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
