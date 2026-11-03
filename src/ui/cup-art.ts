/**
 * Cut Paper artwork (mockups/directions.html, direction B), shared by the cup
 * screen and both ceremonies. Coordinates are the mockup's 390x844 phone frame,
 * so shapes copy across unchanged; the cup SVG shows only the square around
 * the mustard circle. No side effects: safe to import from tests.
 */

/** The part of the mockup frame the cup SVG (and every ceremony overlay) shows. */
export const CUP_VIEWBOX = { x: 40, y: 245, width: 320, height: 320 } as const;
export const CUP_VIEWBOX_ATTR = `${CUP_VIEWBOX.x} ${CUP_VIEWBOX.y} ${CUP_VIEWBOX.width} ${CUP_VIEWBOX.height}`;

/** Cream cup body: square top, rounded bottom. */
export const CUP_BODY = "M128 318 H262 V462 Q262 490 234 490 H156 Q128 490 128 462Z";
const HANDLE = "M258 350 H304 V436 H258 V414 H282 V372 H258Z";
/** Centre of the rim (where the coin lands and the cheer bursts from). */
export const RIM = { x: 195, y: 318 } as const;
/** Bottom of the saucer: the cup squashes onto this point. */
export const BASE = { x: 195, y: 506 } as const;
/** How far below the brim the coffee sits when the cup is empty. */
export const LIQUID_DROP = 160;

/** The cup's shapes once, for the shape layer and again for its shadow copy. */
function cupShapes(): string {
  return `
    <rect class="cp-cobalt" x="96" y="488" width="198" height="18" rx="9"/>
    <path class="cp-tomato" fill-rule="evenodd" d="${HANDLE}"/>
    <path class="cp-cream" d="${CUP_BODY}"/>`;
}
const RIM_BAR = `<rect class="cp-cobalt" x="120" y="308" width="150" height="18" rx="9"/>`;

/**
 * The cup screen's artwork: mustard disc with its shadow, then the cup with
 * saucer, handle, coffee and foam. The cup group is `.cup-figure` and the
 * coffee is `.cup-liquid`, so the ceremonies can squash the cup and refill it.
 */
export function cupSvg(clipId: string): string {
  return `
<svg class="cup" viewBox="${CUP_VIEWBOX_ATTR}" aria-hidden="true">
  <defs><clipPath id="${clipId}"><path d="${CUP_BODY}"/></clipPath></defs>
  <g class="cp-shadow" transform="translate(10 10)"><circle cx="195" cy="400" r="150"/></g>
  <circle class="cp-mustard cup-disc" cx="195" cy="400" r="150"/>
  <g class="cup-figure">
    <g class="cp-shadow" transform="translate(8 8)">${cupShapes()}${RIM_BAR}</g>
    ${cupShapes()}
    <g clip-path="url(#${clipId})">
      <g class="cup-liquid">
        <rect class="cp-coffee" x="120" y="336" width="150" height="170"/>
        <rect class="cp-foam" x="120" y="336" width="150" height="16"/>
        <circle class="cp-foam" cx="150" cy="352" r="9"/>
        <circle class="cp-foam" cx="190" cy="354" r="11"/>
        <circle class="cp-foam" cx="232" cy="351" r="8"/>
      </g>
    </g>
    ${RIM_BAR}
  </g>
</svg>`;
}

/** Torn strip of the darker paper along the bottom of the screen. */
export const PAPER_BAND_SVG = `
<svg class="paper-band" viewBox="0 0 390 76" preserveAspectRatio="none" aria-hidden="true">
  <path d="M0 32 L70 4 L140 30 L230 0 L320 26 L390 6 V76 H0Z"/>
</svg>`;

/** The 32-point mustard starburst, centred on the origin. */
export const STARBURST =
  "M160 0L105.9 21.1L147.8 61.2L89.8 60L113.1 113.1L60 89.8L61.2 147.8L21.1 105.9L0 160L-21.1 105.9L-61.2 147.8L-60 89.8L-113.1 113.1L-89.8 60L-147.8 61.2L-105.9 21.1L-160 0L-105.9 -21.1L-147.8 -61.2L-89.8 -60L-113.1 -113.1L-60 -89.8L-61.2 -147.8L-21.1 -105.9L0 -160L21.1 -105.9L61.2 -147.8L60 -89.8L113.1 -113.1L89.8 -60L147.8 -61.2L105.9 -21.1Z";

/** The £ coin, centred on the origin: hard shadow, mustard face, deep inner disc, cream £. */
export const COIN_MARKUP = `
  <g class="cp-shadow" transform="translate(4 4)"><circle r="22"/></g>
  <circle class="cp-mustard" r="22"/>
  <circle class="cp-mustard-deep" r="15"/>
  <text class="cp-on-dark cp-coin-mark" y="8" text-anchor="middle">£</text>`;

/**
 * Confetti pieces in the mockup's order: the shape cycles triangle, rect,
 * circle while the colour cycles cobalt, mustard, tomato, cream, giving cobalt
 * triangles, mustard rects, tomato circles, cream triangles, and so on.
 */
const CONFETTI_SHAPES = [
  `<path d="M0 -9 L9 7 H-9Z"/>`,
  `<rect x="-5" y="-8" width="10" height="16"/>`,
  `<circle r="6"/>`,
];
export const CONFETTI_COLOURS = ["cp-cobalt", "cp-mustard", "cp-tomato", "cp-cream"];

export function confettiMarkup(i: number): { className: string; markup: string } {
  return {
    className: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
    markup: CONFETTI_SHAPES[i % CONFETTI_SHAPES.length],
  };
}
