# 36: Stronger vibration where the phone allows it

**What to build:** Tom asked for vibration like Duolingo's lesson-complete (2026-11-17). Today a press gives one light tick and so does confirming a settle. On phones whose browser offers patterned vibration (Android), a press plays a short pattern timed to the ceremony: a tick at the press, a firmer buzz as the coin lands, a flutter at the cheer. Confirming a settle plays a longer celebratory pattern. On iPhone nothing changes: a web app there gets a single light tick, and only inside the tap itself, so a pattern is not possible. That limit is written into the design doc so it is not asked again.

The pattern must be requested inside the tap, before the first await, like the tick today.

No one on the project has an Android phone today; the device check waits for a tester who does.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] The press pattern is derived from the ceremony timeline (press, coin landing, cheer) as a pure function; unit tested, failing first
- [ ] The item's ceremony decides the pattern: no-pour items land their coin earlier, and the pattern follows (unit tested)
- [ ] The haptics interface gains a pattern call; the fake records it; the real one uses patterned vibration when present and falls back to the single tick otherwise
- [ ] Press and settle call it before their first await (guard on the existing ordering rule; DOM glue declared untested)
- [ ] The design doc states the iPhone limit
- [ ] Device check (an Android tester): press and settle patterns are felt and line up with the ceremony
- [ ] Device check (Tom): the iPhone tick is unchanged
