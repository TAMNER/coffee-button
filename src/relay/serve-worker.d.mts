export function serveWorker<Env>(
  worker: { fetch(request: Request, env: Env): Promise<Response> },
  env: Env,
): Promise<{ url: string; close(): Promise<void> }>;
