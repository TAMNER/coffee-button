/**
 * Starling Bank API v2, reached through the relay (Starling sends no CORS
 * headers, so the browser cannot call it directly). Only the paths the app
 * needs: accounts and savings goals ("Spaces"). The token is sent as a bearer
 * header and never logged.
 */

export interface StarlingAccount {
  accountUid: string;
  [field: string]: unknown;
}

export interface StarlingSpace {
  savingsGoalUid: string;
  name: string;
  [field: string]: unknown;
}

export class StarlingClient {
  private readonly baseUrl: string;

  constructor(
    private readonly fetchFn: typeof fetch,
    baseUrl: string,
    private readonly token: string,
  ) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
      Accept: "application/json",
    };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    const res = await this.fetchFn(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return (await res.json()) as T;
  }

  async accounts(): Promise<StarlingAccount[]> {
    const data = await this.request<{ accounts: StarlingAccount[] }>("GET", "/api/v2/accounts");
    return data.accounts;
  }

  /** The account's Spaces (Starling calls them savings goals). */
  async listSpaces(accountUid: string): Promise<StarlingSpace[]> {
    const data = await this.request<{ savingsGoalList: StarlingSpace[] }>(
      "GET",
      `/api/v2/account/${encodeURIComponent(accountUid)}/savings-goals`,
    );
    return data.savingsGoalList;
  }

  /** Creates a GBP Space and returns its uid. */
  async createSpace(accountUid: string, name: string): Promise<string> {
    const data = await this.request<{ savingsGoalUid: string }>(
      "PUT",
      `/api/v2/account/${encodeURIComponent(accountUid)}/savings-goals`,
      { name, currency: "GBP" },
    );
    return data.savingsGoalUid;
  }
}
