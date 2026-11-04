// Ticket 22: the build's public base path. GitHub Pages serves the app under
// /coffee-button/; black-box serves it at /. Vite wants a leading and a
// trailing slash, so whatever BASE_PATH holds is normalised here.
export function normaliseBase(raw: string): string {
  return `/${raw.replace(/^\/+|\/+$/g, "")}/`;
}
