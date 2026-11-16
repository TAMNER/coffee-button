declare const __BUILD_ID__: string;
/**
 * Ticket 15: the ⓘ button top-left on the cup screen and the bottom sheet it
 * opens. The copy and the "show once" rule live in src/domain/info.ts; this is
 * DOM glue only. The sheet closes on the Close button, a tap on the backdrop,
 * Escape, or a downward drag of at least SWIPE_DOWN_PX.
 */
import { browserFacts } from "../adapters/browser";
import { INFO_SECTIONS, homeScreenHintNeeded, markInfoSeen, shouldShowInfoOnLaunch } from "../domain/info";
import { installCopy } from "../domain/install-copy";
import { registerCupExtra, type CupContext } from "./cup";

const SWIPE_DOWN_PX = 60;
const HOME_SCREEN_HEADING = "Add to Home Screen";

/** Asked once per page load, so returning to the cup screen never reopens it. */
let launchChecked = false;
let sheets = 0;

function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.("(display-mode: standalone)").matches === true || nav.standalone === true;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function sheetHtml(id: number): string {
  const hintNeeded = homeScreenHintNeeded(isStandalone());
  // All four sections always show; the Home Screen one is flagged only while the app is not installed.
  // Its body is Safari's steps on iOS Safari and neutral wording elsewhere (domain/install-copy.ts).
  const homeScreenBody = installCopy(browserFacts()).infoBody;
  const sections = INFO_SECTIONS.map((s) => (s.heading === HOME_SCREEN_HEADING ? { ...s, body: homeScreenBody } : s)).map(
      (s) => `<section class="info-section"${s.heading === HOME_SCREEN_HEADING && hintNeeded ? ' data-needed="true"' : ""}>
        <h3>${escapeHtml(s.heading)}</h3>
        <p>${escapeHtml(s.body)}</p>
      </section>`,
    )
    .join("");
  return `<div class="info-backdrop" data-role="info-backdrop"></div>
    <div class="info-sheet" data-role="info-sheet" role="dialog" aria-modal="true" aria-labelledby="info-title-${id}" tabindex="-1">
      <div class="info-grip" aria-hidden="true"></div>
      <h2 class="info-title" id="info-title-${id}">How it works</h2>
      ${sections}
      <button type="button" class="info-close" data-role="info-close">Close</button>
      <p class="info-build">Build ${__BUILD_ID__}</p>
    </div>`;
}

function mountInfo(el: HTMLElement, ctx: CupContext): () => void {
  const id = ++sheets;
  el.classList.add("info-extra");
  el.innerHTML = `<button type="button" class="info-button" data-role="info-open" aria-label="How Coffee Button works" aria-haspopup="dialog">i</button>
    <div class="info-overlay" data-role="info-overlay" hidden></div>`;
  const openButton = el.querySelector<HTMLButtonElement>("[data-role=info-open]")!;
  const overlay = el.querySelector<HTMLElement>("[data-role=info-overlay]")!;

  let alive = true;
  let startY: number | null = null;

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
    // The Close button is the sheet's only control, so Tab keeps focus on it.
    if (e.key === "Tab") {
      e.preventDefault();
      overlay.querySelector<HTMLButtonElement>("[data-role=info-close]")?.focus();
    }
  };

  const open = () => {
    if (!overlay.hidden) return;
    overlay.innerHTML = sheetHtml(id);
    overlay.hidden = false;
    openButton.setAttribute("aria-expanded", "true");
    overlay.querySelector("[data-role=info-backdrop]")!.addEventListener("click", close);
    const closeButton = overlay.querySelector<HTMLButtonElement>("[data-role=info-close]")!;
    closeButton.addEventListener("click", close);
    document.addEventListener("keydown", onKey);
    closeButton.focus();
  };

  function close(): void {
    if (overlay.hidden) return;
    overlay.hidden = true;
    overlay.innerHTML = "";
    openButton.setAttribute("aria-expanded", "false");
    document.removeEventListener("keydown", onKey);
    startY = null;
    if (alive) openButton.focus();
  }

  // Gestures on the open sheet stay on the sheet: the cup's item swipe, the
  // shelf's swipe up and the settings long press all listen on document.
  const stop = (e: Event) => e.stopPropagation();
  const down = (y: number) => {
    startY = y;
  };
  const up = (y: number) => {
    if (startY === null) return;
    const dy = y - startY;
    startY = null;
    if (dy >= SWIPE_DOWN_PX) close();
  };
  overlay.addEventListener("pointerdown", (e) => {
    stop(e);
    down(e.clientY);
  });
  overlay.addEventListener("pointerup", (e) => {
    stop(e);
    up(e.clientY);
  });
  overlay.addEventListener(
    "touchstart",
    (e) => {
      stop(e);
      const t = e.changedTouches[0];
      if (t) down(t.clientY);
    },
    { passive: true },
  );
  overlay.addEventListener(
    "touchend",
    (e) => {
      stop(e);
      const t = e.changedTouches[0];
      if (t) up(t.clientY);
    },
    { passive: true },
  );
  // In Safari a banner is pinned across the top (src/main.ts); sit below it.
  const place = () => {
    let below = 0;
    for (const banner of document.querySelectorAll(".banner")) below = Math.max(below, banner.getBoundingClientRect().bottom);
    openButton.style.setProperty("--info-below", `${below}px`);
  };
  place();
  window.addEventListener("resize", place);
  const frame = requestAnimationFrame(place);

  // The button's own taps must not count as a long press for settings either.
  openButton.addEventListener("pointerdown", stop);
  openButton.addEventListener("click", open);

  if (!launchChecked) {
    launchChecked = true;
    void shouldShowInfoOnLaunch(ctx.store)
      .then(async (show) => {
        if (!show || !alive) return;
        open();
        await markInfoSeen(ctx.store);
      })
      .catch((err) => console.error("Could not read whether the info sheet was seen", err));
  }

  return () => {
    alive = false;
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", place);
    cancelAnimationFrame(frame);
  };
}

registerCupExtra(mountInfo);
