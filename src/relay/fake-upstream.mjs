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
