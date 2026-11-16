// Test helper for relay.test.ts: a stand-in for api.starlingbank.com that
// records the last request and answers with a canned reply.
import http from "node:http";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

/**
 * Run scripts/relay.mjs as its own process on a free port, collecting all output.
 * @param {Record<string, string>} env
 */
export async function spawnRelay(env) {
  const script = fileURLToPath(new URL("../../scripts/relay.mjs", import.meta.url));
  const child = spawn(process.execPath, [script], {
    env: { PATH: process.env.PATH ?? "", RELAY_PORT: "0", ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (c) => (output += c));
  child.stderr.on("data", (c) => (output += c));
  const port = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`relay did not start: ${output}`)), 5000);
    child.stdout.on("data", () => {
      const m = output.match(/127\.0\.0\.1:(\d+)/);
      if (m) {
        clearTimeout(timer);
        resolve(Number(m[1]));
      }
    });
    child.on("exit", () => reject(new Error(`relay exited: ${output}`)));
  });
  return {
    url: `http://127.0.0.1:${port}`,
    output: () => output,
    stop: () =>
      new Promise((resolve) => {
        child.on("exit", () => resolve(undefined));
        child.kill();
      }),
  };
}

/**
 * @param {{ status: number, contentType: string, body: string }} reply
 */
export async function startFakeUpstream(reply) {
  const seen = [];
  let current = reply;
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      seen.push({
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: Buffer.concat(chunks).toString("utf8"),
      });
      res.writeHead(current.status, { "Content-Type": current.contentType, "X-Upstream-Only": "1" });
      res.end(current.body);
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    seen,
    /** Change the canned reply and forget earlier requests (one fake shared across tests). */
    reset: (next) => {
      current = next;
      seen.length = 0;
    },
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

/**
 * Send a request with the target exactly as given (fetch would normalise "..").
 * @param {string} base
 * @param {string} method
 * @param {string} target
 */
export function rawRequest(base, method, target) {
  const { hostname, port } = new URL(base);
  return new Promise((resolve, reject) => {
    const req = http.request({ hostname, port, method, path: target }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () =>
        resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString("utf8") }),
      );
    });
    req.on("error", reject);
    req.end();
  });
}
