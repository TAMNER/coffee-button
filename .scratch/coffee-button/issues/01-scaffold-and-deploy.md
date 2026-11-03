# 01: Scaffold and deploy

**What to build:** A Vite + TypeScript + Vitest project that builds to a Progressive Web App: manifest, service worker for offline, a placeholder cup page. A single deploy script builds and serves the built folder over Tailscale with HTTPS from black-box. Demo: install the blank cup to the iPhone Home Screen from the Tailscale URL and open it in airplane mode.

**Blocked by:** None (can start immediately).

**Status:** deployed at https://black-box.<tailnet>.ts.net/ (systemd user service on 127.0.0.1:8794 behind tailscale serve); iOS install and offline boxes await the device check (ticket 11)

- [x] `npm test` runs Vitest with at least one passing test
- [x] `npm run build` produces a dist folder with manifest and service worker
- [ ] Home Screen install on iOS shows a full-screen app with the Coffee Button name and icon placeholder
- [ ] App launches offline after first visit
- [x] One deploy script builds and points `tailscale serve` at the built folder; script is idempotent

## Notes (agent, 2026-11-03)

- Verified: `npm test` (3 passing, `formatPounds`), `npm run build` emits
  `dist/manifest.webmanifest` and `dist/sw.js` precaching all 7 built files.
- Not verifiable here: iOS Home Screen install and offline launch need the
  iPhone, after the deploy works.
- `scripts/deploy.sh` exists and builds, but `tailscale serve` was refused:
  `sending serve config: Access denied: serve config denied`. Run
  `sudo tailscale set --operator=openclaw` once, then re-run the script.
  HTTPS certs are enabled (black-box.<tailnet>.ts.net).
- Review (2026-11-03): `tailscale serve status` still reports "No serve config".
  Still blocked on the owner running the sudo command above.
