import type { Store } from "../domain/store";
import type { Bus } from "./app";

/**
 * Plays the settle ceremony once per confirmed settlement. The settle event
 * fires only after the settlement is persisted (src/ui/settle.ts via
 * InvestFlow.onSettled), so the ceremony never runs ahead of the data.
 */
export function wireSettleCeremony(bus: Bus, _store: Store, ceremony: { play(): Promise<void> }): () => void {
  return bus.on("settle", () => {
    void ceremony.play();
  });
}
