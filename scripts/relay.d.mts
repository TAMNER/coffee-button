// Minimal typing for the test seam. The project has no @types/node, so this
// describes only the parts of http.Server the tests use.
export interface RelayServer {
  listen(port: number, host: string, callback: () => void): unknown;
  close(callback: (err?: Error) => void): unknown;
  address(): { port: number } | string | null;
}

export function createRelay(options?: { upstream?: string }): RelayServer;
