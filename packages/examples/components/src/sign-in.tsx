import * as v from "valibot";
import { useState } from "react";
import type { ReactBetterAuthClient } from "@neondatabase/auth";

export function SignIn({ auth }: { auth: ReactBetterAuthClient }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [register, setRegister] = useState(false);
  return (
    <main className="sign-in">
      <h1>{register ? "Create your account" : "Welcome back"}</h1>
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
