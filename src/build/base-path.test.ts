import { describe, expect, it } from "vitest";
import { normaliseBase } from "./base-path";

describe("normaliseBase", () => {
  it("adds missing leading and trailing slashes", () => {
    expect(normaliseBase("coffee-button")).toBe("/coffee-button/");
    expect(normaliseBase("/coffee-button")).toBe("/coffee-button/");
    expect(normaliseBase("coffee-button/")).toBe("/coffee-button/");
    expect(normaliseBase("/coffee-button/")).toBe("/coffee-button/");
  });
});
