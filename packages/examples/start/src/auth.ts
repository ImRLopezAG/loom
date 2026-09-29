import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { withLoomServerSession } from "loom/client";
import { createServerClient } from "../loom/_generated/api";
export async function withSession<R>(
  run: Parameters<typeof withLoomServerSession<ReturnType<typeof createServerClient>, R>>[2],
) {
  const request = getRequest();
  setResponseHeader("Cache-Control", "private, no-store");
  const authorization = request.headers.get("authorization");
  return withLoomServerSession(
    createServerClient,
    {
      url: import.meta.env.VITE_LOOM_SERVICE_URL!,
      signal: request.signal,
      getToken: async () => (authorization?.startsWith("Bearer ") ? authorization.slice(7) : null),
    },
    run,
  );
}
