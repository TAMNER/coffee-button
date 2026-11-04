# 18: Starling relay on black-box

**What to build:** A plain Node relay (built-ins only) that forwards requests from the app to api.starlingbank.com, because Starling sends no CORS headers. It accepts only GET /api/v2/accounts, GET and PUT /api/v2/account/{uid}/savings-goals, and PUT /api/v2/account/{uid}/savings-goals/{uid}/add-money/{uid}; everything else is 403. It passes the Authorization header through, adds permissive CORS headers for any origin, answers preflight, and logs nothing but a startup line. It runs as a systemd user service on its own local port and is exposed publicly on its own port by Tailscale Funnel. The deploy script installs it alongside the static server.

**Blocked by:** None (can start immediately).

**Status:** done (relay + tests + deploy unit; the funnel line is in deploy.sh commented out for the author to run once by hand)

- [x] The allow rule (method + path → allowed) is a pure function in its own module, unit tested with allowed, denied and traversal-style paths
- [x] Relay handles OPTIONS preflight with the CORS headers; forwards body and Authorization; returns upstream status and JSON unchanged
- [x] No request logging; token never written anywhere
- [x] Deploy script installs coffee-button-relay.service and runs `tailscale funnel --bg --yes <port>` for the relay port only; the app's own port stays tailnet-only. DO NOT run the funnel command in the ticket; add it to the script and document the one-liner for the author to run
- [x] README/DEVICE-CHECKLIST notes the public relay URL shape and how a friend runs their own
