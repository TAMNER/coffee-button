import { activeItemId } from "./settings";
import type { Item, Press, Store } from "./store";

export class Ledger {
  constructor(
    private store: Store,
    private newId: () => string = () => crypto.randomUUID(),
  ) {}

  /** Records a press of the active item (settings), or of `itemId` when given, at that item's current price. */
  addPress(at: Date): Promise<Press>;
  addPress(itemId: string, at: Date): Promise<Press>;
  async addPress(itemOrAt: string | Date, maybeAt?: Date): Promise<Press> {
    const at = itemOrAt instanceof Date ? itemOrAt : (maybeAt as Date);
    const itemId = itemOrAt instanceof Date ? await activeItemId(this.store) : itemOrAt;
    const item = await this.store.items.get(itemId);
    if (!item) throw new Error(`Unknown item: ${itemId}`);
    const press: Press = { id: this.newId(), itemId, pricePence: item.pricePence, at: at.getTime() };
    await this.store.presses.put(press);
    return press;
  }

  /** Sum of presses in the same local calendar month and year as `now`. */
  async monthToDate(now: Date): Promise<number> {
    const presses = await this.store.presses.list();
    return presses
      .filter((p) => {
        const at = new Date(p.at);
        return at.getFullYear() === now.getFullYear() && at.getMonth() === now.getMonth();
      })
      .reduce((sum, p) => sum + p.pricePence, 0);
  }

  /** Removes the press with this id; a no-op if it is already gone. */
  async undo(pressId: string): Promise<void> {
    await this.store.presses.delete(pressId);
  }

  /** Sum of every press ever recorded. */
  async lifetime(): Promise<number> {
    const presses = await this.store.presses.list();
    return presses.reduce((sum, p) => sum + p.pricePence, 0);
  }

  presses(): Promise<Press[]> {
    return this.store.presses.list();
  }

  items(): Promise<Item[]> {
    return this.store.items.list();
  }
}
