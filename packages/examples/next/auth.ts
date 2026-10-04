import { headers } from "next/headers";
import { withKelloServerSession } from "kello/client";
import { createServerClient } from "./kello/_generated/api";
export async function withSession<R>(
  run: Parameters<typeof withKelloServerSession<ReturnType<typeof createServerClient>, R>>[2],
) {
  const authorization = (await headers()).get("authorization");
  return withKelloServerSession(
    createServerClient,
    {
      url: process.env.NEXT_PUBLIC_LOOM_SERVICE_URL!,
      getToken: async () => (authorization?.startsWith("Bearer ") ? authorization.slice(7) : null),
    },
    run,
  );
}
