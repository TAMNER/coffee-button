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

  /** Listens permanently (capture phase) and unlocks on every gesture. */
  unlockOnGestures(target: EventTarget): void {
    const unlock = () => this.unlock();
    target.addEventListener("touchend", unlock, true);
    target.addEventListener("click", unlock, true);
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

  private ready(): AudioContext | null {
    const ctx = this.ctx;
    if (!ctx) return null;
    if (ctx.state !== "running") void ctx.resume().catch(() => {});
    return ctx;
  }

  playCoin(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime + 0.01;
    this.burst(ctx, "triangle", 1976, t, 0.12); // B6
    this.burst(ctx, "sine", 2637, t + 0.07, 0.32); // E7
  }

  /**
   * Pouring: filtered noise whose pitch and loudness climb for the whole pour,
   * a crescendo that lands on the clink, then a quick cut as the stream stops.
   */
  playPour(durationMs: number): void {
    const ctx = this.ready();
    if (!ctx) return;
    const seconds = Math.max(0.2, durationMs / 1000);
    const t = ctx.currentTime + 0.01;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer(ctx, seconds + 0.1);
    const band = ctx.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 0.9;
    band.frequency.setValueAtTime(350, t);
    band.frequency.exponentialRampToValueAtTime(2200, t + seconds);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.03, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.22, t + seconds * 0.9);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    noise.connect(band).connect(gain).connect(ctx.destination);
    noise.start(t);
    noise.stop(t + seconds + 0.05);
  }

  /**
   * "Woohoo!": two whooping glides (a rising "woo", a rise-and-fall "hoo") with
   * a little vibrato, over a short bright arpeggio and a hiss of confetti.
   */
  playCheer(): void {
    const ctx = this.ready();
    if (!ctx) return;
    const t = ctx.currentTime + 0.02;
    this.whoop(ctx, t, 0.22, [330, 660]); // woo
    this.whoop(ctx, t + 0.24, 0.34, [520, 880, 620]); // hoo
    const notes = [1047, 1319, 1568, 2093]; // C6 E6 G6 C7
    notes.forEach((hz, i) => this.burst(ctx, "triangle", hz, t + 0.05 + i * 0.07, 0.28));
    const hiss = ctx.createBufferSource();
    hiss.buffer = this.noiseBuffer(ctx, 0.5);
    const high = ctx.createBiquadFilter();
    high.type = "highpass";
    high.frequency.value = 3500;
    const hissGain = ctx.createGain();
    hissGain.gain.setValueAtTime(0.0001, t);
    hissGain.gain.exponentialRampToValueAtTime(0.08, t + 0.03);
    hissGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    hiss.connect(high).connect(hissGain).connect(ctx.destination);
    hiss.start(t);
    hiss.stop(t + 0.5);
  }

  /** A vowel-ish glide: a soft sawtooth through a lowpass, pitch moving through `hz` with vibrato. */
  private whoop(ctx: AudioContext, start: number, length: number, hz: number[]): void {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    const step = length / (hz.length - 1);
    osc.frequency.setValueAtTime(hz[0], start);
    hz.slice(1).forEach((f, i) => osc.frequency.exponentialRampToValueAtTime(f, start + step * (i + 1)));
    const vibrato = ctx.createOscillator();
    vibrato.frequency.value = 7;
    const depth = ctx.createGain();
    depth.gain.value = 12;
    vibrato.connect(depth).connect(osc.frequency);
    const low = ctx.createBiquadFilter();
    low.type = "lowpass";
    low.frequency.setValueAtTime(900, start);
    low.frequency.exponentialRampToValueAtTime(1800, start + length);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.16, start + 0.03);
    gain.gain.setValueAtTime(0.16, start + length - 0.06);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(low).connect(gain).connect(ctx.destination);
    vibrato.start(start);
    osc.start(start);
    osc.stop(start + length + 0.02);
    vibrato.stop(start + length + 0.02);
  }

  private noiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
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
