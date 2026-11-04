// Which requests the Starling relay forwards (ticket 18). Pure, Node built-ins only.

const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}";

/** Each rule: the methods allowed and the whole path it must match. */
const RULES = [
  { methods: ["GET"], path: new RegExp("^/api/v2/accounts$") },
  { methods: ["GET", "PUT"], path: new RegExp(`^/api/v2/account/${UUID}/savings-goals$`) },
];

/**
 * @param {string} method
 * @param {string} pathname
 * @returns {boolean}
 */
export function allowRequest(method, pathname) {
  return RULES.some((r) => r.methods.includes(method) && r.path.test(pathname));
}
