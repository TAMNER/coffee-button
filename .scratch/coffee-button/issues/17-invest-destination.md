# 17: Settle destination is the user's choice

**What to build:** InvestEngine is no longer assumed. Settings gains "Where do you invest?", a single URL field, blank by default. On settle day the "Invest £X" button copies the amount and opens that URL; with the field blank it only copies and the "Did you invest £X?" question still follows. Under the button, when nothing is set, one nudge: "Not sure how or where to invest? Open your stocks and shares ISA and invest in Vanguard funds. I recommend ESG Global All Cap UCITS ETF (V3AB)." The App Store fallback for InvestEngine goes away.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] InvestFlow takes the destination URL from settings; blank means copy only and still asks on the next return to the app; unit tested
- [ ] URL validation: http(s) only, otherwise the field shows an error and is not saved; unit tested
- [ ] Settings section "Where do you invest?" saves the URL; export/import carry it
- [ ] Nudge text shown under the Invest button only when no URL is set
- [ ] No remaining reference to InvestEngine in code or UI copy (DESIGN.md already updated)
