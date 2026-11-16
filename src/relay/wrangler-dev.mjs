// Test helper: run a Worker under workerd with the pinned wrangler's local
// `wrangler dev`. Local mode only: no Cloudflare account, no sign-in, no
// deploy. Telemetry and error reports are switched off.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const WRANGLER = fileURLToPath(new URL("../../node_modules/wrangler/bin/wrangler.js", import.meta.url));

/**
 * @param {string} config path from the repo root
 * @param {Record<string, string>} vars
 */
export async function startWranglerDev(config, vars) {
  const args = [WRANGLER, "dev", "-c", config, "--ip", "127.0.0.1", "--port", "0", "--inspector-port", "0"];
  args.push("--show-interactive-dev-session=false");
  for (const [name, value] of Object.entries(vars)) args.push("--var", `${name}:${value}`);
  const child = spawn(process.execPath, args, {
    cwd: ROOT,
    detached: true,
    env: {
      PATH: process.env.PATH ?? "",
      HOME: process.env.HOME ?? "",
      WRANGLER_SEND_METRICS: "false",
      WRANGLER_SEND_ERROR_REPORTS: "false",
      CI: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (c) => (output += c));
  child.stderr.on("data", (c) => (output += c));
  const url = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`wrangler dev did not start: ${output}`)), 45_000);
    const check = () => {
      const m = output.match(/Ready on (http:\/\/127\.0\.0\.1:\d+)/);
      if (m) {
        clearTimeout(timer);
        resolve(m[1]);
      }
    };
    child.stdout.on("data", check);
    child.stderr.on("data", check);
    child.on("exit", () => reject(new Error(`wrangler dev exited: ${output}`)));
  });
  return {
    url,
    output: () => output,
    close: () =>
      new Promise((resolve) => {
        if (child.exitCode !== null) return resolve(undefined);
        child.on("exit", () => resolve(undefined));
        process.kill(-child.pid, "SIGTERM");
      }),
  };
}
