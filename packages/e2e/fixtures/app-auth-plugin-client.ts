import type { BetterAuthClientPlugin } from "better-auth/client";
import type { appPreferences } from "./app-auth-plugin";

export function appPreferencesClient() {
  return {
    id: "app-preferences",
    // SAFETY: Better Auth's type-only inference marker; no server implementation is read at runtime.
    $InferServerPlugin: {} as ReturnType<typeof appPreferences>,
  } satisfies BetterAuthClientPlugin;
}
