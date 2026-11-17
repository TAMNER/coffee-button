import { describe, expect, it } from "vitest";
import { shelfRows } from "./shelf-layout";

describe("shelfRows", () => {
  it("ticket 30: the targets, at most three, stand on one plank in the order given", () => {
    expect(shelfRows(["weekend", "guitar", "ski"])).toEqual([["weekend", "guitar", "ski"]]);
    expect(shelfRows(["laptop"])).toEqual([["laptop"]]);
  });

  it("with no targets there is no empty plank", () => {
    expect(shelfRows([])).toEqual([]);
  });
});
