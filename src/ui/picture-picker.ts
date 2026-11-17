/**
 * Ticket 28: the row of small drawings to tap that chooses an item's picture,
 * used by the Settings item list (src/ui/settings.ts) on every item row and
 * on the add form. One button per entry of the domain's PICTURES, in its
 * order, each drawn with the vessel art the cup screen uses, cropped to the
 * figure (VesselArt.tileViewBox) on a mustard tile instead of the full disc.
 * DOM glue: not unit tested by decision.
 */
import { PICTURES, pictureFor } from "../domain/pictures";
import { vesselFor } from "./art/vessels";

let tiles = 0;

/** The vessel SVG re-cut for a picker tile: the figure's own square, no disc. */
function tileSvg(id: string): string {
  const vessel = vesselFor(id);
  const svg = vessel.svg(`picture-tile-clip-${++tiles}`);
  const { x, y, width, height } = vessel.viewBox;
  return svg.replace(`viewBox="${x} ${y} ${width} ${height}"`, `viewBox="${vessel.tileViewBox ?? `${x} ${y} ${width} ${height}`}"`);
}

/**
 * A labelled group of picture buttons with `current` pressed. An icon the app
 * does not recognise marks the jar, which is what the cup screen shows for it.
 * `onPick` runs with the chosen picture's id after the marking moves to it.
 */
export function picturePicker(current: string, label: string, onPick: (id: string) => void): HTMLElement {
  const group = document.createElement("div");
  group.className = "picture-picker";
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", label);
  let chosen = pictureFor(current).id;
  const buttons = PICTURES.map((picture) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "picture-tile";
    button.dataset.picture = picture.id;
    button.setAttribute("aria-label", picture.label);
    button.innerHTML = tileSvg(picture.id);
    button.addEventListener("click", () => {
      if (picture.id === chosen) return;
      chosen = picture.id;
      mark();
      onPick(picture.id);
    });
    return button;
  });
  const mark = () => {
    for (const b of buttons) b.setAttribute("aria-pressed", String(b.dataset.picture === chosen));
  };
  mark();
  group.append(...buttons);
  return group;
}
