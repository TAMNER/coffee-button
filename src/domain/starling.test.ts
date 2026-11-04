import { describe, expect, it } from "vitest";
import { StarlingClient } from "./starling";

interface Call {
  url: string;
  init: RequestInit | undefined;
}

/** A fetch that records each call and answers with the next queued response. */
function fakeFetch(...responses: (Response | Error)[]) {
  const calls: Call[] = [];
  const fn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    const next = responses.shift();
    if (!next) throw new Error("fake fetch: no response queued");
    if (next instanceof Error) throw next;
    return next;
  }) as typeof fetch;
  return { fn, calls };
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...headers } });
}

const BASE = "https://relay.example:8443";

describe("StarlingClient", () => {
  it("accounts() GETs /api/v2/accounts with the bearer token and returns the accounts", async () => {
    const { fn, calls } = fakeFetch(json({ accounts: [{ accountUid: "acc-1", name: "Personal" }] }));
    const client = new StarlingClient(fn, BASE, "tok-123");

    const accounts = await client.accounts();

    expect(accounts).toEqual([{ accountUid: "acc-1", name: "Personal" }]);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`${BASE}/api/v2/accounts`);
    expect(calls[0].init?.method ?? "GET").toBe("GET");
    expect(new Headers(calls[0].init?.headers).get("authorization")).toBe("Bearer tok-123");
  });

  it("listSpaces(acc) GETs the account's savings goals and returns them; a trailing slash on the base is dropped", async () => {
    const { fn, calls } = fakeFetch(
      json({ savingsGoalList: [{ savingsGoalUid: "sg-1", name: "Holiday", state: "ACTIVE" }] }),
    );
    const client = new StarlingClient(fn, `${BASE}/`, "tok");

    const spaces = await client.listSpaces("acc-1");

    expect(spaces).toEqual([{ savingsGoalUid: "sg-1", name: "Holiday", state: "ACTIVE" }]);
    expect(calls[0].url).toBe(`${BASE}/api/v2/account/acc-1/savings-goals`);
  });
});
