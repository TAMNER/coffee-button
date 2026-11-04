// Which requests the Starling relay forwards (ticket 18). Pure, Node built-ins only.

/**
 * @param {string} method
 * @param {string} pathname
 * @returns {boolean}
 */
export function allowRequest(method, pathname) {
  return method === "GET" && pathname === "/api/v2/accounts";
}
