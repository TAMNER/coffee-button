# 03: Press and ledger

**What to build:** Tapping the cup records a press for the default item (Coffee, £3.50) with a timestamp into IndexedDB. The month-to-date total under the cup updates immediately. A 5-second undo toast reverses the last press. Presses reference an item (name, icon, price) so other items can be added later. A MoneyMover interface exists with the ledger as its only implementation. Demo: tap, see the total rise, undo, see it fall; reload and the total persists.

**Blocked by:** 01 Scaffold and deploy.

**Status:** done

- [x] Tap records a press; total updates within one frame (total is updated synchronously once the IndexedDB write resolves; checked in a headless happy-dom smoke run, not frame-timed on device)
- [x] Undo within 5 seconds removes exactly that press; after 5 seconds the toast is gone (Ledger.undo unit tested; toast timing checked in the headless smoke run)
- [x] Presses survive reload and offline use (IndexedDB survival across a new store instance is contract tested; offline relies on the ticket 01 precache and no network calls; not yet checked on the iPhone)
- [x] Ledger logic (add, undo, month-to-date, lifetime) is unit tested with no DOM
- [x] MoneyMover interface defined; ledger implementation passes the same tests

## Shell contract for later tickets

- `src/ui/app.ts`: `registerScreen(name, mount)`, `ctx.show(name)`, `bus.on/emit` for `press` `{press}`, `undo` `{pressId}`, `settle` `{settlement}`, `registerSettingsSection(title, mount)` + `settingsSections()`, `onStart(fn)` for non-screen modules. `mount(el, ctx)` may return a cleanup.
- `src/ui/register.ts`: add one `import "./<module>";` line per UI module.
- Cup DOM hooks: `[data-role=cup]` (the button), `[data-role=total]` (month total, for the ticket 05 long press), `[data-role=undo-toast]`.
- IndexedDB schema v1 already creates items, presses, settlements, goals and settings, so no ticket needs a version bump for those.
