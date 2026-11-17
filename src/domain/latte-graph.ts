/**
 * Ticket 33: the latte graph on the shelf, as numbers. Seven glasses, oldest
 * first; each carries the running totals at the end of its share of the days.
 * Built on savingsSeries (ticket 32), whose days are local calendar days.
 */
import { formatPoundsShort } from "./money";
import type { SavingsSeries } from "./savings-series";

/** One glass: the local days it covers ("YYYY-MM-DD", both counted) and the running totals at the end of `to`. */
export interface GlassPeriod {
  from: string;
  to: string;
  savedPence: number;
  investedPence: number;
  /** A day that has not happened yet (first week only): drawn as an empty glass. */
  future?: boolean;
}

/** The row always holds exactly this many glasses (and never more). */
export const MAX_GLASSES = 7;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The "YYYY-MM-DD" label `k` days after `day`. */
const addDays = (day: string, k: number) =>
  new Date(Date.parse(`${day}T00:00:00Z`) + k * DAY_MS).toISOString().slice(0, 10);

/**
 * Always seven glasses, starting on the first press day. Within the first
 * week, one glass a day, the glasses after today being days not yet come
 * (`future`, empty). From seven days on, the days from the first press to
 * today are shared out evenly in order, floor(n/7) days each, the oldest
 * n mod 7 glasses taking one extra. Each glass carries the running totals at
 * the end of its last day.
 */
export function glassPeriods(series: SavingsSeries): GlassPeriod[] {
  const first = Math.max(0, series.days.findIndex((d) => d.savedPence > 0));
  const days = series.days.slice(first);
  if (days.length === 0) return [];
  if (days.length < MAX_GLASSES) {
    const today = days[days.length - 1].day;
    return [
      ...days.map((d) => ({ from: d.day, to: d.day, savedPence: d.savedPence, investedPence: d.investedPence })),
      ...Array.from({ length: MAX_GLASSES - days.length }, (_, k) => {
        const day = addDays(today, k + 1);
        return { from: day, to: day, savedPence: 0, investedPence: 0, future: true };
      }),
    ];
  }
  const base = Math.floor(days.length / MAX_GLASSES);
  const extra = days.length % MAX_GLASSES;
  const out: GlassPeriod[] = [];
  let start = 0;
  for (let i = 0; i < MAX_GLASSES; i++) {
    const end = start + base + (i < extra ? 1 : 0) - 1;
    const last = days[end];
    out.push({ from: days[start].day, to: last.day, savedPence: last.savedPence, investedPence: last.investedPence });
    start = end + 1;
  }
  return out;
}

/** Everything the latte graph shows, ready to render. */
export interface LatteGraph {
  glasses: GlassPeriod[];
  /** "£381.30 saved": today's total. */
  savedLabel: string;
  /** "£0 invested" until the first invest. */
  investedLabel: string;
  /** Under the tray, left: the first glass's month, "Jun". */
  firstLabel: string;
  /** Under the tray, right. */
  lastLabel: string;
  /** The text alternative: the two figures. */
  alt: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** The graph from the savings series; null before the first press (the shelf shows its hint instead). */
export function latteGraph(series: SavingsSeries): LatteGraph | null {
  if (series.days.length === 0) return null;
  const glasses = glassPeriods(series);
  const savedLabel = `${formatPoundsShort(series.savedPence)} saved`;
  const investedLabel = `${formatPoundsShort(series.investedPence)} invested`;
  return {
    glasses,
    savedLabel,
    investedLabel,
    firstLabel: MONTHS[Number(glasses[0].from.slice(5, 7)) - 1],
    lastLabel: "today",
    alt: `Savings over time: ${savedLabel}, ${investedLabel}.`,
  };
}

/** How high each layer stands in a glass whose drink can reach `height`; they stack coffee, latte, froth from the bottom. */
export interface GlassFill {
  /** The froth top: saved by then over today's total. */
  savedHeight: number;
  frothHeight: number;
  latteHeight: number;
  coffeeHeight: number;
}

/**
 * The froth top marks the total saved by the end of the period, against
 * today's total; under the froth, invested (coffee, at the bottom) and still
 * waiting (latte) split in proportion, so the froth never hides the latte.
 */
export function glassFill(
  glass: Pick<GlassPeriod, "savedPence" | "investedPence">,
  todayPence: number,
  height: number,
  froth: number,
): GlassFill {
  if (glass.savedPence <= 0 || todayPence <= 0) return { savedHeight: 0, frothHeight: 0, latteHeight: 0, coffeeHeight: 0 };
  const savedHeight = (glass.savedPence / todayPence) * height;
  const frothHeight = Math.min(froth, savedHeight);
  const under = savedHeight - frothHeight;
  const coffeeHeight = (glass.investedPence / glass.savedPence) * under;
  return { savedHeight, frothHeight, latteHeight: under - coffeeHeight, coffeeHeight };
}
