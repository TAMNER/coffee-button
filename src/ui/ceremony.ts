import { WebAudioCoin, type Audio } from "../adapters/audio";
import { ceremonyTimeline, type CeremonyStep } from "../domain/ceremony-timeline";
import { onStart, type Bus } from "./app";

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
  constructor(private stage: Stage) {}

  async play(adapters: CeremonyAdapters): Promise<void> {
    for (const step of ceremonyTimeline()) {
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
// DOM stage: placeholder SVG shapes animated with the Web Animations API.
// Thin and not unit tested; the timeline and Ceremony above are.

const SVG_NS = "http://www.w3.org/2000/svg";
/** Same path as the cup body in cup.ts, in the same 120x120 viewBox. */
const CUP_BODY = "M24 40 h60 v30 a30 30 0 0 1 -60 0 z";
const CONFETTI_COUNT = 24;
export const CONFETTI_COLOURS = ["#e9b949", "#e07a5f", "#81b29a", "#f2cc8f", "#3d85c6", "#f6ead7"];

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

interface Scene {
  overlay: SVGSVGElement;
  cup: Element;
  stream: SVGRectElement;
  liquid: SVGRectElement;
  coin: SVGCircleElement;
  confetti: SVGRectElement[];
}

/**
 * One overlay per play, laid exactly over the cup with pointer-events off,
 * so the cup stays tappable and overlapping plays never share elements.
 */
function buildScene(seed: number): Scene | null {
  const cup = document.querySelector("[data-role=cup] svg");
  if (!cup) return null;
  const box = cup.getBoundingClientRect();
  const overlay = svgEl("svg", { viewBox: "0 0 120 120", "aria-hidden": "true" });
  overlay.style.cssText = `position:fixed;left:${box.left}px;top:${box.top}px;width:${box.width}px;height:${box.height}px;overflow:visible;pointer-events:none;z-index:10;`;

  const clipId = `cup-clip-${seed}-${Math.random().toString(36).slice(2)}`;
  const clip = svgEl("clipPath", { id: clipId });
  clip.append(svgEl("path", { d: CUP_BODY }));
  const defs = svgEl("defs", {});
  defs.append(clip);

  const stream = svgEl("rect", { x: 50, y: -40, width: 8, height: 120, rx: 4, fill: "#c8925a" });
  stream.style.transformBox = "fill-box";
  stream.style.transformOrigin = "top";
  stream.style.transform = "scaleY(0)";

  const liquidGroup = svgEl("g", { "clip-path": `url(#${clipId})` });
  const liquid = svgEl("rect", { x: 20, y: 40, width: 70, height: 70, fill: "#c8925a" });
  liquid.style.transform = "translateY(64px)";
  liquidGroup.append(liquid);

  const coin = svgEl("circle", { cx: 54, cy: 0, r: 8, fill: "#e9b949", stroke: "#b8860b", "stroke-width": 2 });
  coin.style.transformBox = "fill-box";
  coin.style.transformOrigin = "center";
  coin.style.opacity = "0";

  const random = mulberry32(seed);
  const confetti: SVGRectElement[] = [];
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
    piece.dataset.dx = String((random() - 0.5) * 160);
    piece.dataset.dy = String(-30 - random() * 70);
    piece.dataset.fall = String(30 + random() * 50);
    piece.dataset.spin = String((random() - 0.5) * 1080);
    confetti.push(piece);
  }

  overlay.append(defs, liquidGroup, stream, coin, ...confetti);
  document.body.append(overlay);
  return { overlay, cup, stream, liquid, coin, confetti };
}

function drawStep(scene: Scene, step: CeremonyStep): void {
  const ms = step.durationMs;
  switch (step.name) {
    case "pour":
      animate(scene.stream, [
        { transform: "scaleY(0)", opacity: 1 },
        { transform: "scaleY(1)", opacity: 1, offset: 0.2 },
        { transform: "scaleY(1)", opacity: 1, offset: 0.8 },
        { transform: "scaleY(1)", opacity: 0 },
      ], { duration: ms });
      animate(scene.liquid, [{ transform: "translateY(64px)" }, { transform: "translateY(18px)" }], { duration: ms, delay: ms * 0.15, easing: "ease-out" });
      break;
    case "coin":
      animate(scene.coin, [
        { transform: "translateY(-50px) scale(1)", opacity: 1 },
        { transform: "translateY(62px) scale(1)", opacity: 1, offset: 0.75, easing: "ease-out" },
        { transform: "translateY(66px) scale(0.4)", opacity: 0 },
      ], { duration: ms, easing: "cubic-bezier(.5,0,1,1)" });
      break;
    case "cheer":
      animate(scene.cup, [{ transform: "scale(1)" }, { transform: "scale(1.08)", offset: 0.25 }, { transform: "scale(1)", offset: 0.6 }], { duration: ms, easing: "ease-out", fill: "none" });
      for (const piece of scene.confetti) {
        const { dx, dy, fall, spin } = piece.dataset;
        animate(piece, [
          { transform: "translate(0px, 0px) rotate(0deg)", opacity: 1 },
          { transform: `translate(${Number(dx) * 0.8}px, ${dy}px) rotate(${Number(spin) / 2}deg)`, opacity: 1, offset: 0.45 },
          { transform: `translate(${dx}px, ${Number(dy) + Number(fall)}px) rotate(${spin}deg)`, opacity: 0 },
        ], { duration: ms, easing: "cubic-bezier(.2,.7,.4,1)" });
      }
      animate(scene.liquid, [{ opacity: 1 }, { opacity: 0 }], { duration: ms * 0.5, delay: ms * 0.5 });
      break;
  }
}

/** A stage for one play. Never throws; a missing cup or API just means less drawing. */
export function svgStage(seed: number): Stage {
  let scene: Scene | null | undefined;
  return {
    async step(step) {
      try {
        if (scene === undefined) scene = buildScene(seed);
        if (scene) drawStep(scene, step);
      } catch {
        scene = null;
      }
      await wait(step.durationMs);
      if (step.name === "cheer") scene?.overlay.remove();
    },
  };
}

let plays = 0;

onStart((ctx) => {
  const audio = new WebAudioCoin();
  audio.unlockOnFirstGesture(document);
  wireCeremony(
    ctx.bus,
    { play: (adapters) => new Ceremony(svgStage(Date.now() + ++plays)).play(adapters) },
    { audio },
  );
});
