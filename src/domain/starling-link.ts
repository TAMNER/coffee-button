/**
 * Linking a Starling Space (ticket 19). Connect verifies the token by listing
 * accounts, then lists the first account's Spaces; nothing is stored until a
 * Space is chosen or created. The link lives in Settings on this phone only.
 * Per-press transfers are ticket 20.
 */
import { StarlingClient, StarlingError, type StarlingAccount, type StarlingSpace } from "./starling";
import type { Store } from "./store";

/** The author's relay; a friend may point the Settings field at their own. */
export const DEFAULT_RELAY_URL = "https://black-box.<tailnet>.ts.net:8443";

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
  const api = factory(cleanRelay, cleanToken);
  const [account] = await api.accounts();
  if (!account) throw new StarlingError("No Starling account found for this token");
  const spaces = await api.listSpaces(account.accountUid);
  return { token: cleanToken, relayUrl: cleanRelay, accountUid: account.accountUid, spaces, api };
}
