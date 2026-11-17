/**
 * Cut Paper takeaway bag (ticket 29): the picture for delivery. Tom's pick
 * "Bag B" from ticket 27, ported from bagB() in
 * mockups/pictures-and-graph.html: a wide tomato carrier bag with two loop
 * handles (cobalt in front, navy behind) and a torn-off cream order slip.
 * The one change is Tom's: the whole bag sits LIFT units higher than in the
 * mockup, so the figure (handle tops 308 to bag bottom 492) is centred on
 * the disc at y=400. Same names, same types, same coordinate system as
 * src/ui/jar-art.ts. Nothing pours: the coin lands on the bag's mouth (RIM)
 * and the bag hops. No side effects: safe to import from tests.
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

/** How far the bag sits above the mockup's drawing (Tom: "up a little bit (centred)"). */
const LIFT = 10;

/** Where the coin lands: the bag's mouth, between the handles. */
export const RIM = { x: 195, y: 380 - LIFT } as const;
/** Bottom of the bag: it hops up off this point. */
export const BASE = { x: 195, y: 502 - LIFT } as const;
/** No liquid, so nothing drops. */
export const LIQUID_DROP = 0;

/** A loop handle 64 wide and 64 tall from its top-left corner, with a 12-wide strap. */
function handle(x: number, y: number, cls: string): string {
  return `<path class="${cls}" fill-rule="evenodd" d="M${x} ${y + 64} V${y + 30} Q${x} ${y} ${x + 32} ${y} Q${x + 64} ${y} ${x + 64} ${y + 30} V${y + 64} H${x + 52} V${y + 30} Q${x + 52} ${y + 12} ${x + 32} ${y + 12} Q${x + 12} ${y + 12} ${x + 12} ${y + 30} V${y + 64}Z"/>`;
}

const TOP = 378 - LIFT;

const SILHOUETTE =
  handle(176, 318 - LIFT, "cp-dark") +
  handle(150, 322 - LIFT, "cp-cobalt") +
  `<rect class="cp-tomato" x="112" y="${TOP}" width="166" height="124" rx="6"/>`;

/** The shade under the mouth, the order slip with its lines, and the mustard sticker. */
function details(): string {
  const y = (n: number) => n - LIFT;
  return (
    `<rect class="cp-shadow" x="112" y="${TOP}" width="166" height="8" opacity="0.35"/>` +
    `<path class="cp-cream" d="M206 ${y(412)} H254 V${y(470)} L246 ${y(465)} L238 ${y(470)} L230 ${y(465)} L222 ${y(470)} L214 ${y(465)} L206 ${y(470)}Z"/>` +
    `<rect class="cp-cobalt" x="214" y="${y(424)}" width="32" height="5" rx="2"/>` +
    `<rect class="cp-cobalt" x="214" y="${y(436)}" width="24" height="5" rx="2"/>` +
    `<rect class="cp-cobalt" x="214" y="${y(448)}" width="28" height="5" rx="2"/>` +
    `<circle class="cp-mustard" cx="148" cy="${y(460)}" r="16"/>` +
    `<circle class="cp-mustard-deep" cx="148" cy="${y(460)}" r="10"/>`
  );
}

/**
 * The bag's artwork: mustard disc with its shadow, then the bag as the
 * `.cup-figure` group so the press ceremony can hop it. Nothing needs
 * clipping, so `clipId` is unused; there is no `.cup-liquid`.
 */
export function cupSvg(_clipId: string): string {
  return `
<svg class="cup" viewBox="${CUP_VIEWBOX_ATTR}" aria-hidden="true">
  <g class="cp-shadow" transform="translate(10 10)"><circle cx="195" cy="400" r="150"/></g>
  <circle class="cp-mustard cup-disc" cx="195" cy="400" r="150"/>
  <g class="cup-figure">
    <g class="cp-shadow" transform="translate(8 8)">${SILHOUETTE}</g>
    ${SILHOUETTE}${details()}
  </g>
</svg>`;
}
