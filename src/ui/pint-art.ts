/**
 * Cut Paper pint glass, the beer counterpart of src/ui/cup-art.ts. It exports
 * the same names with the same types and the same coordinate system (the
 * mockup's 390x844 phone frame, shown through CUP_VIEWBOX), so it drops in
 * wherever cup-art.ts is used. The rim sits where the cup's rim does
 * (y 318), so the ceremony's stream clip (y 330) and splash points (y 322)
 * still land on the brim; the glass is taller than the cup because it reaches
 * further down. No side effects: safe to import from tests.
 */
import { CUP_VIEWBOX_ATTR } from "./cup-art";

// Vessel-independent artwork: the frame, the torn band, the coin, the
// starburst and the confetti are the same for every item.
export {
  CUP_VIEWBOX,
  CUP_VIEWBOX_ATTR,
  PAPER_BAND_SVG,
  STARBURST,
  COIN_MARKUP,
  CONFETTI_COLOURS,
  confettiMarkup,
} from "./cup-art";

/** Cream glass body: wide square mouth, slight taper, small rounded foot corners. */
export const CUP_BODY = "M136 318 H254 L241 498 Q240 510 228 510 H162 Q150 510 149 498Z";
/** Centre of the rim (where the coin lands and the cheer bursts from). */
export const RIM = { x: 195, y: 318 } as const;
/** Bottom of the base bar: the glass squashes onto this point. */
export const BASE = { x: 195, y: 530 } as const;
/** How far below the brim the beer sits when the glass is empty (foam and all out of sight). */
export const LIQUID_DROP = 190;

/** The glass's shapes once, for the shape layer and again for its shadow copy. */
function glassShapes(): string {
  return `
    <path class="cp-cream" d="${CUP_BODY}"/>
    <rect class="cp-cobalt" x="130" y="504" width="130" height="26" rx="10"/>`;
}
const RIM_BAR = `<rect class="cp-cobalt" x="128" y="310" width="134" height="14" rx="7"/>`;

/**
 * The beer screen's artwork: mustard disc with its shadow, then the pint glass
 * with its base bar, beer, rising bubbles and a tall foam head. The glass group
 * is `.cup-figure` and the beer is `.cup-liquid`, exactly as in cupSvg, so the
 * ceremonies can squash the glass and refill it.
 */
export function cupSvg(clipId: string): string {
  return `
<svg class="cup" viewBox="${CUP_VIEWBOX_ATTR}" aria-hidden="true">
  <defs><clipPath id="${clipId}"><path d="${CUP_BODY}"/></clipPath></defs>
  <g class="cp-shadow" transform="translate(10 10)"><circle cx="195" cy="400" r="150"/></g>
  <circle class="cp-mustard cup-disc" cx="195" cy="400" r="150"/>
  <g class="cup-figure">
    <g class="cp-shadow" transform="translate(8 8)">${glassShapes()}${RIM_BAR}</g>
    ${glassShapes()}
    <g clip-path="url(#${clipId})">
      <g class="cup-liquid">
        <rect class="cp-beer" x="128" y="332" width="134" height="190"/>
        <circle class="cp-mustard" cx="172" cy="468" r="6"/>
        <circle class="cp-mustard" cx="218" cy="432" r="5"/>
        <circle class="cp-mustard" cx="190" cy="400" r="4"/>
        <rect class="cp-beer-foam" x="128" y="324" width="134" height="30"/>
        <circle class="cp-beer-foam" cx="160" cy="354" r="13"/>
        <circle class="cp-beer-foam" cx="196" cy="357" r="15"/>
        <circle class="cp-beer-foam" cx="232" cy="353" r="12"/>
      </g>
    </g>
    ${RIM_BAR}
  </g>
</svg>`;
}
