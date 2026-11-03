# Device checklist

Run on the iPhone 13 (iOS 18 or later), in Safari, from the app's Tailscale
URL serving a production build (`npm run build`). Tick each box only when the
expected result happens. Anything that fails gets a fix ticket in
`.scratch/coffee-button/issues/` before ticket 11 closes.

Before starting: ring/silent switch off silent, volume up, and
Settings > Sounds & Haptics > System Haptics on.

## 1. Install to Home Screen

- [ ] Open the Tailscale URL in Safari, tap Share > Add to Home Screen > Add.
  - Expected: the icon appears on the Home Screen labelled "Coffee". Opening it
    shows the cup full screen with no Safari address bar or toolbar.

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
    December." line, the compound line, and the shelf items with progress bars.
- [ ] Tap the down arrow (or swipe down).
  - Expected: back on the cup screen. Swiping up on the cup screen opens the
    shelf too, and the swipe does not count as a press.

## 8. Settle flow

The Invest button only shows from the day after payday. If today is not after
payday, set Settings > Payday to a day earlier than today first.

- [ ] With at least one press this month, check under the total.
  - Expected: an "Invest £X" button showing the amount owed.
- [ ] Tap "Invest £X".
  - Expected: the InvestEngine app opens (or investengine.com if the app is not
    installed; the App Store page if neither can open).
- [ ] In InvestEngine, long press an amount field and Paste.
  - Expected: the owed amount pastes as a plain number, e.g. "12.50" (no £).
- [ ] Return to Coffee Button (app switcher or the top-left back link).
  - Expected: "Did you invest £X?" with Yes and Not yet; the Invest button is
    hidden while it shows.
- [ ] Tap Not yet.
  - Expected: the prompt closes and "Invest £X" is back with the same amount.
- [ ] Tap Invest again, return, and tap Yes.
  - Expected: the settle ceremony plays (coins cascade out of the cup with
    haptic taps), then the shelf shows the lifetime invested ticking up to the
    new total. The Invest button is gone afterwards.

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
