/**
 * Gear button top-right of the cup screen, mirroring the info button top-left.
 * Opens the settings screen (the long press on the total still works too).
 * DOM glue only.
 */
import { registerCupExtra } from "./cup";

registerCupExtra((el, ctx) => {
  el.innerHTML = `<button type="button" class="settings-button" data-role="settings-open" aria-label="Settings">
    <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22">
      <path fill="currentColor" fill-rule="evenodd" d="M20.61 10.79 L22.97 11.23 L22.97 12.77 L20.61 13.21 L18.95 17.23 L20.30 19.22 L19.22 20.30 L17.23 18.95 L13.21 20.61 L12.77 22.97 L11.23 22.97 L10.79 20.61 L6.77 18.95 L4.78 20.30 L3.70 19.22 L5.05 17.23 L3.39 13.21 L1.03 12.77 L1.03 11.23 L3.39 10.79 L5.05 6.77 L3.70 4.78 L4.78 3.70 L6.77 5.05 L10.79 3.39 L11.23 1.03 L12.77 1.03 L13.21 3.39 L17.23 5.05 L19.22 3.70 L20.30 4.78 L18.95 6.77Z M15.30 12 A3.3 3.3 0 1 0 8.70 12 A3.3 3.3 0 1 0 15.30 12Z"/>
    </svg>
  </button>`;
  const button = el.querySelector<HTMLButtonElement>("[data-role=settings-open]")!;
  button.addEventListener("click", () => ctx.show("settings"));
  // Same banner offset as the info button: sit below Safari's install banner.
  const place = () => {
    let below = 0;
    for (const banner of document.querySelectorAll(".banner")) below = Math.max(below, banner.getBoundingClientRect().bottom);
    button.style.setProperty("--info-below", `${below}px`);
  };
  place();
  window.addEventListener("resize", place);
  const frame = requestAnimationFrame(place);
  return () => {
    window.removeEventListener("resize", place);
    cancelAnimationFrame(frame);
  };
});
