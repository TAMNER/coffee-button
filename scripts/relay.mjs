// Coffee Button's Starling relay (ticket 18). Node built-ins only.
//
// Starling sends no CORS headers, so the browser cannot call it directly. This
// forwards a fixed allow-list of requests (see relay-rules.mjs) and adds open
// CORS headers. It logs one startup line and nothing else: no requests, never
// headers (the Authorization header carries the user's token).
//
//   RELAY_PORT=8795 node scripts/relay.mjs
import http from "node:http";
import { allowRequest } from "./relay-rules.mjs";

const STARLING = "https://api.starlingbank.com";
const PASS_HEADERS = ["authorization", "content-type", "accept"];

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
  const upstream = (options.upstream ?? STARLING).replace(/\/+$/, "");
  return http.createServer((req, res) => {
    if (req.method === "OPTIONS") {
      res.writeHead(204, CORS);
      res.end();
      return;
    }
    // Check the raw request target, never a URL-normalised one: normalising
    // would collapse "/x/../accounts" into an allowed path before the check.
    const target = req.url ?? "";
    const pathname = target.split("?")[0];
    if (!allowRequest(req.method ?? "", pathname)) {
      sendJson(res, 403, { error: "forbidden" });
      return;
    }
    forward(req, res, upstream + target);
  });
}

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {string} url
 */
async function forward(req, res, url) {
  try {
    /** @type {Record<string, string>} */
    const headers = {};
    for (const name of PASS_HEADERS) {
      const value = req.headers[name];
      if (typeof value === "string") headers[name] = value;
    }
    const body = req.method === "PUT" ? await readBody(req) : undefined;
    const up = await fetch(url, { method: req.method, headers, body, redirect: "manual" });
    const out = Buffer.from(await up.arrayBuffer());
    /** @type {Record<string, string>} */
    const replyHeaders = { ...CORS };
    const type = up.headers.get("content-type");
    if (type) replyHeaders["Content-Type"] = type;
    res.writeHead(up.status, replyHeaders);
    res.end(out);
  } catch {
    sendJson(res, 502, { error: "upstream unreachable" });
  }
}

/** @param {http.IncomingMessage} req */
async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

/**
 * @param {http.ServerResponse} res
 * @param {number} status
 * @param {unknown} value
 */
function sendJson(res, status, value) {
  res.writeHead(status, { ...CORS, "Content-Type": "application/json" });
  res.end(JSON.stringify(value));
}
