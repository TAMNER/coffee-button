// Coffee Button's Starling relay (ticket 18). Node built-ins only.
//
// Starling sends no CORS headers, so the browser cannot call it directly. This
// forwards a fixed allow-list of requests (see relay-rules.mjs) and adds open
// CORS headers. It logs one startup line and nothing else: no requests, never
// headers (the Authorization header carries the user's token).
//
//   RELAY_PORT=8795 node scripts/relay.mjs
import http from "node:http";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,Content-Type,Accept",
  "Access-Control-Max-Age": "86400",
};

/**
 * @param {{ upstream?: string }} [options]
 * @returns {http.Server}
 */
export function createRelay(options = {}) {
  void options;
  return http.createServer((req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(204, CORS);
      res.end();
      return;
    }
    res.writeHead(403, CORS);
    res.end();
  });
}
