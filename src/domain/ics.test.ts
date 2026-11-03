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
});
