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
import { goalArt, itemArt } from "./art/items";
import "./shelf.css";

export const SHELF_SCREEN = "shelf";
const TAP_MAX_MS = 500;
const SWIPE_PX = 60;
const PER_ROW = 3;

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
  const percent = Math.floor(entry.progress * 100);
  const status = entry.lit
    ? `<span class="shelf-badge"><span>You could now</span> <span>buy this</span></span>`
    : `<span class="shelf-bar" role="img" aria-label="${percent}% of the way">` +
      `<span style="width:${(entry.progress * 100).toFixed(1)}%"></span></span>`;
  return `
    <li class="shelf-item ${entry.lit ? "is-lit" : "art-off"}">
      <span class="shelf-art" aria-hidden="true">${isGoal ? goalArt() : itemArt(entry.id)}</span>
      <span class="shelf-name">${escapeHtml(entry.name)}</span>
      <span class="shelf-price">${formatPounds(entry.pricePence)}</span>
      ${status}
      ${isGoal ? `<button type="button" class="shelf-remove" data-goal="${entry.id}" aria-label="Remove ${escapeHtml(entry.name)}">×</button>` : ""}
    </li>`;
}

/** Entries three to a shelf; each row stands on its own tomato plank. */
function shelvesHtml(entries: string[]): string {
  let html = "";
  for (let i = 0; i < entries.length; i += PER_ROW) {
    html += `<ul class="shelf-row">${entries.slice(i, i + PER_ROW).join("")}</ul>`;
  }
  return html;
}

function mountShelf(el: HTMLElement, ctx: AppContext): () => void {
  el.innerHTML = `
    <section class="shelf-screen">
      <button type="button" class="shelf-back" data-role="back" aria-label="Back to the cup">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8 H20 L12 18Z"/></svg>
      </button>
      <p class="shelf-pace">
        <span class="shelf-pace-lead">At this rate you'll have</span>
        <span class="shelf-pace-figure" data-role="pace"></span>
        <span class="shelf-pace-tail">by December</span>
      </p>
      <p class="shelf-card" data-role="compound"></p>
      <p class="shelf-overdue" data-role="overdue" hidden></p>
      <div class="shelf" data-role="shelf"></div>
      <form class="goal-form" data-role="goal-form">
        <input name="name" placeholder="Goal" aria-label="Goal name" maxlength="40" required />
        <input name="price" placeholder="£" aria-label="Goal price" inputmode="decimal" required />
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
    const paceText = formatPounds(view.pacePence);
    pace.textContent = paceText;
    // 76px holds "£999.99" at 390px; longer figures step down so they stay on one line.
    pace.dataset.len = paceText.length > 9 ? "xl" : paceText.length > 7 ? "l" : "";
    compounded.textContent =
      `${formatPounds(view.lifetimePence)} at ${COMPOUND_RATE * 100}% for ${COMPOUND_YEARS} years ` +
      `is ${formatPounds(view.compoundedPence)}.`;
    overdue.hidden = view.overdueLine === null;
    overdue.textContent = view.overdueLine ?? "";
    shelf.innerHTML = shelvesHtml([
      ...view.goals.map((g) => entryHtml(g, true)),
      ...view.items.map((i) => entryHtml(i, false)),
    ]);
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

  const offSettle = ctx.bus.on("settle", () => {
    visitLine = undefined; // settled: nothing may be overdue any more
    void refresh();
  });
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

/**
 * Plain tap on the total or swipe up on the cup screen opens the shelf; swipe
 * down closes it. iOS turns a vertical drag into a native pan and sends
 * pointercancel instead of pointerup, so the end of a swipe is read from
 * touchend too (which still fires during a pan), and the cup screen sets
 * touch-action: none (style.css) so its drag is not a pan at all. On the
 * shelf, swipe down only counts from the top of the list; the Back arrow is
 * the main way back.
 */
function attachNavigation(ctx: AppContext): void {
  const screen = () => document.getElementById("app")?.dataset.screen;
  let downAt = 0;
  let startX = 0;
  let startY = 0;
  let swiped = false;

  const start = (x: number, y: number, at: number) => {
    downAt = at;
    startX = x;
    startY = y;
    swiped = false;
  };
  const end = (x: number, y: number) => {
    const dx = x - startX;
    const dy = y - startY;
    if (Math.abs(dy) < SWIPE_PX || Math.abs(dx) > Math.abs(dy)) return;
    if (dy < 0 && screen() === HOME_SCREEN) {
      swiped = true;
      ctx.show(SHELF_SCREEN);
    } else if (dy > 0 && screen() === SHELF_SCREEN && (document.scrollingElement?.scrollTop ?? 0) <= 0) {
      swiped = true;
      ctx.show(HOME_SCREEN);
    }
  };
  // Both families feed the same start/end; after a swipe the screen has changed,
  // so the second of a pointerup/touchend pair matches nothing.
  document.addEventListener("pointerdown", (e) => start(e.clientX, e.clientY, e.timeStamp));
  document.addEventListener("pointerup", (e) => end(e.clientX, e.clientY));
  document.addEventListener("touchstart", (e) => {
    const t = e.changedTouches[0];
    if (t) start(t.clientX, t.clientY, e.timeStamp);
  }, { passive: true });
  document.addEventListener("touchend", (e) => {
    const t = e.changedTouches[0];
    if (t) end(t.clientX, t.clientY);
  }, { passive: true });
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
