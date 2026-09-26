"use client";

import { createContext, createElement, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { QueryClientContext, QueryClientProvider } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { createQueryClient } from "../client/query-client";
import type { LoomAuth } from "../client/cookie-session";

/** Bind once at module scope to the application's generated createClient. */
export function createLoomReact<T extends { dispose(): void }>(
  createClient: (options: { url: string; getToken: () => Promise<string | null> }) => T,
) {
  const Context = createContext<T | null>(null);
  const cacheSessions = new WeakMap<QueryClient, string>();
  function LoomProvider(props: {
    readonly url: string;
    readonly auth: LoomAuth;
    readonly queryClient?: QueryClient;
    readonly children: ReactNode;
    readonly fallback?: ReactNode;
    /** Refresh the application session and supply a new auth.sessionKey. */
    readonly onSessionChange: () => void;
  }) {
    const inherited = useContext(QueryClientContext);
    const [owned] = useState(createQueryClient);
    const queryClient = props.queryClient ?? inherited ?? owned;
    const { url, auth } = props;
    const onSessionChange = useRef(props.onSessionChange);
    useEffect(() => {
      onSessionChange.current = props.onSessionChange;
    });
    const [initialSession] = useState(auth.sessionKey);
    const [invalidated, setInvalidated] = useState<string | null>(null);
    const [state, setState] = useState<{ connection: T; auth: LoomAuth; url: string; queryClient: QueryClient } | null>(
      null,
    );
    useEffect(() => {
      const previousSession = cacheSessions.get(queryClient);
      if (previousSession !== undefined && previousSession !== auth.sessionKey) queryClient.clear();
      cacheSessions.set(queryClient, auth.sessionKey);
      if (invalidated === auth.sessionKey) return;
      const connection = createClient({ url, getToken: auth.getToken });
      let active = true;
      const unsubscribe = auth.subscribe?.(() => {
        if (!active) return;
        active = false;
        setInvalidated(auth.sessionKey);
        setState(null);
        connection.dispose();
        queryClient.clear();
        onSessionChange.current();
      });
      if (active) setState({ connection, auth, url, queryClient });
      return () => {
        active = false;
        unsubscribe?.();
        connection.dispose();
      };
    }, [url, auth, queryClient, invalidated]);
    const current =
      state?.auth === auth && state.url === url && state.queryClient === queryClient ? state.connection : null;
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      current
        ? createElement(Context.Provider, { value: current }, props.children)
        : invalidated === null && auth.sessionKey === initialSession
          ? props.fallback
          : null,
    );
  }
  function useLoom() {
    const connection = useContext(Context);
    if (!connection) throw new Error("useLoom must be used inside the matching LoomProvider");
    return connection;
  }
  return { LoomProvider, useLoom };
}
