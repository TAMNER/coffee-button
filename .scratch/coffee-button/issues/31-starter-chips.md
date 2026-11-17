# 31: Starter chips under the plank

**What to build:** The four built-in targets (Weekend away, Espresso machine, Laptop, Ski week) are starters. Any starter not currently on the plank shows as a one-tap chip under it, beside the name-and-price form, for example "Espresso machine £400". Tapping a chip puts that starter on the plank with its own drawing, at the price the user last gave it or its default. A starter on the plank has no chip. With three targets on the plank the chips hide along with the form. This is how a removed starter, and its drawing, comes back.

Agreed in the grilling session of 2026-11-17 (Q14).

**Blocked by:** 30 (Targets: one plank, three at most).

**Status:** built, awaiting review (not pushed; nothing on device yet). Chip label is "<name> <formatPounds(price)>", e.g. "Espresso machine £400.00", matching the plank's prices; copy for Tom to review.

- [x] The starters available as chips are the built-ins not on the plank, cheapest first, each with its current price; unit tested, failing first
- [x] Adding a starter puts it on the plank with its built-in drawing and remembered price; unit tested
- [x] With three targets there are no chips (unit tested)
- [x] Chips render under the plank beside the form and wrap cleanly at 390px (DOM glue, declared untested; screenshot in both themes: .scratch/coffee-button/shots/31-{three,two,one,chip-tapped}-{light,dark}.png)
