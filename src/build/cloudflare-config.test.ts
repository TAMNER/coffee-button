// The Cloudflare configs, read by the pinned wrangler's own config reader:
// the app is static files only (no script, so no invocations and nothing to
// log), the relay is the shared Worker, and neither keeps logs or exposes
// per-version preview URLs.
import { describe, expect, it } from "vitest";
import { unstable_readConfig } from "wrangler";

const read = (config: string) => unstable_readConfig({ config }, { hideWarnings: true });

describe("Cloudflare configs", () => {
  it("serves the plain build (base path /) from dist as static assets with no Worker script", () => {
    const app = read("wrangler.jsonc");
    expect(app.name).toBe("coffee-button");
    expect(app.main).toBeUndefined();
    expect(app.assets?.directory).toMatch(/\/dist$/);
    expect(app.assets?.not_found_handling).toBe("single-page-application");
    expect(app.workers_dev).toBe(true);
    expect(app.preview_urls).toBe(false);
    expect(app.observability?.enabled).toBe(false);
  });

  it("runs the relay Worker from scripts/relay-worker.mjs with logs and previews off", () => {
    const relay = read("relay-worker/wrangler.jsonc");
    expect(relay.name).toBe("coffee-button-relay");
    expect(relay.main).toMatch(/\/scripts\/relay-worker\.mjs$/);
    expect(relay.assets).toBeUndefined();
    expect(relay.workers_dev).toBe(true);
    expect(relay.preview_urls).toBe(false);
    expect(relay.observability).toMatchObject({
      enabled: false,
      head_sampling_rate: 0,
      logs: { enabled: false, invocation_logs: false },
    });
    expect(relay.logpush).toBe(false);
  });
});
