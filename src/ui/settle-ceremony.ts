import { SwitchHaptics } from "../adapters/haptics";
import { formatPounds } from "../domain/money";
import { settleCeremonyPlan, tickerFrames, type SettleCeremonyPlan } from "../domain/settle-ceremony";
import type { Store } from "../domain/store";
import { onStart, type Bus } from "./app";
import { animate, CONFETTI_COLOURS, mulberry32, svgEl, wait } from "./ceremony";
import { SHELF_SCREEN } from "./shelf";

/**
 * Plays the settle ceremony once per confirmed settlement. The settle event
 * fires only after the settlement is persisted (src/ui/settle.ts via
 * InvestFlow.onSettled), so the ceremony never runs ahead of the data.
 */
export function wireSettleCeremony(
  bus: Bus,
  store: Store,
  ceremony: { play(plan: SettleCeremonyPlan): Promise<void> },
): () => void {
  return bus.on("settle", ({ settlement }) => {
    void settleCeremonyPlan(store, settlement).then((plan) => ceremony.play(plan));
  });
}

// ---------------------------------------------------------------------------
// DOM: placeholder SVG coins cascading out of the tipped cup, then the shelf
// screen with the lifetime invested ticking up. Thin and not unit tested; the
// plan (src/domain/settle-ceremony.ts) and the wiring above are.

const CASCADE_MS = 1600;
const COIN_MS = 1000;
const CONFETTI_COUNT = 32;
const TICK_MS = 1200;
const TICK_STEPS = 24;
const HOLD_MS = 1400;
const FADE_MS = 300;

interface Piece {
  el: SVGElement;
  keyframes: Keyframe[];
  options: KeyframeAnimationOptions;
}

/** Coins burst up out of the cup and fall off the screen; confetti as in the press ceremony. */
async function cascade(coins: number, seed: number): Promise<void> {
  const cup = document.querySelector("[data-role=cup] svg");
  if (!cup) return;
  const box = cup.getBoundingClientRect();
  const overlay = svgEl("svg", { viewBox: "0 0 120 120", "aria-hidden": "true" });
  overlay.style.cssText = `position:fixed;left:${box.left}px;top:${box.top}px;width:${box.width}px;height:${box.height}px;overflow:visible;pointer-events:none;z-index:10;`;
  const random = mulberry32(seed);
  // Far enough below the cup to leave the screen, in viewBox units.
  const offscreen = ((window.innerHeight - box.top) / Math.max(box.height, 1)) * 120 + 20;

  const pieces: Piece[] = [];
  for (let i = 0; i < coins; i++) {
    const coin = svgEl("circle", { cx: 54, cy: 50, r: 7, fill: "#e9b949", stroke: "#b8860b", "stroke-width": 2 });
    coin.style.transformBox = "fill-box";
    coin.style.transformOrigin = "center";
    coin.style.opacity = "0";
    const dx = (random() - 0.5) * 220;
    const up = -40 - random() * 60;
    const flip = (random() - 0.5) * 2;
    pieces.push({
      el: coin,
      keyframes: [
        { transform: "translate(0px, 0px) scaleX(1)", opacity: 1 },
        { transform: `translate(${dx * 0.5}px, ${up}px) scaleX(${flip})`, opacity: 1, offset: 0.35, easing: "ease-in" },
        { transform: `translate(${dx}px, ${offscreen}px) scaleX(1)`, opacity: 1 },
      ],
      options: {
        duration: COIN_MS,
        delay: (i / Math.max(coins, 1)) * (CASCADE_MS - COIN_MS),
        easing: "cubic-bezier(.2,.6,.6,1)",
      },
    });
  }
  for (let i = 0; i < CONFETTI_COUNT; i++) {
    const piece = svgEl("rect", {
      x: 52,
      y: 38,
      width: 4 + random() * 3,
      height: 7 + random() * 4,
      fill: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
    });
    piece.style.transformBox = "fill-box";
    piece.style.transformOrigin = "center";
    piece.style.opacity = "0";
    const dx = (random() - 0.5) * 200;
    const dy = -40 - random() * 90;
    const spin = (random() - 0.5) * 1440;
    pieces.push({
      el: piece,
      keyframes: [
        { transform: "translate(0px, 0px) rotate(0deg)", opacity: 1 },
        { transform: `translate(${dx * 0.8}px, ${dy}px) rotate(${spin / 2}deg)`, opacity: 1, offset: 0.45 },
        { transform: `translate(${dx}px, ${dy + 60}px) rotate(${spin}deg)`, opacity: 0 },
      ],
      options: { duration: 1100, delay: 150, easing: "cubic-bezier(.2,.7,.4,1)" },
    });
  }

  overlay.append(...pieces.map((p) => p.el));
  document.body.append(overlay);
  animate(
    cup,
    [
      { transform: "rotate(0deg)" },
      { transform: "rotate(-150deg)", offset: 0.25 },
      { transform: "rotate(-150deg)", offset: 0.75 },
      { transform: "rotate(0deg)" },
    ],
    { duration: CASCADE_MS, easing: "ease-in-out", fill: "none" },
  );
  for (const p of pieces) animate(p.el, p.keyframes, p.options);
  await wait(CASCADE_MS);
  overlay.remove();
}

/** "Invested so far" card over the shelf, ticking from the old lifetime total to the new one. */
async function tickLifetime(fromPence: number, toPence: number): Promise<void> {
  const card = document.createElement("div");
  card.setAttribute("role", "status");
  card.style.cssText =
    "position:fixed;left:50%;top:calc(env(safe-area-inset-top) + 16px);transform:translateX(-50%);" +
    "padding:12px 20px;border-radius:16px;background:var(--ink);color:var(--cream);" +
    "text-align:center;pointer-events:none;z-index:10;font-variant-numeric:tabular-nums;";
  const label = document.createElement("div");
  label.textContent = "Invested so far";
  label.style.cssText = "font-size:0.85rem;opacity:0.8;";
  const amount = document.createElement("div");
  amount.style.cssText = "font-size:2rem;font-weight:700;";
  card.append(label, amount);
  document.body.append(card);

  try {
    for (const pence of tickerFrames(fromPence, toPence, TICK_STEPS)) {
      amount.textContent = formatPounds(pence);
      await wait(TICK_MS / TICK_STEPS);
    }
    animate(amount, [{ transform: "scale(1)" }, { transform: "scale(1.15)", offset: 0.4 }, { transform: "scale(1)" }], {
      duration: 400,
      fill: "none",
    });
    await wait(HOLD_MS);
    animate(card, [{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS });
    await wait(FADE_MS);
  } finally {
    card.remove();
  }
}

let plays = 0;

onStart((ctx) => {
  const haptics = new SwitchHaptics(document);
  wireSettleCeremony(ctx.bus, ctx.store, {
    async play(plan) {
      try {
        haptics.tap();
        await cascade(plan.coins, Date.now() + ++plays);
        ctx.show(SHELF_SCREEN);
        await tickLifetime(plan.fromPence, plan.toPence);
      } catch (err) {
        // Garnish only: the settlement is already stored.
        console.error("settle ceremony failed", err);
      }
    },
  });
});
