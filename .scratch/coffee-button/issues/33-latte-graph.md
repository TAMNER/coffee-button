# 33: Latte graph on the shelf

**What to build:** Under the single plank, the shelf shows savings over time as a row of latte glasses standing on a cobalt tray: Tom's pick, "Graph 1", from the third round of the mockup (`mockups/pictures-and-graph.html`, function `graph1`, with its `tumbler`, `drink` and `steam` helpers; screenshots `.scratch/coffee-button/shots/27v3-*-02.png` and `-03.png`). One glass per period, oldest on the left, today on the right. Every glass is the same size; each is filled to the running total saved by the end of its period, measured against today's total, so the glasses fill up from left to right. In each glass the top of the cream froth marks the total saved; under the froth, dark brown coffee is what had been invested and light brown latte is what was saved and still waiting, split in proportion so the froth never hides the latte. Steam curls off the newest glass.

Always seven glasses: the days since the first press, at least seven, are shared out evenly among them, so early on each glass is a day and later each is a few weeks. When the days do not divide by seven, the oldest glasses take one day more. The graph always runs from the first press to today. (This replaced a daily, then weekly, then monthly rule that fell from seven glasses to two on day eight.)

In the first week the row fills from the left: it starts on the day of the first press, one glass a day, so on day one there is one full glass on the left (with the steam) and six empty glasses to its right for the days still to come; on day three, three glasses filling up and four empty. The steam sits on today's glass, and "today" under the tray only appears once today is the last glass. (Tom's phone test, 2026-11-17: the row used to reach back seven days before the first press, so one press showed six empty glasses on the left and one full one on the right.)

The only labels are "£X saved" and "£Y invested" above the glasses, and under the tray the first glass's month on the left ("Jun") and "today" on the right: no gridlines, no axis numbers, nothing to tap. When the shelf opens the glasses fill once from the bottom, like a pour, then stay still; with reduced motion switched on they simply appear full. The graph shows from the first press and is absent before it.

Decided by Tom after seeing the mockups (2026-11-17): the "£0 invested" label shows even before the first invest, and the labels keep pence when there are any ("£381.30 saved"). He rejected two earlier rounds (smooth area charts, then cut-paper waves) before choosing bars as latte in a glass with a light brown layer, a dark brown layer, froth, and "heat swirls coming off the top".

Tester feedback 2026-11-17 ("Add a graph of savings and amounts invested over time"); agreed in the grilling session of the same day (Q7, Q8, Q17, Q18) and revised by the mockup rounds above.

**Blocked by:** 27 (Mockup page: the graph pick), 30 (Targets: one plank, which frees the space), 32 (Savings over time, as numbers).

**Status:** built (domain in `src/domain/latte-graph.ts`, art and glue in `src/ui/latte-graph.ts`; screenshots `.scratch/coffee-button/shots/33-*.png`); built with the seven-even-glasses rule and the first week filling from the left; awaiting Tom's device check

- [x] A pure function turns the savings series into the glasses' periods: always seven glasses, the series' days shared out evenly in order (sizes differ by at most one, the oldest glasses longest), from the first day to today; each carries the running saved and invested totals at the end of its period; unit tested, failing first
- [x] A pure function turns each period into its fill levels for a given glass height: the froth top at saved over today's total, coffee and latte split in proportion under the froth; the last glass is always full; unit tested
- [x] A glass with nothing invested shows latte and froth only; a period with nothing saved yet shows an empty glass (unit tested)
- [x] The labels read "£X saved" and "£Y invested" from the same figures as the series, pence shown when there are any, "£0 invested" shown before the first invest; the first glass's month and "today" underneath
- [x] With no presses the graph is absent and the existing first-press hint still shows (guard test on the hint rule)
- [x] The graph has a text alternative saying the two figures
- [x] The new latte colour is a token in both theme blocks (the mockup's values); CSS is appended under a comment naming this ticket
- [x] Glasses, froth with bubbles, tray and steam are drawn as in the mockup's Graph 1 (art and DOM glue, declared untested)
- [x] The pour-in plays once per opening of the shelf and is skipped under reduced motion (DOM glue, declared untested)
- [x] Screenshot at 390x844 with three targets and the graph, for one week, about four weeks and about five months of data: the whole shelf fits or scrolls cleanly, both themes
- [x] In the first week the row starts on the first press day and fills from the left: the glasses after today are days not yet come, drawn empty; the steam is on today's glass; no "today" label until today is the last glass (unit tested, failing first; screenshots `33-first-day-*.png`, `33-day-three-light.png`)
- [ ] Device check (Tom): the graph after a real press and after a real settle

**2026-11-18 (Tom):** the graph gained a caption, a money scale up the left (nothing, half, all of today's total) and a date under every glass; the two end labels are gone. Saved-and-waiting is now drawn in the cup's coffee colour and invested in a darker espresso (`--espresso`); `--latte` is no longer used. Screenshots `33-axes-*.png`. Caption copy awaits Tom's read.

**2026-11-19 (Tom):** superseded by ticket 39, a plain line graph. The glasses, their modules, tests and CSS are removed.
