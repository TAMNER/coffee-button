import { describe, expect, it } from "vitest";
import { cascadeCount } from "./settle-ceremony";

describe("cascadeCount", () => {
  it("is one coin per press settled, capped at 40: 0 -> 0, 12 -> 12, 100 -> 40", () => {
    expect([0, 12, 100].map(cascadeCount)).toEqual([0, 12, 40]);
  });
});
