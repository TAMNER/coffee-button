// Coffee Button's Starling relay as a Cloudflare Worker: the same behaviour as
// scripts/relay.mjs, held to the same tests (src/relay/relay-contract.ts), with
// the allow-list imported from relay-rules.mjs, never copied.
//
// It writes nothing to the console: no requests, never headers (the
// Authorization header carries the user's token). relay-worker/wrangler.jsonc
// also turns Workers Logs off.
//
// Variables (all optional):
//   ALLOWED_ORIGIN  the one origin browsers may call from; unset or blank means "*".
//   UPSTREAM        tests only; defaults to Starling.
import { allowRequest } from "./relay-rules.mjs";

const STARLING = "https://api.starlingbank.com";
const PASS_HEADERS = ["authorization", "content-type", "accept"];

/** @param {string | undefined} allowedOrigin */
function corsHeaders(allowedOrigin) {
  return {
    "Access-Control-Allow-Origin": allowedOrigin?.trim() || "*",
    "Access-Control-Allow-Methods": "GET,PUT,OPTIONS",
    "Access-Control-Allow-Headers": "Authorization,Content-Type,Accept",
    "Access-Control-Max-Age": "86400",
  };
}

export default {
  /**
   * @param {Request} request
   * @param {{ ALLOWED_ORIGIN?: string, UPSTREAM?: string }} env
   * @returns {Promise<Response>}
   */
  async fetch(request, env) {
    const cors = corsHeaders(env.ALLOWED_ORIGIN);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });

    // relay.mjs checks the raw request target so that "/x/../accounts" cannot
    // be checked as one path and forwarded as another. A Worker never sees the
    // raw target: request.url is already parsed, dot segments resolved. So
    // check exactly the path that will be forwarded, and refuse if building
    // the upstream URL would change it.
    const { pathname, search } = new URL(request.url);
    const upstream = (env.UPSTREAM || STARLING).replace(/\/+$/, "");
    const target = upstream + pathname + search;
    if (!allowRequest(request.method, pathname) || new URL(target).pathname !== pathname) {
      return json(403, { error: "forbidden" }, cors);
    }

    try {
      /** @type {Record<string, string>} */
      const headers = {};
      for (const name of PASS_HEADERS) {
        const value = request.headers.get(name);
        if (value !== null) headers[name] = value;
      }
      const body = request.method === "PUT" ? await request.arrayBuffer() : undefined;
      const up = await fetch(target, { method: request.method, headers, body, redirect: "manual" });
      const out = await up.arrayBuffer();
      /** @type {Record<string, string>} */
      const replyHeaders = { ...cors };
      const type = up.headers.get("content-type");
      if (type) replyHeaders["Content-Type"] = type;
      return new Response(out, { status: up.status, headers: replyHeaders });
    } catch {
      return json(502, { error: "upstream unreachable" }, cors);
    }
  },
};

/**
 * @param {number} status
 * @param {unknown} value
 * @param {Record<string, string>} cors
 */
function json(status, value, cors) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
