/**
 * Loads the optional recordings (public/sounds) ahead of the first tap.
 *
 * The pour plays at the very start of the ceremony. When loading only began on
 * the first tap, the pour was still being fetched and decoded at the moment it
 * was due, so the first press was silent while the later sounds played
 * (2026-11-16). Loading starts at page load now, and a sound that is asked for
 * while still decoding can be waited for with `whenLoaded`.
 *
 * Generic over the decoded type so tests need no Web Audio.
 */
export class SampleLoader<T, N extends string = string> {
  private loaded: Partial<Record<N, T>> = {};
  private pending: Partial<Record<N, Promise<T | undefined>>> = {};

  /**
   * @param files     per sound, the files to try in order; the first that loads wins
   * @param fetchFile the bytes of a file, or undefined when it is missing or not audio
   * @param decode    bytes to a playable buffer; may reject
   */
  constructor(
    private readonly files: Record<N, readonly string[]>,
    private readonly fetchFile: (file: string) => Promise<ArrayBuffer | undefined>,
    private readonly decode: (bytes: ArrayBuffer) => Promise<T>,
  ) {}

  /** Begins loading every sound once; calling it again does nothing. */
  start(): void {
    for (const name of Object.keys(this.files) as N[]) {
      if (this.pending[name]) continue;
      this.pending[name] = this.load(name);
    }
  }

  get started(): boolean {
    return Object.keys(this.pending).length > 0;
  }

  /** The decoded sound, if it has arrived. */
  get(name: N): T | undefined {
    return this.loaded[name];
  }

  /** Resolves when the sound has loaded, or to undefined when there is no recording. Never rejects. */
  whenLoaded(name: N): Promise<T | undefined> {
    return this.pending[name] ?? Promise.resolve(undefined);
  }

  private async load(name: N): Promise<T | undefined> {
    for (const file of this.files[name]) {
      try {
        const bytes = await this.fetchFile(file);
        if (!bytes) continue;
        const buffer = await this.decode(bytes);
        this.loaded[name] = buffer;
        return buffer;
      } catch {
        // try the next format; with none left the sound stays missing
      }
    }
    return undefined;
  }
}

/** Below this much left of the pour, starting the recording late is not worth it. */
const MIN_LATE_POUR_MS = 200;

/**
 * How long to play the pour when its recording only arrives `elapsedMs` into a
 * pour of `durationMs`: the time that is left, or null when too little remains.
 */
export function latePourSeconds(durationMs: number, elapsedMs: number): number | null {
  const left = durationMs - elapsedMs;
  return left >= MIN_LATE_POUR_MS ? left / 1000 : null;
}
