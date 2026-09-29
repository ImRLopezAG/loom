import type { LoomAuth } from "./cookie-session";

export interface TokenAuthOptions {
  readonly getState: () => { readonly isLoading: boolean; readonly isAuthenticated: boolean };
  readonly getToken: (options: { readonly forceRefresh: boolean }) => Promise<string | null>;
  readonly subscribe?: (onChange: () => void) => () => void;
}

/** Providers own sessions. Loom consumes their tokens and verifies identity on the server. */
export function createTokenAuth(options: TokenAuthOptions): LoomAuth {
  let revision = 0;
  return {
    async getToken(request) {
      const state = options.getState();
      if (state.isLoading || !state.isAuthenticated) return null;
      const generation = revision;
      const token = await options.getToken({ forceRefresh: request?.forceRefresh ?? false });
      const current = options.getState();
      return generation === revision && !current.isLoading && current.isAuthenticated ? token : null;
    },
    subscribe(onChange) {
      return (
        options.subscribe?.(() => {
          revision++;
          onChange();
        }) ?? (() => {})
      );
    },
  };
}
