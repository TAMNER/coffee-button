// Test helper: serve a Worker's fetch handler from Node on 127.0.0.1. As in
// workerd, the request URL is parsed (dot segments resolved) before the
// Worker sees it.
import http from "node:http";

/**
 * @param {{ fetch(request: Request, env: object): Promise<Response> }} worker
 * @param {object} env
 */
export function serveWorker(worker, env) {
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
      if (typeof value === "string") headers.set(name, value);
    }
    const hasBody = req.method !== "GET" && req.method !== "HEAD" && chunks.length > 0;
    const request = new Request(new URL(req.url ?? "/", `http://${req.headers.host}`), {
      method: req.method,
      headers,
      body: hasBody ? Buffer.concat(chunks) : undefined,
    });
    const response = await worker.fetch(request, env);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  });
  return new Promise((resolve) =>
    server.listen(0, "127.0.0.1", () =>
      resolve({
        url: `http://127.0.0.1:${server.address().port}`,
        close: () => new Promise((done) => server.close(() => done(undefined))),
      }),
    ),
  );
}
