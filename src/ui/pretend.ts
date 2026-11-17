/**
 * Ticket 35: open the app as if today were another date, to walk "Invest £X"
 * on any day. Thin DOM glue over src/domain/pretend.ts, which holds the tested
 * rules (date parsing, the look-only store and mover, the notice).
 *  - The date lives in this app's localStorage, set from a Settings section.
 *    It is read synchronously at boot (src/main.ts), works the same in Safari
 *    and in the installed Home Screen app, and never reaches the export file.
 *  - Switching it on or off reloads the app, so every screen starts on the
 *    right clock and store.
 *  - While it is on, a notice naming the date is pinned above every screen.
 */
import { systemClock } from "../adapters/clock";
import { leavePretend, parsePretendDate, pretendNotice } from "../domain/pretend";
import { onStart, registerSettingsSection, type AppContext } from "./app";

const KEY = "coffee-button.pretend-date";

/** The pretend date, or null when it is off, unreadable or not a real date. */
export function readPretendDate(): Date | null {
  try {
    return parsePretendDate(localStorage.getItem(KEY));
  } catch {
    return null;
  }
}

/** Saves (or with null, clears) the pretend date; false when the browser refuses storage. */
function writePretendDate(value: string | null): boolean {
  try {
    if (value === null) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, value);
    return true;
  } catch {
    return false;
  }
}

onStart(() => {
  const day = readPretendDate();
  if (!day) return;
  // Outside #app like the Safari banner (src/main.ts), so screen swaps keep it.
  const notice = document.createElement("p");
  notice.className = "banner pretend-banner";
  notice.setAttribute("role", "status");
  notice.textContent = pretendNotice(day);
  document.body.prepend(notice);
});

function mountPretend(el: HTMLElement, ctx: AppContext): void {
  const on = readPretendDate();
  el.insertAdjacentHTML(
    "beforeend",
    `<p class="pretend-help">Open the app as if today were another day, to try Invest £X before the day comes. Nothing you press or invest is saved while it is on.</p>
     <label class="settings-row">Pretend today is
       <input name="pretend-date" type="date" />
     </label>
     <div class="settings-row">
       <button type="button" data-role="pretend-on">Pretend</button>
       <button type="button" data-role="pretend-off">Back to today</button>
     </div>
     <p class="settings-status" aria-live="polite" data-role="pretend-status"></p>`,
  );
  const input = el.querySelector<HTMLInputElement>("[name=pretend-date]")!;
  const onButton = el.querySelector<HTMLButtonElement>("[data-role=pretend-on]")!;
  const offButton = el.querySelector<HTMLButtonElement>("[data-role=pretend-off]")!;
  const line = el.querySelector<HTMLElement>("[data-role=pretend-status]")!;
  const say = (text: string) => {
    line.textContent = text;
    line.classList.add("is-error");
  };
  offButton.hidden = !on;
  if (on) {
    const pad = (n: number) => String(n).padStart(2, "0");
    input.value = `${on.getFullYear()}-${pad(on.getMonth() + 1)}-${pad(on.getDate())}`;
  }

  const switchTo = async (value: string | null) => {
    // The store under ctx passes settings writes through to the real store.
    await leavePretend(ctx.store, systemClock.now());
    if (!writePretendDate(value)) return say("This browser will not keep the date. Nothing changed.");
    location.reload();
  };
  onButton.addEventListener("click", () => {
    if (parsePretendDate(input.value) === null) return say("Pick a date first.");
    void switchTo(input.value);
  });
  offButton.addEventListener("click", () => void switchTo(null));
}

registerSettingsSection("Pretend date", mountPretend);
