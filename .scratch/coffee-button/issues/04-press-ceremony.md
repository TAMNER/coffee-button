# 04: Press ceremony

**What to build:** On every press the cup plays the identical ceremony: liquid pours, a coin drops into the cup, a short cheer with confetti. Web Audio plays a coin sound, a haptic fires via the iOS 18 switch trick where available, and the whole thing lasts about two seconds. The press is recorded before the animation starts and navigating away mid-animation loses nothing. Placeholder shapes are fine; the artwork comes later. Demo: tap and feel it.

**Blocked by:** 03 Press and ledger.

**Status:** ready-for-agent

- [ ] Ceremony runs on every press, identical each time, about two seconds
- [ ] Press is persisted before the first animation frame
- [ ] Audio plays after the first user gesture; silent failure if audio is unavailable
- [ ] Haptic attempted via switch toggle; no error where unsupported
- [ ] Rapid double tap records two presses and does not break the animation
