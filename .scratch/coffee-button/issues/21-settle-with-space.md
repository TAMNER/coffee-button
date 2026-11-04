# 21: Settle screen when a Space is linked

**What to build:** With Starling linked, the settle-day screen adds one line under "Invest £X": "£X is waiting in your Coffee Button Space" (using the Space's real name). The Invest button still copies the amount and opens the user's destination; nothing is withdrawn from the Space by the app. When presses are still waiting to move, the line says so instead: "£Y still moving to your Space".

**Blocked by:** 17 (Settle destination), 20 (Every press moves money into the Space).

**Status:** code done; awaits a device check with a linked Space

- [x] A pure function produces the Space line from owed, waiting amount and Space name; unit tested
- [x] Line rendered under the Invest button only when a Space is linked
