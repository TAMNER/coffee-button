import { describe, expect, it } from "vitest";
import { spaceLine } from "./settle-space";

describe("spaceLine", () => {
  it("is null when no Space is linked", () => {
    expect(spaceLine({ owedPence: 1250, waitingPence: 0, spaceName: null })).toBeNull();
  });
});
