# 06: Settle flow

**What to build:** The app tracks the owed balance: all presses since the last settlement. From the day after payday the main screen shows an "Invest £X" button. Pressing it copies £X to the clipboard and opens InvestEngine via a universal link with the App Store page as fallback. On return the app asks "Did you invest £X?"; yes records a settlement and clears the owed balance; not yet leaves it owed. A missed month rolls over and the shelf screen shows one weekly line such as "£X owed since October". Demo: set a fake clock past settle day, settle, confirm, owed balance is zero.

**Blocked by:** 03 Press and ledger.

**Status:** done

- [x] Owed balance equals presses since last settlement; unit tested across month boundaries
- [x] Invest button appears only from payday + 1 while owed balance is non-zero
- [x] Clipboard gets the amount formatted as pounds and pence
- [x] InvestEngine opens; fallback to App Store page if the link fails
- [x] Settlement records amount and date; confirmation prompt appears on return
- [x] Rollover line text correct for an unsettled prior month

Notes:
- Tested in src/domain/settle.test.ts and src/domain/invest.test.ts. The UI (src/ui/settle.ts) is not unit tested and has not been checked in a browser or on the iPhone. The real window.open failure check and the clipboard write inside the tap still need checking on the device (ticket 11).
- isSettleWindow and overdueLine take `owedSince` (the oldest unsettled press, from owedSince()) rather than the last settlement date. A settlement date alone cannot tell October money from November money. With it, a 26 Oct settlement followed only by November presses would wrongly show "Invest" on 1 Nov. Money counts as overdue when it dates from before the current calendar month. overdueLine therefore takes (now, owedSince, owedPence), with no payday argument.
- The weekly cadence of the reminder line is left to the shelf screen (ticket 07), which shows it. overdueLine only produces the text.
- Review (2026-11-03): the shelf now uses `weeklyOverdueLine(store, now)` (src/domain/settle.ts), which was never wired before; it shows at most once every 7 days (`Settings.overdueShownAt`). A Yes settles as of the Invest tap, so presses made while the prompt is up stay owed. The pending invest is saved in `Settings.pendingInvest` and asked about again on boot (under 24 h), so iOS killing the app in InvestEngine no longer loses the question. A refused clipboard write no longer aborts the flow.
- cup.ts gained a below-total slot (registerBelowTotal) for the Invest button.
