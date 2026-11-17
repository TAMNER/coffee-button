import { deviceAudio } from "../adapters/audio";
import { deviceHaptics } from "../adapters/haptics";
import { ceremonyTimeline } from "../domain/ceremony-timeline";
import { pressVibration } from "../domain/vibration";
import { listItems, nextItem, prevItem } from "../domain/items";
import { formatPounds } from "../domain/money";
import { activeItemId, setActiveItem } from "../domain/settings";
import { DEFAULT_ITEM, type Item } from "../domain/store";
import { registerScreen, type AppContext, type Mount } from "./app";

/** What a cup-screen extra (ring, chevrons, info button) may do besides the AppContext. */
export interface CupContext extends AppContext {
  /** Switch to the next (1) or previous (-1) item exactly as a swipe does. */
  switchItem(dir: 1 | -1): void;
  /** The item currently on the button. */
  activeItem(): Item;
}
export type CupMount = (el: HTMLElement, ctx: CupContext) => void | (() => void);
/** Modules layered over the cup screen (ring text, chevrons, info button). Each gets its own div inside .cup-extras. */
const cupExtras: CupMount[] = [];
export function registerCupExtra(mount: CupMount): void {
  cupExtras.push(mount);
}
import { vesselFor } from "./art/vessels";
import { PAPER_BAND_SVG } from "./cup-art";

/** How long the undo toast stays up after a press. */
export const UNDO_MS = 5000;

/** A horizontal move at least this long, and longer than it is tall, switches item. */
const SWIPE_PX = 40;
const SLIDE_MS = 250;

/** Each vessel SVG gets its own clipPath id, since two are on screen mid-slide. */
let vessels = 0;
function vesselSvg(item: Item): string {
  return vesselFor(item.icon).svg(`cup-body-clip-${++vessels}`);
}

function labelText(item: Item): string {
  return `${item.name.toUpperCase()} · THIS MONTH`;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

/**
 * Cut Paper slide: the old vessel is swept off whole in the swipe's direction
 * with a slight tilt, like a card pulled across the table, and the new one is
 * slid in from the other side and lands with a small overshoot. Flat shapes
 * only; no blur, no fade.
 */
function slideVessel(button: HTMLElement, item: Item, dir: 1 | -1): void {
  const old = button.querySelector<SVGSVGElement>(":scope > svg");
  button.insertAdjacentHTML("afterbegin", vesselSvg(item));
  const incoming = button.firstElementChild as SVGSVGElement;
  if (!old) return;
  // The ceremonies draw over the first SVG in the button, which is now the new one.
  old.classList.add("cup-leaving");
  if (prefersReducedMotion() || typeof old.animate !== "function") {
    old.remove();
    return;
  }
  const out = old.animate(
    [
      { transform: "translateX(0) rotate(0deg)" },
      { transform: `translateX(${dir * 115}%) rotate(${dir * 8}deg)` },
    ],
    { duration: SLIDE_MS, easing: "cubic-bezier(.5,0,.9,.4)", fill: "forwards" },
  );
  incoming.animate(
    [
      { transform: `translateX(${-dir * 115}%) rotate(${-dir * 6}deg)` },
      { transform: `translateX(${dir * 3}%) rotate(${dir * 1.5}deg)`, offset: 0.8 },
      { transform: "translateX(0) rotate(0deg)" },
    ],
    { duration: SLIDE_MS, easing: "cubic-bezier(.2,.8,.3,1)" },
  );
  out.onfinish = out.oncancel = () => old.remove();
}

function mountCup(el: HTMLElement, ctx: AppContext): () => void {
  el.innerHTML = `${PAPER_BAND_SVG}
    <button class="cup-button" type="button" data-role="cup"></button>
    <p class="total" id="total" data-role="total" aria-live="polite"><span class="total-amount" data-role="total-amount"></span> <span class="total-label" data-role="total-label"></span></p>
    <div class="below-total" data-role="below-total"></div>
    <div class="cup-extras" data-role="cup-extras"></div>
    <div class="toast" data-role="undo-toast" hidden>
      <span data-role="toast-text"></span>
      <button type="button" data-role="undo">Undo</button>
    </div>`;
  const cup = el.querySelector<HTMLButtonElement>("[data-role=cup]")!;
  const totalAmount = el.querySelector<HTMLElement>("[data-role=total-amount]")!;
  const totalLabel = el.querySelector<HTMLElement>("[data-role=total-label]")!;
  const toast = el.querySelector<HTMLElement>("[data-role=undo-toast]")!;
  const toastText = el.querySelector<HTMLElement>("[data-role=toast-text]")!;
  const undoButton = el.querySelector<HTMLButtonElement>("[data-role=undo]")!;

  let alive = true;
  let monthPence = 0;
  let lastPressId: string | null = null;
  let toastTimer: number | undefined;
  // Coffee is drawn at once; the stored active item replaces it as soon as it loads.
  let items: Item[] = [DEFAULT_ITEM];
  let active: Item = DEFAULT_ITEM;

  /** Names the active item on the button and label, and tells the ceremony which vessel to pour into. */
  const showItem = (item: Item) => {
    cup.dataset.vessel = item.icon;
    cup.setAttribute("aria-label", `I skipped a ${item.name.toLowerCase()}`);
    totalLabel.textContent = labelText(item);
  };
  showItem(active);
  cup.innerHTML = vesselSvg(active);

  void (async () => {
    const [list, id] = await Promise.all([listItems(ctx.store), activeItemId(ctx.store)]);
    if (!alive) return;
    items = list;
    const stored = list.find((item) => item.id === id);
    if (!stored || stored.id === active.id) {
      // Same item, but its name may have been edited in settings.
      if (stored) showItem((active = stored));
      return;
    }
    active = stored;
    showItem(active);
    cup.innerHTML = vesselSvg(active);
  })();

  const switchItem = (dir: 1 | -1) => {
    const id = dir === 1 ? nextItem(items, active.id) : prevItem(items, active.id);
    const item = items.find((i) => i.id === id);
    if (!item || item.id === active.id) return;
    active = item;
    showItem(item);
    slideVessel(cup, item, dir);
    ctx.bus.emit("item", { item });
    void setActiveItem(ctx.store, item.id).catch((err) => console.error("Could not save the active item", err));
  };

  const render = () => {
    // The label is separate markup; textContent still reads "£X COFFEE · THIS MONTH".
    totalAmount.textContent = formatPounds(monthPence);
  };
  const refresh = async () => {
    monthPence = await ctx.ledger.monthToDate(ctx.clock.now());
    render();
  };
  const hideToast = () => {
    window.clearTimeout(toastTimer);
    toast.hidden = true;
    lastPressId = null;
  };

  // --- Horizontal swipe: right for the next item, left for the previous ---
  // The shelf's swipe (src/ui/shelf.ts, attachNavigation) listens on the
  // document too and ignores any move wider than it is tall; this one only
  // acts on moves wider than they are tall, so one gesture never does both.
  // iOS sends both pointer and touch events for one touch: the first end
  // event of a gesture is read, its twin is ignored.
  let startX = 0;
  let startY = 0;
  let ended = true;
  let swallowClick = false;
  const start = (x: number, y: number) => {
    startX = x;
    startY = y;
    ended = false;
    swallowClick = false;
  };
  const end = (x: number, y: number) => {
    if (ended) return;
    ended = true;
    const dx = x - startX;
    const dy = y - startY;
    if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) <= Math.abs(dy)) return;
    // The click a mouse swipe ends in must not also count as a press (on the
    // cup) or a tap that opens the shelf (on the total).
    swallowClick = true;
    switchItem(dx > 0 ? 1 : -1);
  };
  const onPointerDown = (e: PointerEvent) => start(e.clientX, e.clientY);
  const onPointerUp = (e: PointerEvent) => end(e.clientX, e.clientY);
  const onTouchStart = (e: TouchEvent) => {
    const t = e.changedTouches[0];
    if (t) start(t.clientX, t.clientY);
  };
  const onTouchEnd = (e: TouchEvent) => {
    const t = e.changedTouches[0];
    if (t) end(t.clientX, t.clientY);
  };
  document.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("pointerup", onPointerUp);
  document.addEventListener("touchstart", onTouchStart, { passive: true });
  document.addEventListener("touchend", onTouchEnd, { passive: true });
  // Window capture runs before the shelf's document-capture click listener.
  const onClickCapture = (e: MouseEvent) => {
    if (!swallowClick) return;
    swallowClick = false;
    e.stopPropagation();
    e.preventDefault();
  };
  window.addEventListener("click", onClickCapture, true);

  cup.addEventListener("click", async () => {
    // First, before any await: iOS only ticks the switch haptic and resumes
    // audio inside the tap's gesture; after the IndexedDB write it is too late.
    deviceHaptics().vibrate(pressVibration(ceremonyTimeline({ pour: vesselFor(active.icon).pour })));
    deviceAudio().unlock();
    // The item on screen, named explicitly: its switch may still be saving.
    const press = await ctx.ledger.addPress(active.id, ctx.clock.now());
    ctx.bus.emit("press", { press });
    monthPence += press.pricePence;
    render();
    void ctx.mover.move(press.pricePence, { pressId: press.id });

    lastPressId = press.id;
    toastText.textContent = `+${formatPounds(press.pricePence)}`;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(hideToast, UNDO_MS);
  });

  undoButton.addEventListener("click", async () => {
    const pressId = lastPressId;
    if (!pressId) return;
    hideToast();
    await ctx.ledger.undo(pressId);
    ctx.bus.emit("undo", { pressId });
    await refresh();
  });

  const onVisible = () => {
    if (document.visibilityState === "visible") void refresh();
  };
  document.addEventListener("visibilitychange", onVisible);

  render();
  void refresh();
  const belowTotalCleanups = mountBelowTotal(el.querySelector<HTMLElement>("[data-role=below-total]")!, ctx);
  const cupCtx: CupContext = { ...ctx, show: ctx.show, switchItem, activeItem: () => active };
  const extrasSlot = el.querySelector<HTMLElement>("[data-role=cup-extras]")!;
  const extraCleanups = cupExtras.flatMap((mount) => {
    const slot = extrasSlot.appendChild(document.createElement("div"));
    return mount(slot, cupCtx) ?? [];
  });
  return () => {
    for (const fn of extraCleanups) fn();
    alive = false;
    window.clearTimeout(toastTimer);
    document.removeEventListener("visibilitychange", onVisible);
    document.removeEventListener("pointerdown", onPointerDown);
    document.removeEventListener("pointerup", onPointerUp);
    document.removeEventListener("touchstart", onTouchStart);
    document.removeEventListener("touchend", onTouchEnd);
    window.removeEventListener("click", onClickCapture, true);
    for (const fn of belowTotalCleanups) fn();
  };
}

registerScreen("cup", mountCup);

/** Modules that render under the total on the cup screen (e.g. the Invest button). */
const belowTotal: Mount[] = [];

export function registerBelowTotal(mount: Mount): void {
  belowTotal.push(mount);
}

function mountBelowTotal(slot: HTMLElement, ctx: AppContext): (() => void)[] {
  return belowTotal.flatMap((mount) => {
    const el = slot.appendChild(document.createElement("div"));
    return mount(el, ctx) ?? [];
  });
}
