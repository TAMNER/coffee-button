# 05: Settings

**What to build:** A long press on the total opens settings. There the user edits item prices, adds items such as Beer with an icon and price, sets the payday day of month (default 25), and exports or imports all data as a JSON file. Demo: add Beer at £6, change Coffee to £3.80, export, wipe site data, import, and everything is back.

**Blocked by:** 03 Press and ledger.

**Status:** code done; long press awaits device check (DEVICE-CHECKLIST section 5)

- [ ] Long press on total opens settings; main screen stays a cup otherwise
  (implemented in src/ui/settings.ts as a 600 ms delegated long press on
  `[data-role=total]`, with no cup.ts change; it type-checks and builds, but no
  browser was available to try it, so check it on a device. Review: the click
  from the same finger lift is now swallowed so it cannot hit a Settings control)
- [x] Items can be added, renamed, repriced; presses keep the price at time of press
- [x] Payday stored and validated as 1 to 28
- [x] Export produces a JSON file; import restores presses, items, settings, settlements
- [x] Import of malformed JSON is rejected with a message and changes nothing
  (review: every row is checked, a Coffee item is required, and the write is one
  atomic Store.replaceAll; IndexedDB uses a single transaction)
