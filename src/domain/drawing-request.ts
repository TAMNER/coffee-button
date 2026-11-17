/**
 * Ticket 38: asking Tom for a picture that is not in PICTURES. The app has no
 * server, so the request leaves as a link to a destination set at build time.
 */

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
