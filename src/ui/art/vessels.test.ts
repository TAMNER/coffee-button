import { describe, expect, it } from "vitest";
import { vesselFor } from "./vessels";

describe("vessel registry", () => {
  it("the sandwich icon gets a vessel with no pour; the cup and the pint pour", () => {
    expect(vesselFor("sandwich").pour).toBe(false);
    expect(vesselFor("coffee").pour).not.toBe(false);
    expect(vesselFor("beer").pour).not.toBe(false);
  });
});
