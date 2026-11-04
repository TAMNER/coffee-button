import { describe, expect, it } from "vitest";
import { allowRequest } from "../../scripts/relay-rules.mjs";

describe("allowRequest", () => {
  it("allows GET /api/v2/accounts", () => {
    expect(allowRequest("GET", "/api/v2/accounts")).toBe(true);
  });
});
