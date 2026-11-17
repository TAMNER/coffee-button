# 35: Try investment day without waiting for it

**What to build:** Tom wants to walk the whole investment-day flow ("I want to test that user flow", 2026-11-17) and it only appears from the 26th. A tester can open the app as if today were a chosen date, so the main screen shows "Invest £X", the amount is copied, the invest link opens, the app asks "Did you invest £X?", and the settle ceremony plays. While a pretend date is active the app says so plainly on screen, so a pretend day is never mistaken for a real one. Leaving the pretend date returns the app to the real clock.

Start by checking whether the clock can already be overridden; if it can, this ticket is only the on-screen notice and a line in the device checklist.

Open question for Tom before building: should a press or a "Yes, I invested" made on a pretend date be saved (with the pretend timestamp), or should the pretend mode be look-only? Recommendation: look-only for money, so a test walk never clears a real owed balance.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Tom has answered the open question; answer recorded here
- [ ] A pure function reads the pretend date from where the tester sets it and rejects anything that is not a real date; unit tested, failing first
- [ ] With a pretend date on or after settle day and money owed, the settle rules report "Invest £X" exactly as they would on that real date (guard test with the fake clock)
- [ ] A notice naming the pretend date shows on every screen while it is active (DOM glue, declared untested)
- [ ] The device checklist gains the steps to walk investment day this way
- [ ] Device check (Tom): the full flow on the iPhone, including the invest link opening and the return question
