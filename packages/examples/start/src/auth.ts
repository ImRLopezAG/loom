import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { withKelloServerSession } from "kello/client";
import { createServerClient } from "../kello/_generated/api";
export async function withSession<R>(
  run: Parameters<typeof withKelloServerSession<ReturnType<typeof createServerClient>, R>>[2],
) {
  const request = getRequest();
  setResponseHeader("Cache-Control", "private, no-store");
  const authorization = request.headers.get("authorization");
  return withKelloServerSession(
    createServerClient,
    {
      url: import.meta.env.VITE_LOOM_SERVICE_URL!,
      signal: request.signal,
      getToken: async () => (authorization?.startsWith("Bearer ") ? authorization.slice(7) : null),
    },
    run,
  );
}
