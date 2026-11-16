export interface SeenRequest {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  body: string;
}

export interface FakeUpstream {
  url: string;
  seen: SeenRequest[];
  reset(reply: CannedReply): void;
  close(): Promise<void>;
}

export interface CannedReply {
  status: number;
  contentType: string;
  body: string;
}

export function startFakeUpstream(reply: CannedReply): Promise<FakeUpstream>;

export function spawnRelay(env: Record<string, string>): Promise<{
  url: string;
  output(): string;
  stop(): Promise<void>;
}>;

export function rawRequest(
  base: string,
  method: string,
  target: string,
): Promise<{ status: number; body: string }>;
