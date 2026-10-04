import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { createKelloReact, QueryClientProvider } from "kello/react";
import { createQueryClient } from "kello/client";

const cache = createQueryClient();
cache.setQueryData(["unrelated"], "preserved");
const events = new EventTarget();
let connections = 0;
let offline = false;
const { KelloProvider, useKello } = createKelloReact(() => ({
  number: ++connections,
  dispose() {},
  async verifySession() {
    if (offline) throw new Error("offline fixture");
    return { key: "a".repeat(64), expiresAt: Date.now() / 1000 + 3600 };
  },
}));
function Consumer() {
  return <output>connection {useKello().number}</output>;
}
function App() {
  const [sessionKey, setSessionKey] = useState("alice");
  const [mounted, setMounted] = useState(true);
  const [changes, setChanges] = useState(0);
  const [renders, setRenders] = useState(0);
  const auth = useMemo(
    () => ({
      sessionKey,
      getToken: async () => sessionKey,
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
      <button
        onClick={() => {
          offline = true;
          window.dispatchEvent(new Event("offline"));
          events.dispatchEvent(new Event("change"));
        }}
      >
        offline
      </button>
      <button
        onClick={() => {
          offline = false;
          window.dispatchEvent(new Event("online"));
        }}
      >
        online
      </button>
      <span>changes {changes}</span>
      <span>cache {String(cache.getQueryData(["unrelated"]))}</span>
      {mounted && (
        <KelloProvider
          url="https://example.test"
          auth={auth}
          onSessionChange={() => setChanges(changes + 1)}
          fallback={<p>private Alice snapshot</p>}
        >
          <Consumer />
        </KelloProvider>
      )}
    </QueryClientProvider>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<App />);
