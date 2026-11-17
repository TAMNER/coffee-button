import { describe, expect, it } from "vitest";
import { PICTURES, pictureFor } from "./pictures";

describe("PICTURES (ticket 28)", () => {
  it("lists the pictures a user can choose, in a fixed order: cup, pint, plate, jar", () => {
    expect(PICTURES.map((p) => p.id)).toEqual(["cup", "pint", "plate", "jar"]);
    expect(PICTURES.map((p) => p.label)).toEqual(["Cup", "Pint", "Plate", "Jar"]);
  });
});

describe("pictureFor", () => {
  it("resolves a picture name the app does not recognise (old free text) to the jar", () => {
    expect(pictureFor("teapot").id).toBe("jar");
    expect(pictureFor("").id).toBe("jar");
    expect(pictureFor("constructor").id).toBe("jar");
  });
});
