# 22: Publish the app on GitHub Pages

**What to build:** Friends get the app from a public github.io link. A GitHub Actions workflow builds on every push to main and deploys to Pages. The build takes its base path from an environment variable so the Pages build lives under /coffee-button/ while the black-box build stays at /. The PWA manifest, service worker and icons work from the sub-path. README gains a short "Install on your iPhone" section (open the link in Safari, Share, Add to Home Screen, turn off iCloud Private Relay is NOT needed here) and a "Run your own relay" pointer. Flip the repo to public and enable Pages (Actions source) with gh.

**Blocked by:** None (can start immediately; merge after the others so the first public build is the full one).

**Status:** ready-for-agent

- [ ] vite base path configurable (default "/"); a unit test or build check shows manifest start_url/scope resolve under a sub-path
- [ ] .github/workflows/pages.yml: npm ci, test, build with the sub-path base, deploy-pages
- [ ] Repo public, Pages enabled, first deploy green, link recorded in README
- [ ] README install section for friends
