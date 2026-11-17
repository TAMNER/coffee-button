// "Invest £X" under the total, and the "Did you invest £X?" question on return.
// Thin DOM glue: the behaviour lives in src/domain/settle.ts.
import { browserClipboard, type Clipboard } from "../adapters/clipboard";
import { deviceHaptics } from "../adapters/haptics";
import { browserUrlOpener, type UrlOpener } from "../adapters/open-url";
import { formatPounds } from "../domain/money";
import { InvestFlow, isSettleWindow, owed, owedSince } from "../domain/settle";
import { spaceLine } from "../domain/settle-space";
import { waitingTotal } from "../domain/starling-mover";
import { settleVibration } from "../domain/vibration";
import type { AppContext } from "./app";
import { registerBelowTotal } from "./cup";

/** The app's InvestFlow: a Yes emits 'settle' on the bus once the settlement is stored. */
export function createInvestFlow(
  ctx: Pick<AppContext, "store" | "clock" | "bus">,
  clipboard: Clipboard = browserClipboard,
  opener: UrlOpener = browserUrlOpener,
): InvestFlow {
  return new InvestFlow({
    store: ctx.store,
    clock: ctx.clock,
    clipboard,
    opener,
    onSettled: (settlement) => ctx.bus.emit("settle", { settlement }),
  });
}

/** Shown under the Invest button while no destination is set (DESIGN.md: Fund nudge). */
const INVEST_NUDGE =
  "Not sure how or where to invest? Open your stocks and shares ISA and invest in Vanguard funds. I recommend ESG Global All Cap UCITS ETF (V3AB).";

function mountInvest(el: HTMLElement, ctx: AppContext): () => void {
  el.className = "invest";
  el.innerHTML = `
    <button type="button" class="invest-button" data-role="invest" hidden></button>
    <p class="invest-nudge" data-role="invest-nudge" hidden>${INVEST_NUDGE}</p>
    <p class="invest-space" data-role="invest-space" hidden></p>
    <div class="invest-prompt" data-role="invest-prompt" role="group" hidden>
      <p data-role="invest-question"></p>
      <button type="button" data-role="invest-yes">Yes</button>
      <button type="button" data-role="invest-not-yet">Not yet</button>
    </div>`;
  const investButton = el.querySelector<HTMLButtonElement>("[data-role=invest]")!;
  const nudge = el.querySelector<HTMLElement>("[data-role=invest-nudge]")!;
  const space = el.querySelector<HTMLElement>("[data-role=invest-space]")!;
  const prompt = el.querySelector<HTMLElement>("[data-role=invest-prompt]")!;
  const question = el.querySelector<HTMLElement>("[data-role=invest-question]")!;
  const yesButton = el.querySelector<HTMLButtonElement>("[data-role=invest-yes]")!;
  const notYetButton = el.querySelector<HTMLButtonElement>("[data-role=invest-not-yet]")!;

  const flow = createInvestFlow(ctx);

  let owedPence = 0;
  const refresh = async () => {
    const now = ctx.clock.now();
    owedPence = await owed(ctx.store, now);
    const since = await owedSince(ctx.store, now);
    const { paydayDay, investUrl, starling } = await ctx.store.getSettings();
    investButton.textContent = `Invest ${formatPounds(owedPence)}`;
    investButton.hidden = !prompt.hidden || !isSettleWindow(now, paydayDay, since, owedPence);
    nudge.hidden = investButton.hidden || Boolean(investUrl?.trim());
    // Ticket 21: with a Space linked, say where the month's money is. The app
    // never withdraws from the Space; the user moves it on from the Starling app.
    const line = spaceLine({
      owedPence,
      waitingPence: starling ? waitingTotal(await ctx.store.presses.list()) : 0,
      spaceName: starling?.spaceName ?? null,
    });
    space.textContent = line ?? "";
    space.hidden = investButton.hidden || line === null;
  };

  // Synchronous in the click handler so Safari keeps the tap's user activation.
  investButton.addEventListener("click", () => {
    flow.invest(owedPence).catch((err) => console.error("invest failed", err));
  });

  const stopPrompt = flow.onPrompt((text) => {
    question.textContent = text;
    prompt.hidden = false;
    investButton.hidden = true;
    nudge.hidden = true;
    space.hidden = true;
  });
  const closePrompt = () => {
    prompt.hidden = true;
    void refresh();
  };
  yesButton.addEventListener("click", async () => {
    // Inside the gesture, before any await, or iOS drops the haptic (the settle
    // ceremony runs later, after the settlement is persisted).
    deviceHaptics().vibrate(settleVibration());
    prompt.hidden = true;
    await flow.yes();
    closePrompt();
  });
  notYetButton.addEventListener("click", () => {
    void flow.notYet();
    closePrompt();
  });

  // iOS often kills the Home Screen app while the user is investing elsewhere (and the
  // service worker may reload it), so the unanswered question lives in the store
  // and is asked again on mount and on every return.
  const onVisible = () => {
    if (document.visibilityState !== "visible") return;
    void refresh();
    if (prompt.hidden) void flow.resume();
  };
  document.addEventListener("visibilitychange", onVisible);
  const unsubscribe = [
    ctx.bus.on("press", () => void refresh()),
    ctx.bus.on("undo", () => void refresh()),
  ];

  void refresh();
  void flow.resume();
  return () => {
    stopPrompt();
    document.removeEventListener("visibilitychange", onVisible);
    for (const fn of unsubscribe) fn();
  };
}

registerBelowTotal(mountInvest);
