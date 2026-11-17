import { describe, expect, it } from "vitest";
import { PICTURES } from "./pictures";

describe("PICTURES (ticket 28)", () => {
  it("lists the pictures a user can choose, in a fixed order: cup, pint, plate, jar", () => {
    expect(PICTURES.map((p) => p.id)).toEqual(["cup", "pint", "plate", "jar"]);
    expect(PICTURES.map((p) => p.label)).toEqual(["Cup", "Pint", "Plate", "Jar"]);
  });
});
