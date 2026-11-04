export interface SeenRequest {
  method: string;
  url: string;
  headers: Record<string, string | string[] | undefined>;
  body: string;
}

export interface FakeUpstream {
  url: string;
  seen: SeenRequest[];
  close(): Promise<void>;
}

export function startFakeUpstream(reply: {
  status: number;
  contentType: string;
  body: string;
}): Promise<FakeUpstream>;
