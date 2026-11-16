import { describe, expect, it } from "vitest";
import { installCopy, isIosSafari } from "./install-copy";

describe("installCopy", () => {
  it("on iOS Safari the banner and the info body are today's Safari wording, unchanged", () => {
    expect(installCopy({ iosSafari: true })).toEqual({
      banner:
        "Add Coffee Button to your Home Screen (Share, then Add to Home Screen). " +
        "In a Safari tab your savings are deleted after 7 days without a visit.",
      infoBody: "In Safari, tap the share button, then Add to Home Screen. The app needs it to keep your data.",
    });
  });

  it("anywhere else (Android Chrome, desktop, other iOS browsers) the wording is neutral and has no Safari warning", () => {
    expect(installCopy({ iosSafari: false })).toEqual({
      banner: "Add Coffee Button to your home screen from your browser's menu, then use the installed app.",
      infoBody: "Open your browser's menu and choose Install app or Add to Home screen. The app needs it to keep your data.",
    });
  });
});

const UA = {
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  iphoneHomeScreenApp: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  iphoneChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.6478.54 Mobile/15E148 Safari/604.1",
  iphoneFirefox:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/127.0 Mobile/15E148 Safari/605.1.15",
  macOrIpadSafari:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
};

describe("isIosSafari", () => {
  it("iPhone Safari and the installed iPhone app are Safari; iPadOS passes as a Mac but has touch", () => {
    expect(isIosSafari(UA.iphoneSafari, 5)).toBe(true);
    expect(isIosSafari(UA.iphoneHomeScreenApp, 5)).toBe(true);
    expect(isIosSafari(UA.macOrIpadSafari, 5)).toBe(true);
  });

  it("Chrome or Firefox on iPhone, Android Chrome and a Mac without touch are not", () => {
    expect(isIosSafari(UA.iphoneChrome, 5)).toBe(false);
    expect(isIosSafari(UA.iphoneFirefox, 5)).toBe(false);
    expect(isIosSafari(UA.androidChrome, 5)).toBe(false);
    expect(isIosSafari(UA.macOrIpadSafari, 0)).toBe(false);
  });
});
