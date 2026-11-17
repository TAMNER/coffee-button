# 26: Remove an item

**What to build:** In the Settings item list every item except Coffee has a ×. Tapping it opens the app's own Cut Paper sheet, "Remove Beer? Your savings stay." with Remove and Keep. Remove takes the item out of the swipe for good; Keep closes the sheet. Coffee has no × (it can still be renamed and repriced). Everything already saved by pressing that item stays in every total. A removed Beer or Lunch does not come back on the next launch, and stays removed through an export and import; the user gets it back by adding it again by hand. If the removed item is the one on the main screen, the main screen moves to the next item.

The confirm sheet is built here as a reusable piece: tickets 28 and 30 use it too.

Agreed in the grilling session of 2026-11-17 (Q1, Q2, Q3, Q12, Q19).

**Blocked by:** None (can start immediately).

**Status:** built, awaiting review (branch worktree-agent-acc5c6951172ee261)

- [x] Removing an item deletes it from the store; removing Coffee is refused; unit tested, failing first
- [x] Month, owed and lifetime totals are unchanged by removing an item that has presses (guard test)
- [x] A removed built-in item is remembered (a new optional setting) and is not re-added at launch; unit tested
- [x] The remembered removals are in the export file and honoured on import; an older export file without them still imports (unit tested)
- [x] The active item falls to the next item in cycling order when the active one is removed (not a guard test: the existing rule fell back to the first item, Coffee, so this test failed first and `removeItem` now sets the next item)
- [x] A press of a removed item that is still waiting to move to Starling still moves (guard test)
- [x] Settings shows × on every row but Coffee; the confirm sheet has Remove and Keep, closes on either, and is reusable with other wording (DOM glue, declared untested)
- [x] Screenshot at 390x844 of the sheet in both themes (`.scratch/coffee-button/shots/26-confirm-light.png`, `26-confirm-dark.png`)
