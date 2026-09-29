import { headers } from "next/headers";
import { withLoomServerSession } from "loom/client";
import { createServerClient } from "./loom/_generated/api";
export async function withSession<R>(
  run: Parameters<typeof withLoomServerSession<ReturnType<typeof createServerClient>, R>>[2],
) {
  const authorization = (await headers()).get("authorization");
  return withLoomServerSession(
    createServerClient,
    {
      url: process.env.NEXT_PUBLIC_LOOM_SERVICE_URL!,
      getToken: async () => (authorization?.startsWith("Bearer ") ? authorization.slice(7) : null),
    },
    run,
  );
}
