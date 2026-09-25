"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { connect } from "../lib/queries";
import type { Connection, Notes } from "../lib/queries";
import { z } from "zod";
function sessionChanged() {
  const channel = new BroadcastChannel("loom-example-session");
  channel.postMessage("changed");
  channel.close();
}
const sessionData = z.object({ token: z.string().nullable() });
export function NoteList({ notes }: { notes: Notes }) {
  return (
    <ul aria-label="Latest 50 notes">
      {notes.map((note) => (
        <li key={note._id}>{note.text}</li>
      ))}
    </ul>
  );
}
export function NotesPanel({ url, initialNotes, sessionId }: { url: string; initialNotes: Notes; sessionId: string }) {
  const queryClient = useQueryClient();
  const [connection, setConnection] = useState<Connection | null>(null);
  useEffect(() => {
    const current = connect(url, async () => {
      const response = await fetch("/api/session", {
        headers: { "x-loom-session": "1", "x-loom-session-id": sessionId },
        cache: "no-store",
      });
      if (!response.ok) return null;
      return sessionData.parse(await response.json()).token;
    });
    const channel = new BroadcastChannel("loom-example-session");
    channel.onmessage = () => {
      current.dispose();
      queryClient.clear();
      location.assign("/");
    };
    setConnection(current);
    return () => {
      channel.close();
      current.dispose();
    };
  }, [url, sessionId, queryClient]);
  // Identical server/first-client markup. No live iterator is awaited by SSR.
  return connection ? <ConnectedNotes connection={connection} /> : <NoteList notes={initialNotes} />;
}
function ConnectedNotes({ connection }: { connection: Connection }) {
  const { rpc } = connection;
  const [signOutFailed, setSignOutFailed] = useState(false);
  const queryClient = useQueryClient();
  const snapshot = useQuery(rpc.examples.notes.queryOptions());
  const live = useQuery(rpc.examples.watch.liveOptions({ retry: false }));
  const save = useMutation(
    rpc.examples.add.mutationOptions({
      onSuccess: () => queryClient.invalidateQueries({ queryKey: rpc.examples.notes.key() }),
    }),
  );
  return (
    <section>
      <p role="status">
        {live.isError
          ? "Live connection unavailable"
          : live.data
            ? "Live updates connected"
            : "Connecting live updates…"}
      </p>
      <NoteList notes={live.data ?? snapshot.data ?? []} />
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const text = new FormData(form).get("text");
          const input = z.string().trim().min(1).max(200).safeParse(text);
          if (input.success) save.mutate({ text: input.data }, { onSuccess: () => form.reset() });
        }}
      >
        <label>
          New note <input name="text" required maxLength={200} />
        </label>
        <button type="submit" disabled={save.isPending}>
          Add note
        </button>
      </form>
      {(save.isError || snapshot.isError) && <p role="alert">The request failed. Your session may have expired.</p>}
      <button
        type="button"
        onClick={async () => {
          try {
            const response = await fetch("/api/session", { method: "DELETE" });
            if (!response.ok) throw new Error("Sign-out failed");
            sessionChanged();
            connection.dispose();
            queryClient.clear();
            location.assign("/");
          } catch {
            setSignOutFailed(true);
          }
        }}
      >
        Sign out
      </button>
      {signOutFailed && <p role="alert">Could not sign out. Try again.</p>}
    </section>
  );
}
export function SignIn() {
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(false);
        const token = new FormData(event.currentTarget).get("token");
        const parsed = z.string().safeParse(token);
        if (!parsed.success) {
          setPending(false);
          return;
        }
        try {
          const response = await fetch("/api/session", { method: "POST", body: parsed.data });
          if (response.ok) {
            sessionChanged();
            location.assign("/");
          } else setError(true);
        } catch {
          setError(true);
        } finally {
          setPending(false);
        }
      }}
    >
      <p>Use a short-lived access token from the identity provider configured for your Loom backend.</p>
      <label>
        Access token <input name="token" type="password" autoComplete="off" required maxLength={3800} />
      </label>
      <button type="submit" disabled={pending}>
        Connect
      </button>
      {error && <p role="alert">Sign-in failed.</p>}
    </form>
  );
}
