// Typing for the test seam: the Worker's default export and its variables.
export interface RelayEnv {
  ALLOWED_ORIGIN?: string;
  UPSTREAM?: string;
}

declare const worker: {
  fetch(request: Request, env: RelayEnv): Promise<Response>;
};
export default worker;
