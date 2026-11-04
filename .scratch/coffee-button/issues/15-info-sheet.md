# 15: Info button and sheet

**What to build:** A small ⓘ button in the top-left of the cup screen opens a bottom sheet that explains the app in plain words, four short sections: "The idea" (skip the coffee, press the cup, the price is saved), "The money" (nothing moves until you link a bank; link Starling in Settings and every press moves the price into a Space; Monzo is coming), "Swipe" (sideways for items, up for the shelf), and "Add to Home Screen" (Safari share sheet → Add to Home Screen; the app needs it to keep your data). The sheet closes on tap outside, swipe down, or a Close button. No screenshots, no mascots, Cut Paper styling.

**Blocked by:** None (can start immediately).

**Status:** done (2026-11-04). Domain in src/domain/info.ts (unit tested); DOM glue in src/ui/info.ts checked by headless Chrome screenshots (auto-open on first launch, not on second, button clear of ring and chevrons and below the Safari banner). Close paths and focus return are not exercised by an automated test.

- [x] The sheet's section copy lives in one module as data; a unit test asserts the four headings and that the Add to Home Screen section is only marked "needed" when the app is not already running standalone
- [x] ⓘ button top-left on the cup screen, 44px hit target, does not overlap the ring or chevrons
- [x] Bottom sheet opens and closes (tap outside, swipe down, Close); focus goes into the sheet and back
- [x] Shown automatically once on first ever launch, never again (flag persisted in settings; unit tested)
