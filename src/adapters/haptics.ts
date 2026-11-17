export interface Haptics {
  /** One light tap, where the device supports it. */
  tap(): void;
  /**
   * A vibration pattern (alternating vibrate and pause ms, as
   * `navigator.vibrate` takes it) where the device can play one; one tap
   * otherwise. Call it inside the user's tap, before any await.
   */
  vibrate(pattern: readonly number[]): void;
}

/** For tests: counts calls; set `fail` to make it throw. */
export class FakeHaptics implements Haptics {
  taps = 0;
  patterns: number[][] = [];
  fail = false;
  tap(): void {
    this.taps++;
    if (this.fail) throw new Error("haptics unavailable");
  }
  vibrate(pattern: readonly number[]): void {
    this.patterns.push([...pattern]);
    if (this.fail) throw new Error("haptics unavailable");
  }
}

/** The part of `navigator` that vibrates; absent on iOS Safari. */
export interface Vibrator {
  vibrate?(pattern: number[]): boolean;
}

/**
 * iOS 18 Safari ticks the Taptic Engine when an `<input type="checkbox" switch>`
 * toggles. Toggling it through its label's click() gives a haptic tap from script.
 * Elsewhere the click just toggles an invisible checkbox: no effect, no error.
 */
export class SwitchHaptics implements Haptics {
  private label: HTMLLabelElement | null = null;

  /** `vibrator` is `navigator` in the app: Android Chrome has `vibrate`, iOS Safari does not. */
  constructor(
    private doc: Document,
    private vibrator: Vibrator = {},
  ) {}

  tap(): void {
    try {
      this.ensureLabel().click();
    } catch {
      // unsupported; degrade silently
    }
  }

  /** The whole pattern through `navigator.vibrate` where it exists; the switch's one tick otherwise. */
  vibrate(pattern: readonly number[]): void {
    try {
      if (this.vibrator.vibrate?.([...pattern])) return;
    } catch {
      // fall through to the tick
    }
    this.tap();
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
  return (shared ??= new SwitchHaptics(document, navigator));
}
