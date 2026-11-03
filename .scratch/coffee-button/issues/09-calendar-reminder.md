# 09: Calendar reminder

**What to build:** Settings offers "Add monthly reminder". It produces an .ics file with a monthly recurrence on payday + 1 at 9:00 whose event title is "Coffee Button: invest" and whose URL is the app's address. On iOS this opens the Calendar add sheet. Demo: add it on the iPhone and see the event on the 26th.

**Blocked by:** 05 Settings.

**Status:** ready-for-agent

- [ ] Generated .ics validates and includes RRULE monthly on the configured day
- [ ] Event URL and description point at the app
- [ ] Changing payday regenerates the file on next use
- [ ] ics generation unit tested
