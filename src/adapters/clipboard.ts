export interface Clipboard {
  writeText(text: string): Promise<void>;
}

export const browserClipboard: Clipboard = {
  writeText: (text) => navigator.clipboard.writeText(text),
};

/** For tests: remembers everything written. */
export class FakeClipboard implements Clipboard {
  written: string[] = [];
  /** Set to make writes reject, as iOS does with NotAllowedError. */
  fail = false;
  async writeText(text: string): Promise<void> {
    if (this.fail) throw new Error("NotAllowedError");
    this.written.push(text);
  }
}
