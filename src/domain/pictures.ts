/**
 * The pictures a user can choose for an item (ticket 28), in the order the
 * Settings picker shows them. `Item.icon` stores a picture's `id`. A new
 * picture (ticket 29) is one entry appended here plus its drawing registered
 * in src/ui/art/vessels.ts.
 */
export interface Picture {
  /** What `Item.icon` stores. */
  readonly id: string;
  /** The picture's name, as the picker button announces it. */
  readonly label: string;
  /** Older names stored for this picture: the built-in items' icons (src/domain/store.ts). */
  readonly aliases?: readonly string[];
  /**
   * False when there is nothing to pour (the plate, the jar): the press
   * ceremony skips the pour, the coin lands and the figure hops
   * (src/domain/ceremony-timeline.ts).
   */
  readonly pour: boolean;
}

export const PICTURES: readonly Picture[] = [
  { id: "cup", label: "Cup", aliases: ["coffee"], pour: true },
  { id: "pint", label: "Pint", aliases: ["beer"], pour: true },
  { id: "plate", label: "Plate", aliases: ["sandwich"], pour: false },
  { id: "jar", label: "Jar", pour: false },
];

/** The jar: the picture for anything the app has no drawing for. */
const FALLBACK = "jar";

/** The picture an item's `icon` shows; a name the app does not recognise shows the jar. */
export function pictureFor(icon: string): Picture {
  return PICTURES.find((p) => p.id === icon || p.aliases?.includes(icon)) ??PICTURES.find((p) => p.id === FALLBACK)!;
}
