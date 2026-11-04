/**
 * Gear button top-right of the cup screen, mirroring the info button top-left.
 * Opens the settings screen (the long press on the total still works too).
 * DOM glue only.
 */
import { registerCupExtra } from "./cup";

registerCupExtra((el, ctx) => {
  el.innerHTML = `<button type="button" class="settings-button" data-role="settings-open" aria-label="Settings">
    <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22">
      <path fill="currentColor" d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Zm9.3 5.1-2.1-.4a7.3 7.3 0 0 0-.5-1.9l1.6-1.4a1 1 0 0 0 .2-1.3l-1.3-2.2a1 1 0 0 0-1.3-.4l-2 .8a7.3 7.3 0 0 0-1.6-1.2l-.3-2.1A1 1 0 0 0 13 2.4h-2a1 1 0 0 0-1 .8l-.3 2.1a7.3 7.3 0 0 0-1.6 1.2l-2-.8a1 1 0 0 0-1.3.4L3.5 8.3a1 1 0 0 0 .2 1.3l1.6 1.4a7.3 7.3 0 0 0-.5 1.9l-2.1.4a1 1 0 0 0-.8 1v2.5a1 1 0 0 0 .8 1l2.1.4c.1.7.3 1.3.5 1.9l-1.6 1.4a1 1 0 0 0-.2 1.3l1.3 2.2a1 1 0 0 0 1.3.4l2-.8c.5.5 1 .9 1.6 1.2l.3 2.1a1 1 0 0 0 1 .8h2a1 1 0 0 0 1-.8l.3-2.1c.6-.3 1.1-.7 1.6-1.2l2 .8a1 1 0 0 0 1.3-.4l1.3-2.2a1 1 0 0 0-.2-1.3l-1.6-1.4c.2-.6.4-1.2.5-1.9l2.1-.4a1 1 0 0 0 .8-1v-2.5a1 1 0 0 0-.8-1Z"/>
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
