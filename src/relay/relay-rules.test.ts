import { describe, expect, it } from "vitest";
import { allowRequest } from "../../scripts/relay-rules.mjs";

describe("allowRequest", () => {
  it("allows GET /api/v2/accounts", () => {
    expect(allowRequest("GET", "/api/v2/accounts")).toBe(true);
  });

  const A = "0f1e2d3c-4b5a-6978-8a9b-acbdcedf0123";
  it("allows GET and PUT on an account's savings goals", () => {
    expect(allowRequest("GET", `/api/v2/account/${A}/savings-goals`)).toBe(true);
    expect(allowRequest("PUT", `/api/v2/account/${A}/savings-goals`)).toBe(true);
  });

  const G = "11111111-2222-3333-4444-555555555555";
  const T = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
  it("allows PUT add-money into a savings goal", () => {
    expect(allowRequest("PUT", `/api/v2/account/${A}/savings-goals/${G}/add-money/${T}`)).toBe(true);
  });
});
