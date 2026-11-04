import { afterEach, describe, expect, it } from "vitest";
import { createRelay, type RelayServer } from "../../scripts/relay.mjs";
import { startFakeUpstream } from "./fake-upstream.mjs";

const servers: RelayServer[] = [];
const cleanups: (() => Promise<void>)[] = [];

async function listen(server: RelayServer): Promise<string> {
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return `http://127.0.0.1:${(server.address() as { port: number }).port}`;
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((s) => new Promise((r) => s.close(r))));
  await Promise.all(cleanups.splice(0).map((c) => c()));
});

describe("relay", () => {
  it("answers an OPTIONS preflight with 204 and open CORS headers", async () => {
    const relay = await listen(createRelay({ upstream: "http://127.0.0.1:9" }));
    const res = await fetch(`${relay}/api/v2/accounts`, { method: "OPTIONS" });
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("access-control-allow-methods")).toBe("GET,PUT,OPTIONS");
    expect(res.headers.get("access-control-allow-headers")).toBe("Authorization,Content-Type,Accept");
    expect(res.headers.get("access-control-max-age")).toBe("86400");
  });

  it("refuses anything not allowed with a 403 JSON body and CORS headers", async () => {
    const relay = await listen(createRelay({ upstream: "http://127.0.0.1:9" }));
    const res = await fetch(`${relay}/api/v2/account-holder`);
    expect(res.status).toBe(403);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("content-type")).toMatch(/^application\/json/);
    expect(await res.json()).toEqual({ error: "forbidden" });
  });

  it("forwards an allowed GET with path, query and headers, and returns the upstream reply unchanged", async () => {
    const upstream = await startFakeUpstream({
      status: 200,
      contentType: "application/json;charset=UTF-8",
      body: '{"accounts":[{"accountUid":"x"}]}',
    });
    cleanups.push(upstream.close);
    const relay = await listen(createRelay({ upstream: upstream.url }));
    const res = await fetch(`${relay}/api/v2/accounts?a=1&b=2`, {
      headers: { Authorization: "Bearer secret-token", Accept: "application/json", Cookie: "no" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json;charset=UTF-8");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
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
});
