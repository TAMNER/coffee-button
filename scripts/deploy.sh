#!/usr/bin/env bash
# Build Coffee Button and serve dist/ over HTTPS on the tailnet from black-box.
#
#   scripts/deploy.sh
#
# Idempotent: re-running rebuilds dist/ in place and re-points the same
# `tailscale serve` mapping (port 443, path /) at it.
#
# Needs: tailscale up on this machine, HTTPS certificates enabled for the
# tailnet, and either root or this user set as operator
# (`sudo tailscale set --operator=$USER`, once). Friends later: swap `serve`
# for `funnel` (see docs/DESIGN.md, Deferred).
#
# First run on black-box (2026-11-03, tailscale 1.102.4, user openclaw) failed
# at the serve step; HTTPS certs ARE enabled (cert domain
# black-box.<tailnet>.ts.net). Exact output:
#
#   sending serve config: Access denied: serve config denied
#
#   Use 'sudo tailscale serve --bg /home/openclaw/projects/coffee-button/dist'.
#   To not require root, use 'sudo tailscale set --operator=$USER' once.
#
# Fix (by the owner, once): sudo tailscale set --operator=openclaw
# Then the app is expected at https://black-box.<tailnet>.ts.net/
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
DIST="$ROOT/dist"

if [ ! -d node_modules ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  npm ci
fi

npm run build

tailscale serve --bg "$DIST"

echo
tailscale serve status
