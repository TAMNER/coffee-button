/** Leaving the app for another app or site, and noticing when the user comes back. */
export interface UrlOpener {
  /** Opens `url`; resolves false when the browser refused to open it. */
  open(url: string): Promise<boolean>;
  /** Calls `fn` each time the app becomes visible again; returns an unsubscribe. */
  onReturn(fn: () => void): () => void;
}

export const browserUrlOpener: UrlOpener = {
  async open(url) {
    // No "noopener": with it window.open always returns null and failure is undetectable.
    return window.open(url, "_blank") !== null;
  },
  onReturn(fn) {
    const handler = () => {
      if (document.visibilityState === "visible") fn();
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  },
};

/** For tests: records opened URLs; URLs listed in `failing` report failure. */
export class FakeUrlOpener implements UrlOpener {
  opened: string[] = [];
  private listeners = new Set<() => void>();

  constructor(private failing: string[] = []) {}

  async open(url: string): Promise<boolean> {
    this.opened.push(url);
    return !this.failing.includes(url);
  }

  onReturn(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Simulates visibilitychange to visible. */
  returnToApp(): void {
    for (const fn of this.listeners) fn();
  }
}
