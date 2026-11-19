/**
 * Ticket 39: the savings graph on the shelf as a plain line graph, as numbers.
 * Tom's "Graph B" from round five of mockups/pictures-and-graph.html: a saved
 * line and an invested staircase, filled underneath. Built on savingsSeries
 * (ticket 32). Every position is a fraction of the plot, so the drawing code
 * only scales.
 */
import { formatPoundsShort } from "./money";
import type { SavingsSeries } from "./savings-series";

/** Everything the line graph shows, ready to draw. */
export interface LineGraph {
  /** "£381.30 saved": today's total. */
  savedLabel: string;
  /** "£0 invested" until the first invest. */
  investedLabel: string;
  /** False until the first invest: no invested line is drawn. */
  hasInvested: boolean;
  /** The text alternative: the two figures. */
  alt: string;
  /** The money scale: a label at each fraction of the plot's height, from £0 up. */
  yTicks: { label: string; fraction: number }[];
  /** One per day from the first press to today, oldest first. */
  points: LinePoint[];
}

/** One day on the lines: across (0 the first press day, 1 the right edge) and up (fractions of the money scale). */
export interface LinePoint {
  x: number;
  saved: number;
  invested: number;
  /** What a finger on this day reads: "13 Sep: £243.80 saved, £187.10 invested". */
  readout: string;
}

/** The plot is never narrower than this many days, so the first week fills in from the left. */
export const MIN_SPAN_DAYS = 7;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "12 Jun" from "2026-06-12". */
const dayMonth = (day: string) => `${Number(day.slice(8, 10))} ${MONTHS[Number(day.slice(5, 7)) - 1]}`;

/** The largest round step that keeps the scale to at most five lines: 1, 2, 2.5 or 5 times a power of ten (never half a penny). */
function scaleStep(maxPence: number): number {
  for (let pow = 1; ; pow *= 10) {
    for (const m of [1, 2, 2.5, 5]) {
      const step = m * pow;
      if (Number.isInteger(step) && maxPence / step <= 4) return step;
    }
  }
}

/** The graph from the savings series; null before the first press (the shelf shows its hint instead). */
export function lineGraph(series: SavingsSeries): LineGraph | null {
  if (series.days.length === 0) return null;
  const savedLabel = `${formatPoundsShort(series.savedPence)} saved`;
  const investedLabel = `${formatPoundsShort(series.investedPence)} invested`;
  const step = scaleStep(series.savedPence);
  const top = Math.max(step, Math.ceil(series.savedPence / step) * step);
  const yTicks = [];
  for (let v = 0; v <= top; v += step) yTicks.push({ label: formatPoundsShort(v), fraction: v / top });
  // The series reaches back a week before a recent first press; the graph starts on the press.
  const days = series.days.slice(Math.max(0, series.days.findIndex((d) => d.savedPence > 0)));
  const span = Math.max(MIN_SPAN_DAYS, days.length);
  const points = days.map((d, i) => ({
    x: i / (span - 1),
    saved: d.savedPence / top,
    invested: d.investedPence / top,
    readout: `${i === days.length - 1 ? "Today" : dayMonth(d.day)}: ${formatPoundsShort(d.savedPence)} saved, ${formatPoundsShort(d.investedPence)} invested`,
  }));
  return {
    points,
    savedLabel,
    investedLabel,
    hasInvested: series.investedPence > 0,
    alt: `Savings over time: ${savedLabel}, ${investedLabel}.`,
    yTicks,
  };
}
