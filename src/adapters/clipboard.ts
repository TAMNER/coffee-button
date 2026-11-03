export interface Clipboard {
  writeText(text: string): Promise<void>;
}

export const browserClipboard: Clipboard = {
  writeText: (text) => navigator.clipboard.writeText(text),
};

/** For tests: remembers everything written. */
export class FakeClipboard implements Clipboard {
  written: string[] = [];
  async writeText(text: string): Promise<void> {
    this.written.push(text);
  }
}
