export interface Audio {
  /** Liquid pouring for `durationMs`, swelling towards the coin. */
  playPour(durationMs: number): void;
  /** A short synthesised coin clink. */
  playCoin(): void;
  /** The "woohoo" that goes with the confetti. */
  playCheer(): void;
}

/** For tests: counts calls; set `fail` to make it throw. */
export class FakeAudio implements Audio {
  pours = 0;
  coins = 0;
  cheers = 0;
  fail = false;
  playPour(_durationMs: number): void {
    this.pours++;
    if (this.fail) throw new Error("audio unavailable");
  }
  playCoin(): void {
    this.coins++;
    if (this.fail) throw new Error("audio unavailable");
  }
  playCheer(): void {
    this.cheers++;
    if (this.fail) throw new Error("audio unavailable");
  }
}

type AudioContextCtor = typeof AudioContext;

export type SampleName = "pour" | "coin" | "cheer";
/** Optional recordings, tried in this order; the first one found wins. Missing files mean synthesis. */
const SAMPLE_FILES: Record<SampleName, string[]> = {
  pour: ["sounds/pour.m4a", "sounds/pour.mp3"],
  coin: ["sounds/coin.m4a", "sounds/coin.mp3"],
  cheer: ["sounds/cheer.m4a", "sounds/cheer.mp3"],
};

/**
 * Synthesised coin clink: two short bright bursts with a fast decay. No audio file.
 *
 * iOS only lets an AudioContext start or resume inside a user activation, and a
 * touch pointerdown is not one in WebKit; touchend and click are. iOS also
 * suspends or "interrupts" the context whenever the app is backgrounded (for
 * example while the user is in their investing app). So unlock() runs on every
 * touchend and click for the life of the page, never just the first, and the
 * cup's click handler calls it again synchronously before its first await.
 */
export class WebAudioCoin implements Audio {
  private ctx: AudioContext | null = null;
  /** Recorded samples from public/sounds/*.m4a, when present; otherwise the sounds are synthesised. */
  private samples: Partial<Record<SampleName, AudioBuffer>> = {};
  private samplesRequested = false;

  /** Listens permanently (capture phase) and unlocks on every gesture. */
  unlockOnGestures(target: EventTarget): void {
    const unlock = () => this.unlock();
    target.addEventListener("touchend", unlock, true);
    target.addEventListener("click", unlock, true);
  }

  /** Fetches and decodes any recordings once; a 404 just means "synthesise". */
  private loadSamples(ctx: AudioContext): void {
    if (this.samplesRequested) return;
    this.samplesRequested = true;
    for (const name of Object.keys(SAMPLE_FILES) as SampleName[]) {
      void (async () => {
        for (const file of SAMPLE_FILES[name]) {
          try {
            const res = await fetch(file, { cache: "force-cache" });
            if (!res.ok || !/audio|octet-stream|mp4/.test(res.headers.get("content-type") ?? "")) continue;
            this.samples[name] = await ctx.decodeAudioData(await res.arrayBuffer());
            return;
          } catch {
            // try the next format, else stay synthesised
          }
        }
      })();
    }
  }

  /** Plays a recording; `seconds` trims it with a short fade (the pour must end on the clink). */
  private playSample(ctx: AudioContext, buffer: AudioBuffer, seconds?: number): void {
    const t = ctx.currentTime + 0.01;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1, t);
    const length = seconds !== undefined ? Math.min(seconds, buffer.duration) : buffer.duration;
    if (seconds !== undefined) {
      gain.gain.setValueAtTime(1, t + Math.max(0, length - 0.08));
      gain.gain.linearRampToValueAtTime(0.0001, t + length);
    }
    source.connect(gain).connect(ctx.destination);
    source.start(t);
    source.stop(t + length + 0.02);
  }

  /** Call inside a user gesture: creates the context lazily and resumes it if needed. */
  unlock(): void {
    try {
      // iOS mutes Web Audio with the ringer switch unless the page's audio
      // session is "playback" (Safari 17+ AudioSession API; a no-op elsewhere).
      // Trade-off: a clink then pauses music from other apps for a moment.
      const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
      if (session && session.type !== "playback") session.type = "playback";
      const ctx = this.context();
      if (!ctx) return;
      this.loadSamples(ctx);
      if (ctx.state === "running") return;
      void ctx.resume().catch(() => {});
      // A silent one-sample buffer fully unlocks output on older WebKit.
      const source = ctx.createBufferSource();
      source.buffer = ctx.createBuffer(1, 1, 22050);
      source.connect(ctx.destination);
      source.start();
    } catch {
      // no Web Audio here; stay silent
    }
  }

  private ready(): AudioContext | null {
    const ctx = this.ctx;
    if (!ctx) return null;
    if (ctx.state !== "running") void ctx.resume().catch(() => {});
    return ctx;
  }

  playCoin(): void {
    const ctx = this.ready();
    if (!ctx) return;
    if (this.samples.coin) return this.playSample(ctx, this.samples.coin);
    const t = ctx.currentTime + 0.01;
    this.burst(ctx, "triangle", 1976, t, 0.12); // B6
    this.burst(ctx, "sine", 2637, t + 0.07, 0.32); // E7
  }

  /**
   * Pouring and the cheer play only from recordings (public/sounds). The
   * synthesised versions sounded wrong on the iPhone (2026-11-04), so without a
   * recording these are silent and the clink carries the ceremony alone.
   */
  playPour(durationMs: number): void {
    const ctx = this.ready();
    if (!ctx || !this.samples.pour) return;
    this.playSample(ctx, this.samples.pour, Math.max(0.2, durationMs / 1000));
  }

  playCheer(): void {
    const ctx = this.ready();
    if (!ctx || !this.samples.cheer) return;
    this.playSample(ctx, this.samples.cheer);
  }

  private context(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const w = globalThis as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    this.ctx = Ctor ? new Ctor() : null;
    return this.ctx;
  }

  private burst(ctx: AudioContext, type: OscillatorType, hz: number, start: number, decay: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(hz, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + decay);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + decay + 0.02);
  }
}

let shared: WebAudioCoin | undefined;

/** One AudioContext for the whole page. */
export function deviceAudio(): WebAudioCoin {
  return (shared ??= new WebAudioCoin());
}
