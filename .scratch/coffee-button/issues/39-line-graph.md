# 39: Line graph on the shelf (replaces the latte glasses)

**What to build:** Under the plank, savings over time as an ordinary line graph: Tom's pick, "Graph B", from round five of the mockup (`mockups/pictures-and-graph.html`, 2026-11-19). He dropped the glasses of ticket 33 and the cup pictures of round four ("Forget all of this tomfoolery with cups!") and chose from four line graphs.

Two lines on one money scale. The saved line climbs with each press and has a pale fill under it. The invested line is a staircase, flat then a jump on each invest day, with a solid fill under it; the pale band between the two is money saved and still waiting. Until the first invest there is no invested line. "£X saved" and "£Y invested" sit above with a swatch each ("£0 invested" before the first invest, pence shown when there are any).

The money scale climbs in round steps from £0 to at or above today's total, at most five lines. The graph starts on the day of the first press. In the first week the plot is seven days wide and the line stops at today, with a dated tick for every day. From eight days to two months there are at most six dated ticks stepping back evenly from today. Beyond two months there is a tick where each month starts and the month's name in the middle of its stretch; a sliver of a first month gets no name, and over years the names thin out to at most eight.

A finger or pointer on the plot moves a marker to the nearest day, and the line under the graph reads "13 Sep: £243.80 saved, £187.10 invested" ("Today: …" for the last day). At rest it reads "Touch the graph to read any day." This replaces ticket 33's "nothing to tap". No pour-in or other animation.

Saved is blue and invested is the cup's coffee brown; on the dark theme, where brown disappears, they are a lighter blue and mustard (`--line-saved`, `--line-inv`).

**Blocked by:** 32 (Savings over time, as numbers).

**Status:** built 2026-11-19 (domain in `src/domain/line-graph.ts`, drawing and glue in `src/ui/line-graph.ts`); ticket 33's modules, tests and CSS are removed; awaiting Tom's device check

- [x] A pure function turns the savings series into the graph: labels, text alternative, money scale, a point per day, the date axis and a readout per day; unit tested, failing first
- [x] The graph starts on the first press day; the first week is seven days wide and fills from the left
- [x] With no presses the graph is absent and the first-press hint still shows
- [x] The two line colours are tokens in both theme blocks; CSS under a comment naming this ticket
- [x] Lines, fills, axes and the touch marker drawn as in the mockup's Graph B (drawing and DOM glue, declared untested)
- [x] Screenshot at 390x844 with about five months of test data, both themes
- [ ] Device check (Tom): drag a finger across the graph on the phone; the shelf still scrolls up and down from the graph
