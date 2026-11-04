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

  it.each([
    ["PUT", "/api/v2/accounts"],
    ["POST", "/api/v2/accounts"],
    ["DELETE", `/api/v2/account/${A}/savings-goals`],
    ["GET", `/api/v2/account/${A}/savings-goals/${G}/add-money/${T}`],
    ["get", "/api/v2/accounts"],
    ["GET", "/"],
    ["GET", "/api/v2/accounts/"],
    ["GET", "/api/v2/account-holder"],
    ["GET", `/api/v2/account/${A}/balance`],
    ["GET", `/api/v2/feed/account/${A}/category/${G}`],
    ["PUT", `/api/v2/account/${A}/savings-goals/${G}/withdraw-money/${T}`],
    ["GET", "/api/v2/account/not-a-uuid/savings-goals"],
    ["GET", `/api/v2/account/${A}x/savings-goals`],
    ["GET", `/api/v2/account/${A.replace(/-/g, "")}/savings-goals`],
    ["GET", `/api/v2/account/${A.slice(0, -1)}g/savings-goals`],
  ])("denies %s %s", (method, path) => {
    expect(allowRequest(method, path)).toBe(false);
  });

  it.each([
    `/api/v2/account/${A}/savings-goals/..`,
    `/api/v2/account/${A}/../accounts`,
    `/api/v2/account/${A}/savings-goals/${G}/add-money/${T}/..`,
    `/api/v2/account/${A}//savings-goals`,
    `//api/v2/accounts`,
    `/api/v2/account/${A}%2Fsavings-goals`,
    `/api/v2/account/${A}%2fsavings-goals`,
    `/api/v2/account/${A}%5Csavings-goals`,
    `/api/v2/account/${A}/savings-goals%2F..`,
    `/api/v2/account/${A}/savings-goals/${G}/add-money/${T}/extra`,
    `/api/v2/account/${A}/savings-goals/${G}`,
    `/api/v2/account/${A}/savings-goals/${G}/add-money`,
    `/api/v2/account/${A}/savings-goals?x=1`,
  ])("denies traversal-style or extra-segment path %s", (path) => {
    expect(allowRequest("GET", path)).toBe(false);
    expect(allowRequest("PUT", path)).toBe(false);
  });
});
