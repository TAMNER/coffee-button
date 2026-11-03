/**
 * Settings screen. Opened by a 600 ms long press on the month total under the
 * cup (the cup exposes it as [data-role=total]); the main screen has no other
 * settings affordance. Renders every section in the app's settings-section
 * registry; Items, Payday and Data are registered here.
 */
import { browserDownloader } from "../adapters/download";
import { formatPounds } from "../domain/money";
import {
  addItem,
  exportData,
  importData,
  renameItem,
  repriceItem,
  setPayday,
} from "../domain/settings";
import {
  HOME_SCREEN,
  onStart,
  registerScreen,
  registerSettingsSection,
  settingsSections,
  type AppContext,
} from "./app";
import "./settings.css";

export const LONG_PRESS_MS = 600;
const MOVE_TOLERANCE_PX = 10;

/** Long press on the total opens settings. Delegated, so it survives cup re-renders. */
function attachLongPress(ctx: AppContext): void {
  let timer: number | undefined;
  let swallowClick = false;
  let startX = 0;
  let startY = 0;
  const cancel = () => {
    window.clearTimeout(timer);
    timer = undefined;
  };
  document.addEventListener("pointerdown", (e) => {
    swallowClick = false;
    const target = e.target as Element | null;
    if (!target?.closest("[data-role=total]")) return;
    startX = e.clientX;
    startY = e.clientY;
    cancel();
    timer = window.setTimeout(() => {
      timer = undefined;
      swallowClick = true;
      ctx.show("settings");
    }, LONG_PRESS_MS);
  });
  document.addEventListener("pointermove", (e) => {
    if (timer === undefined) return;
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > MOVE_TOLERANCE_PX) cancel();
  });
  document.addEventListener("pointerup", cancel);
  // On iOS the click from the same finger lift lands on whatever Settings
  // control is now under it; swallow that one click (capture phase). A new
  // touch clears the flag, so a later real tap is never eaten.
  document.addEventListener(
    "click",
    (e) => {
      if (!swallowClick) return;
      swallowClick = false;
      e.stopPropagation();
      e.preventDefault();
    },
    true,
  );
  document.addEventListener("pointercancel", cancel);
  document.addEventListener("contextmenu", (e) => {
    if ((e.target as Element | null)?.closest("[data-role=total]")) e.preventDefault();
  });
}

/** "3.80" or "£3.80" to 380; null when it is not a positive amount. */
function parsePence(text: string): number | null {
  const match = /^\s*£?\s*(\d+)(?:\.(\d{1,2}))?\s*$/.exec(text);
  if (!match) return null;
  const pence = Number(match[1]) * 100 + Number((match[2] ?? "0").padEnd(2, "0"));
  return pence > 0 ? pence : null;
}

function poundsField(pence: number): string {
  return formatPounds(pence).replace("£", "");
}

function status(el: HTMLElement): (text: string, isError?: boolean) => void {
  const line = document.createElement("p");
  line.className = "settings-status";
  line.setAttribute("aria-live", "polite");
  el.append(line);
  return (text, isError = false) => {
    line.textContent = text;
    line.classList.toggle("is-error", isError);
  };
}

function mountItems(el: HTMLElement, ctx: AppContext): void {
  const list = document.createElement("ul");
  list.className = "settings-items";
  const form = document.createElement("form");
  form.className = "settings-row";
  form.innerHTML = `
    <input name="icon" aria-label="Icon" placeholder="Icon" size="4" />
    <input name="name" aria-label="Name" placeholder="New item" required />
    <input name="price" aria-label="Price in pounds" placeholder="0.00" inputmode="decimal" size="5" required />
    <button type="submit">Add</button>`;
  el.append(list, form);
  const say = status(el);

  const render = async () => {
    const items = await ctx.ledger.items();
    list.replaceChildren(
      ...items.map((item) => {
        const li = document.createElement("li");
        li.className = "settings-row";
        li.innerHTML = `
          <span class="settings-icon"></span>
          <input name="name" aria-label="Name" />
          <span>£</span><input name="price" aria-label="Price in pounds" inputmode="decimal" size="5" />`;
        li.querySelector(".settings-icon")!.textContent = item.icon;
        const name = li.querySelector<HTMLInputElement>("[name=name]")!;
        const price = li.querySelector<HTMLInputElement>("[name=price]")!;
        name.value = item.name;
        price.value = poundsField(item.pricePence);
        name.addEventListener("change", async () => {
          const next = name.value.trim();
          if (!next) return say("A name cannot be empty.", true);
          await renameItem(ctx.store, item.id, next);
          say(`Renamed to ${next}.`);
        });
        price.addEventListener("change", async () => {
          const pence = parsePence(price.value);
          if (pence === null) return say("Price must be an amount like 3.80.", true);
          await repriceItem(ctx.store, item.id, pence);
          price.value = poundsField(pence);
          say(`${name.value} is now ${formatPounds(pence)}. Earlier presses keep their price.`);
        });
        return li;
      }),
    );
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const name = String(data.get("name")).trim();
    const pence = parsePence(String(data.get("price")));
    if (!name) return say("A name cannot be empty.", true);
    if (pence === null) return say("Price must be an amount like 6.00.", true);
    const icon = String(data.get("icon")).trim() || "cup";
    await addItem(ctx.store, name, pence, icon);
    form.reset();
    say(`Added ${name} at ${formatPounds(pence)}.`);
    await render();
  });

  void render();
}

function mountPayday(el: HTMLElement, ctx: AppContext): void {
  el.insertAdjacentHTML(
    "beforeend",
    `<label class="settings-row">Day of month
       <input name="payday" type="number" min="1" max="28" step="1" inputmode="numeric" size="3" />
     </label>`,
  );
  const input = el.querySelector<HTMLInputElement>("[name=payday]")!;
  const say = status(el);
  void ctx.store.getSettings().then((s) => (input.value = String(s.paydayDay)));
  input.addEventListener("change", async () => {
    try {
      await setPayday(ctx.store, Number(input.value));
      say(`Payday is the ${input.value}; settle day is the day after.`);
    } catch {
      say("Payday must be a day from 1 to 28.", true);
      input.value = String((await ctx.store.getSettings()).paydayDay);
    }
  });
}

function mountData(el: HTMLElement, ctx: AppContext): void {
  el.insertAdjacentHTML(
    "beforeend",
    `<div class="settings-row">
       <button type="button" data-role="export">Export</button>
       <label class="settings-file">Import<input type="file" accept="application/json,.json" data-role="import" /></label>
     </div>`,
  );
  const say = status(el);
  el.querySelector("[data-role=export]")!.addEventListener("click", async () => {
    const day = ctx.clock.now().toISOString().slice(0, 10);
    browserDownloader.download(`coffee-button-${day}.json`, await exportData(ctx.store), "application/json");
    say("Exported.");
  });
  const file = el.querySelector<HTMLInputElement>("[data-role=import]")!;
  file.addEventListener("change", async () => {
    const chosen = file.files?.[0];
    file.value = "";
    if (!chosen) return;
    if (!window.confirm("Replace everything in the app with this file?")) return;
    try {
      await importData(ctx.store, await chosen.text());
      say("Imported. Everything is back.");
    } catch (err) {
      say(err instanceof Error ? err.message : "Import failed.", true);
    }
  });
}

function mountSettings(el: HTMLElement, ctx: AppContext): () => void {
  const cleanups: (() => void)[] = [];
  const panel = document.createElement("div");
  panel.className = "settings";
  panel.innerHTML = `
    <header class="settings-header">
      <h1>Settings</h1>
      <button type="button" class="settings-close" data-role="done">Done</button>
    </header>`;
  panel.querySelector("[data-role=done]")!.addEventListener("click", () => ctx.show(HOME_SCREEN));
  for (const { title, mount } of settingsSections()) {
    const section = document.createElement("section");
    const heading = document.createElement("h2");
    heading.textContent = title;
    section.append(heading);
    panel.append(section);
    const cleanup = mount(section, ctx);
    if (cleanup) cleanups.push(cleanup);
  }
  el.append(panel);
  return () => cleanups.forEach((fn) => fn());
}

registerSettingsSection("Items", mountItems);
registerSettingsSection("Payday", mountPayday);
registerSettingsSection("Data", mountData);
registerScreen("settings", mountSettings);
onStart(attachLongPress);
