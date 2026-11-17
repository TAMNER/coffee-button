# 30: Targets: one plank, three at most

**What to build:** The shelf becomes a single plank holding at most three targets, cheapest on the left and dearest on the right. The four built-in big-ticket items and the user's personal goals stop being two kinds of thing: they are one list of targets, and any of them can be removed. Built-ins keep their drawings; a target the user typed keeps the generic drawing. Removing a target opens the same confirm sheet as removing an item ("Remove Laptop?" with Remove and Keep). The name-and-price form adds a target while there are fewer than three and hides at three. Prices stay editable as they are today.

A new install starts with three: Weekend away £300, Laptop £1000, Ski week £1500.

A phone that already has more than three keeps the user's own goals first, then fills the remaining places with built-ins, cheapest first, at whatever price the user gave them. The other built-ins leave the shelf. Nothing the user typed is ever removed automatically. This runs once and gives the same answer if run again.

Tester feedback 2026-11-17 ("Target shelf needs only one layer. Allow removal of templates."); agreed in the grilling session of the same day (Q5, Q6, Q13, Q14, Q15, Q20).

**Blocked by:** 26 (Remove an item: the confirm sheet).

**Status:** built, awaiting review (not pushed; nothing on device yet)

- [x] The shelf view returns one list of at most three targets, sorted cheapest first; unit tested, failing first
- [x] A new install's targets are exactly Weekend away, Laptop and Ski week at their default prices; unit tested
- [x] Migration: with n personal goals and four built-ins, the result is the n goals plus the 3 − n cheapest built-ins at their edited prices; cases for n = 0, 1, 2, 3 unit tested; running it twice changes nothing
- [x] An export file made before this ticket imports and ends up with the same three targets the migration would give (unit tested)
- [x] Adding a fourth target is refused; removing any target, built-in or typed, works and is remembered (unit tested)
- [x] Lighting ("you could now buy this") and progress still follow the lifetime total (guard tests)
- [x] The shelf renders one plank, three across at 390px, with × on every target opening the confirm sheet (DOM glue, declared untested); the row-split test is changed to one row
- [x] Screenshot at 390x844 with one, two and three targets, both themes (.scratch/coffee-button/shots/{one,two,three,mixed,confirm}-{light,dark}.png)
