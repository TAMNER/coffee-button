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

/** FNV-1a 32-bit, hex. Stable across runs, so the same app URL always gives the same UID. */
function hash(text: string): string {
  let h = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(text)) {
    h ^= byte;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

function utcStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

/** RFC 5545 3.1: at most 75 octets per line; continuations start with a space. Never splits a character. */
function fold(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let octets = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (octets + size > 75) {
      parts.push(current);
      current = " ";
      octets = 1;
    }
    current += char;
    octets += size;
  }
  parts.push(current);
  return parts.join("\r\n");
}

/** UK clocks: BST from 01:00 GMT on the last Sunday in March, GMT from 02:00 BST on the last Sunday in October. */
const EUROPE_LONDON = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/London",
  "BEGIN:DAYLIGHT",
  "TZNAME:BST",
  "TZOFFSETFROM:+0000",
  "TZOFFSETTO:+0100",
  "DTSTART:19700329T010000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZNAME:GMT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0000",
  "DTSTART:19701025T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
];

export function generateIcs({ payday, appUrl, now, tz }: IcsOptions): string {
  // The 29th is missing from most Februaries, so payday 28 settles on the 1st.
  const settleDay = payday >= 28 ? 1 : payday + 1;
  const month = now.getDate() > settleDay ? now.getMonth() + 1 : now.getMonth();
  const start = new Date(now.getFullYear(), month, settleDay);
  const dtstart = `${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}T090000`;
  // Only London has a VTIMEZONE here; elsewhere 09:00 floating local time is valid and right.
  const london = tz === "Europe/London";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Coffee Button//Reminder//EN",
    ...(london ? EUROPE_LONDON : []),
    "BEGIN:VEVENT",
    `UID:monthly-reminder-${hash(appUrl)}@coffee-button`,
    `DTSTAMP:${utcStamp(now)}`,
    london ? `DTSTART;TZID=Europe/London:${dtstart}` : `DTSTART:${dtstart}`,
    `RRULE:FREQ=MONTHLY;BYMONTHDAY=${settleDay}`,
    "SUMMARY:Coffee Button: invest",
    `DESCRIPTION:Settle day. Open ${appUrl} and invest what you saved.`,
    `URL:${appUrl}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
