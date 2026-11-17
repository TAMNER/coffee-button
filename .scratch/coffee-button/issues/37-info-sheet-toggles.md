# 37: Info sheet: the idea on top, the rest folded away

**What to build:** Tom read the new info sheet on his phone (2026-11-17): "there is too much dense text... right now it is an essay. Keep 'the idea' first. The other stuff toggleable perhaps?" The sheet opens showing only "The idea" in full. Every other section (The money, How does saving work?, How does investment work?, Swipe) is a single tappable heading row that unfolds its text when tapped and folds it again on a second tap; opening one does not close the others. The copy itself does not change by a word. So the sheet a first-time user meets is one short paragraph and a few headings, not a wall of text.

Add to Home Screen is the exception: while the app is not installed it stays open, in its highlighted box, because the app loses its data unless installed and that warning must not be hidden behind a tap. Once installed it is a folded row like the others. This exception is the builder's proposal for Tom to confirm.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Which sections start open is decided by a pure function of the section and whether the app is installed: "The idea" always; Add to Home Screen only when not installed; nothing else; unit tested, failing first
- [ ] The headings and bodies are exactly as they are today, in the same order (guard test on the existing copy test)
- [ ] Each folded section is a real control: reachable by keyboard, announces expanded or collapsed, and its heading row is at least 44px tall (DOM glue, declared untested)
- [ ] The sheet no longer needs scrolling on a 390x844 screen when it first opens, installed or not (screenshot, both themes)
- [ ] Screenshot with one section unfolded and with all unfolded: the sheet scrolls cleanly
- [ ] Tom has seen it on the phone
