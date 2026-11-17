# 23: Sounds respect silent mode

**What to build:** With the iPhone's ringer switch on silent, a press makes no sound and gives its vibration tick only. With the switch on ring, the pour, clink and cheer play as today. Playing a sound no longer pauses music from another app. Today the app deliberately forces the "playback" audio session on every unlock, which overrides the ringer switch and interrupts other audio; tester feedback (2026-11-17) says the noise is jarring and settles the open question in the handoff in favour of respecting silent mode. A web app cannot detect headphones or read the switch, so "play when headphones are on" is not built: the ticket records what the phone actually does with headphones in silent mode.

**Blocked by:** None (can start immediately).

**Status:** built (adapter test, guard test, docs); awaiting Tom's two device checks

- [x] Unlocking audio no longer asks for the "playback" session; a test at the audio adapter seam fails first
- [x] The press and settle vibration ticks still fire before the first await, whatever the ringer switch says (guard test)
- [ ] Device check (Tom): switch on silent, a press is silent with a tick; switch on ring, all three sounds play; music from another app keeps playing through a press
- [ ] Device check (Tom): with headphones in and the switch on silent, note in this ticket whether sound plays
- [x] The design doc's "known losses" line and the handoff's open question about the playback session are updated to say silent mode is respected by choice
