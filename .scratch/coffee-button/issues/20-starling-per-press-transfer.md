# 20: Every press moves money into the Space

**What to build:** With Starling linked, each press that survives the 5 s undo window moves the item's price from the main account into the chosen Space. The transfer fires when the undo toast closes without an undo. If the phone is offline or the relay is down, the press is marked waiting and retried on the next launch and on every return to the app, oldest first, one at a time. Settings shows "N presses waiting to move" when N > 0. If Starling rejects the token (401/403) a banner on the cup says "Starling rejected the token. Reconnect in Settings." and retries stop until reconnected. Undo never reverses a transfer. Transfers are idempotent through a stored client-generated transfer uid per press.

**Blocked by:** 19 (Link Starling in Settings).

**Status:** blocked

- [ ] Press records carry transfer state (none | waiting | moved | failed) and a transferUid created once; unit tested
- [ ] StarlingMover schedules the move at undo-window close, not at press; an undo inside the window cancels it; unit tested with a fake clock
- [ ] Retry queue drains oldest first on launch and visibility, stops on 401/403, backs off on 429; unit tested
- [ ] Settings line "N presses waiting to move"; cup banner on token rejection
- [ ] LedgerMover behaviour unchanged when nothing is linked
