"use client";

import { createContext, createElement, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { hydrate } from "@tanstack/query-core";
import { decodeHydration } from "../client/hydration";
import type { LoomHydration } from "../client/server-session";
import { QueryClientContext, QueryClientProvider } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { createQueryClient } from "../client/query-client";
import type { LoomAuth } from "../client/cookie-session";
import { createAuthLifecycle } from "../client/auth-lifecycle";
import type { SessionClientOptions, SessionConnection } from "../client/auth-lifecycle";

/** Bind once at module scope to the application's generated createClient. */
export function createLoomReact<T extends SessionConnection>(createClient: (options: SessionClientOptions) => T) {
  const Context = createContext<T | null>(null);
  function LoomProvider(props: {
    readonly hydration?: LoomHydration;
    readonly url: string;
    readonly auth: LoomAuth;
    readonly queryClient?: QueryClient;
    readonly children: ReactNode;
    readonly fallback?: ReactNode;
    /** Optional notification; Loom owns invalidation and reconnection. */
    readonly onSessionChange?: () => void;
    readonly onAuthError?: (error: Error) => void;
  }) {
    const inherited = useContext(QueryClientContext);
    const [owned] = useState(createQueryClient);
    const queryClient = props.queryClient ?? inherited ?? owned;
    const { url, auth, hydration } = props;
    const reportError = useRef(props.onAuthError);
    const notification = useRef(props.onSessionChange);
    useEffect(() => {
      notification.current = props.onSessionChange;
      reportError.current = props.onAuthError;
    }, [props.onSessionChange, props.onAuthError]);
    const [started, setStarted] = useState(false);
    const [state, setState] = useState<{ connection: T; auth: LoomAuth; url: string; queryClient: QueryClient } | null>(
      null,
    );
    useEffect(() => {
      let initialHydration = hydration;
      const lifecycle = createAuthLifecycle({
        hydration,
        url,
        auth: {
          ...auth,
          subscribe: (notify) =>
            auth.subscribe?.(() => {
              notify();
              notification.current?.();
            }) ?? (() => {}),
        },
        createClient,
        onConnection(connection) {
          if (connection && initialHydration) {
            const candidate = initialHydration;
            initialHydration = undefined;
            hydrate(queryClient, decodeHydration(candidate.state, candidate.cachePrefix));
          }
          setStarted(true);
          setState(connection ? { connection, auth, url, queryClient } : null);
        },
        clearCache(prefix) {
          if (initialHydration?.cachePrefix === prefix) initialHydration = undefined;
          void queryClient.cancelQueries({ queryKey: [prefix] });
          queryClient.removeQueries({ queryKey: [prefix] });
          for (const mutation of queryClient.getMutationCache().getAll())
            if (mutation.options.mutationKey?.[0] === prefix) queryClient.getMutationCache().remove(mutation);
        },
        onError(error) {
          reportError.current?.(error);
        },
      });
      void lifecycle.refresh(false);
      return () => lifecycle.dispose();
    }, [url, auth, queryClient, hydration]);
    const current =
      state?.auth === auth && state.url === url && state.queryClient === queryClient ? state.connection : null;
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      current ? createElement(Context.Provider, { value: current }, props.children) : !started ? props.fallback : null,
    );
  }
  function useLoom() {
    const connection = useContext(Context);
    if (!connection) throw new Error("useLoom must be used inside the matching LoomProvider");
    return connection;
  }
  return { LoomProvider, useLoom };
}
