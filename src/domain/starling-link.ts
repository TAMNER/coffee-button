/**
 * Linking a Starling Space (ticket 19). Connect verifies the token by listing
 * accounts, then lists the first account's Spaces; nothing is stored until a
 * Space is chosen or created. The link lives in Settings on this phone only.
 * Per-press transfers are ticket 20.
 */
import {
  StarlingAuthError,
  StarlingClient,
  StarlingError,
  StarlingNetworkError,
  StarlingRateLimited,
  type StarlingAccount,
  type StarlingSpace,
} from "./starling";
import type { StarlingLink, Store } from "./store";

/** The build's relay address from VITE_DEFAULT_RELAY_URL, trimmed; absent or blank means none. */
export function defaultRelayUrl(env: { readonly VITE_DEFAULT_RELAY_URL?: string; readonly [key: string]: unknown }): string {
  return (env.VITE_DEFAULT_RELAY_URL ?? "").trim();
}

/**
 * What the Settings relay field starts with. Set at build time
 * (VITE_DEFAULT_RELAY_URL), so a public build ships with no relay address and
 * the author's own deploy can pass his. Only read when linking: a saved link
 * keeps the relay it was made with (StarlingLink.relayUrl).
 */
export const DEFAULT_RELAY_URL = defaultRelayUrl(import.meta.env);

/** Connect was tapped with no relay address: nothing was sent anywhere. */
export class StarlingRelayMissing extends StarlingError {
  constructor() {
    super("No relay address");
    this.name = "StarlingRelayMissing";
  }
}

export const RELAY_MISSING_MESSAGE = "Add a relay address first. Starling cannot be reached from this app without one.";

/** The part of StarlingClient linking needs. */
export type StarlingApi = Pick<StarlingClient, "listSpaces" | "createSpace"> & {
  accounts(): Promise<Pick<StarlingAccount, "accountUid">[]>;
};

export type StarlingClientFactory = (relayUrl: string, token: string) => StarlingApi;

/** The real factory: StarlingClient over the browser's fetch. */
export const defaultStarlingFactory: StarlingClientFactory = (relayUrl, token) =>
  new StarlingClient((input, init) => fetch(input, init), relayUrl, token);

/** A verified token with its account's Spaces, not yet stored. */
export interface StarlingConnection {
  token: string;
  relayUrl: string;
  accountUid: string;
  spaces: StarlingSpace[];
  api: StarlingApi;
}

export async function connect(
  _store: Store,
  factory: StarlingClientFactory,
  token: string,
  relayUrl: string,
): Promise<StarlingConnection> {
  const cleanToken = token.trim();
  const cleanRelay = relayUrl.trim();
  if (!cleanRelay) throw new StarlingRelayMissing();
  const api = factory(cleanRelay, cleanToken);
  const [account] = await api.accounts();
  if (!account) throw new StarlingError("No Starling account found for this token");
  const spaces = await api.listSpaces(account.accountUid);
  return { token: cleanToken, relayUrl: cleanRelay, accountUid: account.accountUid, spaces, api };
}

async function saveLink(store: Store, link: StarlingLink): Promise<StarlingLink> {
  // A fresh link is a fresh start: transfers held back by a rejected token resume (ticket 20).
  const { starlingAuthFailed: _cleared, ...settings } = await store.getSettings();
  await store.putSettings({ ...settings, starling: link });
  return link;
}

/** Links one of the connection's existing Spaces. */
export async function chooseSpace(store: Store, conn: StarlingConnection, spaceUid: string): Promise<StarlingLink> {
  const space = conn.spaces.find((s) => s.savingsGoalUid === spaceUid);
  if (!space) throw new StarlingError(`Unknown Space: ${spaceUid}`);
  return saveLink(store, {
    token: conn.token,
    relayUrl: conn.relayUrl,
    accountUid: conn.accountUid,
    spaceUid: space.savingsGoalUid,
    spaceName: space.name,
  });
}

export const COFFEE_BUTTON_SPACE_NAME = "Coffee Button";

/** Creates a new Space on the account (only when the user asks) and links it. */
export async function createAndChooseSpace(
  store: Store,
  conn: StarlingConnection,
  name = COFFEE_BUTTON_SPACE_NAME,
): Promise<StarlingLink> {
  const spaceUid = await conn.api.createSpace(conn.accountUid, name);
  return saveLink(store, {
    token: conn.token,
    relayUrl: conn.relayUrl,
    accountUid: conn.accountUid,
    spaceUid,
    spaceName: name,
  });
}

/** The stored link, or undefined when no Space is linked. */
export async function starlingLink(store: Store): Promise<StarlingLink | undefined> {
  return (await store.getSettings()).starling;
}

/** Forgets the token and the Space on this phone. Money already moved stays in the Space. */
export async function disconnect(store: Store): Promise<void> {
  const { starling: _forgotten, starlingAuthFailed: _cleared, ...rest } = await store.getSettings();
  await store.putSettings(rest);
}

/** One line for the Settings screen. Never echoes the error's own text, which could carry request details. */
export function linkErrorMessage(err: unknown): string {
  if (err instanceof StarlingRelayMissing) return RELAY_MISSING_MESSAGE;
  if (err instanceof StarlingAuthError) return "Starling rejected the token";
  if (err instanceof StarlingNetworkError) return "Could not reach the relay";
  if (err instanceof StarlingRateLimited) return "Starling is busy. Try again in a minute.";
  return "Starling did not accept that. Try again.";
}
