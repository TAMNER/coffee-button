import { describe, expect, it } from "vitest";
import { generateIcs } from "./ics";

const appUrl = "https://black-box.tail1234.ts.net/";

describe("generateIcs", () => {
  it("payday 25 on 3 Nov 2026: monthly 'Coffee Button: invest' on the 26th from 26 Nov 2026 09:00 London, linking to the app", () => {
    const ics = generateIcs({ payday: 25, appUrl, now: new Date(2026, 10, 3, 10, 0), tz: "Europe/London" });
    const lines = ics.split("\r\n");

    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines).toContain("BEGIN:VEVENT");
    expect(lines).toContain("END:VEVENT");
    expect(lines).toContain("SUMMARY:Coffee Button: invest");
    expect(lines).toContain("URL:https://black-box.tail1234.ts.net/");
    expect(lines.find((l) => l.startsWith("DESCRIPTION:"))).toContain("https://black-box.tail1234.ts.net/");
    expect(lines).toContain("RRULE:FREQ=MONTHLY;BYMONTHDAY=26");
    expect(lines).toContain("DTSTART;TZID=Europe/London:20261126T090000");
  });

  it("the description never says settle day (ticket 24): it reads 'Open <app> and invest what you saved.'", () => {
    const unfolded = generateIcs({ payday: 25, appUrl, now: new Date(2026, 10, 3, 10, 0), tz: "Europe/London" })
      .replace(/\r\n /g, "")
      .split("\r\n");

    expect(unfolded).toContain(`DESCRIPTION:Open ${appUrl} and invest what you saved.`);
  });

  it("is identical for identical input, with a UID tied to the app URL so re-adding updates rather than duplicates", () => {
    const options = { payday: 25, appUrl, now: new Date(2026, 10, 3, 10, 0), tz: "Europe/London" };
    const first = generateIcs(options);
    const uid = (ics: string) => ics.split("\r\n").find((l) => l.startsWith("UID:"));

    expect(generateIcs({ ...options })).toBe(first);
    expect(uid(first)).toMatch(/^UID:\S+$/);
    expect(uid(generateIcs({ ...options, payday: 20, now: new Date(2027, 0, 9, 8, 0) }))).toBe(uid(first));
    expect(uid(generateIcs({ ...options, appUrl: "https://elsewhere.example/" }))).not.toBe(uid(first));
  });

  it("starts next month when this month's settle day has passed: 27 Nov 2026 -> 26 Dec 2026", () => {
    const ics = generateIcs({ payday: 25, appUrl, now: new Date(2026, 10, 27, 10, 0), tz: "Europe/London" });

    expect(ics.split("\r\n")).toContain("DTSTART;TZID=Europe/London:20261226T090000");
  });

  it("on the settle day itself (26 Nov 2026, 10:00) the series starts that day, 26 Nov 09:00, already past", () => {
    const ics = generateIcs({ payday: 25, appUrl, now: new Date(2026, 10, 26, 10, 0), tz: "Europe/London" });

    expect(ics.split("\r\n")).toContain("DTSTART;TZID=Europe/London:20261126T090000");
  });

  it("payday 28 settles on the 1st of the next month, never the 29th, so February is not skipped", () => {
    const lines = generateIcs({ payday: 28, appUrl, now: new Date(2026, 10, 3, 10, 0), tz: "Europe/London" }).split("\r\n");

    expect(lines).toContain("RRULE:FREQ=MONTHLY;BYMONTHDAY=1");
    expect(lines).toContain("DTSTART;TZID=Europe/London:20261201T090000");
  });

  it("ends every line with CRLF and folds lines longer than 75 octets, losing nothing", () => {
    const longUrl = "https://black-box.tail1234.ts.net/coffee-button/a/very/long/path/that/goes/on/and/on/?ref=calendar";
    const ics = generateIcs({ payday: 25, appUrl: longUrl, now: new Date(2026, 10, 3, 10, 0), tz: "Europe/London" });

    expect(ics.endsWith("\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
    const lines = ics.slice(0, -2).split("\r\n");
    for (const line of lines) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    const unfolded = ics.replace(/\r\n /g, "").split("\r\n");
    expect(unfolded).toContain(`URL:${longUrl}`);
  });

  it("defines Europe/London in a VTIMEZONE: GMT, and BST from the last Sunday in March to the last Sunday in October", () => {
    const ics = generateIcs({ payday: 25, appUrl, now: new Date(2026, 10, 3, 10, 0), tz: "Europe/London" });
    const tz = ics.slice(ics.indexOf("BEGIN:VTIMEZONE"), ics.indexOf("END:VTIMEZONE"));

    expect(ics.indexOf("BEGIN:VTIMEZONE")).toBeLessThan(ics.indexOf("BEGIN:VEVENT"));
    expect(tz).toContain("TZID:Europe/London\r\n");
    expect(tz).toContain("BEGIN:DAYLIGHT\r\n");
    expect(tz).toContain("TZOFFSETFROM:+0000\r\nTZOFFSETTO:+0100\r\n");
    // 29 Mar 1970 and 25 Oct 1970 were the last Sundays of those months.
    expect(tz).toContain("DTSTART:19700329T010000\r\n");
    expect(tz).toContain("RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU\r\n");
    expect(tz).toContain("BEGIN:STANDARD\r\n");
    expect(tz).toContain("TZOFFSETFROM:+0100\r\nTZOFFSETTO:+0000\r\n");
    expect(tz).toContain("DTSTART:19701025T020000\r\n");
    expect(tz).toContain("RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU\r\n");
  });

  it("outside London uses 09:00 floating local time and no VTIMEZONE: New York, payday 25 -> DTSTART:20261126T090000", () => {
    const ics = generateIcs({ payday: 25, appUrl, now: new Date(2026, 10, 3, 10, 0), tz: "America/New_York" });

    expect(ics.split("\r\n")).toContain("DTSTART:20261126T090000");
    expect(ics).not.toContain("TZID");
    expect(ics).not.toContain("VTIMEZONE");
  });
});
