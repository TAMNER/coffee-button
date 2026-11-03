/**
 * App shell. Every UI module talks to the rest of the app through here:
 *  - registerScreen(name, mount): a full-screen view; show(name) swaps to it.
 *  - bus: typed events. Modules subscribe with bus.on(type, handler).
 *  - registerSettingsSection(title, mount): sections the settings screen renders.
 *  - onStart(fn): run once with the AppContext when the app boots
 *    (for modules that are not screens, e.g. ceremonies).
 * src/ui/register.ts imports every UI module; each module registers itself on import.
 */
import type { Clock } from "../adapters/clock";
import type { Ledger } from "../domain/ledger";
import type { MoneyMover } from "../domain/money-mover";
import type { Item, Press, Settlement, Store } from "../domain/store";

export interface AppEvents {
  /** Emitted after the press is persisted. */
  press: { press: Press };
  /** Emitted after the press is removed. */
  undo: { pressId: string };
  /** Emitted after the settlement is persisted. */
  settle: { settlement: Settlement };
  /** Emitted when a swipe on the cup screen switches the active item (persisted in the background). */
  item: { item: Item };
}

export type EventName = keyof AppEvents;
type Handler<K extends EventName> = (payload: AppEvents[K]) => void;

export interface Bus {
  on<K extends EventName>(type: K, handler: Handler<K>): () => void;
  emit<K extends EventName>(type: K, payload: AppEvents[K]): void;
}

export function createBus(): Bus {
  const handlers = new Map<EventName, Set<Handler<never>>>();
  return {
    on(type, handler) {
      let set = handlers.get(type);
      if (!set) handlers.set(type, (set = new Set()));
      set.add(handler as Handler<never>);
      return () => set.delete(handler as Handler<never>);
    },
    emit(type, payload) {
      for (const handler of handlers.get(type) ?? []) {
        try {
          (handler as Handler<typeof type>)(payload);
        } catch (err) {
          console.error(`bus handler for "${type}" failed`, err);
        }
      }
    },
  };
}

/** The app-wide bus. Subscribing at import time is fine. */
export const bus: Bus = createBus();

export interface AppContext {
  store: Store;
  ledger: Ledger;
  mover: MoneyMover;
  clock: Clock;
  bus: Bus;
  /** Swap the root to a registered screen. */
  show(name: string): void;
}

/** Renders into `el`; may return a cleanup run when the screen is swapped out. */
export type Mount = (el: HTMLElement, ctx: AppContext) => void | (() => void);

const screens = new Map<string, Mount>();
const settingsSectionList: { title: string; mount: Mount }[] = [];
const startHooks: ((ctx: AppContext) => void)[] = [];

export function registerScreen(name: string, mount: Mount): void {
  screens.set(name, mount);
}

export function registerSettingsSection(title: string, mount: Mount): void {
  settingsSectionList.push({ title, mount });
}

export function settingsSections(): readonly { title: string; mount: Mount }[] {
  return settingsSectionList;
}

export function onStart(fn: (ctx: AppContext) => void): void {
  startHooks.push(fn);
}

export const HOME_SCREEN = "cup";

export function startApp(
  root: HTMLElement,
  deps: Omit<AppContext, "bus" | "show">,
): AppContext {
  let cleanup: (() => void) | void;
  const ctx: AppContext = {
    ...deps,
    bus,
    show(name) {
      const mount = screens.get(name);
      if (!mount) throw new Error(`No screen registered as "${name}"`);
      if (cleanup) cleanup();
      root.replaceChildren();
      root.dataset.screen = name;
      cleanup = mount(root, ctx);
    },
  };
  for (const hook of startHooks) hook(ctx);
  ctx.show(HOME_SCREEN);
  return ctx;
}
