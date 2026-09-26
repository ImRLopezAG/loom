import * as v from "valibot";

export interface LoomAuth {
  /** Non-secret identity/version key. Change it whenever the authenticated identity changes. */
  readonly sessionKey: string;
  readonly getToken: () => Promise<string | null>;
  /** Notify only when identity changes or is revoked; the provider suspends until a new sessionKey arrives. */
  readonly subscribe?: (onChange: () => void) => () => void;
}

const responseSchema = v.object({ token: v.nullable(v.string()) });

/** Optional adapter for createCookieSessionHandler. No browser resources open until subscribed. */
export function createCookieSession(endpoint = "/api/session") {
  if (!endpoint.startsWith("/") || new URL(endpoint, "https://loom.invalid").origin !== "https://loom.invalid")
    throw new Error("Session endpoint must be a same-origin absolute path");
  const events = new EventTarget();
  const channelName = `loom-session:${endpoint}`;
  function changed() {
    events.dispatchEvent(new Event("change"));
    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(channelName);
      channel.postMessage("changed");
      channel.close();
    }
  }
  async function update(method: "POST" | "DELETE", body?: string) {
    const init: RequestInit = {
      method,
      credentials: "same-origin",
      redirect: "error",
    };
    if (body !== undefined) init.body = body;
    const response = await fetch(endpoint, init);
    if (!response.ok) throw new Error("Session update failed");
    changed();
  }
  return {
    signIn: (token: string) => update("POST", token),
    signOut: () => update("DELETE"),
    auth(sessionKey: string): LoomAuth {
      return {
        sessionKey,
        async getToken() {
          const response = await fetch(endpoint, {
            headers: { "x-loom-session": "1", "x-loom-session-id": sessionKey },
            cache: "no-store",
            credentials: "same-origin",
            redirect: "error",
          });
          if (!response.ok) return null;
          return v.parse(responseSchema, await response.json()).token;
        },
        subscribe(onChange) {
          events.addEventListener("change", onChange);
          const channel = typeof BroadcastChannel === "undefined" ? undefined : new BroadcastChannel(channelName);
          if (channel) channel.onmessage = onChange;
          return () => {
            events.removeEventListener("change", onChange);
            channel?.close();
          };
        },
      };
    },
  };
}
