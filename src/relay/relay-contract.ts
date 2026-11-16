// The behaviour every Starling relay must show (ticket 18, carried to the
// Cloudflare Worker). relay.test.ts runs it against scripts/relay.mjs and
// relay-worker.test.ts against the Worker, so both are held to the same cases.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { rawRequest, startFakeUpstream, type FakeUpstream } from "./fake-upstream.mjs";

export interface RunningRelay {
  url: string;
  close(): Promise<void>;
}

/** Start one relay forwarding to `upstream`. `allowedOrigin` unset means the default. */
export type StartRelay = (options: { upstream: string; allowedOrigin?: string }) => Promise<RunningRelay>;

export interface ContractOptions {
  /** Passed to every start; the CORS origin the relay must then answer with. */
  allowedOrigin?: string;
  expectedOrigin: string;
  /**
   * "refused": the relay sees the raw request target and refuses dot segments
   * (Node). "resolved": the runtime resolves them before the relay's code runs
   * (Workers parse request.url), so the relay checks and forwards the resolved path.
   */
  dotSegments: "refused" | "resolved";
}

const A = "0f1e2d3c-4b5a-6978-8a9b-acbdcedf0123";
const G = "11111111-2222-3333-4444-555555555555";
const T = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const DEAD_UPSTREAM = "http://127.0.0.1:9";

export function relayContract(name: string, start: StartRelay, options: ContractOptions) {
  describe(name, () => {
    let upstream: FakeUpstream;
    let relay: RunningRelay;
    let deadRelay: RunningRelay;
    const origin = options.allowedOrigin;

    beforeAll(async () => {
      upstream = await startFakeUpstream({ status: 200, contentType: "text/plain", body: "" });
      relay = await start({ upstream: upstream.url, allowedOrigin: origin });
      deadRelay = await start({ upstream: DEAD_UPSTREAM, allowedOrigin: origin });
    }, 60_000);

    afterAll(async () => {
      await Promise.all([relay?.close(), deadRelay?.close(), upstream?.close()]);
    });

    beforeEach(() => upstream.reset({ status: 200, contentType: "text/plain", body: "" }));

    it("answers an OPTIONS preflight with 204 and the CORS headers", async () => {
      const res = await fetch(`${relay.url}/api/v2/accounts`, { method: "OPTIONS" });
      expect(res.status).toBe(204);
      expect(res.headers.get("access-control-allow-origin")).toBe(options.expectedOrigin);
      expect(res.headers.get("access-control-allow-methods")).toBe("GET,PUT,OPTIONS");
      expect(res.headers.get("access-control-allow-headers")).toBe("Authorization,Content-Type,Accept");
      expect(res.headers.get("access-control-max-age")).toBe("86400");
      expect(upstream.seen).toHaveLength(0);
    });

    it("refuses anything not allowed with a 403 JSON body and CORS headers", async () => {
      const res = await fetch(`${relay.url}/api/v2/account-holder`);
      expect(res.status).toBe(403);
      expect(res.headers.get("access-control-allow-origin")).toBe(options.expectedOrigin);
      expect(res.headers.get("content-type")).toMatch(/^application\/json/);
      expect(await res.json()).toEqual({ error: "forbidden" });
      expect(upstream.seen).toHaveLength(0);
    });

    it("forwards an allowed GET with path, query and headers, and returns the upstream reply unchanged", async () => {
      upstream.reset({
        status: 200,
        contentType: "application/json;charset=UTF-8",
        body: '{"accounts":[{"accountUid":"x"}]}',
      });
      const res = await fetch(`${relay.url}/api/v2/accounts?a=1&b=2`, {
        headers: { Authorization: "Bearer secret-token", Accept: "application/json", Cookie: "no" },
      });
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/json;charset=UTF-8");
      expect(res.headers.get("access-control-allow-origin")).toBe(options.expectedOrigin);
      expect(res.headers.get("x-upstream-only")).toBeNull();
      expect(await res.text()).toBe('{"accounts":[{"accountUid":"x"}]}');
      expect(upstream.seen).toHaveLength(1);
      const seen = upstream.seen[0];
      expect(seen.method).toBe("GET");
      expect(seen.url).toBe("/api/v2/accounts?a=1&b=2");
      expect(seen.headers.authorization).toBe("Bearer secret-token");
      expect(seen.headers.accept).toBe("application/json");
      expect(seen.headers.cookie).toBeUndefined();
    });

    it("forwards a PUT add-money body and Content-Type, and passes an upstream error status through", async () => {
      upstream.reset({
        status: 400,
        contentType: "application/json",
        body: '{"errors":[{"message":"INSUFFICIENT_FUNDS"}],"success":false}',
      });
      const path = `/api/v2/account/${A}/savings-goals/${G}/add-money/${T}`;
      const sent = '{"amount":{"currency":"GBP","minorUnits":350}}';
      const res = await fetch(relay.url + path, {
        method: "PUT",
        headers: { Authorization: "Bearer t", "Content-Type": "application/json" },
        body: sent,
      });
      expect(res.status).toBe(400);
      expect(res.headers.get("access-control-allow-origin")).toBe(options.expectedOrigin);
      expect(await res.text()).toBe('{"errors":[{"message":"INSUFFICIENT_FUNDS"}],"success":false}');
      const seen = upstream.seen[0];
      expect(seen.method).toBe("PUT");
      expect(seen.url).toBe(path);
      expect(seen.body).toBe(sent);
      expect(seen.headers["content-type"]).toBe("application/json");
    });

    it.each([
      `/api/v2/account/${A}/../accounts`,
      `/api/v2/accounts/../account-holder`,
      `/api/v2/account/${A}%2F..%2F..%2Faccounts`,
      `/api/v2/account/${A}/savings-goals/%2e%2e/%2e%2e/balance`,
      "http://evil.example/api/v2/account-holder",
    ])("refuses raw request target %s without touching upstream", async (target) => {
      const res = await rawRequest(relay.url, "GET", target);
      expect(res.status).toBe(403);
      expect(upstream.seen).toHaveLength(0);
    });

    // The comment in relay.mjs: never check one path and forward another.
    const resolvesToAllowed = `/api/v2/x/../accounts`;
    if (options.dotSegments === "refused") {
      it.each([resolvesToAllowed, "http://evil.example/api/v2/accounts"])(
        "refuses raw target %s, which only resolves to an allowed path, without touching upstream",
        async (target) => {
          const res = await rawRequest(relay.url, "GET", target);
          expect(res.status).toBe(403);
          expect(upstream.seen).toHaveLength(0);
        },
      );
    } else {
      it(`forwards ${resolvesToAllowed} as the resolved path it checked, never anything else`, async () => {
        const res = await rawRequest(relay.url, "GET", resolvesToAllowed);
        expect(res.status).toBe(200);
        expect(upstream.seen.map((s) => s.url)).toEqual(["/api/v2/accounts"]);
      });
    }

    it("answers 502 JSON when the upstream cannot be reached", async () => {
      const res = await fetch(`${deadRelay.url}/api/v2/accounts`);
      expect(res.status).toBe(502);
      expect(res.headers.get("access-control-allow-origin")).toBe(options.expectedOrigin);
      expect(await res.json()).toEqual({ error: "upstream unreachable" });
    });
  });
}
