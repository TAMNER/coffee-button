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
}

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
  return {
    savedLabel,
    investedLabel,
    hasInvested: series.investedPence > 0,
    alt: `Savings over time: ${savedLabel}, ${investedLabel}.`,
    yTicks,
  };
}
