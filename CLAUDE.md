# Working in Coffee Button

Start with `docs/HANDOFF.md` (current state and open items), then `docs/DESIGN.md` (the agreed design; do not reopen its decisions without new facts).

## Shape of the code

- `src/domain`: pure rules, every module has a test beside it. No browser APIs. Depends only on `store.ts` types and the interfaces it declares.
- `src/adapters` and `src/storage`: one interface, one real implementation, one Fake each (Clock, Clipboard, UrlOpener, Haptics, Audio, Downloader, Timers, Store).
- `src/ui`: DOM glue. Not unit tested by decision. Every module registers itself on import via `src/ui/app.ts` (`registerScreen`, `registerSettingsSection`, `onStart`, the typed `bus`) or `src/ui/cup.ts` (`registerBelowTotal`, `registerCupExtra`), and is listed once in `src/ui/register.ts`.
- Dependencies point inward only. UI imports domain; domain never imports UI or a device.

## Rules

- Test-first, strictly: one failing Vitest test at an agreed seam, the least code to pass it, commit. Say in your report which tests passed first time (guard tests) and what DOM glue has no test.
- Run tests from the repo root: `npx vitest run` (running from a parent directory picks up other projects). `npm run build` runs `tsc --noEmit` first.
- Add a new feature as a new module plus one import line; keep edits to shared files (`cup.ts`, `settle.ts`, `store.ts`, `settings.ts`, `style.css`, `register.ts`) small and additive. Append CSS at the end of `style.css` under a comment naming the ticket. Both theme blocks must get any new colour token.
- Add optional fields to `Settings` only; never rename or move existing exports.
- Export (`exportData`) must never include the Starling token or link; import must ignore them. Never log the token.
- Never run `tailscale funnel` for the app port. The relay (8795 → :8443) is the only Funnel target and Tom enabled it by hand.
- Do not flip the repo public, enable Pages, or change GitHub settings; Tom does that.
- Commit messages end with a `Co-Authored-By:` line for the model that wrote them. Push only when asked, and after Tom has reviewed any user-facing copy.

## Commands

```bash
npx vitest run            # 388 tests (one skipped)
npm run build             # tsc + vite
bash scripts/deploy.sh    # build, restart services, tailscale serve, curl checks
node scripts/screenshot.mjs /tmp/shot.png   # 390x844 render, bypasses the service worker
BASE_PATH=/coffee-button/ npm run build     # the GitHub Pages build
```
