import { describe, expect, it } from "vitest";
import { PICTURES, pictureFor } from "./pictures";
import { DEFAULT_ITEMS } from "./store";

describe("PICTURES (ticket 28)", () => {
  it("lists the pictures a user can choose, in a fixed order: cup, pint, plate, jar, then pastry and bag (ticket 29)", () => {
    expect(PICTURES.map((p) => p.id)).toEqual(["cup", "pint", "plate", "jar", "pastry", "bag"]);
    expect(PICTURES.map((p) => p.label)).toEqual(["Cup", "Pint", "Plate", "Jar", "Pastry", "Bag"]);
  });
});

describe("pictureFor", () => {
  it("resolves a picture name the app does not recognise (old free text) to the jar", () => {
    expect(pictureFor("teapot").id).toBe("jar");
    expect(pictureFor("").id).toBe("jar");
    expect(pictureFor("constructor").id).toBe("jar");
  });

  it("keeps the names typed into the old free-text box: cup, pint and plate show their own pictures", () => {
    expect(pictureFor("cup").id).toBe("cup");
    expect(pictureFor("pint").id).toBe("pint");
    expect(pictureFor("plate").id).toBe("plate");
  });

  it("keeps the built-in items' stored names: coffee, beer and sandwich (and every default item) are not the jar", () => {
    expect(pictureFor("coffee").id).toBe("cup");
    expect(pictureFor("beer").id).toBe("pint");
    expect(pictureFor("sandwich").id).toBe("plate");
    for (const item of DEFAULT_ITEMS) expect(pictureFor(item.icon).id).not.toBe("jar");
  });
});
