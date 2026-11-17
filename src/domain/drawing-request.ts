/**
 * Ticket 38: asking Tom for a picture that is not in PICTURES. The app has no
 * server, so the request leaves as a link to a destination set at build time.
 */

/** The build's destination from VITE_DRAWING_REQUEST_URL, trimmed; absent or blank means none. */
export function drawingRequestDestination(env: {
  readonly VITE_DRAWING_REQUEST_URL?: string;
  readonly [key: string]: unknown;
}): string {
  return (env.VITE_DRAWING_REQUEST_URL ?? "").trim();
}

/**
 * Where requests go. Set at build time (VITE_DRAWING_REQUEST_URL), so no
 * address lives in the repository; a build without it shows no request line.
 * A built-in email address is visible to anyone who opens the app.
 */
export const DRAWING_REQUEST_URL = drawingRequestDestination(import.meta.env);

/**
 * The request link for `itemName`, or null when `destination` is not a usable
 * `mailto:` address or `https:` link. A mailto gets the subject and a body
 * naming the item; an https link (Tom's form) is returned untouched.
 */
export function drawingRequestLink(destination: string, itemName: string): string | null {
  let url: URL;
  try {
    url = new URL(destination);
  } catch {
    return null;
  }
  if (url.protocol === "https:") return destination;
  if (url.protocol !== "mailto:" || !url.pathname) return null;
  const subject = encodeURIComponent("Coffee Button drawing request");
  const body = encodeURIComponent(`I'd like a drawing for: ${itemName.trim()}`);
  return `${destination}?subject=${subject}&body=${body}`;
}
