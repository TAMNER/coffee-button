import { describe, expect, it } from "vitest";
import { FakeClipboard } from "../adapters/clipboard";
import { FakeClock } from "../adapters/clock";
import { FakeUrlOpener } from "../adapters/open-url";
import { InvestFlow } from "./settle";
import { MemoryStore } from "./store";

function setup(failing: string[] = []) {
  const store = new MemoryStore();
  const clock = new FakeClock(new Date(2026, 10, 26, 9, 0));
  const clipboard = new FakeClipboard();
  const opener = new FakeUrlOpener(failing);
  const flow = new InvestFlow({ store, clock, clipboard, opener });
  return { store, clock, clipboard, opener, flow };
}

describe("InvestFlow", () => {
  it('copies "12.50" for £12.50, pounds and pence with no symbol', async () => {
    const { clipboard, flow } = setup();

    await flow.invest(1250);

    expect(clipboard.written).toEqual(["12.50"]);
  });

  it("opens https://investengine.com/ and nothing else when that open works", async () => {
    const { opener, flow } = setup();

    await flow.invest(1250);

    expect(opener.opened).toEqual(["https://investengine.com/"]);
  });

  it("falls back to the App Store page when opening investengine.com fails", async () => {
    const { opener, flow } = setup(["https://investengine.com/"]);

    await flow.invest(1250);

    expect(opener.opened).toEqual([
      "https://investengine.com/",
      "https://apps.apple.com/gb/app/investengine/id1485669937",
    ]);
  });

  it('asks "Did you invest £12.50?" once the user comes back to the app', async () => {
    const { opener, flow } = setup();
    const prompts: string[] = [];
    flow.onPrompt((text) => prompts.push(text));

    await flow.invest(1250);
    expect(prompts).toEqual([]);
    opener.returnToApp();

    expect(prompts).toEqual(["Did you invest £12.50?"]);
  });
});
