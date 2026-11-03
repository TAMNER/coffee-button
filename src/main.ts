import "./style.css";
import { registerSW } from "virtual:pwa-register";
import { systemClock } from "./adapters/clock";
import { ensureDefaultItems } from "./domain/items";
import { Ledger } from "./domain/ledger";
import { LedgerMover } from "./domain/money-mover";
import { MemoryStore, type Store } from "./domain/store";
import { IndexedDbStore } from "./storage/idb";
import { startApp } from "./ui/app";
import "./ui/register";

registerSW({ immediate: true });

/** A line pinned above every screen (outside #app, so screen swaps keep it). */
function showBanner(text: string): void {
  const banner = document.createElement("p");
  banner.className = "banner";
  banner.setAttribute("role", "status");
  banner.textContent = text;
  document.body.prepend(banner);
}

/** Opened from the Home Screen icon rather than a Safari tab. */
function isInstalled(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia?.("(display-mode: standalone)").matches === true;
}

async function boot(): Promise<void> {
  // DESIGN.md: the app insists on Home Screen installation, because Safari
  // evicts site data of non-installed sites after 7 days without a visit.
  if (!isInstalled()) {
    showBanner(
      "Add Coffee Button to your Home Screen (Share, then Add to Home Screen). " +
        "In a Safari tab your savings are deleted after 7 days without a visit.",
    );
  }

  let store: Store;
  try {
    store = await IndexedDbStore.open();
    // Ask once to be exempt from eviction; harmless if refused or unsupported.
    void navigator.storage?.persist?.().catch(() => false);
  } catch (err) {
    // Storage disabled, private mode or quota: still show a working cup.
    console.error("IndexedDB unavailable", err);
    store = new MemoryStore();
    showBanner("Not saving on this device: storage is unavailable. Presses are lost when the app closes.");
  }

  // Installs from before Beer was a default get it once; a failure only means no Beer yet.
  await ensureDefaultItems(store).catch((err) => console.error("Could not add default items", err));

  startApp(document.getElementById("app")!, {
    store,
    ledger: new Ledger(store),
    mover: new LedgerMover(),
    clock: systemClock,
  });
}

void boot();
