import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createLoomReact, QueryClientProvider } from "@loom/core/react";
import { createQueryClient } from "@loom/core/client";

const cache = createQueryClient();
cache.setQueryData(["unrelated"], "preserved");
const events = new EventTarget();
let connections = 0;
const { LoomProvider, useLoom } = createLoomReact(() => ({
  number: ++connections,
  dispose() {},
}));
function Consumer() {
  return <output>connection {useLoom().number}</output>;
}
function App() {
  const [sessionKey, setSessionKey] = useState("alice");
  const [mounted, setMounted] = useState(true);
  const [changes, setChanges] = useState(0);
  const [renders, setRenders] = useState(0);
  const auth = useMemo(
    () => ({
      sessionKey,
      getToken: async () => null,
      subscribe(onChange: () => void) {
        events.addEventListener("change", onChange);
        return () => events.removeEventListener("change", onChange);
      },
    }),
    [sessionKey],
  );
  return (
    <QueryClientProvider client={cache}>
      <button onClick={() => setMounted(!mounted)}>toggle</button>
      <button onClick={() => setRenders(renders + 1)}>rerender {renders}</button>
      <button onClick={() => events.dispatchEvent(new Event("change"))}>invalidate</button>
      <button onClick={() => setSessionKey("bob")}>new identity</button>
      <span>changes {changes}</span>
      <span>cache {String(cache.getQueryData(["unrelated"]))}</span>
      {mounted && (
        <LoomProvider
          url="https://example.test"
          auth={auth}
          onSessionChange={() => setChanges(changes + 1)}
          fallback={<p>private Alice snapshot</p>}
        >
          <Consumer />
        </LoomProvider>
      )}
    </QueryClientProvider>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<App />);
