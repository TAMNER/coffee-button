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
}

export const PICTURES: readonly Picture[] = [
  { id: "cup", label: "Cup" },
  { id: "pint", label: "Pint" },
  { id: "plate", label: "Plate" },
  { id: "jar", label: "Jar" },
];
