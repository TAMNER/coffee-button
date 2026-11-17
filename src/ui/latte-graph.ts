/**
 * Ticket 33: the latte graph under the plank, Tom's "Graph 1" from
 * mockups/pictures-and-graph.html (graph1 with its tumbler, drink and steam
 * helpers), ported as drawn. One glass per period on a cobalt tray; the
 * numbers come from domain/latte-graph.ts. Art and DOM glue: not unit tested
 * by decision.
 *
 * The pour-in: each glass's drink sits in its own group, clipped to the
 * glass, and rises from below the foot once (CSS in shelf.css), staggered
 * left to right. Only under prefers-reduced-motion: no-preference; otherwise
 * the glasses simply appear full.
 */
import { glassFill, type LatteGraph } from "../domain/latte-graph";

const f1 = (n: number) => n.toFixed(1);
let uid = 0;

/** Steam: three curling wisps rising from (cx, y0), the middle one tallest. Cream with a paper-2 offset shadow. */
function steam(cx: number, y0: number, k = 1): string {
  const wisps: [number, number, number, number][] = [[-11, 26, 1, 0.1], [0, 38, -1, 0], [11, 30, 1, 0.35]];
  const paths = wisps
    .map(([dx, h, dir, ph]) => {
      const pts: string[] = [];
      const x = cx + dx * k;
      const hh = h * k;
      const amp = 4.2 * k;
      for (let t = 0; t <= 1.0001; t += 0.04) {
        const a = amp * (0.5 + 0.5 * t);
        pts.push(`${f1(x + dir * a * Math.sin(2 * Math.PI * (0.85 * t + ph)))} ${f1(y0 - hh * t)}`);
      }
      return `M${pts.join(" L")}`;
    })
    .join(" ");
  const w = f1(4.6 * k);
  return `<g class="lg-steam"><g class="steam-sh" transform="translate(3 3)"><path stroke-width="${w}" d="${paths}"/></g>` +
    `<g class="steam"><path stroke-width="${w}" d="${paths}"/></g></g>`;
}

/** A tumbler: straight sides tapering in towards the foot, rounded foot corners. */
function tumbler(xc: number, yT: number, yB: number, wT: number, wB: number, r: number): string {
  const lt = xc - wT / 2, rt = xc + wT / 2, lb = xc - wB / 2, rb = xc + wB / 2;
  return `M${f1(lt)} ${f1(yT)} H${f1(rt)} L${f1(rb)} ${f1(yB - r)} Q${f1(rb)} ${f1(yB)} ${f1(rb - r)} ${f1(yB)} H${f1(lb + r)} Q${f1(lb)} ${f1(yB)} ${f1(lb)} ${f1(yB - r)}Z`;
}

/**
 * The drink in one column from x to x+w, standing on yBottom: coffee at the
 * bottom, latte over it, a froth band on top with round bubbles hanging off
 * it like the real cup's foam. Heights come from glassFill.
 */
function drink(x: number, w: number, yBottom: number, fill: ReturnType<typeof glassFill>, froth: number, bub: number): string {
  if (fill.savedHeight <= 0) return "";
  const ySaved = yBottom - fill.savedHeight;
  const ft = fill.frothHeight;
  let out = `<rect class="cp-latte" x="${f1(x)}" y="${f1(ySaved)}" width="${f1(w)}" height="${f1(fill.savedHeight + 20)}"/>`;
  if (fill.coffeeHeight > 0) {
    out += `<rect class="cp-coffee" x="${f1(x)}" y="${f1(yBottom - fill.coffeeHeight)}" width="${f1(w)}" height="${f1(fill.coffeeHeight + 20)}"/>`;
  }
  out += `<rect class="cp-foam" x="${f1(x)}" y="${f1(ySaved)}" width="${f1(w)}" height="${f1(ft)}"/>`;
  if (fill.savedHeight > froth + bub * 2) {
    const n = w > 60 ? 4 : w > 28 ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const cx = x + w * ((i + 0.5) / n) + (i % 2 ? 2 : -2);
      const r = bub * (i % 2 ? 0.8 : 1.1);
      out += `<circle class="cp-foam" cx="${f1(cx)}" cy="${f1(ySaved + ft - 0.5)}" r="${f1(r)}"/>`;
    }
  }
  return out;
}

/** The row of glasses on the cobalt tray, as in the mockup's graph1. */
function glassesSvg(graph: LatteGraph): string {
  const W = 358, H = 200, FROTH = 8, BUB = 3;
  const list = graph.glasses;
  const n = list.length;
  // Today's glass is the full one; in the first week the glasses after it are days not yet come, drawn empty.
  const today = list[graph.todayIndex].savedPence;
  const trayY = H - 18, yT = 58, yB = trayY;
  const x0 = 6, x1 = 340, pitch = (x1 - x0) / n;
  const wT = Math.min(44, pitch * 0.72), wB = wT * 0.84;
  const ib = yB - 9, ut = yT + 8;
  let shadow = "";
  let glasses = "";
  list.forEach((glass, i) => {
    const xc = x0 + pitch * (i + 0.5);
    const fill = glassFill(glass, today, ib - ut, FROTH);
    const body = tumbler(xc, yT, yB, wT, wB, 7);
    const rim = `<rect class="cp-cobalt" x="${f1(xc - wT / 2 - 3)}" y="${yT - 6}" width="${f1(wT + 6)}" height="9" rx="4.5"/>`;
    const id = `lg-clip-${++uid}`;
    // A glint on the glass, only over the drink and below the froth.
    const hl = Math.min((yB - yT) * 0.5, ib - 6 - (ib - fill.savedHeight + 14));
    shadow += `<path d="${body}"/>${rim}`;
    glasses += `<path class="cp-cream" d="${body}"/>
      <defs><clipPath id="${id}"><path d="${tumbler(xc, yT, ib, wT - 7, wB - 7, 5)}"/></clipPath></defs>
      <g clip-path="url(#${id})"><g class="lg-drink" style="--i:${i}">${drink(xc - wT / 2, wT, ib, fill, FROTH, BUB)}</g></g>
      ${hl > 10 ? `<rect class="cp-cream" x="${f1(xc - wT / 2 + 7)}" y="${f1(ib - 6 - hl)}" width="3.5" height="${f1(hl)}" rx="1.75" opacity="0.55"/>` : ""}
      ${rim}`;
  });
  const todayX = x0 + pitch * (graph.todayIndex + 0.5);
  // --n: how many glasses pour, so the steam waits for the last of them.
  return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true" style="--n:${graph.todayIndex + 1}">
  <g class="cp-shadow" transform="translate(5 5)">${shadow}<rect x="0" y="${trayY}" width="${W - 12}" height="12" rx="6"/></g>
  <rect class="cp-cobalt" x="0" y="${trayY}" width="${W - 12}" height="12" rx="6"/>
  ${glasses}
  ${steam(todayX, yT - 12, 1)}
</svg>`;
}

/**
 * The whole graph: the two labels above, the glasses, the first glass's
 * month and "today" under the tray. One text alternative for all of it.
 * `pour` adds the class that plays the pour-in (once per opening of the shelf).
 */
export function latteGraphHtml(graph: LatteGraph, pour: boolean): string {
  return `<figure class="latte-graph${pour ? " is-pouring" : ""}" role="img" aria-label="${graph.alt}">
    <div class="lg-labels" aria-hidden="true">
      <span class="lg-saved"><i class="lg-sw lg-sw-saved"></i>${graph.savedLabel}</span>
      <span class="lg-inv"><i class="lg-sw lg-sw-inv"></i>${graph.investedLabel}</span>
    </div>
    ${glassesSvg(graph)}
    <div class="lg-ends" aria-hidden="true"><span>${graph.firstLabel}</span><span>${graph.lastLabel}</span></div>
  </figure>`;
}
