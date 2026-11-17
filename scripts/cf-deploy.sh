#!/usr/bin/env bash
# Deploy Coffee Button to Cloudflare: the relay Worker first, then the app built with that
# relay's address as its default. Run from a worktree, not the main tree: the main tree's
# dist/ is what the tailnet preview serves.
#
# Needs CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID in the environment (never printed).
# Rollback: npx wrangler rollback [-c relay-worker/wrangler.jsonc]; remove: npx wrangler delete [...].
set -euo pipefail
cd "$(dirname "$0")/.."
: "${CLOUDFLARE_API_TOKEN:?set CLOUDFLARE_API_TOKEN first (read -rs CLOUDFLARE_API_TOKEN && export CLOUDFLARE_API_TOKEN)}"
: "${CLOUDFLARE_ACCOUNT_ID:?set CLOUDFLARE_ACCOUNT_ID first}"
export WRANGLER_SEND_METRICS=false

if [[ "$(pwd)" == "$HOME/projects/coffee-button" ]]; then
  echo "cf-deploy: run this from a worktree (e.g. ~/projects/coffee-button-wt/cf-hosting), not the main tree" >&2
  exit 2
fi

echo "== 1/3 relay Worker"
out=$(npx wrangler deploy -c relay-worker/wrangler.jsonc 2>&1) || { echo "$out"; exit 1; }
echo "$out" | tail -8
relay=$(echo "$out" | grep -o 'https://coffee-button-relay\.[a-z0-9-]*\.workers\.dev' | head -1)
[[ -n "$relay" ]] || { echo "cf-deploy: could not read the relay address from wrangler's output" >&2; exit 1; }

echo "== 2/3 build the app with relay $relay"
# VITE_DRAWING_REQUEST_URL (ticket 38): where "Request a drawing" in Settings goes, a mailto:
# address or an https: form link. Not set here; export it before running to build one in.
# With none, the line and button are not shown.
# A built-in email address is visible to anyone who opens the app.
BUILD_ID="$(git rev-parse --short HEAD)" VITE_DEFAULT_RELAY_URL="$relay" npm run build >/dev/null
if grep -rq "black-box" dist; then echo "cf-deploy: the build mentions black-box; not deploying" >&2; exit 1; fi

echo "== 3/3 app"
out=$(npx wrangler deploy 2>&1) || { echo "$out"; exit 1; }
echo "$out" | tail -8
app=$(echo "$out" | grep -o 'https://coffee-button\.[a-z0-9-]*\.workers\.dev' | head -1)

# The relay's config keeps ALLOWED_ORIGIN blank (any site) so the repo names no account.
# Now that the app's address is known, redeploy the relay answering CORS for that origin only.
if [[ -n "${app:-}" ]]; then
  echo "== lock the relay to $app"
  out=$(npx wrangler deploy -c relay-worker/wrangler.jsonc --var "ALLOWED_ORIGIN:$app" 2>&1) || { echo "$out"; exit 1; }
  echo "$out" | tail -4
else
  echo "cf-deploy: could not read the app address; the relay still answers CORS for any site" >&2
fi

echo
echo "relay: $relay"
echo "app:   ${app:-see above}"
echo "checks (expect 204, then 403):"
curl -s -o /dev/null -w "  OPTIONS %{http_code}\n" -X OPTIONS "$relay/api/v2/accounts" || true
echo "  allowed origin: $(curl -s -D - -o /dev/null -X OPTIONS "$relay/api/v2/accounts" | tr -d '\r' | grep -i '^access-control-allow-origin:' | cut -d' ' -f2-) (expect ${app:-the app address})"
curl -s -o /dev/null -w "  blocked path %{http_code}\n" "$relay/api/v2/account-holder" || true
[[ -n "${app:-}" ]] && curl -s -o /dev/null -w "  app %{http_code}\n" "$app/" || true
