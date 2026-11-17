/**
 * Cut Paper iced muffin (ticket 29): the picture for snacks. Tom's pick
 * "Pastry B" from ticket 27, ported unchanged from pastryB() in
 * mockups/pictures-and-graph.html: a mustard dome over a pleated cobalt case,
 * cream icing and a tomato cherry. Same names, same types, same coordinate
 * system as src/ui/jar-art.ts, so it drops in wherever they are used. Nothing
 * pours: the coin lands on the cherry (RIM) and the muffin hops. No side
 * effects: safe to import from tests.
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

/** Where the coin lands: the top of the cherry. */
export const RIM = { x: 195, y: 312 } as const;
/** Bottom of the case: the muffin hops up off this point. */
export const BASE = { x: 195, y: 506 } as const;
/** No liquid, so nothing drops. */
export const LIQUID_DROP = 0;

const CASE = "M142 420 H248 L236 506 H154Z";
const DOME = "M122 422 Q116 344 195 334 Q274 344 268 422 Q268 434 256 434 H134 Q122 434 122 422Z";
const ICING =
  "M140 372 Q150 340 195 338 Q240 340 250 372 Q246 388 236 378 Q230 398 218 382 Q208 394 198 380 Q188 396 176 382 Q166 392 158 378 Q148 388 140 372Z";

const SILHOUETTE =
  `<path class="cp-cobalt" d="${CASE}"/><path class="cp-mustard-deep" d="${DOME}"/>` +
  `<circle class="cp-tomato" cx="198" cy="326" r="14"/>`;

/** The case's pleats, the icing, crumbs on the dome, the cherry's stalk and glint. */
function details(): string {
  const pleats = [0, 1, 2, 3, 4]
    .map((i) => {
      const xt = 158 + i * 19;
      const xb = 166 + i * 14.5;
      return `<path class="cp-dark" d="M${xt} 434 H${xt + 6} L${xb + 4} 506 H${xb}Z"/>`;
    })
    .join("");
  return (
    pleats +
    `<path class="cp-cream" d="${ICING}"/>` +
    `<circle class="cp-mustard" cx="146" cy="404" r="5"/><circle class="cp-mustard" cx="244" cy="402" r="5"/>` +
    `<circle class="cp-mustard" cx="172" cy="414" r="4"/><circle class="cp-mustard" cx="222" cy="416" r="4"/>` +
    `<path class="cp-cobalt" d="M200 314 Q204 298 216 292 L219 297 Q209 302 206 315Z"/>` +
    `<circle class="cp-cream" cx="192" cy="321" r="4"/>`
  );
}

/**
 * The muffin's artwork: mustard disc with its shadow, then the muffin as the
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
