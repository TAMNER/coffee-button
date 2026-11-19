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
  /** Tick marks along the bottom, as fractions across. */
  xTicks: number[];
  /** Dates or month names along the bottom, each centred on its fraction across. */
  xLabels: { label: string; x: number }[];
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
const DAY_MS = 24 * 60 * 60 * 1000;
/** The "YYYY-MM-DD" label `k` days after `day`. */
const addDays = (day: string, k: number) => new Date(Date.parse(`${day}T00:00:00Z`) + k * DAY_MS).toISOString().slice(0, 10);
/** Longer than this and the bottom shows months, not dates. */
const MAX_DATED_DAYS = 62;
/** A month's stretch narrower than this share of the plot gets no name. */
const MIN_MONTH_WIDTH = 0.07;
const MAX_MONTH_NAMES = 8;

/**
 * The bottom axis for `n` days starting on `first`, on a plot `span` days
 * wide. A week or less: every day of the span. Up to two months: at most six
 * dates stepping back evenly from today. Longer: month starts and names.
 */
function xAxis(first: string, n: number, span: number): Pick<LineGraph, "xTicks" | "xLabels"> {
  const at = (i: number) => i / (span - 1);
  const dated = (i: number) => ({ label: i === n - 1 ? "today" : dayMonth(addDays(first, i)), x: at(i) });
  if (n <= MAX_DATED_DAYS) {
    const step = n <= MIN_SPAN_DAYS ? 1 : Math.ceil((n - 1) / 5);
    const days: number[] = [];
    for (let i = n <= MIN_SPAN_DAYS ? span - 1 : n - 1; i >= 0; i -= step) days.unshift(i);
    return { xTicks: days.map(at), xLabels: days.map(dated) };
  }
  const starts: number[] = [];
  for (let i = 1; i < n; i++) if (addDays(first, i).endsWith("-01")) starts.push(i);
  const edges = [0, ...starts, n - 1];
  const names = edges.slice(0, -1).map((from, k) => ({
    label: MONTHS[Number(addDays(first, from).slice(5, 7)) - 1],
    x: (at(from) + at(edges[k + 1])) / 2,
    width: at(edges[k + 1]) - at(from),
  }));
  const every = Math.ceil(names.length / MAX_MONTH_NAMES);
  return {
    xTicks: starts.map(at),
    xLabels: names
      .filter((m, k) => (names.length - 1 - k) % every === 0 && (every > 1 || m.width >= MIN_MONTH_WIDTH))
      .map(({ label, x }) => ({ label, x })),
  };
}

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
    ...xAxis(days[0].day, days.length, span),
    points,
    savedLabel,
    investedLabel,
    hasInvested: series.investedPence > 0,
    alt: `Savings over time: ${savedLabel}, ${investedLabel}.`,
    yTicks,
  };
}
