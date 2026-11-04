/**
 * Shelf item artwork in the Cut Paper direction (mockups/directions.html,
 * section "paper"): two to four flat shapes per item, stuck down with a hard
 * shadow offset 5,5. Colours come from classes styled in items.css, so a
 * parent with class "art-off" desaturates an item to the --off palette.
 * Each function returns a complete inline <svg> on a 100 x 90 canvas.
 */
import "./items.css";

/** Silhouette shapes are repeated in the shadow layer; details sit on top. */
function cut(label: string, silhouette: string, details = ""): string {
  return (
    `<svg class="art" viewBox="0 0 105 90" role="img" aria-label="${label}">` +
    `<g class="art-sh" transform="translate(5 5)">${silhouette}</g>${silhouette}${details}</svg>`
  );
}

export function laptopArt(): string {
  return cut(
    "Laptop",
    `<rect class="c-cobalt" x="16" y="16" width="68" height="50" rx="4"/>` +
      `<rect class="c-tomato" x="4" y="66" width="92" height="12" rx="3"/>`,
    `<rect class="c-cream" x="23" y="23" width="54" height="36"/>` +
      `<rect class="c-mustard" x="23" y="23" width="54" height="10"/>`,
  );
}

export function skiWeekArt(): string {
  return cut(
    "Ski week",
    `<path class="c-cobalt" d="M2 82 L38 18 L58 50 L70 36 L98 82Z"/>`,
    `<path class="c-cream" d="M29 34 L38 18 L48 36 L42 31 L38 38 L33 31Z"/>` +
      `<path class="c-tomato" d="M60 82 L84 44 L88 46 L66 82Z"/>` +
      `<path class="c-mustard" d="M70 82 L90 50 L94 52 L76 82Z"/>`,
  );
}

export function espressoMachineArt(): string {
  return cut(
    "Espresso machine",
    `<rect class="c-tomato" x="22" y="14" width="56" height="66"/>` +
      `<rect class="c-cobalt" x="16" y="8" width="68" height="12"/>`,
    `<circle class="c-mustard" cx="36" cy="32" r="7"/>` +
      `<rect class="c-cobalt" x="38" y="44" width="24" height="10"/>` +
      `<rect class="c-cobalt" x="62" y="46" width="26" height="6"/>` +
      `<rect class="c-cream" x="40" y="62" width="20" height="14"/>`,
  );
}

export function weekendAwayArt(): string {
  return cut(
    "Weekend away",
    `<path class="c-cobalt" d="M36 32 V14 H64 V32 H57 V21 H43 V32Z"/>` +
      `<rect class="c-mustard" x="12" y="30" width="76" height="50" rx="6"/>`,
    `<rect class="c-tomato" x="12" y="48" width="76" height="10"/>` +
      `<circle class="c-cream" cx="72" cy="69" r="6"/>`,
  );
}

/** Generic personal goal: a gift box with a bow. */
export function goalArt(): string {
  return cut(
    "Goal",
    `<rect class="c-tomato" x="16" y="40" width="68" height="42"/>` +
      `<rect class="c-mustard" x="10" y="28" width="80" height="14"/>` +
      `<path class="c-cobalt" d="M50 30 L28 12 L26 30Z M50 30 L72 12 L74 30Z"/>`,
    `<rect class="c-cobalt" x="45" y="28" width="10" height="54"/>`,
  );
}

/** Artwork per default shelf item id (src/domain/shelf.ts). */
export const ITEM_ART: Readonly<Record<string, () => string>> = {
  laptop: laptopArt,
  "ski-week": skiWeekArt,
  "espresso-machine": espressoMachineArt,
  "weekend-away": weekendAwayArt,
};

/** The item's artwork, or the goal icon for ids without one. */
export function itemArt(id: string): string {
  return ITEM_ART[id]?.() ?? goalArt();
}
