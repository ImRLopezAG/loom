import { useState } from "react";
import * as v from "valibot";
import { createRoot } from "react-dom/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createLoomNeonReact } from "loom/react/neon";
import { createClient, configuration } from "../loom/_generated/api";
import { SignIn } from "./sign-in";
import "./style.css";

const authUrl = import.meta.env.VITE_NEON_AUTH_URL ?? configuration.authUrl;
const serviceUrl = import.meta.env.VITE_LOOM_URL ?? configuration.serviceUrl;
const loom = authUrl ? createLoomNeonReact(createClient, { authUrl }) : undefined;

function Journal({ bindings }: { bindings: NonNullable<typeof loom> }) {
  const { rpc } = bindings.useLoom();
  const cache = useQueryClient();
  const [paused, setPaused] = useState(false);
  const [message, setMessage] = useState("");
  const snapshotOptions = rpc.journal.list.queryOptions();
  const liveOptions = rpc.journal.watch.liveOptions({ enabled: !paused });
  const snapshot = useQuery(snapshotOptions);
  const live = useQuery(liveOptions);
  const add = useMutation(rpc.journal.add.mutationOptions());
  const entries = paused ? snapshot.data : (live.data ?? snapshot.data);
  const error = paused ? snapshot.error : (live.error ?? snapshot.error);
  return (
    <main>
      <header>
        <p>Loom component example</p>
        <h1>Your journal</h1>
        <p>Save a thought. Open a second tab to see new entries arrive.</p>
        <button
          onClick={async () => {
            try {
              const result = await bindings.auth.signOut();
              if (result.error) setMessage("Could not sign out. Try again.");
            } catch {
              setMessage("Could not sign out. Try again.");
            }
          }}
        >
          Sign out
        </button>
      </header>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (add.isPending) return;
          const form = event.currentTarget;
          const text = new FormData(form).get("text");
          if (!v.is(v.string(), text) || !text.trim()) return;
          setMessage("");
          try {
            await add.mutateAsync({ text });
            await cache.invalidateQueries({ queryKey: snapshotOptions.queryKey });
            form.reset();
          } catch (cause) {
            setMessage(cause instanceof Error ? cause.message : "Could not save entry. Try again.");
          }
        }}
      >
        <label htmlFor="entry">New entry</label>
        <textarea id="entry" name="text" maxLength={200} required />
        <button disabled={add.isPending}>{add.isPending ? "Saving…" : "Save entry"}</button>
      </form>
      {message && <p role="alert">{message}</p>}
      <section aria-label="Recent entries">
        <h2>Recent entries</h2>
        <p role="status">
          {paused
            ? "Live updates paused."
            : live.isError
              ? "Live updates unavailable."
              : live.isPending
                ? "Connecting live updates…"
                : "Live updates active."}
        </p>
        <button
          onClick={async () => {
            if (paused) {
              await cache.invalidateQueries({ queryKey: liveOptions.queryKey });
              setPaused(false);
              return;
            }
            if (live.data) cache.setQueryData(snapshotOptions.queryKey, live.data);
            setPaused(true);
            await cache.cancelQueries({ queryKey: liveOptions.queryKey });
          }}
        >
          {paused ? "Resume live updates" : "Pause live updates"}
        </button>
        {error && <p role="alert">{error.message}</p>}
        {!entries && !error && <p>Loading entries…</p>}
        {entries?.length === 0 && <p>No entries yet. Save your first thought above.</p>}
        <ul>
          {entries?.map((entry) => (
            <li key={entry._id}>{entry.text}</li>
          ))}
        </ul>
        <small>Showing up to 50 recent entries.</small>
      </section>
    </main>
  );
}

function App() {
  if (!loom || !serviceUrl)
    return (
      <main>
        <h1>Connect your journal</h1>
        <p>Run loom link and deploy, then set VITE_LOOM_URL and VITE_NEON_AUTH_URL.</p>
      </main>
    );
  return (
    <loom.LoomProvider url={serviceUrl} fallback={<SignIn auth={loom.auth} />}>
      <Journal bindings={loom} />
    </loom.LoomProvider>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing application root");
createRoot(root).render(<App />);
