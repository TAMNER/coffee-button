#!/usr/bin/env bash
# Build Coffee Button and serve dist/ over HTTPS on the tailnet from black-box.
#
#   scripts/deploy.sh
#
# How it works: a tiny Node static server (scripts/serve.mjs) runs as a systemd
# user service on 127.0.0.1:8794, and `tailscale serve` proxies the tailnet
# HTTPS name to it. Tailscale only lets root serve a filesystem path, but an
# operator user may proxy a local port, hence the extra process.
#
# One-time setup already done on black-box: `sudo tailscale set --operator=openclaw`
# and lingering is enabled for the user (so the service survives logout/reboot).
# The app stays tailnet-only. Only the Starling relay (scripts/relay.mjs, port
# 8795) is public, via Tailscale Funnel on :8443 (see docs/DESIGN.md).
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
PORT=8794  # 8787 is taken by another service on black-box
UNIT_DIR="$HOME/.config/systemd/user"
UNIT="$UNIT_DIR/coffee-button.service"

if [ ! -d node_modules ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  npm ci
fi

# The tailnet build keeps a relay address built in; a build without the variable ships none.
# VITE_DRAWING_REQUEST_URL (ticket 38): where "Request a drawing" in Settings goes, a mailto:
# address or an https: form link. Not set here; export it before running to build one in.
# With none, the line and button are not shown.
# A built-in email address is visible to anyone who opens the app.
# This machine's tailnet name is read from Tailscale, never written in the repository.
TS_HOST="$(tailscale status --json | python3 -I -c 'import json,sys; print(json.load(sys.stdin)["Self"]["DNSName"].rstrip("."))')"
BUILD_ID="$(git rev-parse --short HEAD)" VITE_DEFAULT_RELAY_URL="${VITE_DEFAULT_RELAY_URL:-https://$TS_HOST:8443}" npm run build

mkdir -p "$UNIT_DIR"
cat > "$UNIT" <<UNIT
[Unit]
Description=Coffee Button static server (dist/ on 127.0.0.1:$PORT)
After=network.target

[Service]
ExecStart=$(command -v node) $ROOT/scripts/serve.mjs
Environment=PORT=$PORT HOST=127.0.0.1
Restart=always
RestartSec=2

[Install]
WantedBy=default.target
UNIT

# Starling relay (ticket 18): scripts/relay.mjs on 127.0.0.1:$RELAY_PORT.
RELAY_PORT=8795
RELAY_UNIT="$UNIT_DIR/coffee-button-relay.service"
cat > "$RELAY_UNIT" <<UNIT
[Unit]
Description=Coffee Button Starling relay (127.0.0.1:$RELAY_PORT)
After=network.target

[Service]
ExecStart=$(command -v node) $ROOT/scripts/relay.mjs
Environment=RELAY_PORT=$RELAY_PORT
Restart=always
RestartSec=2

[Install]
WantedBy=default.target
UNIT

systemctl --user daemon-reload
systemctl --user enable --now coffee-button.service >/dev/null
systemctl --user restart coffee-button.service
systemctl --user enable --now coffee-button-relay.service >/dev/null
systemctl --user restart coffee-button-relay.service

# Idempotent: re-running re-points the same HTTPS mapping at the same port.
tailscale serve --bg --yes "$PORT" >/dev/null

# The relay alone goes on the public internet, on its own HTTPS port; the app's
# port above stays tailnet-only. The author runs this once by hand (Funnel
# config persists), so it stays commented out here:
# tailscale funnel --bg --yes --https=8443 8795

sleep 1
systemctl --user is-active coffee-button.service
curl -fsS -o /dev/null -w "local   %{http_code}\n" "http://127.0.0.1:$PORT/"
systemctl --user is-active coffee-button-relay.service
# The relay refuses everything off its allow-list, so 403 here means healthy.
curl -sS -o /dev/null -w "relay   %{http_code} (expect 403)\n" "http://127.0.0.1:$RELAY_PORT/"
URL="https://$TS_HOST"
curl -fsS -o /dev/null -w "tailnet %{http_code} $URL\n" "$URL/" || echo "tailnet check failed (certificate may take a minute on first use)"
