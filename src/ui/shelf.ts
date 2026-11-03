/**
 * Shelf screen ("the motivation screen"). Reached from the cup screen by a
 * plain tap on the total or a swipe up; swipe down or Back returns. Long press
 * on the total belongs to settings (ticket 05), so taps held longer than
 * TAP_MAX_MS are ignored here. Everything shown comes from domain/shelf.ts.
 */
import { formatPounds } from "../domain/money";
import {
  addGoal,
  COMPOUND_RATE,
  COMPOUND_YEARS,
  MAX_GOALS,
  removeGoal,
  setShelfPrice,
  shelfItems,
  shelfView,
  type ShelfEntry,
} from "../domain/shelf";
import { weeklyOverdueLine } from "../domain/settle";
import { HOME_SCREEN, onStart, registerScreen, registerSettingsSection, type AppContext } from "./app";
import "./shelf.css";

export const SHELF_SCREEN = "shelf";
const TAP_MAX_MS = 500;
const SWIPE_PX = 60;


/** Simple geometric stand-ins; ticket 10 replaces them with the chosen artwork. */
const SHAPES: Record<string, string> = {
  laptop: `<rect x="10" y="14" width="28" height="18" rx="2"/><rect x="6" y="32" width="36" height="4" rx="1"/>`,
  "ski-week": `<path d="M8 38 L24 10 L40 38 Z"/><path d="M18 22 L24 12 L30 22 Z" fill="#fff"/>`,
  "long-haul-flight": `<path d="M6 26 L42 22 L42 26 L6 30 Z"/><path d="M20 26 L28 12 L32 12 L28 26 Z"/><path d="M20 28 L28 40 L32 40 L28 28 Z"/>`,
  "used-car": `<rect x="6" y="22" width="36" height="10" rx="3"/><path d="M14 22 L18 14 H32 L36 22 Z"/><circle cx="14" cy="34" r="4"/><circle cx="34" cy="34" r="4"/>`,
  "espresso-machine": `<rect x="12" y="8" width="24" height="10" rx="2"/><rect x="14" y="18" width="20" height="20"/><rect x="20" y="28" width="8" height="6" fill="#fff"/>`,
  bike: `<circle cx="13" cy="30" r="8" fill="none" stroke-width="3"/><circle cx="35" cy="30" r="8" fill="none" stroke-width="3"/><path d="M13 30 L22 18 L35 30 M22 18 H30" fill="none" stroke-width="3"/>`,
  "weekend-away": `<rect x="10" y="16" width="28" height="22" rx="3"/><rect x="18" y="10" width="12" height="6" fill="none" stroke-width="3"/>`,
  phone: `<rect x="16" y="6" width="16" height="36" rx="3"/><rect x="18" y="10" width="12" height="26" fill="#fff"/>`,
  camera: `<rect x="8" y="16" width="32" height="22" rx="3"/><rect x="16" y="11" width="10" height="5"/><circle cx="24" cy="27" r="7" fill="#fff"/>`,
  "festival-ticket": `<path d="M6 16 H42 V22 A4 4 0 0 0 42 30 V36 H6 V30 A4 4 0 0 0 6 22 Z"/>`,
};
const GOAL_SHAPE = `<path d="M24 6 L29 19 L43 19 L32 28 L36 42 L24 34 L12 42 L16 28 L5 19 L19 19 Z"/>`;

function itemSvg(id: string): string {
  const shape = SHAPES[id] ?? GOAL_SHAPE;
  return `<svg class="shelf-icon" viewBox="0 0 48 48" aria-hidden="true" fill="currentColor" stroke="currentColor">${shape}</svg>`;
}

/** "3.80" or "£3.80" to 380; null when it is not a positive amount. */
function parsePence(text: string): number | null {
  const match = /^\s*£?\s*(\d+)(?:\.(\d{1,2}))?\s*$/.exec(text);
  if (!match) return null;
  const pence = Number(match[1]) * 100 + Number((match[2] ?? "0").padEnd(2, "0"));
  return pence > 0 ? pence : null;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function entryHtml(entry: ShelfEntry, isGoal: boolean): string {
  const caption = entry.lit ? "you could now buy this" : `${Math.floor(entry.progress * 100)}%`;
  return `
    <li class="shelf-item ${entry.lit ? "is-lit" : ""}">
      ${itemSvg(isGoal ? "" : entry.id)}
      <span class="shelf-name">${escapeHtml(entry.name)}</span>
      <span class="shelf-price">${formatPounds(entry.pricePence)}</span>
      <span class="shelf-bar"><span style="width:${(entry.progress * 100).toFixed(1)}%"></span></span>
      <span class="shelf-caption">${caption}</span>
      ${isGoal ? `<button type="button" class="shelf-remove" data-goal="${entry.id}" aria-label="Remove ${escapeHtml(entry.name)}">×</button>` : ""}
    </li>`;
}

function mountShelf(el: HTMLElement, ctx: AppContext): () => void {
  el.innerHTML = `
    <section class="shelf-screen">
      <button type="button" class="shelf-back" data-role="back" aria-label="Back to the cup">↓</button>
      <p class="shelf-line" data-role="pace"></p>
      <p class="shelf-line" data-role="compound"></p>
      <p class="shelf-line shelf-overdue" data-role="overdue" hidden></p>
      <ul class="shelf" data-role="shelf"></ul>
      <form class="goal-form" data-role="goal-form">
        <input name="name" placeholder="Goal" maxlength="40" required />
        <input name="price" placeholder="£" inputmode="decimal" required />
        <button type="submit">Add</button>
      </form>
    </section>`;
  const pace = el.querySelector<HTMLElement>("[data-role=pace]")!;
  const compounded = el.querySelector<HTMLElement>("[data-role=compound]")!;
  const overdue = el.querySelector<HTMLElement>("[data-role=overdue]")!;
  const shelf = el.querySelector<HTMLElement>("[data-role=shelf]")!;
  const form = el.querySelector<HTMLFormElement>("[data-role=goal-form]")!;

  let alive = true;
  // Asked once per visit: the weekly cadence counts visits, and a refresh after
  // adding a goal must not hide a line that is already showing.
  let visitLine: Promise<string | null> | undefined;
  const overdueLine = (now: Date) => (visitLine ??= weeklyOverdueLine(ctx.store, now));
  const refresh = async () => {
    const view = await shelfView({ store: ctx.store, ledger: ctx.ledger, now: ctx.clock.now(), overdueLine });
    if (!alive) return;
    pace.textContent = `At this rate you'll have ${formatPounds(view.pacePence)} by December.`;
    compounded.textContent =
      `${formatPounds(view.lifetimePence)} at ${COMPOUND_RATE * 100}% for ${COMPOUND_YEARS} years ` +
      `is ${formatPounds(view.compoundedPence)}.`;
    overdue.hidden = view.overdueLine === null;
    overdue.textContent = view.overdueLine ?? "";
    shelf.innerHTML =
      view.goals.map((g) => entryHtml(g, true)).join("") + view.items.map((i) => entryHtml(i, false)).join("");
    form.hidden = view.goals.length >= MAX_GOALS;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const price = parsePence(String(data.get("price") ?? ""));
    if (!name || price === null) return;
    try {
      await addGoal(ctx.store, name, price);
      form.reset();
    } catch {
      // Already three goals; the form is hidden on refresh.
    }
    await refresh();
  });

  shelf.addEventListener("click", async (e) => {
    const id = (e.target as Element).closest<HTMLElement>("[data-goal]")?.dataset.goal;
    if (!id) return;
    await removeGoal(ctx.store, id);
    await refresh();
  });

  el.querySelector("[data-role=back]")!.addEventListener("click", () => ctx.show(HOME_SCREEN));

  const offSettle = ctx.bus.on("settle", () => void refresh());
  void refresh();
  return () => {
    alive = false;
    offSettle();
  };
}

/** Shelf prices are edited in settings, one field per default item. */
async function mountShelfPrices(el: HTMLElement, ctx: AppContext): Promise<void> {
  const list = document.createElement("ul");
  list.className = "shelf-prices";
  el.append(list);
  for (const item of await shelfItems(ctx.store)) {
    const row = document.createElement("li");
    const label = document.createElement("label");
    label.textContent = item.name;
    const input = document.createElement("input");
    input.inputMode = "decimal";
    input.value = formatPounds(item.pricePence).replace("£", "");
    input.addEventListener("change", async () => {
      const pence = parsePence(input.value);
      if (pence === null) {
        input.value = formatPounds(item.pricePence).replace("£", "");
        return;
      }
      item.pricePence = pence;
      await setShelfPrice(ctx.store, item.id, pence);
    });
    label.append(input);
    row.append(label);
    list.append(row);
  }
}

/** Plain tap on the total or swipe up on the cup screen opens the shelf; swipe down closes it. */
function attachNavigation(ctx: AppContext): void {
  const screen = () => document.getElementById("app")?.dataset.screen;
  let downAt = 0;
  let startX = 0;
  let startY = 0;
  let swiped = false;

  document.addEventListener("pointerdown", (e) => {
    downAt = e.timeStamp;
    startX = e.clientX;
    startY = e.clientY;
    swiped = false;
  });
  document.addEventListener("pointerup", (e) => {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dy) < SWIPE_PX || Math.abs(dx) > Math.abs(dy)) return;
    if (dy < 0 && screen() === HOME_SCREEN) {
      swiped = true;
      ctx.show(SHELF_SCREEN);
    } else if (dy > 0 && screen() === SHELF_SCREEN) {
      swiped = true;
      ctx.show(HOME_SCREEN);
    }
  });
  // Capture phase: a swipe that started on the cup must not also count as a press.
  document.addEventListener(
    "click",
    (e) => {
      if (swiped) {
        swiped = false;
        e.stopPropagation();
        e.preventDefault();
        return;
      }
      if (screen() !== HOME_SCREEN) return;
      if (!(e.target as Element | null)?.closest("[data-role=total]")) return;
      if (e.timeStamp - downAt > TAP_MAX_MS) return; // long press: settings
      ctx.show(SHELF_SCREEN);
    },
    true,
  );
}

registerScreen(SHELF_SCREEN, mountShelf);
registerSettingsSection("Shelf prices", (el, ctx) => void mountShelfPrices(el, ctx));
onStart(attachNavigation);
