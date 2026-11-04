/**
 * Settings section "Starling" (ticket 19). DOM glue over src/domain/starling-link.ts,
 * which holds the tested behaviour. Unlinked: token (password field), the four
 * scopes, relay URL, Connect. Connect shows a spinner, then a Space picker with
 * "Create a Coffee Button Space" first. Linked: "Connected: <name>" and
 * Disconnect. The token is never logged or written anywhere but the store.
 */
import {
  chooseSpace,
  createAndChooseSpace,
  connect,
  defaultStarlingFactory,
  disconnect,
  linkErrorMessage,
  starlingLink,
  DEFAULT_RELAY_URL,
  type StarlingConnection,
} from "../domain/starling-link";
import { waitingLine } from "../domain/starling-mover";
import { registerSettingsSection, type AppContext } from "./app";
import { onStarlingChange, useStarlingMoverIfLinked } from "./starling-mover";

/** The token scopes the user ticks when making the Personal Access Token. */
export const STARLING_SCOPES = [
  "account:read",
  "savings-goal:read",
  "savings-goal:create",
  "savings-goal-transfer:create",
] as const;

const CREATE = "__create__";

function mountStarling(el: HTMLElement, ctx: AppContext): () => void {
  const body = document.createElement("div");
  body.className = "starling";
  const line = document.createElement("p");
  line.className = "settings-status";
  line.setAttribute("aria-live", "polite");
  el.append(body, line);
  let gone = false;
  let showWaiting = async () => {};
  const offChange = onStarlingChange(() => void showWaiting());

  const say = (text: string, isError = false) => {
    line.textContent = text;
    line.classList.toggle("is-error", isError);
  };

  const showLinked = (spaceName: string) => {
    body.innerHTML = `
      <p class="starling-connected"></p>
      <p class="starling-waiting" hidden></p>
      <div class="settings-row"><button type="button" data-role="starling-disconnect">Disconnect</button></div>`;
    body.querySelector(".starling-connected")!.textContent = `Connected: ${spaceName}`;
    // Ticket 20: "N presses waiting to move" when transfers are queued.
    const waiting = body.querySelector<HTMLElement>(".starling-waiting")!;
    showWaiting = async () => {
      const text = waitingLine(await ctx.store.presses.list());
      if (gone || !waiting.isConnected) return;
      waiting.textContent = text;
      waiting.hidden = text === "";
    };
    void showWaiting();
    body.querySelector("[data-role=starling-disconnect]")!.addEventListener("click", async () => {
      if (!window.confirm("Forget the Starling token and Space on this phone? Money already moved stays in the Space.")) return;
      await disconnect(ctx.store);
      say("Disconnected. The token is forgotten.");
      showForm();
    });
  };

  const showForm = () => {
    body.innerHTML = `
      <form class="starling-form" autocomplete="off">
        <p class="starling-help">Make a Personal Access Token in the Starling developer portal with these scopes:</p>
        <ul class="starling-scopes"></ul>
        <label class="starling-field">Token
          <input name="token" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" required />
        </label>
        <label class="starling-field">Relay URL
          <input name="relay" type="url" inputmode="url" autocapitalize="off" spellcheck="false" required />
        </label>
        <div class="settings-row">
          <button type="submit" data-role="starling-connect">Connect</button>
          <span class="starling-spinner" aria-hidden="true" hidden></span>
        </div>
      </form>`;
    const scopes = body.querySelector(".starling-scopes")!;
    for (const scope of STARLING_SCOPES) {
      const li = document.createElement("li");
      li.textContent = scope;
      scopes.append(li);
    }
    const form = body.querySelector<HTMLFormElement>("form")!;
    const token = form.querySelector<HTMLInputElement>("[name=token]")!;
    const relay = form.querySelector<HTMLInputElement>("[name=relay]")!;
    const button = form.querySelector<HTMLButtonElement>("[data-role=starling-connect]")!;
    const spinner = form.querySelector<HTMLElement>(".starling-spinner")!;
    relay.value = DEFAULT_RELAY_URL;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!token.value.trim()) return say("Paste the token first.", true);
      button.disabled = true;
      spinner.hidden = false;
      say("Asking Starling…");
      try {
        const conn = await connect(ctx.store, defaultStarlingFactory, token.value, relay.value || DEFAULT_RELAY_URL);
        if (gone) return;
        token.value = "";
        say("");
        showPicker(conn);
      } catch (err) {
        if (gone) return;
        say(linkErrorMessage(err), true);
        button.disabled = false;
        spinner.hidden = true;
      }
    });
  };

  const showPicker = (conn: StarlingConnection) => {
    body.innerHTML = `
      <form class="starling-picker">
        <fieldset>
          <legend>Which Space should presses move into?</legend>
          <div class="starling-spaces"></div>
        </fieldset>
        <div class="settings-row">
          <button type="submit" data-role="starling-choose">Use this Space</button>
          <span class="starling-spinner" aria-hidden="true" hidden></span>
        </div>
      </form>`;
    const list = body.querySelector(".starling-spaces")!;
    const option = (value: string, text: string, checked: boolean) => {
      const label = document.createElement("label");
      label.className = "starling-space";
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "space";
      radio.value = value;
      radio.checked = checked;
      label.append(radio, document.createTextNode(` ${text}`));
      list.append(label);
    };
    option(CREATE, "Create a Coffee Button Space", true);
    for (const space of conn.spaces) option(space.savingsGoalUid, space.name, false);

    const form = body.querySelector<HTMLFormElement>("form")!;
    const button = form.querySelector<HTMLButtonElement>("[data-role=starling-choose]")!;
    const spinner = form.querySelector<HTMLElement>(".starling-spinner")!;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const picked = String(new FormData(form).get("space") ?? CREATE);
      button.disabled = true;
      spinner.hidden = false;
      try {
        const link =
          picked === CREATE ? await createAndChooseSpace(ctx.store, conn) : await chooseSpace(ctx.store, conn, picked);
        if (gone) return;
        say(`Linked to ${link.spaceName}. The token stays on this phone.`);
        showLinked(link.spaceName);
        // Ticket 20: presses from now on move into this Space, without a relaunch.
        void useStarlingMoverIfLinked(ctx);
      } catch (err) {
        if (gone) return;
        say(linkErrorMessage(err), true);
        button.disabled = false;
        spinner.hidden = true;
      }
    });
  };

  void starlingLink(ctx.store).then((link) => {
    if (gone) return;
    if (link) showLinked(link.spaceName);
    else showForm();
  });

  return () => {
    gone = true;
    offChange();
  };
}

registerSettingsSection("Starling", mountStarling);
