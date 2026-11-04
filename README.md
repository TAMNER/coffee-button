# Coffee Button

## What it is

A Home Screen web app that is just a coffee cup: tap it when you skip buying a
coffee and a two-second ceremony plays. The coffee's price is added to a ledger
you clear into your Stocks and Shares ISA once a month. See `docs/DESIGN.md`.

## Install on your iPhone

1. Open <https://tamner.github.io/coffee-button/> in Safari.
2. Tap Share, then Add to Home Screen.
3. Open Coffee Button from the Home Screen icon.

Use the installed app, not the Safari tab: the app keeps your data only when it
is installed on the Home Screen.

## Link Starling

1. In the app, open Settings and find the Starling section.
2. At <https://developer.starlingbank.com> create a Personal Access Token with
   these four scopes: `account:read`, `savings-goal:read`,
   `savings-goal:create`, `savings-goal-transfer:create`.
3. Paste the token, tap Connect, then pick a Space (or create a Coffee Button
   Space).

The token stays on your phone only.

## Run your own relay

Starling's API sends no CORS headers, so the app talks to it through a small
relay. To run your own, serve `node scripts/relay.mjs` behind HTTPS, then set
the Relay URL in the app's Settings to its address.

## Develop

```sh
npm ci
npm test
npm run dev
```

`BASE_PATH=/coffee-button/ npm run build` builds for the GitHub Pages sub-path;
without it the build serves from `/`.
