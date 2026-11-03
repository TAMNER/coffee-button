import type { Press, Store } from "./store";

export class Ledger {
  constructor(
    private store: Store,
    private newId: () => string = () => crypto.randomUUID(),
  ) {}

  async addPress(itemId: string, at: Date): Promise<Press> {
    const item = await this.store.items.get(itemId);
    if (!item) throw new Error(`Unknown item: ${itemId}`);
    const press: Press = { id: this.newId(), itemId, pricePence: item.pricePence, at: at.getTime() };
    await this.store.presses.put(press);
    return press;
  }
}
