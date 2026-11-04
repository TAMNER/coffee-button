# 17: Settle destination is the user's choice

**What to build:** InvestEngine is no longer assumed. Settings gains "Where do you invest?", a single URL field, blank by default. On settle day the "Invest £X" button copies the amount and opens that URL; with the field blank it only copies and the "Did you invest £X?" question still follows. Under the button, when nothing is set, one nudge: "Not sure how or where to invest? Open your stocks and shares ISA and invest in Vanguard funds. I recommend ESG Global All Cap UCITS ETF (V3AB)." The App Store fallback for InvestEngine goes away.

**Blocked by:** None (can start immediately).

**Status:** done (pending device check)

- [x] InvestFlow takes the destination URL from settings; blank means copy only and still asks on the next return to the app; unit tested
- [x] URL validation: http(s) only, otherwise the field shows an error and is not saved; unit tested
- [x] Settings section "Where do you invest?" saves the URL; export/import carry it
- [x] Nudge text shown under the Invest button only when no URL is set
- [x] No remaining reference to InvestEngine in code or UI copy (DESIGN.md already updated)

## Notes

- InvestFlow reads `settings.investUrl` in `resume()` (run on every mount and every return to the app) and opens it synchronously in `invest()`, because Safari only allows `window.open` inside the tap's user activation, before any await.
- Import refuses a file whose `investUrl` is not an http(s) link, since the app would open it.
- The settings section and the nudge are DOM glue (no DOM test environment); the rules are in `validateInvestUrl` / `setInvestUrl` (src/domain/settings.ts).
