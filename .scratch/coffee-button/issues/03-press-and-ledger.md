# 03: Press and ledger

**What to build:** Tapping the cup records a press for the default item (Coffee, £3.50) with a timestamp into IndexedDB. The month-to-date total under the cup updates immediately. A 5-second undo toast reverses the last press. Presses reference an item (name, icon, price) so other items can be added later. A MoneyMover interface exists with the ledger as its only implementation. Demo: tap, see the total rise, undo, see it fall; reload and the total persists.

**Blocked by:** 01 Scaffold and deploy.

**Status:** ready-for-agent

- [ ] Tap records a press; total updates within one frame
- [ ] Undo within 5 seconds removes exactly that press; after 5 seconds the toast is gone
- [ ] Presses survive reload and offline use
- [ ] Ledger logic (add, undo, month-to-date, lifetime) is unit tested with no DOM
- [ ] MoneyMover interface defined; ledger implementation passes the same tests
