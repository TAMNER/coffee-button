# Coffee Button — Design

Agreed 2026-11-03 after a grilling session. This is the source of truth for V1.
Anything not listed under "Explicitly dropped" but also not listed as a feature
is out of scope until discussed.

## One sentence

A Home Screen web app that is just a coffee cup. Tap it when you skip buying a
coffee; a two-second ceremony plays and the coffee's price is added to a ledger
you clear into your Stocks and Shares ISA once a month.

## Product

- **Audience.** The author first; friends later via a shared link.
- **Main screen.** One cup, one tap. Running total for the current month under
  the cup. Long-press on the total opens settings.
- **Press.** Records an item (default: Coffee, £3.50) with timestamp. A 5-second
  undo toast reverses it. No hold-to-confirm.
- **Items.** Presses reference an item (name, icon, price). V1 shows only Coffee
  on screen; adding Beer etc. is a settings change, not a code change.
- **Ceremony on every press.** Pour, coin drop into the cup, cheer with
  confetti. Identical stimulus every time (Pavlovian), ~2 s, never blocks: the
  press is recorded before the animation starts and the user may leave
  mid-animation.
- **Two taps total.** Home Screen icon → tap the cup. No widgets.

## Money

- **Mechanism: ledger, monthly settle.** Real money does not move on the press.
  Revolut (the author's bank) has no personal API; Open Banking needs a company
  and a paid provider; a Starling float was rejected as inelegant. The ledger
  works on any bank, which is what friends need.
- **Settle day.** Payday is the 25th; settle day is the 26th. From settle day
  the main screen shows a single "Invest £X" button. It copies £X to the
  clipboard and opens InvestEngine (universal link to investengine.com, falling
  back to the App Store page). On return the app asks "Did you invest £X?"
  Yes clears the owed balance and plays the settle ceremony. "Not yet" leaves
  it owed.
- **Settle ceremony.** Bigger than the press ceremony: the month's coins cascade
  out of the cup, lifetime total ticks up on the shelf screen.
- **Missed months.** Owed balance rolls over. One reminder line per week on the
  shelf screen ("£X owed since October"). Never a modal, never a badge.
- **InvestEngine.** Stays. AutoInvest invests deposited cash without further
  action. Deposits from £1.
- **MoneyMover interface.** The ledger is one implementation. A Starling Space
  mover (personal access token → savings goal, no in-app prompt) is a documented
  future implementation. In a browser it would need a small proxy on black-box
  for CORS and request signing; it is a stub in docs, not code, until asked for.

## Motivation screen ("the shelf")

- **Pace line.** "At this rate you'll have £X by December."
- **Compounding line.** "£X at 5% for 10 years is £Y." Rate fixed at 5%.
- **Shelf.** Drawn big-ticket items (laptop, ski week, long-haul flight, used
  car, …) with rough editable prices, greyed until the lifetime total passes the
  price, then lit with "you could now buy this". Unreached items show progress.
  Up to three personal goals with a price.
- **Also shown.** Owed-since line when a settle is overdue. Nothing else.
- **Tone.** Whimsical objects. No mascot, no happy characters.

## Design process

- The author acts as a consultant choosing from options, not drawing.
- Three visual directions delivered as one interactive mockup page: cup screen,
  looping press ceremony, shelf with five items, each in its own palette and
  line style. Author picks one; two rounds of iteration; then the artwork
  becomes the real assets.
- All artwork is inline SVG. Confetti and pour are procedural.
- The app is built with placeholder shapes first so design happens against a
  working button.

## Stack

- Progressive Web App installed to the iOS Home Screen. Vanilla TypeScript,
  Vite, Web Animations API + CSS, Web Audio for the coin sound, IndexedDB for
  storage, service worker for offline.
- Haptics: iOS 18 `<input type="checkbox" switch>` toggle trick. Verify on
  device; degrade silently.
- Known losses vs native: ringer switch mutes audio; no scheduled local
  notifications.
- Reminder: the app offers an `.ics` with a monthly rule on settle day whose
  event links to the app URL. Added to Calendar once.
- Data: local only. JSON export and import. The app insists on Home Screen
  installation because Safari evicts non-installed site data after 7 days.
- Tests: Vitest for ledger, settle, projections, ics generation.

## Hosting

- Served from `black-box` (this machine, on the author's tailnet) via
  `tailscale serve` of the built `dist/` folder, which provides HTTPS.
- One deploy script: build, then point `tailscale serve` at `dist/`.
- Friends later: `tailscale funnel` makes the same site a public link.
- Devices on the tailnet today: black-box (linux), a Windows desktop, iphone-13.

## Explicitly dropped

Native iOS, Xcode, Apple Developer Program (£79/yr), any company, any payment
provider (TrueLayer, Yapily, GoCardless), Open Banking / VRP, Revolut
automation, a Starling float account, Apple Watch, Siri/Shortcuts, widgets,
accounts, server-side state, sync, iCloud, LLM-generated text, mascots.

## Deferred (discussed, parked)

Starling Space mover (needs proxy); Tailscale Funnel for friends; sync backend;
Rive if the cup grows many states; custom domain (~£10/yr).
