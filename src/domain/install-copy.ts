/**
 * Install wording for the banner (src/main.ts) and the info sheet's
 * "Add to Home Screen" section. Safari's share-sheet steps and its 7-day
 * warning are for iOS Safari only.
 */
export interface BrowserFacts {
  /** Safari on iPhone or iPad (not another iOS browser). */
  iosSafari: boolean;
}

export interface InstallCopy {
  banner: string;
  infoBody: string;
}

const SAFARI: InstallCopy = {
  banner:
    "Add Coffee Button to your Home Screen (Share, then Add to Home Screen). " +
    "In a Safari tab your savings are deleted after 7 days without a visit.",
  infoBody: "In Safari, tap the share button, then Add to Home Screen. The app needs it to keep your data.",
};

const ELSEWHERE: InstallCopy = {
  banner: "Add Coffee Button to your home screen from your browser's menu, then use the installed app.",
  infoBody: "Open your browser's menu and choose Install app or Add to Home screen. The app needs it to keep your data.",
};

export function installCopy(facts: BrowserFacts): InstallCopy {
  return facts.iosSafari ? SAFARI : ELSEWHERE;
}
