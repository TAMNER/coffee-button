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
 * iOS only lets an AudioContext start inside a user gesture, so call
 * unlockOnFirstGesture() at boot; until then playCoin() is silent.
 */
export class WebAudioCoin implements Audio {
  private ctx: AudioContext | null = null;

  unlockOnFirstGesture(target: EventTarget): void {
    const unlock = () => {
      target.removeEventListener("pointerdown", unlock, true);
      target.removeEventListener("touchend", unlock, true);
      try {
        const ctx = this.context();
        if (!ctx) return;
        if (ctx.state !== "running") void ctx.resume().catch(() => {});
        // A silent one-sample buffer fully unlocks output on older WebKit.
        const source = ctx.createBufferSource();
        source.buffer = ctx.createBuffer(1, 1, 22050);
        source.connect(ctx.destination);
        source.start();
      } catch {
        // no Web Audio here; stay silent
      }
    };
    target.addEventListener("pointerdown", unlock, true);
    target.addEventListener("touchend", unlock, true);
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
