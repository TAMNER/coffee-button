import { describe, expect, it } from "vitest";
import { Ledger } from "./ledger";
import { shelfHint } from "./shelf-hint";
import { MemoryStore } from "./store";

describe("shelfHint", () => {
  it("before the first press the shelf shows the hint instead of £0.00 sums", () => {
    expect(shelfHint([])).toBe("Tap the cup every time you walk past the café.");
  });

  it("after one press there is no hint: the sums show", async () => {
    const ledger = new Ledger(new MemoryStore());
    await ledger.addPress("coffee", new Date(2026, 10, 16, 8));
    expect(shelfHint(await ledger.presses())).toBeNull();
  });

  it("undoing the only press brings the hint back", async () => {
    const ledger = new Ledger(new MemoryStore());
    const p = await ledger.addPress("coffee", new Date(2026, 10, 16, 8));
    await ledger.undo(p.id);
    expect(shelfHint(await ledger.presses())).toBe("Tap the cup every time you walk past the café.");
  });
});
