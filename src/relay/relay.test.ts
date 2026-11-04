import { afterEach, describe, expect, it } from "vitest";
import { createRelay, type RelayServer } from "../../scripts/relay.mjs";

const servers: RelayServer[] = [];

async function listen(server: RelayServer): Promise<string> {
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return `http://127.0.0.1:${(server.address() as { port: number }).port}`;
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map((s) => new Promise((r) => s.close(r))));
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
});
