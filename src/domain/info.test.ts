import { describe, expect, it } from "vitest";
import { INFO_SECTIONS, homeScreenHintNeeded, markInfoSeen, shouldShowInfoOnLaunch } from "./info";
import { exportData, importData } from "./settings";
import { MemoryStore } from "./store";

describe("info sheet copy", () => {
  it("has exactly four sections: The idea, The money, Swipe, Add to Home Screen", () => {
    expect(INFO_SECTIONS.map((s) => s.heading)).toEqual(["The idea", "The money", "Swipe", "Add to Home Screen"]);
  });

  it("sells the idea and explains the two money paths in plain words", () => {
    const body = (heading: string) => INFO_SECTIONS.find((s) => s.heading === heading)!.body;
    expect(body("The idea")).toMatch(/^Want to cut down on frivolous spending\?/);
    expect(body("The idea")).toContain("Skip and Save!");
    expect(body("The money")).toContain("Set up Starling");
    expect(body("The money")).toContain("monthly");
  });

  it("marks the Add to Home Screen section needed only when not running standalone", () => {
    expect(homeScreenHintNeeded(false)).toBe(true);
    expect(homeScreenHintNeeded(true)).toBe(false);
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
