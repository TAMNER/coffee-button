/**
 * Ticket 15: the info sheet's copy, as data, and when it shows.
 * Ticket 24: the copy's second version (Tom's words, 2026-11-17).
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
    body: "Skip a coffee, Press the cup and Save the money. Build good habits whilst investing in future you.",
  },
  {
    heading: "The money",
    body: "Click the cup and set money aside. Once a month the app shows Invest £X and prompts you to invest your savings.",
  },
  {
    heading: "How does saving work?",
    body:
      "For Starling bank users, your savings will grow in your Coffee Button Space every time you click. " +
      "For other users, the app keeps a tally of your savings until Invest £X appears.",
  },
  {
    heading: "How does investment work?",
    body:
      "When Invest £X appears, the app will prompt you to invest your savings with your chosen investment service. " +
      "Follow the instructions to invest in future you.",
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

/** Ticket 37: whether a section of the sheet starts unfolded. */
export function sectionStartsOpen(section: InfoSection, _standalone: boolean): boolean {
  return section.heading === "The idea";
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
