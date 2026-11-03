/**
 * Settings section "Reminder": one button that hands over coffee-button.ics,
 * a monthly event on settle day linking back to the app. Payday is read at
 * click time, so a changed payday is reflected the next time it is used.
 */
import { browserDownloader } from "../adapters/download";
import { generateIcs } from "../domain/ics";
import { registerSettingsSection, type AppContext } from "./app";

function mountReminder(el: HTMLElement, ctx: AppContext): void {
  el.insertAdjacentHTML(
    "beforeend",
    `<div class="settings-row">
       <button type="button" data-role="add-reminder">Add monthly reminder</button>
     </div>`,
  );
  el.querySelector("[data-role=add-reminder]")!.addEventListener("click", async () => {
    const { paydayDay } = await ctx.store.getSettings();
    const ics = generateIcs({
      payday: paydayDay,
      appUrl: new URL("./", location.href).href,
      now: ctx.clock.now(),
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
    browserDownloader.download("coffee-button.ics", ics, "text/calendar");
  });
}

registerSettingsSection("Reminder", mountReminder);
