// "Invest £X" under the total, and the "Did you invest £X?" question on return.
// Thin DOM glue: the behaviour lives in src/domain/settle.ts.
import { browserClipboard } from "../adapters/clipboard";
import { deviceHaptics } from "../adapters/haptics";
import { browserUrlOpener } from "../adapters/open-url";
import { formatPounds } from "../domain/money";
import { InvestFlow, isSettleWindow, owed, owedSince } from "../domain/settle";
import type { AppContext } from "./app";
import { registerBelowTotal } from "./cup";

function mountInvest(el: HTMLElement, ctx: AppContext): () => void {
  el.className = "invest";
  el.innerHTML = `
    <button type="button" class="invest-button" data-role="invest" hidden></button>
    <div class="invest-prompt" data-role="invest-prompt" role="group" hidden>
      <p data-role="invest-question"></p>
      <button type="button" data-role="invest-yes">Yes</button>
      <button type="button" data-role="invest-not-yet">Not yet</button>
    </div>`;
  const investButton = el.querySelector<HTMLButtonElement>("[data-role=invest]")!;
  const prompt = el.querySelector<HTMLElement>("[data-role=invest-prompt]")!;
  const question = el.querySelector<HTMLElement>("[data-role=invest-question]")!;
  const yesButton = el.querySelector<HTMLButtonElement>("[data-role=invest-yes]")!;
  const notYetButton = el.querySelector<HTMLButtonElement>("[data-role=invest-not-yet]")!;

  const flow = new InvestFlow({
    store: ctx.store,
    clock: ctx.clock,
    clipboard: browserClipboard,
    opener: browserUrlOpener,
    onSettled: (settlement) => ctx.bus.emit("settle", { settlement }),
  });

  let owedPence = 0;
  const refresh = async () => {
    const now = ctx.clock.now();
    owedPence = await owed(ctx.store, now);
    const since = await owedSince(ctx.store, now);
    const { paydayDay } = await ctx.store.getSettings();
    investButton.textContent = `Invest ${formatPounds(owedPence)}`;
    investButton.hidden = !prompt.hidden || !isSettleWindow(now, paydayDay, since, owedPence);
  };

  // Synchronous in the click handler so Safari keeps the tap's user activation.
  investButton.addEventListener("click", () => {
    flow.invest(owedPence).catch((err) => console.error("invest failed", err));
  });

  const stopPrompt = flow.onPrompt((text) => {
    question.textContent = text;
    prompt.hidden = false;
    investButton.hidden = true;
  });
  const closePrompt = () => {
    prompt.hidden = true;
    void refresh();
  };
  yesButton.addEventListener("click", async () => {
    // Inside the gesture, before any await, or iOS drops the haptic (the settle
    // ceremony runs later, after the settlement is persisted).
    deviceHaptics().tap();
    prompt.hidden = true;
    await flow.yes();
    closePrompt();
  });
  notYetButton.addEventListener("click", () => {
    void flow.notYet();
    closePrompt();
  });

  // iOS often kills the Home Screen app while InvestEngine is open (and the
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
