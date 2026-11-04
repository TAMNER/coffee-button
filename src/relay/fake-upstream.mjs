// Test helper for relay.test.ts: a stand-in for api.starlingbank.com that
// records the last request and answers with a canned reply.
import http from "node:http";

/**
 * @param {{ status: number, contentType: string, body: string }} reply
 */
export async function startFakeUpstream(reply) {
  const seen = [];
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
      res.writeHead(reply.status, { "Content-Type": reply.contentType, "X-Upstream-Only": "1" });
      res.end(reply.body);
    });
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}`,
    seen,
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
