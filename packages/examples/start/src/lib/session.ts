import { createCookieSessionHandler } from "@loom/core/server";
import { createServerClient } from "../../loom/_generated/api";
export { readToken, sessionFingerprint } from "@loom/core/server";
export function backendUrl() {
  const url = process.env.LOOM_SERVICE_URL;
  if (!url) throw new Error("Set LOOM_SERVICE_URL to your deployed Loom service");
  return new URL(url).href;
}
export const session = createCookieSessionHandler({
  async verify(token, signal) {
    const connection = createServerClient({ url: backendUrl(), getToken: async () => token });
    try {
      await connection.client.examples.greeting({ name: "Session" }, { signal });
    } finally {
      connection.dispose();
    }
  },
});
