/** Hands the user a file to save. */
export interface Downloader {
  download(filename: string, text: string, mimeType: string): void;
}

/** Saves via a temporary Blob URL and a clicked <a download>. */
export const browserDownloader: Downloader = {
  download(filename, text, mimeType) {
    const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};

/** For tests: records every download instead of saving it. */
export class FakeDownloader implements Downloader {
  readonly downloads: { filename: string; text: string; mimeType: string }[] = [];
  download(filename: string, text: string, mimeType: string): void {
    this.downloads.push({ filename, text, mimeType });
  }
}
