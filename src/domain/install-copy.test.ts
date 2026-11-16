import { describe, expect, it } from "vitest";
import { installCopy } from "./install-copy";

describe("installCopy", () => {
  it("on iOS Safari the banner and the info body are today's Safari wording, unchanged", () => {
    expect(installCopy({ iosSafari: true })).toEqual({
      banner:
        "Add Coffee Button to your Home Screen (Share, then Add to Home Screen). " +
        "In a Safari tab your savings are deleted after 7 days without a visit.",
      infoBody: "In Safari, tap the share button, then Add to Home Screen. The app needs it to keep your data.",
    });
  });
});
