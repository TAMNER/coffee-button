export interface Audio {
  /** A short synthesised coin clink. */
  playCoin(): void;
}

/** For tests: counts calls; set `fail` to make it throw. */
export class FakeAudio implements Audio {
  coins = 0;
  fail = false;
  playCoin(): void {
    this.coins++;
    if (this.fail) throw new Error("audio unavailable");
  }
}

type AudioContextCtor = typeof AudioContext;

/**
 * Synthesised coin clink: two short bright bursts with a fast decay. No audio file.
 *
 * iOS only lets an AudioContext start or resume inside a user activation, and a
 * touch pointerdown is not one in WebKit; touchend and click are. iOS also
 * suspends or "interrupts" the context whenever the app is backgrounded (for
 * example while the user is in InvestEngine). So unlock() runs on every
 * touchend and click for the life of the page, never just the first, and the
 * cup's click handler calls it again synchronously before its first await.
 */
export class WebAudioCoin implements Audio {
  private ctx: AudioContext | null = null;

  /** Listens permanently (capture phase) and unlocks on every gesture. */
  unlockOnGestures(target: EventTarget): void {
    const unlock = () => this.unlock();
    target.addEventListener("touchend", unlock, true);
    target.addEventListener("click", unlock, true);
  }

  /** Call inside a user gesture: creates the context lazily and resumes it if needed. */
  unlock(): void {
    try {
      const ctx = this.context();
      if (!ctx || ctx.state === "running") return;
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

  playCoin(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    if (ctx.state !== "running") void ctx.resume().catch(() => {});
    const t = ctx.currentTime + 0.01;
    this.burst(ctx, "triangle", 1976, t, 0.12); // B6
    this.burst(ctx, "sine", 2637, t + 0.07, 0.32); // E7
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
