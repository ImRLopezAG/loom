import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient, createLiveQueryClient } from "@loom/core/client";
import type { FunctionReference } from "@loom/core/client";
import { LoomProvider, useAction, useMutation, useQuery } from "@loom/core/react";

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
  const snapshot = useQuery(query, { filter });
  return (
    <output aria-label={label}>
      {snapshot.status === "success" ? `${snapshot.value.subject}:${snapshot.value.count}` : snapshot.status}
    </output>
  );
}
function App() {
  const [render, setRender] = useState(0);
  const [mounted, setMounted] = useState(true);
  const [filter, setFilter] = useState("one");
  const [actionResult, setActionResult] = useState("");
  const write = useMutation(mutation);
  const invoke = useAction(action);
  return (
    <main>
      <h1>Loom client fixture</h1>
      <button onClick={() => setRender(render + 1)}>Render {render}</button>
      <button onClick={() => setFilter(filter === "one" ? "two" : "one")}>Change arguments</button>
      <button onClick={() => setMounted(!mounted)}>Toggle queries</button>
      <button
        onClick={() => {
          identity = null;
          live.setIdentity(null);
        }}
      >
        Sign out
      </button>
      <button
        onClick={() => {
          identity = "bob";
          live.setIdentity("bob");
        }}
      >
        Sign in Bob
      </button>
      <button
        onClick={async () => {
          await write(null);
        }}
      >
        Mutate
      </button>
      <button
        onClick={async () => {
          setActionResult(await invoke(null));
        }}
      >
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
const container = document.getElementById("root");
if (!container) throw new Error("Missing root");
createRoot(container).render(
  <StrictMode>
    <LoomProvider client={client} live={live}>
      <App />
    </LoomProvider>
  </StrictMode>,
);
