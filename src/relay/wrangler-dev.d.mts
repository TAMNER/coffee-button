export function startWranglerDev(
  config: string,
  vars: Record<string, string>,
): Promise<{ url: string; output(): string; close(): Promise<void> }>;
