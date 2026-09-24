import { useState } from "react";
import * as v from "valibot";

const sessionSchema = v.object({
  token: v.string(),
  identityKey: v.string(),
  url: v.string(),
  deployment: v.string(),
  issuer: v.string(),
});
export interface Session {
  readonly url: string;
  readonly deployment: string;
  readonly name: string;
  readonly issuer: string;
  readonly identityKey: string;
  readonly getAuth: () => Promise<{ token: string; identityKey: string } | null>;
  readonly signOut: () => Promise<void>;
}
/** This module replaces Neon sign-in only in disposable test builds. */
export function SignIn({ onSession }: { onSession: (session: Session) => void }) {
  const [error, setError] = useState(false);
  return (
    <main>
      <h1>Test workspace</h1>
      {(["alice", "bob"] as const).map((subject) => (
        <button
          key={subject}
          onClick={async () => {
            setError(false);
            try {
              const response = await fetch("/session", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ subject }),
              });
              if (!response.ok) throw new Error("Session unavailable");
              const session = v.parse(sessionSchema, await response.json());
              let active = true;
              onSession({
                ...session,
                name: subject === "alice" ? "Alice" : "Bob",
                getAuth: async () => (active ? session : null),
                signOut: async () => {
                  active = false;
                },
              });
            } catch {
              setError(true);
            }
          }}
        >
          Continue as {subject === "alice" ? "Alice" : "Bob"}
        </button>
      ))}
      {error && <p role="alert">Could not sign in</p>}
    </main>
  );
}
