import { deviceAudio, type Audio } from "../adapters/audio";
import { ceremonyTimeline, type CeremonyStep } from "../domain/ceremony-timeline";
import { onStart, type Bus } from "./app";
import { COFFEE_VESSEL, vesselFor, type VesselArt } from "./art/vessels";
import { COIN_MARKUP, confettiMarkup, STARBURST } from "./cup-art";

/**
 * No haptics here: iOS only ticks the switch haptic inside the user's gesture,
 * and the ceremony runs after the press is persisted (an IndexedDB await later).
 * The cup's click handler taps it synchronously instead (src/ui/cup.ts).
 */
export interface CeremonyAdapters {
  audio: Audio;
}

/** Draws one step of one play; resolves when that step has finished. */
export interface Stage {
  step(step: CeremonyStep): Promise<void>;
}

/** A stage that draws nothing and takes no time. */
export const instantStage: Stage = { step: async () => {} };

export class Ceremony {
  /** `{ pour: false }` for a vessel with nothing to pour: coin, then cheer. */
  constructor(
    private stage: Stage,
    private options: { pour?: boolean } = {},
  ) {}

  async play(adapters: CeremonyAdapters): Promise<void> {
    for (const step of ceremonyTimeline(this.options)) {
      if (step.name === "pour") quietly(() => adapters.audio.playPour(step.durationMs));
      if (step.name === "cheer") quietly(() => adapters.audio.playCheer());
      await this.stage.step(step);
      if (step.name === "coin") quietly(() => adapters.audio.playCoin());
    }
  }
}

/**
 * Plays the ceremony on every press. The press event fires only after the press
 * is persisted, so leaving mid-animation loses nothing. Fire and forget: the
 * cup stays tappable while a ceremony runs.
 */
export function wireCeremony(
  bus: Bus,
  ceremony: Pick<Ceremony, "play">,
  adapters: CeremonyAdapters,
): () => void {
  return bus.on("press", () => {
    void ceremony.play(adapters);
  });
}

/** Sound and haptics are garnish: where they fail, the ceremony carries on silently. */
function quietly(fn: () => void): void {
  try {
    fn();
  } catch {
    // unsupported or blocked on this device
  }
}

// ---------------------------------------------------------------------------
// DOM stage: the Cut Paper press ceremony (mockups/directions.html, direction B,
// "Press ceremony" frame), drawn with the Web Animations API.
// Thin and not unit tested; the timeline and Ceremony above are.

const SVG_NS = "http://www.w3.org/2000/svg";
const CONFETTI_COUNT = 20;

/** Small deterministic PRNG so each play's confetti comes from its own seed. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function svgEl<K extends keyof SVGElementTagNameMap>(
  name: K,
  attrs: Record<string, string | number>,
): SVGElementTagNameMap[K] {
  const el = document.createElementNS(SVG_NS, name);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

export function animate(el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions): void {
  try {
    el.animate(keyframes, { fill: "forwards", ...options });
  } catch {
    // no Web Animations API: the step still takes its time, just undrawn
  }
}

/**
 * An SVG laid exactly over the cup's SVG, in the same coordinates (the
 * mockup's phone frame), overflowing it, with pointer-events off so the cup
 * stays tappable. One per play, so overlapping plays never share elements.
 */
export function overlayOver(cupSvg: Element, viewBox: VesselArt["viewBox"] = COFFEE_VESSEL.viewBox): SVGSVGElement {
  const box = cupSvg.getBoundingClientRect();
  const viewBoxAttr = `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`;
  const overlay = svgEl("svg", { viewBox: viewBoxAttr, "aria-hidden": "true" });
  overlay.style.cssText = `position:fixed;left:${box.left}px;top:${box.top}px;width:${box.width}px;height:${box.height}px;overflow:visible;pointer-events:none;z-index:10;`;
  return overlay;
}

/** Overlay units per CSS pixel, and the overlay y of the top of the viewport. */
export function overlayMetrics(
  cupSvg: Element,
  viewBox: VesselArt["viewBox"] = COFFEE_VESSEL.viewBox,
): { unitsPerPx: number; screenTop: number; screenBottom: number } {
  const box = cupSvg.getBoundingClientRect();
  const unitsPerPx = viewBox.height / Math.max(box.height, 1);
  return {
    unitsPerPx,
    screenTop: viewBox.y - box.top * unitsPerPx,
    screenBottom: viewBox.y + (window.innerHeight - box.top) * unitsPerPx,
  };
}

/** The mustard £ coin, centred on the origin; position it with a CSS transform. */
export function coinEl(): SVGGElement {
  const coin = svgEl("g", {});
  coin.innerHTML = COIN_MARKUP;
  return coin;
}

/** Confetti piece i, centred on the origin; position it with a CSS transform. */
export function confettiEl(i: number): SVGGElement {
  const { className, markup } = confettiMarkup(i);
  const piece = svgEl("g", { class: className });
  piece.innerHTML = markup;
  return piece;
}

/** Transforms on shapes inside the cup's SVG are in its user units, about a fixed point. */
function pinOrigin(el: SVGElement | HTMLElement, x: number, y: number): void {
  el.style.transformBox = "view-box";
  el.style.transformOrigin = `${x}px ${y}px`;
}

interface Scene {
  cleanup(): void;
  vessel: VesselArt;
  cupFigure: SVGGElement | null;
  liquid: SVGGElement | null;
  stream: SVGRectElement;
  streamTravel: number;
  coin: SVGGElement;
  coinFrom: number;
  splashes: { el: SVGRectElement; side: number }[];
  burst: SVGPathElement;
  confetti: { el: SVGGElement; dx: number; dy: number; fall: number; drift: number; spin: number }[];
}

/**
 * The month total flips from its old value to the new one as the coin lands.
 * The cup re-renders the total straight after the press event (which is what
 * starts this play), so the old value is read now and shown in a copy laid
 * over the real one, which stays hidden until the flip.
 */
function flipTotal(vessel: VesselArt = COFFEE_VESSEL): () => void {
  const amount = document.querySelector<HTMLElement>("[data-role=total-amount]");
  if (!amount) return () => {};
  const steps = ceremonyTimeline({ pour: vessel.pour });
  const coinEnds = steps.findIndex((s) => s.name === "coin") + 1;
  const flipAt = steps.slice(0, coinEnds).reduce((ms, s) => ms + s.durationMs, 0) + 40;
  const half = 110;
  const box = amount.getBoundingClientRect();
  const ghost = amount.cloneNode(true) as HTMLElement;
  ghost.removeAttribute("data-role");
  ghost.setAttribute("aria-hidden", "true");
  ghost.style.cssText = `position:fixed;left:${box.left}px;top:${box.top}px;width:${box.width}px;height:${box.height}px;margin:0;text-align:center;white-space:nowrap;pointer-events:none;z-index:10;`;
  amount.parentElement?.append(ghost);
  const end = flipAt + 2 * half;
  const at = (ms: number) => ms / end;
  animate(ghost, [
    { transform: "scaleY(1)", opacity: 1 },
    { transform: "scaleY(1)", opacity: 1, offset: at(flipAt) },
    { transform: "scaleY(0)", opacity: 1, offset: at(flipAt + half), easing: "ease-in" },
    { transform: "scaleY(0)", opacity: 0 },
  ], { duration: end });
  animate(amount, [
    { transform: "scaleY(0)", opacity: 0 },
    { transform: "scaleY(0)", opacity: 0, offset: at(flipAt + half) },
    { transform: "scaleY(0)", opacity: 1, offset: at(flipAt + half) + 0.001, easing: "cubic-bezier(.2,1.6,.5,1)" },
    { transform: "scaleY(1)", opacity: 1 },
  ], { duration: end, fill: "none" });
  return () => ghost.remove();
}

/** The vessel on screen now: the cup button names it (src/ui/cup.ts), so a beer press pours beer. */
function vesselOnScreen(): VesselArt {
  const icon = document.querySelector<HTMLElement>("[data-role=cup]")?.dataset.vessel;
  return icon ? vesselFor(icon) : COFFEE_VESSEL;
}

function buildScene(seed: number, vessel: VesselArt = vesselOnScreen()): Scene | null {
  const cup = document.querySelector("[data-role=cup] svg");
  if (!cup) return null;
  const { viewBox, rim, base, liquidClass } = vessel;
  const overlay = overlayOver(cup, viewBox);
  const { screenTop } = overlayMetrics(cup, viewBox);
  const cupFigure = cup.querySelector<SVGGElement>(".cup-figure");
  const liquid = cup.querySelector<SVGGElement>(".cup-liquid");
  if (cupFigure) pinOrigin(cupFigure, base.x, base.y);

  // The stream runs from the top of the screen down behind the cup, clipped
  // just under the rim so it never shows below the saucer as it drains away.
  const clipId = `pour-clip-${seed}-${Math.random().toString(36).slice(2)}`;
  const clip = svgEl("clipPath", { id: clipId });
  const clipTop = screenTop - 4000;
  clip.append(svgEl("rect", { x: -1000, y: clipTop, width: 3000, height: rim.y + 12 - clipTop }));
  const defs = svgEl("defs", {});
  defs.append(clip);
  const streamTop = Math.min(screenTop, viewBox.y) - 20;
  const streamTravel = rim.y + 62 - streamTop;
  const stream = svgEl("rect", { class: liquidClass, x: rim.x - 8, y: streamTop, width: 16, height: streamTravel });
  stream.style.transform = `translateY(${-streamTravel}px)`;
  const clipped = svgEl("g", { "clip-path": `url(#${clipId})` });
  clipped.append(stream);
  const pour = svgEl("g", {});
  pour.append(defs, clipped);
  // In front of the disc, behind the cup.
  if (vessel.pour !== false) cup.insertBefore(pour, cupFigure);

  // Behind the disc, so its 32 points fan out round the mustard circle.
  const burst = svgEl("path", { class: "cp-mustard", d: STARBURST });
  burst.style.opacity = "0";
  cup.insertBefore(burst, cup.querySelector("defs")?.nextSibling ?? cup.firstChild);

  const splashes = [
    { el: svgEl("rect", { class: liquidClass, x: rim.x - 19, y: rim.y + 4, width: 9, height: 9 }), side: -1 },
    { el: svgEl("rect", { class: liquidClass, x: rim.x + 11, y: rim.y + 4, width: 8, height: 8 }), side: 1 },
  ];
  for (const { el } of splashes) el.style.opacity = "0";

  const coin = coinEl();
  const coinFrom = Math.min(screenTop, viewBox.y) - 30;
  coin.style.opacity = "0";

  const random = mulberry32(seed);
  const confetti: Scene["confetti"] = [];
  for (let i = 0; i < CONFETTI_COUNT; i++) {
    const el = confettiEl(i);
    el.style.opacity = "0";
    const dx = ((i + random()) / CONFETTI_COUNT - 0.5) * 300;
    confetti.push({
      el,
      dx,
      dy: -10 - random() * 150,
      fall: 70 + random() * 30,
      drift: dx * 0.08 + (random() - 0.5) * 8,
      spin: (random() < 0.5 ? -1 : 1) * (60 + random() * 210),
    });
  }

  overlay.append(...splashes.map((s) => s.el), coin, ...confetti.map((c) => c.el));
  document.body.append(overlay);
  const removeGhost = flipTotal(vessel);
  return {
    cleanup() {
      overlay.remove();
      burst.remove();
      pour.remove();
      removeGhost();
    },
    vessel,
    cupFigure,
    liquid,
    stream,
    streamTravel,
    coin,
    coinFrom,
    splashes,
    burst,
    confetti,
  };
}

function drawStep(scene: Scene, step: CeremonyStep): void {
  const ms = step.durationMs;
  const { rim: RIM, liquidDrop: LIQUID_DROP } = scene.vessel;
  const rim = `translate(${RIM.x}px, ${RIM.y - 6}px)`;
  switch (step.name) {
    case "pour": {
      const t = scene.streamTravel;
      animate(scene.stream, [
        { transform: `translateY(${-t}px)` },
        { transform: "translateY(0px)", offset: 0.2 },
        { transform: "translateY(0px)", offset: 0.78 },
        { transform: `translateY(${t}px)` },
      ], { duration: ms, easing: "ease-in-out" });
      if (scene.liquid) {
        animate(scene.liquid, [
          { transform: `translateY(${LIQUID_DROP}px)` },
          { transform: `translateY(${LIQUID_DROP}px)`, offset: 0.15 },
          { transform: "translateY(0px)" },
        ], { duration: ms, easing: "ease-out", fill: "none" });
      }
      break;
    }
    case "coin": {
      const land = 0.75;
      animate(scene.coin, [
        { transform: `translate(${RIM.x}px, ${scene.coinFrom}px)`, opacity: 1, easing: "cubic-bezier(.55,0,1,.45)" },
        { transform: `translate(${RIM.x}px, ${RIM.y}px)`, opacity: 1, offset: land },
        // Into the cup it sinks out of sight; on a plate it stays put and fades.
        scene.vessel.pour === false
          ? { transform: `translate(${RIM.x}px, ${RIM.y}px)`, opacity: 0 }
          : { transform: `translate(${RIM.x}px, ${RIM.y + 26}px) scale(.6)`, opacity: 0 },
      ], { duration: ms });
      for (const { el, side } of scene.splashes) {
        animate(el, [
          { transform: "translate(0px, 0px)", opacity: 0 },
          { transform: `translate(${side * 14}px, -34px)`, opacity: 1, offset: 0.43 },
          { transform: `translate(${side * 22}px, -4px)`, opacity: 0 },
        ], { duration: 420, delay: ms * land, easing: "ease-out" });
      }
      if (scene.cupFigure && scene.vessel.pour === false) {
        // The sandwich hops off the plate as the coin lands.
        animate(scene.cupFigure, [
          { transform: "translateY(0px)" },
          { transform: "translateY(-22px)", offset: 0.3, easing: "ease-in" },
          { transform: "translateY(0px)", offset: 0.6, easing: "ease-out" },
          { transform: "translateY(-7px)", offset: 0.8, easing: "ease-in" },
          { transform: "translateY(0px)" },
        ], { duration: 520, delay: ms * land, easing: "ease-out", fill: "none" });
      } else if (scene.cupFigure) {
        animate(scene.cupFigure, [
          { transform: "scale(1)" },
          { transform: "scale(1.06, .93)", offset: 0.24 },
          { transform: "scale(.97, 1.04)", offset: 0.59 },
          { transform: "scale(1)" },
        ], { duration: 510, delay: ms * land, easing: "ease-in-out", fill: "none" });
      }
      break;
    }
    case "cheer":
      animate(scene.burst, [
        { transform: `${rim} scale(.2)`, opacity: 0 },
        { transform: `${rim} scale(.55)`, opacity: 1, offset: 0.17 },
        { transform: `${rim} scale(1)`, opacity: 1, offset: 0.58 },
        { transform: `${rim} scale(1.12)`, opacity: 0 },
      ], { duration: ms, easing: "ease-out" });
      for (const c of scene.confetti) {
        animate(c.el, [
          { transform: `${rim} scale(0)`, opacity: 0 },
          { transform: `${rim} scale(1)`, opacity: 1, offset: 0.04, easing: "cubic-bezier(.1,.8,.3,1)" },
          { transform: `translate(${RIM.x + c.dx}px, ${RIM.y - 6 + c.dy}px) rotate(${c.spin / 2}deg)`, opacity: 1, offset: 0.45, easing: "ease-in" },
          { transform: `translate(${RIM.x + c.dx + c.drift}px, ${RIM.y - 6 + c.dy + c.fall}px) rotate(${c.spin}deg)`, opacity: 0 },
        ], { duration: ms });
      }
      break;
  }
}

/** A stage for one play. Never throws; a missing cup or API just means less drawing. */
export function svgStage(seed: number, vessel?: VesselArt): Stage {
  let scene: Scene | null | undefined;
  return {
    async step(step) {
      try {
        if (scene === undefined) scene = buildScene(seed, vessel);
        if (scene) drawStep(scene, step);
      } catch {
        scene?.cleanup();
        scene = null;
      }
      await wait(step.durationMs);
      if (step.name === "cheer") scene?.cleanup();
    },
  };
}

let plays = 0;

onStart((ctx) => {
  const audio = deviceAudio();
  audio.unlockOnGestures(document);
  wireCeremony(
    ctx.bus,
    {
      play: (adapters) => {
        // Read once per play: a Lunch press skips the pour even if the user swipes on mid-ceremony.
        const vessel = vesselOnScreen();
        return new Ceremony(svgStage(Date.now() + ++plays, vessel), { pour: vessel.pour }).play(adapters);
      },
    },
    { audio },
  );
});
