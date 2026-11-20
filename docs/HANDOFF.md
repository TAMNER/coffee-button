# Coffee Button: handoff

Written 2026-11-04 at the end of the session that built tickets 13 to 22. Read this first, then `docs/DESIGN.md` (the agreed design, source of truth), then `CLAUDE.md` (how to work in this repo). The architecture explainer with diagrams is published as a Claude artifact: https://claude.ai/artifact/FwVggpfSfmfxfwAKpCxgQK (private to Tom).

## Update, 2026-11-17: round-two feedback built (read this before the rest)

Everything below this section was written on 2026-11-04 and is partly out of date. What changed since:

- **16 Nov.** Tester round one fixes (pace counts at least seven days, install copy per browser), recorded pour and cheer, and Cloudflare hosting: the Starling relay as a Worker (`relay-worker/`), the app as Workers static assets (`wrangler.jsonc`), deployed by `scripts/cf-deploy.sh` from a worktree. Tom has deployed and tested it. The design doc's "Relay" and "Hosting" sections still describe the black-box relay and GitHub Pages; they need Tom's wording for the Cloudflare decision.
- **17 Nov.** Tom's second round of feedback was triaged, grilled and built as tickets 23 to 36 (`.scratch/coffee-button/issues/`, GitHub issues of the same numbers). All fourteen are built on branch `round-2`: silent mode respected, new info sheet copy, Settings help lines, removable items, six pictures with a picker, one plank of three targets with starter chips, the latte graph (a row of seven glasses), a look-only pretend date for walking "Invest £X", and vibration patterns on Android. 388 tests, build clean.
- **18 Nov.** Pushed to `main` and deployed to Cloudflare by Tom at build `e22bc94`. Sound: the installed app was silent with the ringer on (iOS 26.6.2) until the audio session was named "ambient"; Tom confirmed the fix, and silent mode still mutes. The total's label reads "SAVED THIS MONTH!!" for every item. The latte graph has a money scale, a date under each glass and a caption; Tom looked at three other graph pictures (mockup round four) and kept the glasses. Open: the haptic tick is a trial (`src/ui/tap-switch.ts`, an invisible real switch over the cup) that Tom has not confirmed on his phone; if it ticks, add it to the settle "Yes" button, if not, remove it.
- **19 Nov.** The latte glasses are gone. Tom asked for a normal line graph, picked "Graph B" from round five of the mockup page, and it is built as ticket 39 (`src/domain/line-graph.ts`, `src/ui/line-graph.ts`): saved line and invested staircase, filled, with a money scale, dates and a touch readout. Ticket 33's modules and CSS are removed; the unused `--latte` and `--espresso` tokens are still in `src/style.css`. 394 tests. Pushed to `main`; the tailnet preview is deployed, Cloudflare is not (Tom deploys that). Ticket 39 has no GitHub issue yet. Open: Tom's device check of the graph (drag to read, shelf still scrolls).
- **20 Nov.** The project is now a showcase, not an app to hand out: the README opens with what the repository shows and two screenshots (`docs/screens/`, from the test backup). Ahead of going public, the tailnet name was taken out of the files (`scripts/deploy.sh` reads it from Tailscale) and the merged remote branch `worktree-tickets-23-36` was deleted. The same day `main` was rewritten and force-pushed to remove the name from every commit (455 commits, same content, new hashes), the three issue comments that held it were reposted without it, and hashes quoted in issues and here were repointed. **Every local branch and worktree made before 20 Nov is on the old history and still contains the name: never push one; cherry-pick its commits onto the new `main` instead.** A bundle of the old history is at `~/backups/coffee-button-before-rewrite-2026-11-20.bundle` on black-box. GitHub keeps the old commits reachable by hash until its support team clears them; Tom asks for that, then makes the repo public.
- **Not done by an agent, waiting on Tom:** nothing from `round-2` is deployed or on a phone. Device checks are open in tickets 23, 24, 29, 33, 35 and 36 (36 needs an Android tester). Copy to read before any push: the info sheet (24), the reworded phrase in the Settings help (25), the pretend-date notice and labels (35), the payday line and calendar reminder that no longer say "settle day" (24), and the starter chip labels (31).
- **The mockup page** for the new pictures and the graph is `mockups/pictures-and-graph.html` (three rounds; Tom's picks are recorded in ticket 27), published privately at https://claude.ai/artifact/AEQvMsQ5QPdCPh8YBa2BE5.
- **A bug fixed on the way:** the ring text sat about 55px off the disc whenever "Invest £X" showed (it only re-measured when the cup changed size). Fixed in `src/ui/ring.ts`.

## Where things stand (as of 2026-11-04)

| Area | State |
|---|---|
| App | Complete through ticket 21. 209 Vitest tests green, `tsc` clean, build clean. |
| Preview | Live at https://black-box.<tailnet>.ts.net/ (tailnet only). Deployed from the working tree by `scripts/deploy.sh`. Current build id shows at the foot of the info sheet. |
| Starling | Verified end to end on Tom's iPhone against the real API on 2026-11-04: a press moved money into the Space, an undo did not, an offline press moved on return. Relay is live on https://black-box.<tailnet>.ts.net:8443 via Tailscale Funnel. |
| GitHub | https://github.com/TAMNER/coffee-button. Main is pushed. Issues 1 to 21 closed except the device-check ones (1, 2, 3, 4, 5, 9, 11), which are Tom's to walk. Issue 22 (GitHub Pages) open. |
| Repo visibility | Still **private**. See "Blocked on GitHub" below. |
| Sounds | Only the synthesised coin clink plays. Pour and cheer are silent until recordings exist (see "Recordings"). |

## What Tom was about to do

1. Record three sounds with Voice Memos and Taildrop them to black-box (see Recordings).
2. Retry the two GitHub commands once the stuck visibility change clears.
3. Listen to the current build, which is clink-only.

## Blocked on GitHub

On 2026-11-04 GitHub had an incident (Git Operations, Issues, Actions degraded). Tom's first `gh repo edit --visibility public` got a 502, and every retry since says `A previous visibility change is still in progress`. The Pages call then fails with "Your current plan does not support GitHub Pages for this repository", which only means the repo is still private (free plan Pages needs public). Nothing on our side is wrong. When GitHub clears the stuck job, run in order:

```bash
gh repo edit TAMNER/coffee-button --visibility public --accept-visibility-change-consequences
gh api -X POST repos/TAMNER/coffee-button/pages -f build_type=workflow
gh workflow run pages.yml
```

Then confirm the run is green and https://tamner.github.io/coffee-button/ loads and installs from Safari, tick the last box in `.scratch/coffee-button/issues/22-github-pages.md`, and close issue 22. The auto-mode permission classifier refused to flip the repo public from an agent session ("Create Public Surface"), so Tom runs those himself.

Two git gotchas met today:
- The gh OAuth token originally lacked the `workflow` scope, so HTTPS pushes containing `.github/workflows/pages.yml` were refused. Tom ran `gh auth refresh -h github.com -s workflow`, which fixed it. The remote is currently HTTPS (`https://github.com/TAMNER/coffee-button.git`) with gh as the credential helper. SSH (`git@github.com:TAMNER/coffee-button.git`) also works but was flaky during the incident.
- "Internal Server Error" and "fatal error in commit_refs" on push were the GitHub incident, not the repo.

## Recordings

Drop files into `public/sounds/` (README there). `pour.m4a` (1 to 2 s of liquid into a cup; the app trims it to the pour length with a fade into the clink), `cheer.m4a` (a "woohoo", about 1 s), optionally `coin.m4a`. Missing files fall back: coin to synthesis, pour and cheer to silence (the synthesised versions sounded wrong on the iPhone and were removed on purpose). The service worker precaches `m4a` and `mp3`. From the iPhone: Voice Memos → Share → Tailscale → black-box, then on black-box:

```bash
tailscale file get ~/projects/coffee-button/public/sounds/
```

Rename to the names above, run `scripts/deploy.sh`, relaunch the app twice.

## Deploy, serve, relay

- `scripts/deploy.sh`: builds with `BUILD_ID=$(git rev-parse --short HEAD)`, writes and restarts two systemd user units (`coffee-button.service` → `scripts/serve.mjs` on 127.0.0.1:8794; `coffee-button-relay.service` → `scripts/relay.mjs` on 127.0.0.1:8795), runs `tailscale serve --bg --yes 8794`, and curls both. The relay funnel line is in the script but commented out; Tom ran it once by hand: `tailscale funnel --bg --yes --https=8443 8795`.
- Never put the app itself on Funnel. The relay port is the only public surface on black-box.
- Port 8787 is taken by another service on black-box; do not reuse it.
- `scripts/screenshot.mjs <out.png> [url] [js]` takes a 390x844 screenshot with headless Chrome over the DevTools protocol, bypassing the service worker and closing the info sheet. Use it to check layout before deploying. Plain `--screenshot` headless mode serves stale service-worker caches and was unreliable.

## iPhone facts learned the hard way

- iCloud Private Relay must be off or Tailscale MagicDNS names do not resolve; the raw IP is useless because the TLS certificate is for the name.
- A stale Home Screen app: open, wait ten seconds, swipe away, reopen. Still stale: open the URL in Safari, pull to reload twice, relaunch. Never delete the Home Screen icon without exporting first: the installed app has its own storage and deleting the icon deletes presses.
- Web Audio is muted by the ringer switch unless `navigator.audioSession.type = "playback"` (iOS 17+). Since ticket 23 the adapter no longer sets it: silent mode is respected by choice, and sounds no longer pause other apps' music.
- Haptics and audio unlock must run before the first `await` in the tap handler.

## Open design questions (ask Tom, do not decide)

- Settled (ticket 23, tester feedback 2026-11-17): the "playback" audio session is gone; silent mode is respected by choice and other apps' music keeps playing. No setting.
- Whether the cheer should be a human voice (Tom's own recording) or synthesised. Tom chose recordings.
- Monzo: build only when a Monzo-owning tester exists. Facts in DESIGN.md.
- Tailscale Funnel for friends was superseded by GitHub Pages; do not enable Funnel for the app.

## Process Tom expects

- Strict test-first: one failing test at a pre-agreed seam, minimal code, commit, repeat. DOM glue is written after the domain is green and declared as untested.
- Up to five Opus subagents in parallel for build work, each in its own git worktree, merged by hand into main. The Workflow tool must be launched with the shell's cwd inside the repo, or worktree creation fails with "not in a git repository".
- Tom reviews copy (banner phrases, info sheet) before it is pushed; show lists and wait.
- He grills designs with `/grill-me` before building; `/to-tickets` writes tickets to `.scratch/coffee-button/issues/` and mirrors them to GitHub issues with native blocked-by links.

## Ticket index

`.scratch/coffee-button/issues/01` to `22`, each with acceptance boxes and a Status line, mirrored to GitHub issues of the same number. 13 to 21 were built on 2026-11-04 from the round-one feedback. See `docs/DEVICE-CHECKLIST.md` for the phone walk-through, including the relay section.
