import { formatPounds } from "../domain/money";
import { settleCeremonyPlan, tickerFrames, type SettleCeremonyPlan } from "../domain/settle-ceremony";
import type { Store } from "../domain/store";
import { onStart, type Bus } from "./app";
import { animate, coinEl, confettiEl, mulberry32, overlayMetrics, overlayOver, wait } from "./ceremony";
import { CUP_VIEWBOX, RIM } from "./cup-art";
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
// DOM: Cut Paper coins cascading out of the tipped cup, then the shelf
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

/**
 * The cup tips over and the month's coins burst out of it and fall off the
 * screen, with confetti as in the press ceremony. Same Cut Paper coin and
 * palette; coordinates are the cup SVG's (the mockup's phone frame).
 */
async function cascade(coins: number, seed: number): Promise<void> {
  const cup = document.querySelector("[data-role=cup] svg");
  if (!cup) return;
  const overlay = overlayOver(cup);
  const { unitsPerPx, screenBottom } = overlayMetrics(cup);
  const random = mulberry32(seed);
  // Mouth of the tipped cup, and far enough below to leave the screen.
  const from = { x: 150, y: 470 };
  const offscreen = screenBottom - from.y + 40;
  // Spread the coins over the screen's width rather than the disc's.
  const spread = Math.max(window.innerWidth * unitsPerPx, CUP_VIEWBOX.width);

  const pieces: Piece[] = [];
  for (let i = 0; i < coins; i++) {
    const coin = coinEl();
    coin.style.opacity = "0";
    const dx = (random() - 0.5) * spread;
    const up = -110 - random() * 160;
    const flip = (random() - 0.5) * 2;
    const at = (x: number, y: number) => `translate(${from.x + x}px, ${from.y + y}px)`;
    pieces.push({
      el: coin,
      keyframes: [
        { transform: `${at(0, 0)} scale(.6, .6)`, opacity: 1 },
        { transform: `${at(dx * 0.5, up)} scale(${flip}, 1)`, opacity: 1, offset: 0.35, easing: "ease-in" },
        { transform: `${at(dx, offscreen)} scale(1, 1)`, opacity: 1 },
      ],
      options: {
        duration: COIN_MS,
        delay: (i / Math.max(coins, 1)) * (CASCADE_MS - COIN_MS),
        easing: "cubic-bezier(.2,.6,.6,1)",
      },
    });
  }
  for (let i = 0; i < CONFETTI_COUNT; i++) {
    const piece = confettiEl(i);
    piece.style.opacity = "0";
    const dx = (random() - 0.5) * spread;
    const dy = -110 - random() * 240;
    const spin = (random() - 0.5) * 1440;
    const at = (x: number, y: number) => `translate(${RIM.x + x}px, ${RIM.y + y}px)`;
    pieces.push({
      el: piece,
      keyframes: [
        { transform: `${at(0, 0)} rotate(0deg) scale(0)`, opacity: 1 },
        { transform: `${at(dx * 0.8, dy)} rotate(${spin / 2}deg) scale(1)`, opacity: 1, offset: 0.45 },
        { transform: `${at(dx, dy + 160)} rotate(${spin}deg) scale(1)`, opacity: 0 },
      ],
      options: { duration: 1100, delay: 150, easing: "cubic-bezier(.2,.7,.4,1)" },
    });
  }

  overlay.append(...pieces.map((p) => p.el));
  document.body.append(overlay);
  // Tip the cup itself (not the disc behind it) about its middle.
  const figure = cup.querySelector<SVGGElement>(".cup-figure");
  if (figure) {
    figure.style.transformBox = "view-box";
    figure.style.transformOrigin = "195px 407px";
    animate(
      figure,
      [
        { transform: "rotate(0deg)" },
        { transform: "rotate(-150deg)", offset: 0.25 },
        { transform: "rotate(-150deg)", offset: 0.75 },
        { transform: "rotate(0deg)" },
      ],
      { duration: CASCADE_MS, easing: "ease-in-out", fill: "none" },
    );
  }
  for (const p of pieces) animate(p.el, p.keyframes, p.options);
  await wait(CASCADE_MS);
  overlay.remove();
}

/** "Invested so far" card over the shelf, ticking from the old lifetime total to the new one. */
async function tickLifetime(fromPence: number, toPence: number): Promise<void> {
  const card = document.createElement("div");
  card.setAttribute("role", "status");
  card.className = "settle-card";
  const label = document.createElement("div");
  label.textContent = "Invested so far";
  label.className = "settle-card-label";
  const amount = document.createElement("div");
  amount.className = "settle-card-amount";
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
  wireSettleCeremony(ctx.bus, ctx.store, {
    async play(plan) {
      try {
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
