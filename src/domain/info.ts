/**
 * Ticket 15: the info sheet's copy, as data, and when it shows.
 * The UI (src/ui/info.ts) only renders what is here.
 */
import type { Store } from "./store";

export interface InfoSection {
  heading: string;
  body: string;
}

export const INFO_SECTIONS: readonly InfoSection[] = [
  {
    heading: "The idea",
    body: "Skip the coffee, press the cup. The price you didn't spend is saved.",
  },
  {
    heading: "The money",
    body:
      "Nothing moves when you press: the app keeps a tally. On the 26th you invest the month's total in one go. " +
      "Link Starling in Settings and every press moves the price into a Space instead. Monzo is coming.",
  },
  {
    heading: "Swipe",
    body: "Swipe sideways to change what you skipped: coffee, beer, lunch. Swipe up for the shelf.",
  },
  {
    heading: "Add to Home Screen",
    body: "In Safari, tap the share button, then Add to Home Screen. The app needs it to keep your data.",
  },
];

/** The Add to Home Screen section is marked "needed" only when the app is not already installed. */
export function homeScreenHintNeeded(standalone: boolean): boolean {
  return !standalone;
}

/** The sheet opens by itself only until it has been seen once. */
export async function shouldShowInfoOnLaunch(store: Store): Promise<boolean> {
  return !(await store.getSettings()).infoSeen;
}
