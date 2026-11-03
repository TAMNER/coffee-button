# 07: Shelf screen

**What to build:** A second screen reached by swiping up or tapping the total. It shows a pace line ("At this rate you'll have £X by December"), a compounding line ("£X at 5% for 10 years is £Y"), and a shelf of placeholder big-ticket items with editable rough prices that are greyed until the lifetime total passes their price, then lit with "you could now buy this". Unreached items show progress. Up to three personal goals with a price can be added on the shelf itself. An owed-since line appears when a settlement is overdue. Demo: seed a lifetime total and watch items light up.

**Blocked by:** 03 Press and ledger.

**Status:** done

- [x] Pace projection uses presses this calendar year extrapolated to 31 December; unit tested (`paceToYearEnd`, £120 by 31 March -> £486.67)
- [x] Compounding uses fixed 5% annual over 10 years; unit tested (`compound`, £100 -> £162.89, £240 -> £390.93)
- [x] Items light when lifetime total >= price; progress shown otherwise (`shelfState` unit tested; lit/greyed with thin progress bars checked in a headless happy-dom smoke run, not yet on device)
- [x] Up to three personal goals, add and remove, persisted (`addGoal`/`removeGoal` through the Store; fourth rejected)
- [x] Default item list of about ten items with editable prices (ten defaults; prices stored in `Settings.shelfPrices`, edited in a "Shelf prices" settings section, which appears once ticket 05's settings screen is merged)

## Notes for later tickets

- Navigation is delegated from `src/ui/shelf.ts` (no edit to `cup.ts`): a plain tap on `[data-role=total]` (held under 500 ms, so ticket 05's 600 ms long press still wins) or a swipe up on the cup screen opens `shelf`; swipe down or the Back arrow returns.
- Overdue line: the placeholder is gone (review, 2026-11-03); the shelf asks `weeklyOverdueLine` once per visit, and again after a settlement.
- Swipes: read from touchend as well as pointerup (iOS pans end in pointercancel); the cup screen has `touch-action: none`; swipe down on the shelf only counts at scrollTop 0.
- `Settings` gained an optional `shelfPrices` field (additive; old data reads as defaults).
- The shelf refreshes on the `settle` bus event so ticket 08's lifetime tick-up is visible.
- Shapes are geometric placeholders keyed by item id, for ticket 10 to replace.
