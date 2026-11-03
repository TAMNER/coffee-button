# 07: Shelf screen

**What to build:** A second screen reached by swiping up or tapping the total. It shows a pace line ("At this rate you'll have £X by December"), a compounding line ("£X at 5% for 10 years is £Y"), and a shelf of placeholder big-ticket items with editable rough prices that are greyed until the lifetime total passes their price, then lit with "you could now buy this". Unreached items show progress. Up to three personal goals with a price can be added on the shelf itself. An owed-since line appears when a settlement is overdue. Demo: seed a lifetime total and watch items light up.

**Blocked by:** 03 Press and ledger.

**Status:** ready-for-agent

- [ ] Pace projection uses presses this calendar year extrapolated to 31 December; unit tested
- [ ] Compounding uses fixed 5% annual over 10 years; unit tested
- [ ] Items light when lifetime total >= price; progress shown otherwise
- [ ] Up to three personal goals, add and remove, persisted
- [ ] Default item list of about ten items with editable prices
