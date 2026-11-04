# 19: Link Starling in Settings

**What to build:** A "Starling" section in Settings. The user pastes a Personal Access Token (scopes listed on screen: account:read, savings-goal:read, savings-goal:create, savings-goal-transfer:create) and taps Connect. The app calls Starling through the relay, verifies the token by listing accounts, then lists Spaces to pick one, with "Create a Coffee Button Space" at the top. The chosen account uid, Space uid and name are stored in settings together with the token, on this phone only. A Relay URL field, prefilled with the author's relay, lets a friend point at their own. Disconnect forgets everything. Export never includes the token.

**Blocked by:** None (can start immediately; the device test needs 18).

**Status:** ready-for-agent

- [ ] StarlingClient (accounts, listSpaces, createSpace, addMoney) built on injected fetch and a base URL; unit tested against a fake fetch for success, 401/403, 429 with Retry-After, and network failure
- [ ] Connect flow: verify → list Spaces → pick or create → persisted; unit tested at the domain seam
- [ ] Settings UI section with token field (password type), scope checklist, relay URL, Space picker, Disconnect
- [ ] exportData omits the token and Space link; importData ignores any present; unit tested
- [ ] Token stored only in IndexedDB; no console.log of it anywhere
