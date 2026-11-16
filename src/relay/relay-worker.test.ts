// The Cloudflare Worker relay (scripts/relay-worker.mjs) held to the same
// contract as scripts/relay.mjs. Here the Worker's fetch handler runs inside
// Node behind a small adapter; relay-workerd.test.ts runs it in workerd.
import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { type RelayEnv } from "../../scripts/relay-worker.mjs";
import { relayContract, type StartRelay } from "./relay-contract";
import { startFakeUpstream } from "./fake-upstream.mjs";
import { serveWorker } from "./serve-worker.mjs";

const startInNode: StartRelay = ({ upstream, allowedOrigin }) => {
  const env: RelayEnv = { UPSTREAM: upstream };
  if (allowedOrigin !== undefined) env.ALLOWED_ORIGIN = allowedOrigin;
  return serveWorker(worker, env);
};

relayContract("relay Worker (in Node), default origin", startInNode, {
  expectedOrigin: "*",
  dotSegments: "resolved",
});

relayContract("relay Worker (in Node), ALLOWED_ORIGIN set", startInNode, {
  allowedOrigin: "https://coffee-button.pages.dev",
  expectedOrigin: "https://coffee-button.pages.dev",
  dotSegments: "resolved",
});

describe("relay Worker", () => {
  afterEach(() => vi.restoreAllMocks());

  it("treats a blank ALLOWED_ORIGIN as unset", async () => {
    const res = await worker.fetch(new Request("https://relay.example/api/v2/accounts", { method: "OPTIONS" }), {
      ALLOWED_ORIGIN: "  ",
    });
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("writes nothing to the console for forwarded, refused or failed requests", async () => {
    const calls: unknown[][] = [];
    for (const method of ["log", "info", "warn", "error", "debug", "trace"] as const) {
      vi.spyOn(console, method).mockImplementation((...args: unknown[]) => void calls.push(args));
    }
    const upstream = await startFakeUpstream({ status: 200, contentType: "application/json", body: "{}" });
    try {
      const auth = { Authorization: "Bearer super-secret-token" };
      const live = { UPSTREAM: upstream.url };
      const ok = await worker.fetch(new Request("https://r.example/api/v2/accounts", { headers: auth }), live);
      const denied = await worker.fetch(new Request("https://r.example/nope", { headers: auth }), live);
      const dead = await worker.fetch(new Request("https://r.example/api/v2/accounts", { headers: auth }), {
        UPSTREAM: "http://127.0.0.1:9",
      });
      expect([ok.status, denied.status, dead.status]).toEqual([200, 403, 502]);
    } finally {
      await upstream.close();
    }
    expect(calls).toEqual([]);
  });
});
