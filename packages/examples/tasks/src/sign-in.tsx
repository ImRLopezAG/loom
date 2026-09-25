import * as v from "valibot";
import { useState } from "react";
import { createAuthClient } from "@neondatabase/auth";

const serviceUrl = import.meta.env.VITE_LOOM_URL;
const authUrl = import.meta.env.VITE_NEON_AUTH_URL;
const auth = authUrl ? createAuthClient(authUrl) : undefined;
export interface Session {
  readonly url: string;
  readonly deployment: string;
  readonly name: string;
  readonly identityKey: string;
  readonly issuer: string;
  readonly getAuth: () => Promise<{ token: string; identityKey: string } | null>;
  readonly signOut: () => Promise<void>;
}

export function SignIn({ onSession }: { onSession: (session: Session) => void }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [register, setRegister] = useState(false);
  if (!auth || !serviceUrl)
    return (
      <main className="sign-in">
        <h1>Connect your Neon application</h1>
        <p>Set VITE_NEON_AUTH_URL and VITE_LOOM_URL in .env, then restart the frontend.</p>
      </main>
    );
  return (
    <main className="sign-in">
      <h1>{register ? "Create your workspace" : "Welcome back"}</h1>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (pending) return;
          const data = new FormData(event.currentTarget);
          const email = data.get("email");
          const password = data.get("password");
          const name = data.get("name") ?? "";
          if (!v.is(v.string(), email) || !v.is(v.string(), password) || !v.is(v.string(), name)) return;
          setPending(true);
          setError("");
          try {
            const result = register
              ? await auth.signUp.email({ email, password, name })
              : await auth.signIn.email({ email, password });
            if (result.error) throw new Error(result.error.message ?? "Sign-in failed");
            const session = await auth.getSession();
            if (!session.data?.user) throw new Error("Verify your email, then sign in.");
            const identityKey = session.data.user.id;
            onSession({
              url: serviceUrl,
              identityKey,
              issuer: v.parse(v.string(), authUrl),
              deployment: import.meta.env.VITE_LOOM_DEPLOYMENT ?? "preview",
              name: session.data.user.name,
              getAuth: async () => {
                const current = await auth.getSession();
                if (current.data?.user.id !== identityKey) return null;
                // The Neon SDK places the refreshed JWT in the session token.
                const token = current.data.session.token;
                return token ? { token, identityKey } : null;
              },
              signOut: async () => {
                const result = await auth.signOut();
                if (result.error) throw new Error("Could not sign out. Try again.");
              },
            });
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : "Could not sign in.");
          } finally {
            setPending(false);
          }
        }}
      >
        {register && (
          <label>
            Name
            <input name="name" required autoComplete="name" />
          </label>
        )}
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            minLength={8}
            required
            autoComplete={register ? "new-password" : "current-password"}
          />
        </label>
        <button disabled={pending}>{pending ? "Connecting…" : register ? "Create account" : "Sign in"}</button>
      </form>
      <button disabled={pending} onClick={() => setRegister(!register)}>
        {register ? "Use an existing account" : "Create an account"}
      </button>
      {error && <p role="alert">{error}</p>}
    </main>
  );
}
