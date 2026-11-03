/**
 * Vessel artwork per item icon. The cup screen draws the active item's vessel
 * and the press ceremony pours into it, both through this registry, so a new
 * vessel is one module plus one line here. No side effects: safe to import
 * from tests.
 */
import { BASE, CUP_VIEWBOX, cupSvg, LIQUID_DROP, RIM } from "../cup-art";

export interface Point {
  readonly x: number;
  readonly y: number;
}

export interface VesselArt {
  /**
   * The part of the mockup's 390x844 phone frame the vessel SVG shows. The
   * ceremony overlay is laid over the vessel in these same coordinates.
   */
  readonly viewBox: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
  /**
   * The complete inline `<svg class="cup" viewBox=...>`. `clipId` names the
   * clipPath that keeps the liquid inside the body. Inside it, the group
   * `.cup-figure` is the vessel (the ceremony squashes it about `base`) and
   * `.cup-liquid` is the liquid with its foam (the ceremony slides it down by
   * `liquidDrop` and lets it rise back to the brim).
   */
  svg(clipId: string): string;
  /** Centre of the rim: the pour aims here, the coin lands here, the cheer bursts from here. */
  readonly rim: Point;
  /** Bottom centre of the vessel: the squash on the coin's landing pivots here. */
  readonly base: Point;
  /** How far, in viewBox units, below the brim the liquid sits when the vessel is empty. */
  readonly liquidDrop: number;
  /** Fill class of the liquid, used for the pour stream and its splashes (e.g. "cp-coffee"). */
  readonly liquidClass: string;
}

export const COFFEE_VESSEL: VesselArt = {
  viewBox: CUP_VIEWBOX,
  svg: cupSvg,
  rim: RIM,
  base: BASE,
  liquidDrop: LIQUID_DROP,
  liquidClass: "cp-coffee",
};

// TODO(ticket 12 merge): replace this alias with the pint glass from
// src/ui/pint-art.ts (liquidClass "cp-beer", --beer and --beer-foam tokens).
export const BEER_VESSEL: VesselArt = COFFEE_VESSEL;

const VESSELS: Record<string, VesselArt> = {
  coffee: COFFEE_VESSEL,
  beer: BEER_VESSEL,
  pint: BEER_VESSEL,
};

/** The vessel for an item icon; any icon without its own art gets the coffee cup. */
export function vesselFor(icon: string): VesselArt {
  return Object.hasOwn(VESSELS, icon) ? VESSELS[icon] : COFFEE_VESSEL;
}
