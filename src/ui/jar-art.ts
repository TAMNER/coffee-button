/**
 * Cut Paper honey jar (ticket 28): the picture for anything the app has no
 * drawing for. Tom's pick "Jar B" from ticket 27, ported unchanged from
 * jarB() in mockups/pictures-and-graph.html: a round-bellied jar under a
 * spotted tomato cloth, tied with a cobalt band and bow. Same names, same
 * types, same coordinate system as src/ui/sandwich-art.ts, so it drops in
 * wherever they are used. Nothing pours: the coin lands on top of the cloth
 * (RIM) and the jar hops. No side effects: safe to import from tests.
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

/** Where the coin lands: the top of the cloth. */
export const RIM = { x: 195, y: 320 } as const;
/** Bottom of the jar: it hops up off this point. */
export const BASE = { x: 195, y: 506 } as const;
/** No liquid, so nothing drops. */
export const LIQUID_DROP = 0;

/** The jar's glass: shoulders under the cloth, round belly. */
const BODY = "M160 352 H230 V372 Q278 386 278 444 Q278 506 195 506 Q112 506 112 444 Q112 386 160 372Z";

/** The cloth: a dome over the lid with a pinked hem across the bottom. */
function clothPath(): string {
  const hem = Array.from({ length: 14 }, (_, i) => {
    const x0 = 246 - i * (102 / 14);
    return `L${(x0 - 102 / 28).toFixed(1)} 384 L${(x0 - 102 / 14).toFixed(1)} 374`;
  }).join(" ");
  return `M144 374 Q140 324 195 320 Q250 324 246 374 ${hem}Z`;
}

const SILHOUETTE = `<path class="cp-cream" d="${BODY}"/><path class="cp-tomato" d="${clothPath()}"/>`;

/** Honey, glint, label, the cloth's spots, then the band and bow. */
function details(clipId: string): string {
  const spots = [[168, 340], [195, 334], [222, 340], [180, 358], [210, 358], [158, 362], [234, 362]]
    .map(([x, y]) => `<circle class="cp-cream" cx="${x}" cy="${y}" r="4"/>`)
    .join("");
  return (
    `<g clip-path="url(#${clipId})"><rect class="cp-mustard-deep" x="100" y="404" width="190" height="110"/>` +
    `<rect class="cp-mustard" x="100" y="404" width="190" height="8"/></g>` +
    `<path class="cp-foam" d="M250 410 Q262 426 260 452 L252 452 Q254 428 244 414Z"/>` +
    `<rect class="cp-cream" x="160" y="432" width="70" height="38" rx="5"/>` +
    `<rect class="cp-tomato" x="168" y="440" width="54" height="5" rx="2"/>` +
    `<rect class="cp-tomato" x="174" y="452" width="42" height="5" rx="2"/>` +
    spots +
    `<rect class="cp-cobalt" x="146" y="364" width="98" height="9" rx="4"/>` +
    `<path class="cp-cobalt" d="M240 368 L262 356 L262 380Z M240 368 L250 392 L240 394Z"/>` +
    `<circle class="cp-dark" cx="241" cy="368" r="5"/>`
  );
}

/**
 * The jar's artwork: mustard disc with its shadow, then the jar as the
 * `.cup-figure` group so the press ceremony can hop it. `clipId` keeps the
 * honey inside the glass; there is no `.cup-liquid`.
 */
export function cupSvg(clipId: string): string {
  return `
<svg class="cup" viewBox="${CUP_VIEWBOX_ATTR}" aria-hidden="true">
  <defs><clipPath id="${clipId}"><path d="${BODY}"/></clipPath></defs>
  <g class="cp-shadow" transform="translate(10 10)"><circle cx="195" cy="400" r="150"/></g>
  <circle class="cp-mustard cup-disc" cx="195" cy="400" r="150"/>
  <g class="cup-figure">
    <g class="cp-shadow" transform="translate(8 8)">${SILHOUETTE}</g>
    ${SILHOUETTE}${details(clipId)}
  </g>
</svg>`;
}
