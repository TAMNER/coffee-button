import { describe, expect, it } from "vitest";
import { spaceLine } from "./settle-space";

describe("spaceLine", () => {
  it("is null when no Space is linked", () => {
    expect(spaceLine({ owedPence: 1250, waitingPence: 0, spaceName: null })).toBeNull();
  });
});

describe("spaceLine with a Space", () => {
  it("says the owed amount is waiting in the named Space when nothing is still moving", () => {
    expect(spaceLine({ owedPence: 1250, waitingPence: 0, spaceName: "Coffee Button" })).toBe(
      "£12.50 is waiting in your Coffee Button Space",
    );
  });
});
