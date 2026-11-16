# Recorded sounds

Drop recordings here. Only the coin has a synthesised fallback: without `coin.m4a` the clink is synthesised, but without `pour.m4a` or `cheer.m4a` the pour and the cheer are silent (their synthesised versions sounded wrong on the iPhone and were removed on 2026-11-04).

| File | Plays | Without it |
|---|---|---|
| `pour.m4a` (or `.mp3`) | during the pour, trimmed to 0.8 s with a short fade so it ends on the clink | silent |
| `coin.m4a` (or `.mp3`) | as the coin lands | synthesised clink |
| `cheer.m4a` (or `.mp3`) | with the confetti, at full length | silent |

Record 1–2 s of liquid pouring into a cup, a short clink under 0.5 s, and a "woohoo!" of about 1 s. Voice Memos on an iPhone exports `.m4a`, which Safari and Chrome decode natively.

The files must be here before `npm run build`: the build copies them into `dist/` and the service worker precaches them. They load once per launch, on the first tap, so relaunch the app after deploying. Keep them short.
