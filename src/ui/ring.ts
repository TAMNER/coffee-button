/**
 * Ticket 14: the "Skip and Save" ring around the big button, and the faint
 * chevrons that signify the swipes. Low contrast on purpose: the button is
 * the hero. The ring is decoration (pointer-events: none) laid over the
 * button by measuring it; the chevrons are real buttons.
 */
import { activeRingLabel, ringLabel } from "../domain/ring";
import { CUP_VIEWBOX } from "./cup-art";
import { registerCupExtra, type CupContext } from "./cup";
import { SHELF_SCREEN } from "./shelf";

const TOP_TEXT = "SKIP AND SAVE";
/** The disc in the vessel art, in CUP_VIEWBOX units (see cup-art.ts / pint-art.ts). */
const DISC = { cx: 195, cy: 400, r: 150 } as const;
/** Ring SVG side as a multiple of the disc radius; the viewBox is 200 wide, so the disc is r=80 in it. */
const RING_SCALE = 2.5;

let rings = 0;

function ringSvg(id: number): string {
  // Top arc runs clockwise over the top (glyphs outward); the bottom arc runs
  // left to right under the disc, so its baseline sits further out to keep
  // the glyphs clear of the disc and upright.
  return `<svg class="ring-svg" viewBox="-100 -100 200 200" aria-hidden="true" focusable="false">
    <defs>
      <path id="ring-top-${id}" d="M -88 0 A 88 88 0 0 1 88 0"/>
      <path id="ring-bottom-${id}" d="M -96 0 A 96 96 0 0 0 96 0"/>
    </defs>
    <text class="ring-text"><textPath href="#ring-top-${id}" startOffset="50%" text-anchor="middle">${TOP_TEXT}</textPath></text>
    <text class="ring-text"><textPath href="#ring-bottom-${id}" startOffset="50%" text-anchor="middle" data-role="ring-item"></textPath></text>
  </svg>`;
}

const CHEVRON_LEFT = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M15 4 L7 12 L15 20"/></svg>`;
const CHEVRON_RIGHT = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M9 4 L17 12 L9 20"/></svg>`;
const CHEVRON_UP = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 15 L12 7 L20 15"/></svg>`;

function mountRing(el: HTMLElement, ctx: CupContext): () => void {
  const id = ++rings;
  el.classList.add("ring-extra");
  el.innerHTML = `<div class="ring" data-role="ring">${ringSvg(id)}</div>
    <button type="button" class="chevron chevron-left" data-role="chevron-prev" aria-label="Previous item">${CHEVRON_LEFT}</button>
    <button type="button" class="chevron chevron-right" data-role="chevron-next" aria-label="Next item">${CHEVRON_RIGHT}</button>
    <button type="button" class="chevron chevron-up" data-role="chevron-shelf" aria-label="Open the shelf">${CHEVRON_UP}</button>`;
  const ring = el.querySelector<HTMLElement>("[data-role=ring]")!;
  const itemText = el.querySelector<SVGTextPathElement>("[data-role=ring-item]")!;
  const prev = el.querySelector<HTMLButtonElement>("[data-role=chevron-prev]")!;
  const next = el.querySelector<HTMLButtonElement>("[data-role=chevron-next]")!;
  const up = el.querySelector<HTMLButtonElement>("[data-role=chevron-shelf]")!;

  let alive = true;
  // Whatever the cup shows now, then the stored item at its stored price
  // (the cup's own load does not emit 'item'; a reprice lands here on remount).
  itemText.textContent = ringLabel(ctx.activeItem());
  let switched = false;
  void activeRingLabel(ctx.store)
    .then((label) => {
      if (alive && !switched) itemText.textContent = label;
    })
    .catch((err) => console.error("Could not read the active item for the ring", err));
  const offItem = ctx.bus.on("item", ({ item }) => {
    switched = true;
    itemText.textContent = ringLabel(item);
  });

  prev.addEventListener("click", () => ctx.switchItem(-1));
  next.addEventListener("click", () => ctx.switchItem(1));
  up.addEventListener("click", () => ctx.show(SHELF_SCREEN));

  // The extras slot is a sibling of the button in the flex column, so the
  // ring and side chevrons are placed over the disc by measuring the button.
  const cup = (el.closest("#app") ?? document).querySelector<HTMLElement>(".cup-button");
  const place = () => {
    if (!cup) return;
    const box = cup.getBoundingClientRect();
    if (box.width === 0) return;
    const unit = box.width / CUP_VIEWBOX.width;
    const cx = box.left + (DISC.cx - CUP_VIEWBOX.x) * unit;
    const cy = box.top + (DISC.cy - CUP_VIEWBOX.y) * unit;
    const side = DISC.r * unit * RING_SCALE;
    ring.style.width = ring.style.height = `${side}px`;
    ring.style.left = `${cx - side / 2}px`;
    ring.style.top = `${cy - side / 2}px`;
    el.style.setProperty("--cup-mid-y", `${cy}px`);
  };
  place();
  const observer = typeof ResizeObserver === "function" ? new ResizeObserver(place) : undefined;
  if (cup) observer?.observe(cup);
  // The disc also moves without changing size when something beside it in the
  // column appears or grows (the Invest button and nudge under the total, a
  // banner above), so the column and the cup's siblings are watched as well.
  // The button may sit inside the tap switch's wrapper (src/ui/tap-switch.ts);
  // the wrapper is then the column's child.
  const slot = cup?.closest(".tap-switch-wrap") ?? cup;
  const column = slot?.parentElement;
  if (column) {
    observer?.observe(column);
    for (const sibling of column.children) if (sibling !== slot) observer?.observe(sibling);
  }
  window.addEventListener("resize", place);
  // Fonts and layout may settle after mount.
  const frame = requestAnimationFrame(place);

  return () => {
    alive = false;
    offItem();
    observer?.disconnect();
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", place);
  };
}

registerCupExtra(mountRing);
