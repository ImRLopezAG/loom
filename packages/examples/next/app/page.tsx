import { cookies } from "next/headers";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createQueryClient } from "@loom/core/client";
import { createServerClient } from "../loom/_generated/api";
import { backendUrl, sessionFingerprint } from "../lib/session";
import { NotesPanel, SignIn } from "../components/notes";
export const dynamic = "force-dynamic";
export default async function Page() {
  const token = (await cookies()).get("loom_session")?.value;
  if (!token)
    return (
      <main>
        <h1>Loom + Next.js</h1>
        <SignIn />
      </main>
    );
  const sessionId = await sessionFingerprint(token);
  const url = backendUrl();
  const connection = createServerClient({ url, getToken: async () => token });
  const queryClient = createQueryClient();
  try {
    const [greeting, notes] = await Promise.all([
      queryClient.fetchQuery(connection.rpc.examples.greeting.queryOptions({ input: { name: "Next.js" } })),
      queryClient.fetchQuery(connection.rpc.examples.notes.queryOptions()),
    ]);
    return (
      <main>
        <h1>Loom + Next.js</h1>
        <p>{greeting.message}</p>
        <p>Signed in as {greeting.owner}</p>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <NotesPanel url={url} initialNotes={notes} sessionId={sessionId} />
        </HydrationBoundary>
      </main>
    );
  } catch {
    return (
      <main>
        <h1>Loom + Next.js</h1>
        <p role="alert">Could not load your session. Reconnect to retry.</p>
        <SignIn />
      </main>
    );
  } finally {
    connection.dispose();
    queryClient.clear();
  }
}
