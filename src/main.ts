import "./style.css";
import { registerSW } from "virtual:pwa-register";
import { systemClock } from "./adapters/clock";
import { Ledger } from "./domain/ledger";
import { LedgerMover } from "./domain/money-mover";
import { IndexedDbStore } from "./storage/idb";
import { startApp } from "./ui/app";
import "./ui/register";

registerSW({ immediate: true });

async function boot(): Promise<void> {
  const store = await IndexedDbStore.open();
  startApp(document.getElementById("app")!, {
    store,
    ledger: new Ledger(store),
    mover: new LedgerMover(),
    clock: systemClock,
  });
}

void boot();
