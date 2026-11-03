import { deviceAudio } from "../adapters/audio";
import { deviceHaptics } from "../adapters/haptics";
import { formatPounds } from "../domain/money";
import { DEFAULT_ITEM } from "../domain/store";
import { registerScreen, type AppContext, type Mount } from "./app";
import { cupSvg, PAPER_BAND_SVG } from "./cup-art";

/** How long the undo toast stays up after a press. */
export const UNDO_MS = 5000;

/** Cut Paper cup (src/ui/cup-art.ts); one cup screen is mounted at a time. */
const CUP_SVG = cupSvg("cup-body-clip");

function mountCup(el: HTMLElement, ctx: AppContext): () => void {
  el.innerHTML = `${PAPER_BAND_SVG}
    <button class="cup-button" type="button" data-role="cup" aria-label="I skipped a coffee">${CUP_SVG}</button>
    <p class="total" id="total" data-role="total" aria-live="polite"><span class="total-amount" data-role="total-amount"></span> <span class="total-label">this month</span></p>
    <div class="below-total" data-role="below-total"></div>
    <div class="toast" data-role="undo-toast" hidden>
      <span data-role="toast-text"></span>
      <button type="button" data-role="undo">Undo</button>
    </div>`;
  const cup = el.querySelector<HTMLButtonElement>("[data-role=cup]")!;
  const totalAmount = el.querySelector<HTMLElement>("[data-role=total-amount]")!;
  const toast = el.querySelector<HTMLElement>("[data-role=undo-toast]")!;
  const toastText = el.querySelector<HTMLElement>("[data-role=toast-text]")!;
  const undoButton = el.querySelector<HTMLButtonElement>("[data-role=undo]")!;

  let monthPence = 0;
  let lastPressId: string | null = null;
  let toastTimer: number | undefined;

  const render = () => {
    // The label is static markup; textContent still reads "£X this month".
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

  cup.addEventListener("click", async () => {
    // First, before any await: iOS only ticks the switch haptic and resumes
    // audio inside the tap's gesture; after the IndexedDB write it is too late.
    deviceHaptics().tap();
    deviceAudio().unlock();
    const press = await ctx.ledger.addPress(DEFAULT_ITEM.id, ctx.clock.now());
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
  return () => {
    window.clearTimeout(toastTimer);
    document.removeEventListener("visibilitychange", onVisible);
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
