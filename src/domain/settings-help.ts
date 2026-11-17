/**
 * Ticket 25: the permanent help lines in Settings, as data (Tom approved,
 * 2026-11-17). The UI (src/ui/settings.ts, src/ui/invest-destination.ts) only
 * renders what is here.
 */
export const SETTINGS_HELP = {
  data:
    "Export saves a backup file of your presses and settings. " +
    "Import replaces everything on this phone with a backup. Your bank link is never in the file.",
  investDestination:
    "Paste the link to wherever you invest. " +
    "When Invest £X appears, tapping it copies the amount and opens this link. Nothing is sent to them.",
} as const;
