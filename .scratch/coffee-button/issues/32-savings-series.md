# 32: Savings over time, as numbers

**What to build:** The numbers behind the latte graph (ticket 33), with no drawing. From the ledger's presses and the confirmed settlements, produce a day-by-day series from the first press to today: the running total saved (every press) and the running total invested (every confirmed "Did you invest £X? Yes"). The span is never shorter than seven days, matching the pace rule, so a first-day user gets a week-wide series ending today. Before the first press there is no series. The two headline figures, total saved and total invested, come from the same function so the labels and the picture can never disagree.

Agreed in the grilling session of 2026-11-17 (Q8, Q17, Q18).

**Blocked by:** None (can start immediately).

**Status:** in-progress

- [x] No presses gives no series; unit tested, failing first
- [x] One press today gives a seven-day series ending today, with saved stepping up on the day of the press
- [x] Saved is cumulative per day across items and months; invested steps up on the day of each settlement by its amount
- [ ] An undone press does not appear in the series (guard test)
- [ ] The last point's saved figure equals the ledger's lifetime total, and its invested figure equals the sum of settlements (guard tests)
- [ ] Days are the phone's local days; a press at 23:59 and one at 00:01 fall on different days (unit tested with the fake clock)
