"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { LoomClient } from "../client/transport";
import type { LiveQueryClient } from "../client/live";

interface LoomContextValue {
  readonly client: LoomClient;
  readonly live: LiveQueryClient;
}
const LoomContext = createContext<LoomContextValue | null>(null);
export interface LoomProviderProps extends LoomContextValue {
  readonly children: ReactNode;
}
/** Clients are application-owned. Auth adapters must synchronously update live.setIdentity on auth changes. */
export function LoomProvider({ client, live, children }: LoomProviderProps) {
  const value = useMemo(() => ({ client, live }), [client, live]);
  return <LoomContext value={value}>{children}</LoomContext>;
}
export function useLoomContext(): LoomContextValue {
  const context = useContext(LoomContext);
  if (!context) throw new Error("Loom hooks require a LoomProvider");
  return context;
}
