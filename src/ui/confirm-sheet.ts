/**
 * Ticket 26: the app's own yes/no bottom sheet in Cut Paper, built to be
 * reused (tickets 28 and 30 use it for other removals). It borrows the info
 * sheet's overlay, backdrop, torn edge and title (src/style.css), so the two
 * read as one family. The caller passes all wording. DOM glue only, untested
 * by decision.
 *
 *   if (await confirmSheet({ title: "Remove Beer?", body: "Your savings stay.", confirm: "Remove", cancel: "Keep" })) …
 *
 * Resolves true on the confirm button, false on the cancel button, a tap on
 * the backdrop or Escape. Focus starts on cancel and returns to where it was.
 */
export interface ConfirmWording {
  title: string;
  body?: string;
  /** The button that goes ahead, e.g. "Remove". */
  confirm: string;
  /** The button that backs out, e.g. "Keep". */
  cancel: string;
}

let sheets = 0;

export function confirmSheet(wording: ConfirmWording): Promise<boolean> {
  const id = ++sheets;
  const returnFocus = document.activeElement as HTMLElement | null;
  const overlay = document.createElement("div");
  overlay.className = "info-overlay confirm-overlay";
  overlay.innerHTML = `<div class="info-backdrop" data-role="confirm-backdrop"></div>
    <div class="info-sheet confirm-sheet" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title-${id}" tabindex="-1">
      <div class="info-grip" aria-hidden="true"></div>
      <h2 class="info-title" id="confirm-title-${id}"></h2>
      <p class="confirm-body"></p>
      <div class="confirm-actions">
        <button type="button" class="confirm-go" data-role="confirm-go"></button>
        <button type="button" class="info-close confirm-cancel" data-role="confirm-cancel"></button>
      </div>
    </div>`;
  overlay.querySelector(".info-title")!.textContent = wording.title;
  const body = overlay.querySelector<HTMLElement>(".confirm-body")!;
  if (wording.body) {
    body.id = `confirm-body-${id}`;
    body.textContent = wording.body;
    overlay.querySelector(".confirm-sheet")!.setAttribute("aria-describedby", body.id);
  } else {
    body.remove();
  }
  const go = overlay.querySelector<HTMLButtonElement>("[data-role=confirm-go]")!;
  const cancel = overlay.querySelector<HTMLButtonElement>("[data-role=confirm-cancel]")!;
  go.textContent = wording.confirm;
  cancel.textContent = wording.cancel;

  // Gestures on the sheet stay on the sheet: the cup swipe, shelf swipe and
  // settings long press all listen on document.
  const stop = (e: Event) => e.stopPropagation();
  for (const type of ["pointerdown", "pointerup", "touchstart", "touchend"]) overlay.addEventListener(type, stop);

  return new Promise((resolve) => {
    const finish = (answer: boolean) => {
      document.removeEventListener("keydown", onKey);
      overlay.remove();
      returnFocus?.focus?.();
      resolve(answer);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish(false);
      // Two buttons: Tab moves between them and never leaves the sheet.
      if (e.key === "Tab") {
        e.preventDefault();
        (document.activeElement === go ? cancel : go).focus();
      }
    };
    go.addEventListener("click", () => finish(true));
    cancel.addEventListener("click", () => finish(false));
    overlay.querySelector("[data-role=confirm-backdrop]")!.addEventListener("click", () => finish(false));
    document.addEventListener("keydown", onKey);
    document.body.append(overlay);
    cancel.focus();
  });
}
