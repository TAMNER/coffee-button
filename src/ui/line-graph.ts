/**
 * Ticket 39: the savings graph under the plank as a plain line graph, Tom's
 * "Graph B" from round five of mockups/pictures-and-graph.html, ported as
 * drawn: the saved line with a pale fill, the invested staircase with a solid
 * fill, a money scale, dates, and a marker that follows a finger and reads out
 * that day. The numbers come from domain/line-graph.ts. Drawing and DOM glue:
 * not unit tested by decision.
 */
import type { LineGraph, LinePoint } from "../domain/line-graph";

const W = 358, H = 200, X0 = 40, X1 = 340, YT = 12, YB = 168;
const HINT = "Touch the graph to read any day.";

const f1 = (n: number) => n.toFixed(1);
const px = (x: number) => X0 + x * (X1 - X0);
const py = (v: number) => YB - v * (YB - YT);

/** Straight segments through every day. */
function linePath(points: LinePoint[]): string {
  return points.map((p, i) => `${i ? "L" : "M"}${f1(px(p.x))} ${f1(py(p.saved))}`).join(" ");
}
/** A staircase: the invested amount holds until the day it changes, then jumps. */
function stepPath(points: LinePoint[]): string {
  let d = `M${f1(px(points[0].x))} ${f1(py(points[0].invested))}`;
  for (let i = 1; i < points.length; i++) {
    if (points[i].invested !== points[i - 1].invested) d += ` H${f1(px(points[i].x))} V${f1(py(points[i].invested))}`;
  }
  return `${d} H${f1(px(points[points.length - 1].x))}`;
}
/** Close a line down to the baseline, for the fill under it. */
const closed = (d: string, points: LinePoint[]) => `${d} V${YB} H${f1(px(points[0].x))}Z`;

function svg(graph: LineGraph): string {
  const pts = graph.points;
  const last = pts[pts.length - 1];
  const scale = graph.yTicks
    .map(({ label, fraction }) => {
      const y = f1(py(fraction));
      return `<line class="${fraction ? "lg-grid" : "lg-base"}" x1="${X0}" x2="${X1}" y1="${y}" y2="${y}"/>` +
        `<text class="lg-tick" x="${X0 - 8}" y="${y}" dy="0.35em" text-anchor="end">${label}</text>`;
    })
    .join("");
  const ticks = graph.xTicks.map((x) => `<line class="lg-base" x1="${f1(px(x))}" x2="${f1(px(x))}" y1="${YB}" y2="${YB + 5}"/>`).join("");
  const dates = graph.xLabels
    .map(({ label, x }) => `<text class="lg-date" x="${f1(px(x))}" y="${YB + 19}" text-anchor="middle">${label}</text>`)
    .join("");
  const saved = linePath(pts);
  const invested = stepPath(pts);
  return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
  ${scale}${ticks}${dates}
  <path class="lg-area lg-area-saved" d="${closed(saved, pts)}"/>
  ${graph.hasInvested ? `<path class="lg-area lg-area-inv" d="${closed(invested, pts)}"/><path class="lg-line lg-line-inv" d="${invested}"/>` : ""}
  <path class="lg-line lg-line-saved" d="${saved}"/>
  <circle class="lg-dot lg-dot-saved" cx="${f1(px(last.x))}" cy="${f1(py(last.saved))}" r="4.5"/>
  <g data-role="marker" visibility="hidden">
    <line class="lg-cross" y1="${YT}" y2="${YB}"/>
    <circle class="lg-dot lg-dot-inv" r="4.5"/>
    <circle class="lg-dot lg-dot-saved" r="4.5"/>
  </g>
</svg>`;
}

/**
 * Draw the graph into its slot (empty and hidden before the first press) and
 * make it readable by touch: a finger or pointer on the plot moves a marker to
 * the nearest day and the line under the graph says that day's figures.
 */
export function renderLineGraph(slot: HTMLElement, graph: LineGraph | null): void {
  slot.hidden = graph === null;
  if (!graph) {
    slot.innerHTML = "";
    return;
  }
  slot.innerHTML = `<figure class="line-graph" role="img" aria-label="${graph.alt}">
    <div class="lg-labels" aria-hidden="true">
      <span class="lg-saved"><i class="lg-sw lg-sw-saved"></i>${graph.savedLabel}</span>
      <span class="lg-inv"><i class="lg-sw lg-sw-inv"></i>${graph.investedLabel}</span>
    </div>
    ${svg(graph)}
    <p class="lg-readout" aria-hidden="true">${HINT}</p>
  </figure>`;
  const plot = slot.querySelector<SVGSVGElement>("svg")!;
  const marker = plot.querySelector<SVGGElement>("[data-role=marker]")!;
  const readout = slot.querySelector<HTMLElement>(".lg-readout")!;
  const pts = graph.points;
  const read = (e: PointerEvent) => {
    const box = plot.getBoundingClientRect();
    const x = (((e.clientX - box.left) / box.width) * W - X0) / (X1 - X0);
    const p = pts.reduce((a, b) => (Math.abs(b.x - x) < Math.abs(a.x - x) ? b : a));
    const at = f1(px(p.x));
    marker.setAttribute("visibility", "visible");
    const [cross, inv, saved] = Array.from(marker.children);
    cross.setAttribute("x1", at);
    cross.setAttribute("x2", at);
    inv.setAttribute("cx", at);
    inv.setAttribute("cy", f1(py(p.invested)));
    inv.setAttribute("visibility", graph.hasInvested ? "inherit" : "hidden");
    saved.setAttribute("cx", at);
    saved.setAttribute("cy", f1(py(p.saved)));
    readout.textContent = p.readout;
  };
  plot.addEventListener("pointerdown", read);
  plot.addEventListener("pointermove", read);
  plot.addEventListener("pointerleave", () => {
    marker.setAttribute("visibility", "hidden");
    readout.textContent = HINT;
  });
}
