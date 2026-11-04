import { describe, expect, it } from "vitest";
import { StarlingAuthError, StarlingClient, StarlingNetworkError, StarlingRateLimited } from "./starling";

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

  it("createSpace(acc, name) PUTs {name, currency: GBP} as JSON and returns the new savingsGoalUid", async () => {
    const { fn, calls } = fakeFetch(json({ savingsGoalUid: "sg-new", success: true }));
    const client = new StarlingClient(fn, BASE, "tok");

    const uid = await client.createSpace("acc-1", "Coffee Button");

    expect(uid).toBe("sg-new");
    expect(calls[0].url).toBe(`${BASE}/api/v2/account/acc-1/savings-goals`);
    expect(calls[0].init?.method).toBe("PUT");
    expect(new Headers(calls[0].init?.headers).get("content-type")).toBe("application/json");
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({ name: "Coffee Button", currency: "GBP" });
  });

  it("addMoney PUTs the amount in minor units and the reference under the transfer uid and returns the result", async () => {
    const { fn, calls } = fakeFetch(json({ transferUid: "tx-1", success: true }));
    const client = new StarlingClient(fn, BASE, "tok");

    const result = await client.addMoney("acc-1", "sg-1", "tx-1", 350, "Coffee");

    expect(result).toEqual({ transferUid: "tx-1", success: true });
    expect(calls[0].url).toBe(`${BASE}/api/v2/account/acc-1/savings-goals/sg-1/add-money/tx-1`);
    expect(calls[0].init?.method).toBe("PUT");
    expect(JSON.parse(String(calls[0].init?.body))).toEqual({
      amount: { currency: "GBP", minorUnits: 350 },
      reference: "Coffee",
    });
  });

  it.each([401, 403])("a %i answer rejects with StarlingAuthError, whose message does not carry the token", async (status) => {
    const { fn } = fakeFetch(json({ error: "invalid_token" }, status));
    const client = new StarlingClient(fn, BASE, "secret-tok");

    const err = await client.accounts().catch((e: unknown) => e);

    expect(err).toBeInstanceOf(StarlingAuthError);
    expect((err as StarlingAuthError).status).toBe(status);
    expect(String((err as Error).message)).not.toContain("secret-tok");
  });

  it("a 429 with Retry-After: 3 rejects with StarlingRateLimited after 3000 ms; without the header it is undefined", async () => {
    const { fn } = fakeFetch(json({}, 429, { "retry-after": "3" }), json({}, 429));
    const client = new StarlingClient(fn, BASE, "tok");

    const first = await client.listSpaces("acc-1").catch((e: unknown) => e);
    const second = await client.listSpaces("acc-1").catch((e: unknown) => e);

    expect(first).toBeInstanceOf(StarlingRateLimited);
    expect((first as StarlingRateLimited).retryAfterMs).toBe(3000);
    expect(second).toBeInstanceOf(StarlingRateLimited);
    expect((second as StarlingRateLimited).retryAfterMs).toBeUndefined();
  });

  it("a fetch that throws (offline, relay down, TLS) rejects with StarlingNetworkError", async () => {
    const { fn } = fakeFetch(new TypeError("Failed to fetch"));
    const client = new StarlingClient(fn, BASE, "tok");

    await expect(client.accounts()).rejects.toBeInstanceOf(StarlingNetworkError);
  });
});
