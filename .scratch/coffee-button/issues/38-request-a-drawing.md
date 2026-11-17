# 38: Request a drawing

**What to build:** Tom, after trying the picture picker on his phone (2026-11-17): "Add a request drawing button and I can go work on requests." Pictures are a fixed set drawn by hand and shipped in releases (design doc), so a friend who wants a picture that is not there needs a way to ask. In Settings, under the picture row of the add-item form, there is a line and a button: "Want a picture that isn't here?" and "Request a drawing". Tapping it opens the place Tom receives requests, with a short message already filled in that says what the request is for (the item's name if the user has typed one in the add form).

Where requests go is not decided yet and is Tom's choice (an email address, or a form he makes). The app has no server and no accounts, so the destination is a link. It is set at build time, like the default relay address, so no personal address lives in the repository: a `mailto:` address or an `https:` form link. A build with no destination shows no button and no line. An email address that is built in is visible to anyone who opens the app; the ticket says so plainly so Tom chooses with that in mind.

Proposed copy, for Tom to review: the line "Want a picture that isn't here?", the button "Request a drawing", and the prefilled message "Coffee Button drawing request" as the subject with the body "I'd like a drawing for: <item name>".

**Blocked by:** None (can start immediately). Going live waits on Tom choosing the destination.

**Status:** built, waiting on Tom (destination and copy review). Domain in `src/domain/drawing-request.ts`, glue in `src/ui/drawing-request.ts`; screenshots `shots/38-*`.

- [x] A pure function builds the request link from the configured destination and the item name: a `mailto:` destination gets the subject and body, correctly encoded; an `https:` destination is opened as it is; anything else, or nothing configured, gives no link; unit tested, failing first
- [x] An item name with spaces, an ampersand, a question mark or a pound sign survives into the message intact (unit tested)
- [x] With no destination built in, Settings shows no line and no button (guard test on the function; DOM glue declared untested)
- [x] The destination comes from a build-time variable, documented beside the relay variable in the deploy scripts' comments; no address is committed
- [x] The line and button sit under the add form's picture row and read well at 390px in both themes (screenshot, taken with a made-up destination)
- [ ] Tom has chosen the destination and reviewed the copy
