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
# Friends later: `tailscale funnel --bg 8787` instead of serve (see docs/DESIGN.md).
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
PORT=8794  # 8787 is taken by another service on black-box
UNIT_DIR="$HOME/.config/systemd/user"
UNIT="$UNIT_DIR/coffee-button.service"

if [ ! -d node_modules ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  npm ci
fi

npm run build

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

systemctl --user daemon-reload
systemctl --user enable --now coffee-button.service >/dev/null
systemctl --user restart coffee-button.service

# Idempotent: re-running re-points the same HTTPS mapping at the same port.
tailscale serve --bg --yes "$PORT" >/dev/null

sleep 1
systemctl --user is-active coffee-button.service
curl -fsS -o /dev/null -w "local   %{http_code}\n" "http://127.0.0.1:$PORT/"
URL="https://$(tailscale status --json | python3 -I -c 'import json,sys; print(json.load(sys.stdin)["Self"]["DNSName"].rstrip("."))')"
curl -fsS -o /dev/null -w "tailnet %{http_code} $URL\n" "$URL/" || echo "tailnet check failed (certificate may take a minute on first use)"
