import { describe, expect, it } from "vitest";
import { waitingCount, waitingTotal } from "./starling-mover";
import type { Press } from "./store";

const press = (id: string, pricePence: number, state?: "waiting" | "moved" | "failed"): Press => ({
  id,
  itemId: "coffee",
  pricePence,
  at: 0,
  ...(state ? { transfer: { state, transferUid: `t-${id}` } } : {}),
});

describe("waiting presses", () => {
  it("counts and sums only presses whose transfer is waiting", () => {
    const presses = [
      press("a", 350, "waiting"),
      press("b", 600, "moved"),
      press("c", 800),
      press("d", 350, "failed"),
      press("e", 600, "waiting"),
    ];

    expect(waitingCount(presses)).toBe(2);
    expect(waitingTotal(presses)).toBe(950);
  });
});
