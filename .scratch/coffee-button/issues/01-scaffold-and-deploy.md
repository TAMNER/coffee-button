# 01: Scaffold and deploy

**What to build:** A Vite + TypeScript + Vitest project that builds to a Progressive Web App: manifest, service worker for offline, a placeholder cup page. A single deploy script builds and serves the built folder over Tailscale with HTTPS from black-box. Demo: install the blank cup to the iPhone Home Screen from the Tailscale URL and open it in airplane mode.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] `npm test` runs Vitest with at least one passing test
- [ ] `npm run build` produces a dist folder with manifest and service worker
- [ ] Home Screen install on iOS shows a full-screen app with the Coffee Button name and icon placeholder
- [ ] App launches offline after first visit
- [ ] One deploy script builds and points `tailscale serve` at the built folder; script is idempotent
