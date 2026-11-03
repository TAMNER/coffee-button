# 04: Press ceremony

**What to build:** On every press the cup plays the identical ceremony: liquid pours, a coin drops into the cup, a short cheer with confetti. Web Audio plays a coin sound, a haptic fires via the iOS 18 switch trick where available, and the whole thing lasts about two seconds. The press is recorded before the animation starts and navigating away mid-animation loses nothing. Placeholder shapes are fine; the artwork comes later. Demo: tap and feel it.

**Blocked by:** 03 Press and ledger.

**Status:** done

- [x] Ceremony runs on every press, identical each time, about two seconds
- [x] Press is persisted before the first animation frame
- [x] Audio plays after the first user gesture; silent failure if audio is unavailable
- [x] Haptic attempted via switch toggle; no error where unsupported
- [x] Rapid double tap records two presses and does not break the animation

## Notes

- Tested (Vitest): `ceremonyTimeline()` order and ~2 s total; `Ceremony.play` calls `audio.playCoin` and `haptics.tap` once each and resolves when both throw; two plays 50 ms apart both complete; `wireCeremony` plays on the bus `press` event, by which time the press is already in the store (bus level, mirroring cup.ts: persist, then emit; the cup handler itself sits inside a DOM listener).
- Not tested, by design (thin DOM): `svgStage` (WAAPI on a per-play SVG overlay with `pointer-events:none`, so the cup stays tappable), `WebAudioCoin`, `SwitchHaptics`. Typechecked and built; not run in a browser here (no headless browser on this machine).
- Device checks for ticket 11: coin clink audible after the first tap (silent when the ringer switch is on), switch haptic ticks on iOS 18, overlay lines up with the cup.
- Haptic fires at the start of play (closest to the gesture); the clink fires when the coin lands.
- Confetti is randomised per play from a seed; everything else is identical each press.
