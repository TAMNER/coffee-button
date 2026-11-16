# Device checklist

Run on the iPhone 13 (iOS 18 or later), in Safari, from the app's Tailscale
URL serving a production build (`npm run build`). Tick each box only when the
expected result happens. Anything that fails gets a fix ticket in
`.scratch/coffee-button/issues/` before ticket 11 closes.

> Before you start: iCloud Private Relay must be off on the phone (Settings,
> your name, iCloud, Private Relay), or at least "Limit IP Address Tracking"
> off for this Wi-Fi. Private Relay resolves Safari's DNS through Apple, so the
> Tailscale MagicDNS name never resolves and the page spins forever. Found
> 2026-11-03. The raw IP is no use: the certificate is for the name only.

Before starting: ring/silent switch off silent, volume up, and
Settings > Sounds & Haptics > System Haptics on.

## 1. Install to Home Screen

- [ ] Open the Tailscale URL in Safari, tap Share > Add to Home Screen > Add.
  - Expected: the icon appears on the Home Screen labelled "Coffee". Opening it
    shows the cup full screen with no Safari address bar or toolbar.
- [ ] Compare the Safari tab with the Home Screen app.
  - Expected: the Safari tab shows a dark banner asking to Add to Home Screen
    (data is deleted after 7 days in a tab); the Home Screen app has no banner.

## 2. Offline launch

- [ ] Open the app once from the Home Screen while online, close it (swipe it
  away in the app switcher), turn on Airplane Mode, then open it again.
  - Expected: the cup screen loads with the month total; no Safari "offline"
    page. Earlier presses are still counted.
- [ ] Turn Airplane Mode off again before section 8.

## 3. Press with sound and haptic

- [ ] Tap the cup.
  - Expected: a two-note coin clink plays and the phone gives one light haptic
    tap. The press ceremony plays. The total under the cup goes up by £3.50 and
    reads "£X.XX this month". An "+£3.50 / Undo" toast appears.
- [ ] Close and reopen the app.
  - Expected: the total is the same as before closing.

## 4. Undo

- [ ] Tap the cup, then tap Undo within 5 seconds.
  - Expected: the toast disappears and the total drops back by £3.50.
- [ ] Tap the cup and wait more than 5 seconds.
  - Expected: the toast disappears by itself and the press stays counted.

## 5. Long press for settings

- [ ] Press and hold the month total for about a second.
  - Expected: Settings opens (sections Items, Payday, Data, Shelf prices,
    Reminder). No iOS text-selection or callout menu appears.
- [ ] Tap Done.
  - Expected: back on the cup screen.

## 6. Add Beer

- [ ] In Settings > Items, enter Icon "beer", Name "Beer", Price "6.00", tap Add.
  - Expected: "Added Beer at £6.00." shows and Beer appears in the item list.
- [ ] Close and reopen the app, long press the total again.
  - Expected: Beer is still listed at 6.00.

## 7. Tap to shelf

- [ ] On the cup screen, tap the month total briefly.
  - Expected: the shelf opens with the "At this rate you'll have £X by
    the end of the year." line, the compound line, and the shelf items with progress bars.
- [ ] Tap the down arrow (or swipe down).
  - Expected: back on the cup screen. Swiping up on the cup screen opens the
    shelf too, and the swipe does not count as a press.

## 8. Settle flow

The Invest button only shows from the day after payday. If today is not after
payday, set Settings > Payday to a day earlier than today first.

- [ ] With at least one press this month, check under the total.
  - Expected: an "Invest £X" button showing the amount owed.
- [ ] With Settings > Where do you invest? blank, check under the button.
  - Expected: "Not sure how or where to invest? Open your stocks and shares
    ISA and invest in Vanguard funds. I recommend ESG Global All Cap UCITS ETF
    (V3AB)."
- [ ] Tap "Invest £X" with the field still blank, leave to another app, and
  come back.
  - Expected: nothing opens; "Did you invest £X?" shows on return. Tap Not yet.
- [ ] In Settings > Where do you invest?, type "example" and tap away.
  - Expected: an inline error; the field is not saved.
- [ ] Enter the https link of your own investing app or site and tap away.
  - Expected: a confirmation line; back on the cup screen the nudge is gone.
- [ ] Tap "Invest £X".
  - Expected: your link opens.
- [ ] There, long press an amount field and Paste.
  - Expected: the owed amount pastes as a plain number, e.g. "12.50" (no £).
- [ ] Return to Coffee Button (app switcher or the top-left back link).
  - Expected: "Did you invest £X?" with Yes and Not yet; the Invest button is
    hidden while it shows.
- [ ] Tap Not yet.
  - Expected: the prompt closes and "Invest £X" is back with the same amount.
- [ ] Tap Invest again, return, and tap Yes.
  - Expected: one haptic tap on Yes, then the settle ceremony plays (coins
    cascade out of the cup), then the shelf shows the lifetime invested ticking up to the
    new total. The Invest button is gone afterwards.

- [ ] Make another press, tap Invest, and while in your investing app swipe Coffee
  Button away in the app switcher. Reopen it from the Home Screen.
  - Expected: "Did you invest £X?" appears straight away. Tap Not yet.
- [ ] Return to the cup after a few seconds in another app, then tap the cup.
  - Expected: the coin clink still plays (audio resumes after backgrounding).

## 9. Calendar reminder import

- [ ] Settings > Reminder > Add monthly reminder.
  - Expected: iOS offers coffee-button.ics; choosing to add it opens Calendar
    with an event on settle day (the day after payday) at 09:00, repeating
    monthly.
- [ ] Add the event and open it in Calendar.
  - Expected: it is on the next settle day still to come, the notes read
    "Settle day. Open <app URL> and invest what you saved.", and tapping the
    URL opens the app at the Tailscale URL.

## 10. Export then import

- [ ] Settings > Data > Export.
  - Expected: "Exported." shows and iOS offers coffee-button-YYYY-MM-DD.json;
    save it to Files.
- [ ] Tap the cup twice so the data differs from the export.
- [ ] Settings > Data > Import, pick the saved file, confirm "Replace everything
  in the app with this file?".
  - Expected: "Imported. Everything is back." The month total, Beer, payday,
    goals and the settlement from section 8 match the moment of export (the two
    extra presses are gone).
- [ ] Import a file that is not an export (any other .json, or cancel the confirm).
  - Expected: an error message in red, or nothing changes on cancel; existing
    data is untouched.

## 11. Starling relay

Starling sends no CORS headers, so the app talks to it through a small relay
(`scripts/relay.mjs`, Node built-ins only). It forwards only
`GET /api/v2/accounts`, `GET`/`PUT /api/v2/account/{uid}/savings-goals` and
`PUT /api/v2/account/{uid}/savings-goals/{uid}/add-money/{uid}`; everything
else gets 403. It passes the Authorization header through and logs nothing but
one startup line, so the token is never written anywhere.

- Relay URL shape (the value for the relay field in Settings):
  `https://black-box.<tailnet>.ts.net:8443`, with no trailing path.
- One-time, by the author on black-box after `scripts/deploy.sh` has installed
  `coffee-button-relay.service`: `tailscale funnel --bg --yes --https=8443 8795`.
  Only the relay is public; the app itself stays tailnet-only.
- [ ] On black-box: `curl -i http://127.0.0.1:8795/`.
  - Expected: `403` with `{"error":"forbidden"}` (healthy: the root is not on
    the allow-list).
- [ ] From a phone off the tailnet: open `https://black-box.<tailnet>.ts.net:8443/`.
  - Expected: the same 403 JSON over HTTPS.

**A friend running their own relay:** copy `scripts/relay.mjs` and
`scripts/relay-rules.mjs` anywhere with Node 18 or newer, run
`RELAY_PORT=8795 node scripts/relay.mjs` (it listens on 127.0.0.1 only), and
put any HTTPS in front of it: their own `tailscale funnel`, Caddy, nginx or a
similar TLS proxy. Then paste that HTTPS origin into the relay field in
Settings.
