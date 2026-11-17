import { describe, expect, it } from "vitest";
import { parsePretendDate } from "./pretend";

describe("parsePretendDate", () => {
  it('reads "2026-11-26" (what a date field gives) as 26 November 2026, local midnight', () => {
    expect(parsePretendDate("2026-11-26")).toEqual(new Date(2026, 10, 26));
  });

  it.each([null, undefined, "", "  ", "hello", "2026-02-30", "2026-13-01", "2026-11-00", "26/11/2026", "2026-11-26T09:00"])(
    "rejects %j, which is not a real date",
    (raw) => {
      expect(parsePretendDate(raw)).toBeNull();
    },
  );
});
