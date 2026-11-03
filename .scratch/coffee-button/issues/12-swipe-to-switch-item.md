# 12: Swipe to switch item

**What to build:** On the main screen, a horizontal swipe cycles the active item: swipe right goes to the next item, swipe left to the previous, wrapping around. The vessel slides out and the next one slides in, Cut Paper style. Beer at £6.00 is a default item alongside Coffee, so a fresh install and an existing install both have it. The active item is remembered across launches. A tap on the vessel records a press for the active item at its price. The ceremony pours that item's liquid: amber beer with a foam head into a pint glass, coffee as today. The small label under the total names the active item. Swipe up to the shelf keeps working; the gesture locks to one axis.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] nextItem/prevItem cycle through items in order and wrap; unit tested
- [ ] Beer (600 pence, icon "beer") is seeded for new stores and added once to existing stores that lack it; unit tested, never duplicated
- [ ] Active item id persisted in settings; defaults to Coffee; survives reload; unit tested
- [ ] Press records the active item's current price; unit tested
- [ ] Horizontal swipe switches with a slide transition; vertical swipe still opens the shelf
- [ ] Pint glass artwork and beer-coloured pour in the ceremony
