import { formatPounds } from "../domain/money";
import { DEFAULT_ITEM } from "../domain/store";
import { registerScreen, type AppContext, type Mount } from "./app";

/** How long the undo toast stays up after a press. */
export const UNDO_MS = 5000;

const CUP_SVG = `
<svg class="cup" viewBox="0 0 120 120" aria-hidden="true">
  <path d="M24 40 h60 v30 a30 30 0 0 1 -60 0 z" fill="#7a4a2a" />
  <path d="M84 48 h6 a12 12 0 0 1 0 24 h-7" fill="none" stroke="#7a4a2a" stroke-width="7" />
  <ellipse cx="54" cy="104" rx="38" ry="6" fill="#d9c3a5" />
</svg>`;

function mountCup(el: HTMLElement, ctx: AppContext): () => void {
  el.innerHTML = `
    <button class="cup-button" type="button" data-role="cup" aria-label="I skipped a coffee">${CUP_SVG}</button>
    <p class="total" id="total" data-role="total" aria-live="polite"></p>
    <div class="below-total" data-role="below-total"></div>
    <div class="toast" data-role="undo-toast" hidden>
      <span data-role="toast-text"></span>
      <button type="button" data-role="undo">Undo</button>
    </div>`;
  const cup = el.querySelector<HTMLButtonElement>("[data-role=cup]")!;
  const total = el.querySelector<HTMLElement>("[data-role=total]")!;
  const toast = el.querySelector<HTMLElement>("[data-role=undo-toast]")!;
  const toastText = el.querySelector<HTMLElement>("[data-role=toast-text]")!;
  const undoButton = el.querySelector<HTMLButtonElement>("[data-role=undo]")!;

  let monthPence = 0;
  let lastPressId: string | null = null;
  let toastTimer: number | undefined;

  const render = () => {
    total.textContent = `${formatPounds(monthPence)} this month`;
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
