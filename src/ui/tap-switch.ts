/**
 * A real switch under the finger, so the tap itself ticks the Taptic Engine.
 *
 * From iOS 26.5 a script can no longer tick the phone by clicking a hidden
 * `<input type="checkbox" switch>` (src/adapters/haptics.ts); only a finger
 * landing on a real switch still does. So an invisible switch is laid over
 * the button and takes the touch, and its click is passed on to the button.
 * Keyboard and screen-reader users still reach the button itself: the switch
 * is out of the tab order and hidden from assistive technology.
 * Elsewhere it is an invisible checkbox that passes the click on: no effect.
 */
export function attachTapSwitch(button: HTMLElement): HTMLInputElement {
  const wrap = document.createElement("span");
  wrap.className = "tap-switch-wrap";
  button.replaceWith(wrap);
  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  input.className = "tap-switch";
  input.tabIndex = -1;
  input.setAttribute("aria-hidden", "true");
  wrap.append(button, input);
  // Synchronous, so the button's handler still runs inside the tap's gesture.
  input.addEventListener("click", () => button.click());
  return input;
}
