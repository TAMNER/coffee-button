/**
 * Vessel artwork per item icon. The cup screen draws the active item's vessel
 * and the press ceremony pours into it, both through this registry, so a new
 * vessel is one module plus one line here. No side effects: safe to import
 * from tests.
 */
import { BASE, CUP_VIEWBOX, cupSvg, LIQUID_DROP, RIM } from "../cup-art";
import { pictureFor } from "../../domain/pictures";
import * as bag from "../bag-art";
import * as jar from "../jar-art";
import * as pastry from "../pastry-art";
import * as pint from "../pint-art";
import * as sandwich from "../sandwich-art";

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
  /**
   * False for a vessel with nothing to pour (Lunch's plate): the ceremony skips
   * the pour, the coin lands on `rim` and the figure hops instead of squashing.
   * Absent means it pours.
   */
  readonly pour?: boolean;
  /**
   * The square of the drawing the Settings picker tile shows (ticket 28): the
   * figure and its shadow, without the mustard disc, so the object reads at
   * 40px. Absent means the whole `viewBox`.
   */
  readonly tileViewBox?: string;
}

export const COFFEE_VESSEL: VesselArt = {
  viewBox: CUP_VIEWBOX,
  svg: cupSvg,
  rim: RIM,
  base: BASE,
  liquidDrop: LIQUID_DROP,
  liquidClass: "cp-coffee",
  tileViewBox: "90 296 228 228",
};

export const BEER_VESSEL: VesselArt = {
  viewBox: pint.CUP_VIEWBOX,
  svg: pint.cupSvg,
  rim: pint.RIM,
  base: pint.BASE,
  liquidDrop: pint.LIQUID_DROP,
  liquidClass: "cp-beer",
  tileViewBox: "80 304 240 240",
};

export const SANDWICH_VESSEL: VesselArt = {
  viewBox: sandwich.CUP_VIEWBOX,
  svg: sandwich.cupSvg,
  rim: sandwich.RIM,
  base: sandwich.BASE,
  liquidDrop: sandwich.LIQUID_DROP,
  // Crumbs: what flies off the plate where the coin lands.
  liquidClass: "cp-bread",
  pour: false,
  tileViewBox: "57 296 284 284",
};

export const JAR_VESSEL: VesselArt = {
  viewBox: jar.CUP_VIEWBOX,
  svg: jar.cupSvg,
  rim: jar.RIM,
  base: jar.BASE,
  liquidDrop: jar.LIQUID_DROP,
  // Drops of honey: what flies off the cloth where the coin lands.
  liquidClass: "cp-mustard-deep",
  pour: false,
  tileViewBox: "92 312 214 214",
};

export const PASTRY_VESSEL: VesselArt = {
  viewBox: pastry.CUP_VIEWBOX,
  svg: pastry.cupSvg,
  rim: pastry.RIM,
  base: pastry.BASE,
  liquidDrop: pastry.LIQUID_DROP,
  // Crumbs: what flies off the muffin where the coin lands.
  liquidClass: "cp-mustard-deep",
  pour: false,
  tileViewBox: "79 283 240 240",
};

export const BAG_VESSEL: VesselArt = {
  viewBox: bag.CUP_VIEWBOX,
  svg: bag.cupSvg,
  rim: bag.RIM,
  base: bag.BASE,
  liquidDrop: bag.LIQUID_DROP,
  // Scraps of the order slip: what flies off the bag where the coin lands.
  liquidClass: "cp-cream",
  pour: false,
  tileViewBox: "84 289 230 230",
};

/** The drawing per picture id (src/domain/pictures.ts PICTURES). A new picture adds one line here. */
const VESSELS: Record<string, VesselArt> = {
  cup: COFFEE_VESSEL,
  pint: BEER_VESSEL,
  plate: SANDWICH_VESSEL,
  jar: JAR_VESSEL,
  pastry: PASTRY_VESSEL,
  bag: BAG_VESSEL,
};

/**
 * The vessel for an item icon, through the domain's picture names (so the
 * built-in "coffee", "beer" and "sandwich" keep theirs); any icon the app
 * does not recognise gets the jar (ticket 28).
 */
export function vesselFor(icon: string): VesselArt {
  const id = pictureFor(icon).id;
  return Object.hasOwn(VESSELS, id) ? VESSELS[id] : JAR_VESSEL;
}
