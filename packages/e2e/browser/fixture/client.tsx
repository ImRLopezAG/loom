import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient, createLiveQueryClient } from "@loom/core/client";
import type { FunctionReference } from "@loom/core/client";
import { LoomProvider, createLoomQueryClient, useMutation, useQuery } from "@loom/core/react";

import { createQueryMethod, createMutationMethod } from "@loom/core/query";

let identity: string | null = "alice";
const client = createClient({
  url: location.origin,
  getAuth: async () => (identity ? { token: identity, identityKey: identity } : null),
});
const live = createLiveQueryClient({ url: location.origin, client, deployment: "browser", identityKey: identity });
const query: FunctionReference<"query", "public", { filter: string }, { subject: string; count: number }> = {
  name: "tasks:read",
  kind: "query",
  visibility: "public",
  version: "a".repeat(64),
};
const mutation: FunctionReference<"mutation", "public", null, number> = {
  visibility: "public",
  version: query.version,
  name: "tasks:write",
  kind: "mutation",
};
const action: FunctionReference<"action", "public", null, string> = {
  visibility: "public",
  version: query.version,
  name: "tasks:action",
  kind: "action",
};
function Result({ filter, label }: { filter: string; label: string }) {
  const snapshot = useQuery(createQueryMethod(query)({ input: { filter } }));
  return (
    <output aria-label={label}>
      {snapshot.status === "success"
        ? `${snapshot.data.subject}:${snapshot.data.count}`
        : identity === null
          ? "signed-out"
          : snapshot.status}
    </output>
  );
}
function App({ switchIdentity }: { switchIdentity: (next: string | null) => void }) {
  const [render, setRender] = useState(0);
  const [mounted, setMounted] = useState(true);
  const [filter, setFilter] = useState("one");
  const [actionResult, setActionResult] = useState("");
  const write = useMutation(createMutationMethod(mutation)());
  const invoke = useMutation(createMutationMethod(action)({ onSuccess: setActionResult }));
  return (
    <main>
      <h1>Loom client fixture</h1>
      <button onClick={() => setRender(render + 1)}>Render {render}</button>
      <button onClick={() => setFilter(filter === "one" ? "two" : "one")}>Change arguments</button>
      <button onClick={() => setMounted(!mounted)}>Toggle queries</button>
      <button
        onClick={() => {
          switchIdentity(null);
        }}
      >
        Sign out
      </button>
      <button
        onClick={() => {
          switchIdentity("bob");
        }}
      >
        Sign in Bob
      </button>
      <button disabled={write.isPending} onClick={() => write.mutate(null)}>
        Mutate
      </button>
      <button disabled={invoke.isPending} onClick={() => invoke.mutate(null)}>
        Run action
      </button>
      <output aria-label="action">{actionResult}</output>
      {mounted && (
        <>
          <Result filter={filter} label="first" />
          <Result filter={filter} label="second" />
        </>
      )}
    </main>
  );
}
let queryClient = createLoomQueryClient({ client, live });
function Session() {
  const [current, setCurrent] = useState(queryClient);
  return (
    <LoomProvider client={client} live={live} queryClient={current}>
      <App
        key={identity}
        switchIdentity={(next) => {
          identity = next;
          live.setIdentity(next);
          queryClient = createLoomQueryClient({ client, live });
          setCurrent(queryClient);
        }}
      />
    </LoomProvider>
  );
}
const container = document.getElementById("root");
if (!container) throw new Error("Missing root");
createRoot(container).render(
  <StrictMode>
    <Session />
  </StrictMode>,
);
