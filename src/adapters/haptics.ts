export interface Haptics {
  /** One light tap, where the device supports it. */
  tap(): void;
}

/** For tests: counts calls; set `fail` to make it throw. */
export class FakeHaptics implements Haptics {
  taps = 0;
  fail = false;
  tap(): void {
    this.taps++;
    if (this.fail) throw new Error("haptics unavailable");
  }
}

/**
 * iOS 18 Safari ticks the Taptic Engine when an `<input type="checkbox" switch>`
 * toggles. Toggling it through its label's click() gives a haptic tap from script.
 * Elsewhere the click just toggles an invisible checkbox: no effect, no error.
 */
export class SwitchHaptics implements Haptics {
  private label: HTMLLabelElement | null = null;

  constructor(private doc: Document) {}

  tap(): void {
    try {
      this.ensureLabel().click();
    } catch {
      // unsupported; degrade silently
    }
  }

  private ensureLabel(): HTMLLabelElement {
    if (this.label?.isConnected) return this.label;
    const label = this.doc.createElement("label");
    label.setAttribute("aria-hidden", "true");
    label.style.cssText =
      "position:fixed;left:0;top:0;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);opacity:0;pointer-events:none;";
    const input = this.doc.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", "");
    input.tabIndex = -1;
    label.append(input);
    this.doc.body.append(label);
    this.label = label;
    return label;
  }
}

let shared: Haptics | undefined;

/** One switch for the whole page, created on first use (needs `document`). */
export function deviceHaptics(): Haptics {
  return (shared ??= new SwitchHaptics(document));
}
