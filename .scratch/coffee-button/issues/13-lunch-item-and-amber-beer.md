# 13: Lunch item, coin-drop ceremony, amber beer

**What to build:** Lunch at £8.00 is a third seeded item after Beer, so a fresh install and an existing install both have it (Coffee → Beer → Lunch → Coffee when swiping). Its artwork is a Cut Paper sandwich on a plate in the same palette as the cup and pint. A press on Lunch records £8.00 and plays a ceremony with no pour: the coin drops onto the plate, the sandwich hops, the cheer and confetti are the same as today. Beer's liquid becomes amber ale copper (deep copper, like a pint of bitter), foam head unchanged.

**Blocked by:** None (can start immediately).

**Status:** done (2026-11-04), except the shelf/settings icon art box: no icon-to-art map exists to extend (see note)

- [x] Lunch (800 pence, icon "sandwich") is seeded for new stores and added once to existing stores that lack it; cycling order Coffee, Beer, Lunch; unit tested, never duplicated
- [x] The vessel registry can describe a vessel with no pour; the ceremony timeline for such a vessel skips the pour phase and goes coin → cheer; unit tested at the domain seam
- [x] Sandwich-on-plate artwork drawn in the Cut Paper style; the coin lands on the plate and the sandwich hops
- [x] Beer liquid colour darkened to amber ale copper in both light and dark themes
- [ ] Shelf/settings item art has a sandwich for the "sandwich" icon (falls back gracefully if none)

Note (ticket 13 build): src/ui/art/items.ts maps shelf goal ids to art, not item icons, and the settings item list shows the icon name as text ("sandwich"), so there was no icon art map to add a sandwich to; the text label is the graceful fallback. The cup screen and ceremony get the sandwich through vesselFor("sandwich").
