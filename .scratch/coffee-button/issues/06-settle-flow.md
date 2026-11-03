# 06: Settle flow

**What to build:** The app tracks the owed balance: all presses since the last settlement. From the day after payday the main screen shows an "Invest £X" button. Pressing it copies £X to the clipboard and opens InvestEngine via a universal link with the App Store page as fallback. On return the app asks "Did you invest £X?"; yes records a settlement and clears the owed balance; not yet leaves it owed. A missed month rolls over and the shelf screen shows one weekly line such as "£X owed since October". Demo: set a fake clock past settle day, settle, confirm, owed balance is zero.

**Blocked by:** 03 Press and ledger.

**Status:** ready-for-agent

- [ ] Owed balance equals presses since last settlement; unit tested across month boundaries
- [ ] Invest button appears only from payday + 1 while owed balance is non-zero
- [ ] Clipboard gets the amount formatted as pounds and pence
- [ ] InvestEngine opens; fallback to App Store page if the link fails
- [ ] Settlement records amount and date; confirmation prompt appears on return
- [ ] Rollover line text correct for an unsettled prior month
