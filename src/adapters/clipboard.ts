export interface Clipboard {
  writeText(text: string): Promise<void>;
}

export const browserClipboard: Clipboard = {
  // Call synchronously inside the tap. ClipboardItem with a promised Blob is
  // the write iOS Safari accepts most reliably; writeText is the fallback.
  writeText(text) {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
      const blob = Promise.resolve(new Blob([text], { type: "text/plain" }));
      return navigator.clipboard.write([new ClipboardItem({ "text/plain": blob })]);
    }
    return navigator.clipboard.writeText(text);
  },
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
