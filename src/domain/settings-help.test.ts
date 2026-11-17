import { describe, expect, it } from "vitest";
import { SETTINGS_HELP } from "./settings-help";

describe("settings help lines (ticket 25)", () => {
  it("uses Tom's approved wording verbatim under Data and under Where do you invest?", () => {
    expect(SETTINGS_HELP).toEqual({
      data:
        "Export saves a backup file of your presses and settings. " +
        "Import replaces everything on this phone with a backup. Your bank link is never in the file.",
      investDestination:
        "Paste the link to wherever you invest. " +
        "When Invest £X appears, tapping it copies the amount and opens this link. Nothing is sent to them.",
    });
  });
});
