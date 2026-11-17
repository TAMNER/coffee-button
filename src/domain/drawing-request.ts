/**
 * Ticket 38: asking Tom for a picture that is not in PICTURES. The app has no
 * server, so the request leaves as a link to a destination set at build time.
 */

/** The request link for `itemName`. */
export function drawingRequestLink(destination: string, itemName: string): string {
  const subject = encodeURIComponent("Coffee Button drawing request");
  const body = encodeURIComponent(`I'd like a drawing for: ${itemName.trim()}`);
  return `${destination}?subject=${subject}&body=${body}`;
}
