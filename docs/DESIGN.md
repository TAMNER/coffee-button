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
- **Items.** Presses reference an item (name, icon, price). Coffee (£3.50),
  Beer (£6.00) and Lunch (£8.00, a sandwich on a plate) are seeded; more items
  are a settings change, not a code change. A horizontal swipe on the main
  screen cycles the active item, the vessel slides out and the next slides in,
  and the press uses that item's price (added 2026-11-03, ticket 12; Lunch
  2026-11-04). Faint cobalt chevrons at cup height (tappable) and at the
  bottom of the screen signify the swipes.
- **Removing an item (2026-11-17, ticket 26).** Every item but Coffee can be
  removed from its row in Settings. Coffee is permanent, but can be renamed,
  repriced and given another picture (a tea drinker makes it "Tea"). A removed
  Beer or Lunch stays removed, through export and import too; it comes back
  only by adding it again by hand. Presses keep their own price, so everything
  already saved stays in every total. If the removed item was on the main
  screen, the cup moves to the next item.
- **Pictures (2026-11-17, tickets 27 to 29).** An item's picture is chosen
  from a fixed set of six drawn by us: cup, pint, plate, jar, pastry (an iced
  muffin) and bag (a carrier bag). Settings shows them as a row of tappable
  tiles on every item and on the add form; the free-text icon box is gone. The
  jar is the "anything else" picture and what an unrecognised name shows. New
  pictures ship in releases: a friend asks, it is drawn, it arrives. Nothing is
  ever generated on request.
- **One way to remove anything.** Removing an item or a shelf target opens the
  app's own Cut Paper sheet ("Remove Beer? Your savings stay.", Remove / Keep).
  No browser confirm box, and nothing is removed without it.
- **Ring.** Curved text around the button like a stamp: "SKIP AND SAVE" over
  the top arc, the active item and price ("COFFEE £3.50") on the bottom arc,
  permanent, updating on swipe.
- **Info.** A small i in the top-left opens a sheet. Since 2026-11-17 (ticket
  24) its copy is the author's own: the idea, the money, how saving works
  (Starling users' savings grow in their Coffee Button Space; everyone else
  gets a tally), how investment works, then the swipes and an Add to Home
  Screen hint. The words a user sees are "Invest £X" and "Space"; "settle day"
  and "investment day" are names for the code and these docs only.
- **Ceremony on every press.** Pour, coin drop into the cup, cheer with
  confetti. Beer pours amber ale with a cream foam head. Lunch has no pour:
  the coin drops onto the plate, the sandwich hops, confetti as usual. The jar,
  pastry and bag follow the plate: coin lands, the object hops, no pour and no
  pour sound. Identical stimulus every time (Pavlovian), ~2 s, never blocks: the
  press is recorded before the animation starts and the user may leave
  mid-animation.
- **Two taps total.** Home Screen icon → tap the cup. No widgets.

## Money

- **Mechanism: ledger first, optional bank mover.** Every press is a ledger
  entry. With no bank linked, nothing moves until settle day. With Starling
  linked (round-one feedback, 2026-11-04), every press that survives the 5 s
  undo window moves the item's price from the main account into a Starling
  Space, so the money is physically out of reach within seconds. Offline or
  relay-down presses stay in the ledger marked waiting and are retried on the
  next launch or return to the app. Problems surface only as a line in
  Settings ("2 presses waiting to move") or a banner on the cup when Starling
  rejects the token. Undo never reverses a real transfer.
- **Starling specifics (checked 2026-11-04).** Personal Access Token, no
  company needed, never expires, 5 req/s and 1000 req/day. Space transfers
  (`add-money` on a savings goal) need only the `savings-goal-transfer:create`
  scope and no in-app approval. The API sends no CORS headers, so the browser
  cannot call it: a relay is required. The token lives in IndexedDB on the
  phone only, never in the repo or on a server's disk.
- **Relay.** One plain Node file on black-box, exposed on its own port by
  Tailscale Funnel (the app is not on Funnel). It forwards only Starling's
  accounts and savings-goal paths, never logs, and its URL is a Settings field
  so a friend can run their own copy. Cloudflare Workers was considered and
  declined by the author (self-host preferred).
- **Space.** After pasting the token the app lists existing Spaces to pick one,
  with "Create a Coffee Button Space" at the top. Nothing is created silently.
  Money stays in the Space; the author moves it on from the Starling app.
- **Monzo.** Wanted, built when a tester exists. Facts: the developer API is
  "not suitable for public applications", a client may only connect to its
  creator's account plus a hand-picked few, tokens last about 6 hours (refresh
  tokens only for confidential clients), every login needs approval in the
  Monzo app. CORS is open, so no relay. It will never be a one-tap link for
  the public.
- **Settle day.** Payday is the 25th; settle day is the 26th. From settle day
  the main screen shows "Invest £X". It copies £X to the clipboard and opens
  the destination the user set once in Settings ("Where do you invest?", blank
  by default; blank means copy only). On return the app asks "Did you invest
  £X?" Yes clears the owed balance and plays the settle ceremony. With a
  Space linked the screen also says "£X is waiting in your Coffee Button
  Space". InvestEngine is no longer assumed: friends use whatever they use.
- **Pretend date (2026-11-17, ticket 35).** A tester can open the app as if
  today were another day (Settings, last section) to walk "Invest £X" without
  waiting for it. It is look-only for money: ceremonies play, but no press or
  settle is saved and no transfer is sent, and a notice above every screen
  says so. The date lives outside Settings, so it is never exported.
- **Fund nudge.** Under the button, for people with nothing set: "Not sure how
  or where to invest? Open your stocks and shares ISA and invest in Vanguard
  funds. I recommend ESG Global All Cap UCITS ETF (V3AB)."
- **Settle ceremony.** Bigger than the press ceremony: the month's coins cascade
  out of the cup, lifetime total ticks up on the shelf screen.
- **Missed months.** Owed balance rolls over. One reminder line per week on the
  shelf screen ("£X owed since October"). Never a modal, never a badge.
- **MoneyMover interface.** LedgerMover (no-op) and StarlingMover (per-press
  Space transfer with a persisted queue). Monzo is the next implementation.

## Motivation screen ("the shelf")

- **Pace line.** "At this rate you'll have £X by the end of the year."
  Measured from the first press (counting at least 7 days) and projected
  through 31 December. Before the first press the shelf shows "Tap the cup
  every time you walk past the café." instead of the sums (2026-11-16).
- **Compounding line.** "£X at 5% for 10 years is £Y." Rate fixed at 5%.
- **Shelf: one plank of targets (2026-11-17, tickets 30 and 31).** A single
  plank holds at most three targets, cheapest on the left. There is one kind
  of target: the four drawn starters (weekend away £300, espresso machine
  £400, laptop £1000, ski week £1500; cut from ten on 2026-11-04) and anything
  the user types are the same thing, and any of them can be removed. Starters
  keep their drawings and editable prices; a typed target gets the generic
  drawing. Each is greyed until the lifetime total passes its price, then lit
  with "you could now buy this"; unreached targets show progress. A new
  install starts with weekend away, laptop and ski week. Under the plank a
  name-and-price form adds a target, and any starter not on the plank shows as
  a one-tap chip that puts it back; form and chips hide when the plank is
  full. This replaced two rows of built-ins plus a row of up to three goals,
  which testers found too busy.
- **Older phones.** A phone from before the single plank keeps every goal the
  user typed and fills the remaining places with starters, cheapest first at
  the user's prices; the other starters leave the plank. It runs once.
  Nothing the user typed is ever removed automatically.
- **Latte graph (2026-11-17, tickets 32 and 33).** Under the plank, savings
  over time as a row of seven latte glasses on a cobalt tray. The days since
  the first press (at least seven) are shared out evenly among the glasses, so
  early on each glass is a day and later each is a few weeks; the row always
  runs from the first press to today. Each glass is filled to what had been
  saved by then: the top of the cream froth is the total saved, dark coffee
  under it is what had been invested, light latte is saved and still waiting.
  Steam curls off the newest glass. The only labels are "£X saved" and
  "£Y invested" (pence shown when there are any; "£0 invested" shown before
  the first invest), the first month and "today". No gridlines, no axis
  numbers, nothing to tap. The drink pours in once when the shelf opens, and
  simply appears under reduced motion. Absent before the first press. The
  author rejected two smoother versions (area charts, then cut-paper waves)
  before choosing bars as glasses; do not go back to a curve.
- **Also shown.** Owed-since line when a settle is overdue. Nothing beyond
  the pace line, the compounding line, the plank and the graph.
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
  device; degrade silently. On iPhone a web app gets one light tick, and only
  inside the tap itself, so no pattern or stronger buzz is possible there
  (ticket 36). Where `navigator.vibrate` exists (Android), the tap requests one
  pattern timed to the ceremony, and a longer one for a settle.
- Known losses vs native: no scheduled local notifications. The ringer
  switch mutes the sounds by choice (ticket 23): on silent a press gives its
  vibration tick only, and sounds never pause other apps' music. A web app
  cannot see headphones or the switch, so there is no "play with headphones".
- Reminder: the app offers an `.ics` with a monthly rule on settle day whose
  event links to the app URL. Added to Calendar once.
- Data: local only. JSON export and import. The app insists on Home Screen
  installation because Safari evicts non-installed site data after 7 days.
- Tests: Vitest for ledger, settle, projections, ics generation.

## Hosting

- Author's preview: served from `black-box` (on the author's tailnet) by a
  small Node static server behind `tailscale serve`, which provides HTTPS.
  One deploy script.
- Friends: the public repo publishes the built app to GitHub Pages. Friends
  open the link in Safari and Add to Home Screen. No accounts, no server
  state, each phone keeps its own data.
- Starling relay: Node on black-box, its own port on Tailscale Funnel.
- Devices on the tailnet today: black-box (linux), a Windows desktop, iphone-13.

## Explicitly dropped

Native iOS, Xcode, Apple Developer Program (£79/yr), any company, any payment
provider (TrueLayer, Yapily, GoCardless), Open Banking / VRP, Revolut
automation, a Starling float account, Apple Watch, Siri/Shortcuts, widgets,
accounts, server-side state, sync, iCloud, LLM-generated text, mascots.

## Deferred (discussed, parked)

Monzo mover (needs a tester); sync backend;
Rive if the cup grows many states; custom domain (~£10/yr).
