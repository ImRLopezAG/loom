"use client";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoomProvider, useLoom, auth } from "../lib/loom";
import type { LoomHydration } from "loom/client";
import type { Notes } from "../lib/loom";
import * as v from "valibot";
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
export function NotesPanel({
  url,
  initialNotes,
  hydration,
}: {
  url: string;
  initialNotes: Notes;
  hydration: LoomHydration;
}) {
  return (
    <LoomProvider url={url} hydration={hydration} ssrFallback={<NoteList notes={initialNotes} />} fallback={<SignIn />}>
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
          const input = v.safeParse(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(200)), text);
          if (input.success) save.mutate({ text: input.output }, { onSuccess: () => form.reset() });
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
            const result = await auth.signOut();
            if (result.error) throw new Error("Sign out failed");
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
  const [register, setRegister] = useState(false);
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(false);
        const data = new FormData(event.currentTarget);
        const parsed = v.safeParse(v.object({ email: v.string(), password: v.string(), name: v.string() }), {
          email: data.get("email"),
          password: data.get("password"),
          name: data.get("name") ?? "",
        });
        if (!parsed.success) {
          setPending(false);
          setError(true);
          return;
        }
        try {
          const { email, password, name } = parsed.output;
          const result = register
            ? await auth.signUp.email({ email, password, name })
            : await auth.signIn.email({ email, password });
          if (result.error) throw new Error("Sign in failed");
          reloadSession();
        } catch {
          setError(true);
        } finally {
          setPending(false);
        }
      }}
    >
      {register && (
        <label>
          Name <input name="name" autoComplete="name" required />
        </label>
      )}
      <label>
        Email <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        Password <input name="password" type="password" autoComplete="current-password" required />
      </label>
      <button type="submit" disabled={pending}>
        {register ? "Create account" : "Sign in"}
      </button>
      <button type="button" onClick={() => setRegister(!register)}>
        {register ? "Use an existing account" : "Create an account"}
      </button>
      {error && <p role="alert">Sign-in failed.</p>}
    </form>
  );
}
