import { afterEach, describe, expect, it } from "vitest";
import { createRelay, type RelayServer } from "../../scripts/relay.mjs";
import { spawnRelay, startFakeUpstream } from "./fake-upstream.mjs";
import { relayContract } from "./relay-contract";

const cleanups: (() => Promise<void>)[] = [];

afterEach(async () => {
  await Promise.all(cleanups.splice(0).map((c) => c()));
});

async function startNodeRelay({ upstream }: { upstream: string }) {
  const server: RelayServer = createRelay({ upstream });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `http://127.0.0.1:${(server.address() as { port: number }).port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

relayContract("relay (Node, scripts/relay.mjs)", startNodeRelay, {
  expectedOrigin: "*",
  dotSegments: "refused",
});

describe("relay as a script", () => {
  it("runs as a script from RELAY_PORT and UPSTREAM, printing one startup line and never the token", async () => {
    const upstream = await startFakeUpstream({ status: 200, contentType: "application/json", body: "{}" });
    cleanups.push(upstream.close);
    const relay = await spawnRelay({ UPSTREAM: upstream.url });
    cleanups.push(relay.stop);
    const ok = await fetch(`${relay.url}/api/v2/accounts`, {
      headers: { Authorization: "Bearer super-secret-token" },
    });
    expect(ok.status).toBe(200);
    expect(upstream.seen[0].headers.authorization).toBe("Bearer super-secret-token");
    const denied = await fetch(`${relay.url}/nope`, { headers: { Authorization: "Bearer super-secret-token" } });
    expect(denied.status).toBe(403);
    await new Promise((r) => setTimeout(r, 50));
    const lines = relay.output().trim().split("\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/127\.0\.0\.1:\d+/);
    expect(relay.output()).not.toContain("super-secret-token");
  });
});
