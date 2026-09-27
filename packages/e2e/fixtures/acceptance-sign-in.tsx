import { useState } from "react";
import type { ReactBetterAuthClient } from "@neondatabase/auth";

/** Test-only shortcut through the same official auth client used by the example. */
export function SignIn({ auth }: { auth: ReactBetterAuthClient }) {
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
              const result = await auth.signIn.email({
                email: `${subject}@example.test`,
                password: "fixture-password",
              });
              if (result.error) throw new Error("Sign-in failed");
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
