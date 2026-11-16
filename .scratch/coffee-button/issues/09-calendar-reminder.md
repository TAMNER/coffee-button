# 09: Calendar reminder

**What to build:** Settings offers "Add monthly reminder". It produces an .ics file with a monthly recurrence on payday + 1 at 9:00 whose event title is "Coffee Button: invest" and whose URL is the app's address. On iOS this opens the Calendar add sheet. Demo: add it on the iPhone and see the event on the 26th.

**Blocked by:** 05 Settings.

**Status:** code done; device checks outstanding (ticket 11)

- [x] Generated .ics validates and includes RRULE monthly on the configured day
  (built to RFC 5545: VERSION, PRODID, UID, DTSTAMP, a VTIMEZONE for
  Europe/London, CRLF, 75-octet folding; payday 28 recurs on the 1st.
  2026-11-16: files from generateIcs (payday 25 London, payday 28 London,
  payday 25 New York) parse with the Python icalendar library and
  recurring-ical-events expands them to 26 Nov, 26 Dec, 26 Jan... at 09:00 and,
  for payday 28, to the 1st of each month. The iPhone Calendar add sheet is
  still a device check in ticket 11)
- [x] Event URL and description point at the app
- [x] Changing payday regenerates the file on next use
  (src/ui/reminder.ts reads payday when the button is tapped; UI is not unit tested)
- [x] ics generation unit tested (src/domain/ics.test.ts)
