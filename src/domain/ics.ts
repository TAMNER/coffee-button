/**
 * The monthly calendar reminder: an .ics with one recurring event on settle
 * day (payday + 1) at 09:00 local, linking back to the app.
 */
export interface IcsOptions {
  /** Payday, 1 to 28. */
  payday: number;
  /** The app's address; the event links here. */
  appUrl: string;
  /** Today, read in local time; the first event is the next settle day from here. */
  now: Date;
  /** IANA time zone the 09:00 is in, e.g. "Europe/London". */
  tz: string;
}

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

export function generateIcs({ payday, appUrl, now, tz }: IcsOptions): string {
  const settleDay = payday + 1;
  const start = new Date(now.getFullYear(), now.getMonth(), settleDay);
  const dtstart = `${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}T090000`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Coffee Button//Reminder//EN",
    "BEGIN:VEVENT",
    `DTSTART;TZID=${tz}:${dtstart}`,
    `RRULE:FREQ=MONTHLY;BYMONTHDAY=${settleDay}`,
    "SUMMARY:Coffee Button: invest",
    `DESCRIPTION:Settle day. Open ${appUrl} and invest what you saved.`,
    `URL:${appUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n") + "\r\n";
}
