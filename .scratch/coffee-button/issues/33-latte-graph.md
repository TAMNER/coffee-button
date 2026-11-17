# 33: Latte graph on the shelf

**What to build:** Under the single plank, the shelf shows savings over time as a row of latte glasses standing on a cobalt tray: Tom's pick, "Graph 1", from the third round of the mockup (`mockups/pictures-and-graph.html`, function `graph1`, with its `tumbler`, `drink` and `steam` helpers; screenshots `.scratch/coffee-button/shots/27v3-*-02.png` and `-03.png`). One glass per period, oldest on the left, today on the right. Every glass is the same size; each is filled to the running total saved by the end of its period, measured against today's total, so the glasses fill up from left to right. In each glass the top of the cream froth marks the total saved; under the froth, dark brown coffee is what had been invested and light brown latte is what was saved and still waiting, split in proportion so the froth never hides the latte. Steam curls off the newest glass.

Periods, so there are never more than seven glasses:

- up to 7 days since the first press: one glass per day (always seven, because the series always spans at least seven days);
- after that, up to 7 weeks: one glass per week, the last one being this week so far;
- after that: one glass per calendar month, the last one being this month so far, showing the most recent seven months.

The weekly stage is not in the mockup; it is here so the graph does not collapse to one or two monthly glasses on day eight. The seven-glass limit and the weekly stage are the builder's proposal for Tom to confirm.

The only labels are "£X saved" and "£Y invested" above the glasses, and under the tray the first glass's month on the left ("Jun") and "today" on the right: no gridlines, no axis numbers, nothing to tap. When the shelf opens the glasses fill once from the bottom, like a pour, then stay still; with reduced motion switched on they simply appear full. The graph shows from the first press and is absent before it.

Decided by Tom after seeing the mockups (2026-11-17): the "£0 invested" label shows even before the first invest, and the labels keep pence when there are any ("£381.30 saved"). He rejected two earlier rounds (smooth area charts, then cut-paper waves) before choosing bars as latte in a glass with a light brown layer, a dark brown layer, froth, and "heat swirls coming off the top".

Tester feedback 2026-11-17 ("Add a graph of savings and amounts invested over time"); agreed in the grilling session of the same day (Q7, Q8, Q17, Q18) and revised by the mockup rounds above.

**Blocked by:** 27 (Mockup page: the graph pick), 30 (Targets: one plank, which frees the space), 32 (Savings over time, as numbers).

**Status:** built (domain in `src/domain/latte-graph.ts`, art and glue in `src/ui/latte-graph.ts`; screenshots `.scratch/coffee-button/shots/33-*.png`); waiting for Tom's device check and his word on the seven-glass limit and the weekly stage

- [x] A pure function turns the savings series into the glasses' periods: seven daily glasses for the first week, weekly glasses up to seven weeks, then the most recent seven calendar months; each carries the running saved and invested totals at the end of its period; unit tested, failing first
- [x] A pure function turns each period into its fill levels for a given glass height: the froth top at saved over today's total, coffee and latte split in proportion under the froth; the last glass is always full; unit tested
- [x] A glass with nothing invested shows latte and froth only; a period with nothing saved yet shows an empty glass (unit tested)
- [x] The labels read "£X saved" and "£Y invested" from the same figures as the series, pence shown when there are any, "£0 invested" shown before the first invest; the first glass's month and "today" underneath
- [x] With no presses the graph is absent and the existing first-press hint still shows (guard test on the hint rule)
- [x] The graph has a text alternative saying the two figures
- [x] The new latte colour is a token in both theme blocks (the mockup's values); CSS is appended under a comment naming this ticket
- [x] Glasses, froth with bubbles, tray and steam are drawn as in the mockup's Graph 1 (art and DOM glue, declared untested)
- [x] The pour-in plays once per opening of the shelf and is skipped under reduced motion (DOM glue, declared untested)
- [x] Screenshot at 390x844 with three targets and the graph, for one week, about four weeks and about five months of data: the whole shelf fits or scrolls cleanly, both themes
- [ ] Device check (Tom): the graph after a real press and after a real settle
