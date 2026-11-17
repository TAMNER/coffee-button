# 25: Settings explains Import, Export and the invest link

**What to build:** A tester asked "What do import export buttons mean? How does the InvestEngine link work?" (2026-11-17). Both features work; neither says what it does. Settings gains one short line under each.

Proposed copy, for Tom to review:

- Under Export and Import: "Export saves a backup file of your presses and settings. Import replaces everything on this phone with a backup. Your bank link is never in the file."
- Under "Where do you invest?": "Paste the link to wherever you invest. When Invest £X appears, tapping it copies the amount and opens this link. Nothing is sent to them."

Tom approved this copy on 2026-11-17. The second line was then reworded from "On investment day, Invest copies…" to follow his ticket 24 decision that the app says "Invest £X", not "investment day"; that one phrase is still his to read before the push.

**Blocked by:** None (can start immediately).

**Status:** built, awaiting Tom's review of the two lines before push

- [x] The two lines are held as data beside the other Settings copy and covered by a test that fails first
- [x] Each line shows under its section in Settings, in both themes, without pushing the buttons off a 390px screen (screenshot)
- [x] Export still leaves out the Starling token and link, and import still ignores them (guard tests)
- [ ] Tom has reviewed the two lines before they are pushed
