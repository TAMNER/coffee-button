# 28: Picture picker, with the jar as the fallback

**What to build:** The free-text "Icon" box in Settings goes. In its place is a row of small drawings to tap: cup, pint, plate and the new jar (ticket 29 adds two more). The row appears when adding an item and on every existing item, including Coffee, so Coffee renamed to Tea can keep the cup or switch. An item whose picture the app does not recognise shows the jar on the main screen, not the coffee cup as today. The jar uses the plate's ceremony: the coin lands, the jar hops, confetti, no pour.

The jar is drawn from Tom's pick in ticket 27.

Agreed in the grilling session of 2026-11-17 (Q4, Q9, Q10, Q11).

**Blocked by:** 26 (Remove an item: shares the Settings item list), 27 (Mockup page: the jar pick).

**Status:** blocked (waiting on 26 and 27)

- [ ] The list of pictures a user can choose is data in the domain, in a fixed order; unit tested, failing first
- [ ] Changing an existing item's picture is saved and shows on the main screen; unit tested at the settings seam
- [ ] An unrecognised picture name resolves to the jar; the existing fallback test is changed first and fails
- [ ] The jar plays the no-pour ceremony (coin lands, hop, confetti) and no pour sound; tested at the ceremony timeline seam
- [ ] Items saved with the old free-text box keep working: cup, pint and plate names still show their drawings (guard test)
- [ ] Settings shows the picker row on the add form and on each item row, with the current picture marked (DOM glue, declared untested)
- [ ] Screenshot at 390x844 of Settings with the picker, both themes
