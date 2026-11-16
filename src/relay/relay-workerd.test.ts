// The relay Worker in the real Workers runtime (workerd, local `wrangler dev`
// from the pinned devDependency), held to the same contract as relay.mjs.
// Never calls Starling: UPSTREAM points at the local fake.
import { describe, expect, it } from "vitest";
import { relayContract, type StartRelay } from "./relay-contract";
import { startFakeUpstream } from "./fake-upstream.mjs";
import { startWranglerDev } from "./wrangler-dev.mjs";

const CONFIG = "relay-worker/wrangler.jsonc";

const startInWorkerd: StartRelay = ({ upstream, allowedOrigin }) =>
  startWranglerDev(CONFIG, { UPSTREAM: upstream, ...(allowedOrigin === undefined ? {} : { ALLOWED_ORIGIN: allowedOrigin }) });

relayContract("relay Worker (workerd), default origin", startInWorkerd, {
  expectedOrigin: "*",
  dotSegments: "resolved",
});

relayContract("relay Worker (workerd), ALLOWED_ORIGIN set", startInWorkerd, {
  allowedOrigin: "https://coffee-button.example.workers.dev",
  expectedOrigin: "https://coffee-button.example.workers.dev",
  dotSegments: "resolved",
});

describe("relay Worker (workerd) output", () => {
  it("never prints the token or any request header", async () => {
    const upstream = await startFakeUpstream({ status: 200, contentType: "application/json", body: "{}" });
    const relay = await startWranglerDev(CONFIG, { UPSTREAM: upstream.url });
    try {
      const headers = { Authorization: "Bearer super-secret-token", "X-Probe": "probe-header-value" };
      const ok = await fetch(`${relay.url}/api/v2/accounts`, { headers });
      const denied = await fetch(`${relay.url}/nope`, { headers });
      expect([ok.status, denied.status]).toEqual([200, 403]);
      expect(upstream.seen[0].headers.authorization).toBe("Bearer super-secret-token");
      await new Promise((r) => setTimeout(r, 200));
      expect(relay.output()).not.toContain("super-secret-token");
      expect(relay.output()).not.toContain("probe-header-value");
    } finally {
      await relay.close();
      await upstream.close();
    }
  }, 60_000);
});
