# 14: "Skip and Save" ring and swipe chevrons

**What to build:** Curved text around the big button like a stamp or the Shazam ring: "SKIP AND SAVE" along the top arc, the active item and its price ("COFFEE £3.50") along the bottom arc, in cobalt small caps. It is permanent and the bottom arc changes when the user swipes to another item or reprices it. Faint cobalt chevrons sit at cup height on the left and right edges and one points up at the bottom of the screen for the shelf. The side chevrons are tappable and switch item exactly like a swipe. All of it is low contrast so the button stays the hero.

**Blocked by:** None (can start immediately).

**Status:** done (branch worktree-wf_94a0471a-70c-2; DOM glue verified by headless screenshots, not unit tests)

- [x] The ring label text for an item is a pure function ("COFFEE £3.50", "BEER £6.00"); unit tested
- [x] Ring rendered as SVG textPath around the button; top arc "SKIP AND SAVE"; bottom arc follows the active item after a swipe (listens to the 'item' bus event) and after a reprice
- [x] Left/right chevrons at cup height, tappable, switching item with the same slide as a swipe; up chevron at the bottom for the shelf (tappable too)
- [x] Chevrons and ring respect prefers-reduced-motion and do not intercept the cup press
- [x] Looks right in light and dark themes on a 390px wide phone frame
