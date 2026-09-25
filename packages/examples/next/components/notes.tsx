"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoomProvider, useLoom, session } from "../lib/loom";
import type { Notes } from "../lib/loom";
import { z } from "zod";
function reloadSession() {
  location.assign("/");
}
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
  const auth = useMemo(() => session.auth(sessionId), [sessionId]);
  return (
    <LoomProvider url={url} auth={auth} fallback={<NoteList notes={initialNotes} />} onSessionChange={reloadSession}>
      <ConnectedNotes />
    </LoomProvider>
  );
}
function ConnectedNotes() {
  const { rpc } = useLoom();
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
            await session.signOut();
            reloadSession();
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
          await session.signIn(parsed.data);
          reloadSession();
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
