import { describe, expect, it } from "vitest";
import { INFO_SECTIONS, homeScreenHintNeeded, markInfoSeen, sectionStartsOpen, shouldShowInfoOnLaunch } from "./info";
import { installCopy } from "./install-copy";
import { exportData, importData } from "./settings";
import { MemoryStore } from "./store";

describe("info sheet copy", () => {
  it("has the four agreed sections, then Swipe and Add to Home Screen, in that order", () => {
    expect(INFO_SECTIONS.map((s) => s.heading)).toEqual([
      "The idea",
      "The money",
      "How does saving work?",
      "How does investment work?",
      "Swipe",
      "Add to Home Screen",
    ]);
  });

  it("uses Tom's agreed wording verbatim for the four new sections", () => {
    expect(INFO_SECTIONS.slice(0, 4)).toEqual([
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
    ]);
  });

  it("keeps the Swipe and Add to Home Screen sections unchanged after the new ones", () => {
    expect(INFO_SECTIONS.slice(4)).toEqual([
      {
        heading: "Swipe",
        body: "Swipe sideways to change what you skipped: coffee, beer, lunch. Swipe up for the shelf.",
      },
      {
        heading: "Add to Home Screen",
        body: "In Safari, tap the share button, then Add to Home Screen. The app needs it to keep your data.",
      },
    ]);
  });

  it("the install wording still follows the browser: Safari's steps on iOS Safari, neutral wording elsewhere", () => {
    const stored = INFO_SECTIONS.find((s) => s.heading === "Add to Home Screen")!.body;
    expect(installCopy({ iosSafari: true }).infoBody).toBe(stored);
    expect(installCopy({ iosSafari: false }).infoBody).not.toContain("Safari");
    expect(installCopy({ iosSafari: false }).infoBody).toContain("browser's menu");
  });

  it("marks the Add to Home Screen section needed only when not running standalone", () => {
    expect(homeScreenHintNeeded(false)).toBe(true);
    expect(homeScreenHintNeeded(true)).toBe(false);
  });
});

describe("which info sections start open (ticket 37)", () => {
  const section = (heading: string) => INFO_SECTIONS.find((s) => s.heading === heading)!;

  it("opens The idea whether or not the app is installed", () => {
    expect(sectionStartsOpen(section("The idea"), false)).toBe(true);
    expect(sectionStartsOpen(section("The idea"), true)).toBe(true);
  });

  it("folds The money, saving, investment and Swipe whether or not the app is installed", () => {
    for (const heading of ["The money", "How does saving work?", "How does investment work?", "Swipe"]) {
      expect(sectionStartsOpen(section(heading), false)).toBe(false);
      expect(sectionStartsOpen(section(heading), true)).toBe(false);
    }
  });

  it("keeps Add to Home Screen open while the app is not installed, folded once it is", () => {
    expect(sectionStartsOpen(section("Add to Home Screen"), false)).toBe(true);
    expect(sectionStartsOpen(section("Add to Home Screen"), true)).toBe(false);
  });
});

describe("info sheet on first launch", () => {
  it("shows on the first ever launch", async () => {
    expect(await shouldShowInfoOnLaunch(new MemoryStore())).toBe(true);
  });

  it("never shows again once marked seen, and leaves the other settings alone", async () => {
    const store = new MemoryStore();
    await store.putSettings({ paydayDay: 25, activeItemId: "beer" });

    await markInfoSeen(store);

    expect(await shouldShowInfoOnLaunch(store)).toBe(false);
    expect(await store.getSettings()).toEqual({ paydayDay: 25, activeItemId: "beer", infoSeen: true });
  });

  it("stays seen after an export is imported into a fresh store", async () => {
    const store = new MemoryStore();
    await markInfoSeen(store);
    const fresh = new MemoryStore();

    await importData(fresh, await exportData(store));

    expect(await shouldShowInfoOnLaunch(fresh)).toBe(false);
  });
});
