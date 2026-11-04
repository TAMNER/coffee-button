/**
 * Cut Paper sandwich on a plate, Lunch's counterpart of src/ui/cup-art.ts and
 * src/ui/pint-art.ts. Same names, same types, same coordinate system (the
 * mockup's 390x844 phone frame, shown through CUP_VIEWBOX), so it drops in
 * wherever they are used. Nothing pours: the two halves stand apart on a
 * cream plate with a cobalt rim and the coin lands on the plate between them
 * (RIM). No side effects: safe to import from tests.
 */
import { CUP_VIEWBOX_ATTR } from "./cup-art";

export {
  CUP_VIEWBOX,
  CUP_VIEWBOX_ATTR,
  PAPER_BAND_SVG,
  STARBURST,
  COIN_MARKUP,
  CONFETTI_COLOURS,
  confettiMarkup,
} from "./cup-art";

/** Where the coin lands: the plate's surface, between the two halves. */
export const RIM = { x: 195, y: 462 } as const;
/** Bottom of the plate: the sandwich hops up off this point. */
export const BASE = { x: 195, y: 490 } as const;
/** No liquid, so nothing drops. */
export const LIQUID_DROP = 0;

/** The plate: cobalt rim with its cream well. */
const PLATE = `
    <ellipse class="cp-cobalt" cx="195" cy="468" rx="132" ry="22"/>
    <ellipse class="cp-cream" cx="195" cy="464" rx="114" ry="14"/>`;

/** One sandwich half, standing on the plate with its left edge at x; its silhouette only. */
function halfSilhouette(x: number): string {
  return `
      <path class="cp-mustard-deep" d="M${x} 462 V402 Q${x} 380 ${x + 37} 380 Q${x + 74} 380 ${x + 74} 402 V462Z"/>`;
}

/** One sandwich half's layers: domed top slice, lettuce, tomato, bottom slice. */
function halfLayers(x: number): string {
  const w = 74;
  const wave = Array.from({ length: 5 }, (_, i) => `Q${x + 7 + i * 16} 412 ${x + 14 + i * 16} 420`).join(" ");
  return `
      <path class="cp-bread" d="M${x + 5} 418 V404 Q${x + 5} 386 ${x + 37} 386 Q${x + w - 5} 386 ${x + w - 5} 404 V418Z"/>
      <path class="cp-lettuce" d="M${x - 4} 432 V420 L${x - 2} 420 ${wave} L${x + w + 4} 420 V432Z"/>
      <rect class="cp-tomato" x="${x - 2}" y="430" width="${w + 4}" height="12" rx="4"/>
      <rect class="cp-bread" x="${x + 5}" y="442" width="${w - 10}" height="15" rx="3"/>`;
}

const LEFT = 108;
const RIGHT = 208;

/**
 * Lunch's artwork: mustard disc with its shadow, then the plate and two
 * sandwich halves, each tipped slightly outwards. The plate and sandwich are
 * the `.cup-figure` group, so the press ceremony can hop them; there is no
 * `.cup-liquid` and `clipId` is unused (kept for the shared signature).
 */
export function cupSvg(_clipId: string): string {
  const halves = `
    <g transform="rotate(-5 ${LEFT + 37} 462)">${halfSilhouette(LEFT)}</g>
    <g transform="rotate(5 ${RIGHT + 37} 462)">${halfSilhouette(RIGHT)}</g>`;
  return `
<svg class="cup" viewBox="${CUP_VIEWBOX_ATTR}" aria-hidden="true">
  <g class="cp-shadow" transform="translate(10 10)"><circle cx="195" cy="400" r="150"/></g>
  <circle class="cp-mustard cup-disc" cx="195" cy="400" r="150"/>
  <g class="cup-figure">
    <g class="cp-shadow" transform="translate(8 8)">${PLATE}${halves}</g>
    ${PLATE}
    <g transform="rotate(-5 ${LEFT + 37} 462)">${halfSilhouette(LEFT)}${halfLayers(LEFT)}</g>
    <g transform="rotate(5 ${RIGHT + 37} 462)">${halfSilhouette(RIGHT)}${halfLayers(RIGHT)}</g>
  </g>
</svg>`;
}
