export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };

/** For tests: always returns the given instant until set() moves it. */
export class FakeClock implements Clock {
  constructor(private instant: Date) {}
  now(): Date {
    return new Date(this.instant.getTime());
  }
  set(instant: Date): void {
    this.instant = instant;
  }
}
