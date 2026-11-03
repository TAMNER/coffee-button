# 08: Settle ceremony

**What to build:** When the user confirms a settlement, a bigger ceremony plays: the month's coins cascade out of the cup and the lifetime total on the shelf ticks up to its new value. Demo: settle and watch.

**Blocked by:** 04 Press ceremony; 06 Settle flow.

**Status:** done

- [x] Ceremony plays once per confirmed settlement
- [x] Coin count in the cascade reflects the number of presses settled, capped for performance
- [x] Lifetime total animates to the new value
- [x] Settlement is persisted before the animation starts

## Notes

- Tested (Vitest): `cascadeCount` (0 -> 0, 12 -> 12, 100 -> 40) and `tickerFrames` (2400 -> 3650 in 5 steps gives 2400, 2650, 2900, 3150, 3400, 3650) in src/domain/settle-ceremony.test.ts. In src/ui/settle-ceremony.test.ts, `wireSettleCeremony` is driven through `InvestFlow` with `onSettled` emitting `settle` on a bus, as src/ui/settle.ts does: the settlement is already in the store when play is called. A second test at the same seam checks the plan: £24.00 settled in October, then three November presses (£3.50, £3.50, £5.50) settled as £12.50, plays 3 coins and ticks £24.00 to £36.50.
- "Lifetime total" here means lifetime invested, the sum of all settlements. The ledger's press lifetime does not change on a settle, so it cannot tick up. The figure appears in an "Invested so far" card over the shelf screen. The shelf itself also refreshes on `settle` (ticket 07).
- Sequence: one haptic tap, then the cup tips and the coins (one per press settled since the previous settlement, at most 40) burst out and fall off screen with confetti (~1.6 s). Then the app shows the shelf and the card ticks up over ~1.2 s, holds and fades. The ceremony plays once for each `settle` event.
- ceremony.ts change: `export` was added to `CONFETTI_COLOURS`, `mulberry32`, `wait`, `svgEl` and `animate`. Nothing else in that file changed.
- Not tested, by design (thin DOM): the cascade overlay and the ticker card. They are typechecked and built but have not been run in a browser or on the iPhone (ticket 11).
