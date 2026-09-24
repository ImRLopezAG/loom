import { useState } from "react";
import { createRoot } from "react-dom/client";
import { createORPCClient } from "@orpc/client";
import type { Client } from "@orpc/client";
import { RPCLink } from "@orpc/client/websocket";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import {
  createRpcQuerySession,
  createRpcLiveMethod,
  createRpcMutationMethod,
  optimisticMutation,
} from "@loom/core/query";

type Router = {
  write: Client<Record<never, never>, number, number, Error>;
  read: Client<Record<never, never>, undefined, AsyncIteratorObject<{ count: number }, void, void>, Error>;
};
let socket: WebSocket | undefined;
const session = createRpcQuerySession({
  link: new RPCLink({
    connect: () => {
      session.signal.throwIfAborted();
      socket = new WebSocket(location.origin.replace("http", "ws") + "/ws");
      return socket;
    },
    reconnect: { enabled: true, maxAttempt: 3, delay: () => 10 },
  }),
  identity: { issuer: "test", subject: "alice" },
  deployment: location.origin,
  version: "v1",
});
const raw = createORPCClient<Router>(session.link);
const api = {
  read: createRpcLiveMethod(raw.read, session, ["read"]),
  write: createRpcMutationMethod(raw.write, session, ["write"]),
};
function Result({ label }: { label: string }) {
  const value = useQuery(api.read({ retry: 3, retryDelay: 10, select: (result) => result.count }));
  return <output data-testid={label}>{value.data ?? "empty"}</output>;
}
function Edit() {
  const queryKey = api.read().queryKey;
  const mutation = useMutation(
    optimisticMutation(
      session,
      () => [queryKey],
      api.write({
        onMutate: (count) => {
          session.queryClient.setQueryData(queryKey, { count });
        },
      }),
    ),
  );
  return (
    <>
      <button onClick={() => mutation.mutate(9)}>Save</button>
      <button
        onClick={() => {
          void session.queryClient.invalidateQueries({ queryKey });
        }}
      >
        Refetch
      </button>
      <output data-testid="mutation">{mutation.status}</output>
    </>
  );
}
function App() {
  const [active, setActive] = useState(true);
  return (
    <QueryClientProvider client={session.queryClient}>
      <button
        onClick={() => {
          session.dispose();
          socket?.close();
          setActive(false);
        }}
      >
        Sign out
      </button>
      {active ? (
        <>
          <Edit />
          <Result label="one" />
          <Result label="two" />
        </>
      ) : (
        <p>Signed out</p>
      )}
    </QueryClientProvider>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<App />);
