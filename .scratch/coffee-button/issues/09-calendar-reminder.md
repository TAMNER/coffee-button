# 09: Calendar reminder

**What to build:** Settings offers "Add monthly reminder". It produces an .ics file with a monthly recurrence on payday + 1 at 9:00 whose event title is "Coffee Button: invest" and whose URL is the app's address. On iOS this opens the Calendar add sheet. Demo: add it on the iPhone and see the event on the 26th.

**Blocked by:** 05 Settings.

**Status:** code done; device checks outstanding (ticket 11)

- [ ] Generated .ics validates and includes RRULE monthly on the configured day
  (built to RFC 5545: VERSION, PRODID, UID, DTSTAMP, a VTIMEZONE for
  Europe/London, CRLF, 75-octet folding; payday 28 recurs on the 1st. Not run
  through an external validator; the iPhone Calendar add sheet is a device check)
- [x] Event URL and description point at the app
- [x] Changing payday regenerates the file on next use
  (src/ui/reminder.ts reads payday when the button is tapped; UI is not unit tested)
- [x] ics generation unit tested (src/domain/ics.test.ts)
