/**
 * Ticket 38: "Want a picture that isn't here?" and a Request a drawing link,
 * under the add form's picture row in Settings (src/ui/settings.ts). The
 * link and words come from src/domain/drawing-request.ts; a build with no
 * destination gets nothing at all.
 *
 * A real <a href> styled as a button rather than a button calling the
 * UrlOpener: in an installed iPhone Home Screen app, window.open of a mailto:
 * can silently do nothing, while a link the user taps opens Mail. An https
 * form opens in a new browsing context so the app itself stays put; a mailto
 * has no target, as the OS hands it to the mail app.
 * DOM glue: not unit tested by decision.
 */
import { DRAWING_REQUEST_COPY, DRAWING_REQUEST_URL, drawingRequestLink } from "../domain/drawing-request";

/** The request line for the add form, following `nameInput`; null when this build has no destination. */
export function drawingRequestLine(nameInput: HTMLInputElement): HTMLElement | null {
  if (drawingRequestLink(DRAWING_REQUEST_URL, "") === null) return null;
  const line = document.createElement("p");
  line.className = "drawing-request";
  const words = document.createElement("span");
  words.textContent = DRAWING_REQUEST_COPY.line;
  const link = document.createElement("a");
  link.className = "drawing-request-link";
  link.textContent = DRAWING_REQUEST_COPY.button;
  if (DRAWING_REQUEST_URL.startsWith("https:")) {
    link.target = "_blank";
    link.rel = "noopener";
  }
  // Kept current as the name is typed, and set again on the tap itself, so the
  // message always names what is in the box at that moment.
  const update = () => (link.href = drawingRequestLink(DRAWING_REQUEST_URL, nameInput.value) ?? "");
  update();
  nameInput.addEventListener("input", update);
  nameInput.form?.addEventListener("reset", () => queueMicrotask(update));
  link.addEventListener("click", update);
  line.append(words, link);
  return line;
}
