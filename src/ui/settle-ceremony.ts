import { settleCeremonyPlan, type SettleCeremonyPlan } from "../domain/settle-ceremony";
import type { Store } from "../domain/store";
import type { Bus } from "./app";

/**
 * Plays the settle ceremony once per confirmed settlement. The settle event
 * fires only after the settlement is persisted (src/ui/settle.ts via
 * InvestFlow.onSettled), so the ceremony never runs ahead of the data.
 */
export function wireSettleCeremony(
  bus: Bus,
  store: Store,
  ceremony: { play(plan: SettleCeremonyPlan): Promise<void> },
): () => void {
  return bus.on("settle", ({ settlement }) => {
    void settleCeremonyPlan(store, settlement).then((plan) => ceremony.play(plan));
  });
}
