import { describe, expect, it } from "vitest";
import { StarlingAuthError, StarlingNetworkError, StarlingRateLimited, type StarlingSpace } from "./starling";
import {
  chooseSpace,
  connect,
  createAndChooseSpace,
  defaultRelayUrl,
  disconnect,
  linkErrorMessage,
  starlingLink,
  type StarlingApi,
} from "./starling-link";
import { MemoryStore } from "./store";

/** A Starling stand-in that records which relay and token it was made with. */
function fakeStarling(opts: { accounts?: string[]; spaces?: StarlingSpace[]; createdUid?: string } = {}) {
  const made: { relayUrl: string; token: string }[] = [];
  const created: { accountUid: string; name: string }[] = [];
  const api: StarlingApi = {
    accounts: async () => (opts.accounts ?? ["acc-1"]).map((accountUid) => ({ accountUid })),
    listSpaces: async () => opts.spaces ?? [],
    createSpace: async (accountUid, name) => {
      created.push({ accountUid, name });
      return opts.createdUid ?? "sg-new";
    },
  };
  const factory = (relayUrl: string, token: string) => {
    made.push({ relayUrl, token });
    return api;
  };
  return { factory, made, created };
}

const RELAY = "https://relay.example:8443";

describe("starling link: connect", () => {
  it("uses the first account and lists its Spaces, with the token and relay given, and stores nothing yet", async () => {
    const store = new MemoryStore();
    const spaces = [{ savingsGoalUid: "sg-1", name: "Holiday" }];
    const { factory, made } = fakeStarling({ accounts: ["acc-1", "acc-2"], spaces });

    const conn = await connect(store, factory, " tok-1 ", RELAY);

    expect(made).toEqual([{ relayUrl: RELAY, token: "tok-1" }]);
    expect(conn.accountUid).toBe("acc-1");
    expect(conn.spaces).toEqual(spaces);
    expect((await store.getSettings()).starling).toBeUndefined();
  });

  it("a token whose Starling login has no accounts is refused with 'No Starling account'", async () => {
    const { factory } = fakeStarling({ accounts: [] });

    await expect(connect(new MemoryStore(), factory, "tok", RELAY)).rejects.toThrow(/No Starling account/);
  });
});

describe("starling link: choosing a Space", () => {
  it("chooseSpace stores token, relay, account, Space uid and name, and leaves payday 25 alone", async () => {
    const store = new MemoryStore();
    const { factory } = fakeStarling({ spaces: [{ savingsGoalUid: "sg-1", name: "Holiday" }] });
    const conn = await connect(store, factory, "tok-1", RELAY);

    const link = await chooseSpace(store, conn, "sg-1");

    const expected = { token: "tok-1", relayUrl: RELAY, accountUid: "acc-1", spaceUid: "sg-1", spaceName: "Holiday" };
    expect(link).toEqual(expected);
    expect(await store.getSettings()).toEqual({ paydayDay: 25, starling: expected });
  });

  it("createAndChooseSpace creates 'Coffee Button' on the account and stores the new Space", async () => {
    const store = new MemoryStore();
    const { factory, created } = fakeStarling({ createdUid: "sg-cb" });
    const conn = await connect(store, factory, "tok-1", RELAY);

    const link = await createAndChooseSpace(store, conn);

    expect(created).toEqual([{ accountUid: "acc-1", name: "Coffee Button" }]);
    expect(link).toEqual({ token: "tok-1", relayUrl: RELAY, accountUid: "acc-1", spaceUid: "sg-cb", spaceName: "Coffee Button" });
    expect((await store.getSettings()).starling).toEqual(link);
  });
});

describe("starling link: disconnect", () => {
  it("forgets token and Space entirely, keeps other settings, and starlingLink reads undefined", async () => {
    const store = new MemoryStore();
    const { factory } = fakeStarling({ spaces: [{ savingsGoalUid: "sg-1", name: "Holiday" }] });
    await chooseSpace(store, await connect(store, factory, "tok-1", RELAY), "sg-1");
    expect(await starlingLink(store)).toMatchObject({ spaceName: "Holiday" });

    await disconnect(store);

    const settings = await store.getSettings();
    expect("starling" in settings).toBe(false);
    expect(settings).toEqual({ paydayDay: 25 });
    expect(await starlingLink(store)).toBeUndefined();
  });
});

describe("starling link: a rejected token (ticket 20)", () => {
  it("saving the link again (reconnect) clears starlingAuthFailed, and so does disconnect", async () => {
    const store = new MemoryStore();
    const { factory } = fakeStarling({ spaces: [{ savingsGoalUid: "sg-1", name: "Holiday" }] });
    await store.putSettings({ ...(await store.getSettings()), starlingAuthFailed: true });

    await chooseSpace(store, await connect(store, factory, "tok-2", RELAY), "sg-1");
    expect((await store.getSettings()).starlingAuthFailed).toBeUndefined();

    await store.putSettings({ ...(await store.getSettings()), starlingAuthFailed: true });
    await disconnect(store);
    expect(await store.getSettings()).toEqual({ paydayDay: 25 });
  });
});

describe("starling link: what the user is told", () => {
  it("names a rejected token, an unreachable relay, a rate limit, and anything else, without the token", () => {
    expect(linkErrorMessage(new StarlingAuthError(401))).toBe("Starling rejected the token");
    expect(linkErrorMessage(new StarlingAuthError(403))).toBe("Starling rejected the token");
    expect(linkErrorMessage(new StarlingNetworkError())).toBe("Could not reach the relay");
    expect(linkErrorMessage(new StarlingNetworkError(502))).toBe("Could not reach the relay");
    expect(linkErrorMessage(new StarlingRateLimited(3000))).toBe("Starling is busy. Try again in a minute.");
    expect(linkErrorMessage(new Error("tok-1 leaked?"))).toBe("Starling did not accept that. Try again.");
  });
});

describe("starling link: the relay default comes from the build", () => {
  it("VITE_DEFAULT_RELAY_URL sets it (trimmed); absent or blank means no relay address", () => {
    expect(defaultRelayUrl({ VITE_DEFAULT_RELAY_URL: " https://relay.example:8443 " })).toBe("https://relay.example:8443");
    expect(defaultRelayUrl({ VITE_DEFAULT_RELAY_URL: "  " })).toBe("");
    expect(defaultRelayUrl({})).toBe("");
  });
});
