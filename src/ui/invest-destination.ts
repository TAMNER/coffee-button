/**
 * Settings section "Where do you invest?": one URL field, blank by default.
 * Saved on blur or Enter; anything that is not an http or https link shows an
 * inline error and is not saved. Thin DOM glue: the rules live in
 * validateInvestUrl / setInvestUrl (src/domain/settings.ts).
 */
import { setInvestUrl } from "../domain/settings";
import { SETTINGS_HELP } from "../domain/settings-help";
import { registerSettingsSection, type AppContext } from "./app";

function mountInvestDestination(el: HTMLElement, ctx: AppContext): void {
  el.insertAdjacentHTML(
    "beforeend",
    `<label class="settings-row invest-destination">Link
       <input name="invest-url" type="url" inputmode="url" autocomplete="url" autocapitalize="off"
              spellcheck="false" placeholder="https://" />
     </label>
     <p class="settings-help" data-role="invest-url-help"></p>
     <p class="settings-status" aria-live="polite" data-role="invest-url-status"></p>`,
  );
  el.querySelector("[data-role=invest-url-help]")!.textContent = SETTINGS_HELP.investDestination;
  const input = el.querySelector<HTMLInputElement>("[name=invest-url]")!;
  const line = el.querySelector<HTMLElement>("[data-role=invest-url-status]")!;
  const say = (text: string, isError = false) => {
    line.textContent = text;
    line.classList.toggle("is-error", isError);
    input.setAttribute("aria-invalid", String(isError));
  };

  let saved = "";
  void ctx.store.getSettings().then((s) => {
    saved = s.investUrl ?? "";
    input.value = saved;
  });

  const save = async () => {
    if (input.value.trim() === saved) return;
    try {
      await setInvestUrl(ctx.store, input.value);
      saved = (await ctx.store.getSettings()).investUrl ?? "";
      input.value = saved;
      say(saved ? "Invest will copy the amount and open this link." : "Invest will copy the amount only.");
    } catch {
      say("That needs to be a link starting with https:// or http://. Not saved.", true);
    }
  };

  input.addEventListener("blur", () => void save());
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    void save();
  });
}

registerSettingsSection("Where do you invest?", mountInvestDestination);
