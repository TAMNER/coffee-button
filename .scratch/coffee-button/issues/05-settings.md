# 05: Settings

**What to build:** A long press on the total opens settings. There the user edits item prices, adds items such as Beer with an icon and price, sets the payday day of month (default 25), and exports or imports all data as a JSON file. Demo: add Beer at £6, change Coffee to £3.80, export, wipe site data, import, and everything is back.

**Blocked by:** 03 Press and ledger.

**Status:** ready-for-agent

- [ ] Long press on total opens settings; main screen stays a cup otherwise
- [ ] Items can be added, renamed, repriced; presses keep the price at time of press
- [ ] Payday stored and validated as 1 to 28
- [ ] Export produces a JSON file; import restores presses, items, settings, settlements
- [ ] Import of malformed JSON is rejected with a message and changes nothing
