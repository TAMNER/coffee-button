# 33: Latte graph on the shelf

**What to build:** Under the single plank, the shelf shows savings over time as a latte in layers, drawn from Tom's pick in ticket 27. A dark espresso layer at the bottom is money invested. A lighter coffee layer above it is money saved and still waiting to be invested. A smooth froth line on top is the running total saved. The only labels are "£X saved", "£Y invested", the first month on the left and "today" on the right: no gridlines, no axis numbers, nothing to tap. When the shelf opens the graph fills once from the bottom, like a pour, then stays still; with reduced motion switched on it simply appears. It shows from the first press and is absent before it.

Tester feedback 2026-11-17 ("Add a graph of savings and amounts invested over time"; "under the curve is coffee and the curve line is latte froth"); agreed in the grilling session of the same day (Q7, Q8, Q16, Q17, Q18).

**Blocked by:** 27 (Mockup page: the graph pick), 30 (Targets: one plank, which frees the space), 32 (Savings over time, as numbers).

**Status:** blocked (waiting on 27, 30 and 32)

- [ ] A pure function turns the series into the three shapes (espresso area, coffee area, froth line) for a given width and height; unit tested, failing first
- [ ] The froth line is smoothed but never dips below an earlier total and passes through the final total (unit tested)
- [ ] The labels read "£X saved" and "£Y invested" using the same figures as the series; first month and "today" underneath
- [ ] With no presses the graph is absent and the existing first-press hint still shows (guard test on the hint rule)
- [ ] The graph has a text alternative saying the two figures
- [ ] New colours are tokens in both theme blocks; CSS is appended under a comment naming this ticket
- [ ] The pour-in plays once per opening of the shelf and is skipped under reduced motion (DOM glue, declared untested)
- [ ] Screenshot at 390x844 with three targets and the graph: the whole shelf fits or scrolls cleanly, both themes
- [ ] Device check (Tom): the graph after a real press and after a real settle
