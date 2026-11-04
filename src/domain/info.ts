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
    body:
      "Want to cut down on frivolous spending? Want to save for something mindful and amazing? Skip and Save! " +
      "Skip the coffee, press the cup, and the price you didn't spend is saved.",
  },
  {
    heading: "The money",
    body:
      "Set up Starling in Settings and every press moves the price into a Starling Space straight away. " +
      "Otherwise the app keeps a tally of your savings and prompts you monthly to move the total into an investment account.",
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

/** Remembers that the sheet has been shown, leaving every other setting as it was. */
export async function markInfoSeen(store: Store): Promise<void> {
  const settings = await store.getSettings();
  await store.putSettings({ ...settings, infoSeen: true });
}
