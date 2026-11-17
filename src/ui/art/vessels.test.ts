import { describe, expect, it } from "vitest";
import { COFFEE_VESSEL, vesselFor } from "./vessels";

describe("vessel registry", () => {
  it("the sandwich icon gets a vessel with no pour; the cup and the pint pour", () => {
    expect(vesselFor("sandwich").pour).toBe(false);
    expect(vesselFor("coffee").pour).not.toBe(false);
    expect(vesselFor("beer").pour).not.toBe(false);
  });

  it("an icon without its own art gets the jar, not the coffee cup (ticket 28)", () => {
    const jar = vesselFor("jar");
    expect(vesselFor("teapot")).toBe(jar);
    expect(jar).not.toBe(COFFEE_VESSEL);
    expect(jar.pour).toBe(false);
  });
});
