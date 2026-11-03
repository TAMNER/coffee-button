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
