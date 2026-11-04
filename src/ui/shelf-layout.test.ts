import { describe, expect, it } from "vitest";
import { shelfRows } from "./shelf-layout";

describe("shelfRows", () => {
  it("goals get their own plank above; the four built-ins stand two and two", () => {
    expect(shelfRows(["g1", "g2", "g3"], ["weekend", "espresso", "laptop", "ski"])).toEqual([
      ["g1", "g2", "g3"],
      ["weekend", "espresso"],
      ["laptop", "ski"],
    ]);
  });

  it("with no goals there is no empty goal plank", () => {
    expect(shelfRows([], ["weekend", "espresso", "laptop", "ski"])).toEqual([
      ["weekend", "espresso"],
      ["laptop", "ski"],
    ]);
  });
});
