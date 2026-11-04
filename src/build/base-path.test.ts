import { describe, expect, it } from "vitest";
import { normaliseBase } from "./base-path";

describe("normaliseBase", () => {
  it("adds missing leading and trailing slashes", () => {
    expect(normaliseBase("coffee-button")).toBe("/coffee-button/");
    expect(normaliseBase("/coffee-button")).toBe("/coffee-button/");
    expect(normaliseBase("coffee-button/")).toBe("/coffee-button/");
    expect(normaliseBase("/coffee-button/")).toBe("/coffee-button/");
  });

  it("defaults to / when unset, blank or only slashes", () => {
    expect(normaliseBase(undefined)).toBe("/");
    expect(normaliseBase("")).toBe("/");
    expect(normaliseBase("  ")).toBe("/");
    expect(normaliseBase("/")).toBe("/");
    expect(normaliseBase("//")).toBe("/");
  });
});
