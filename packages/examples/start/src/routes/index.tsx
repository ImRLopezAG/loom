import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { connectServer, createQueryClient } from "../lib/queries";
import { backendUrl, readToken, sessionFingerprint } from "../lib/session";
import { NotesPanel, SignIn } from "../components/notes";
const load = createServerFn({ method: "GET" }).handler(async () => {
  setResponseHeader("Cache-Control", "private, no-store");
  setResponseHeader("Vary", "Cookie");
  const token = readToken(getRequest());
  if (!token) return null;
  const url = backendUrl();
  const connection = connectServer(url, async () => token);
  const queryClient = createQueryClient();
  try {
    const [greeting, notes] = await Promise.all([
      queryClient.fetchQuery(connection.rpc.examples.mixed.queryOptions({ input: { name: "TanStack Start" } })),
      queryClient.fetchQuery(connection.rpc.examples.notes.queryOptions()),
    ]);
    return { url, greeting, notes, sessionId: await sessionFingerprint(token), updatedAt: Date.now() };
  } finally {
    connection.dispose();
    queryClient.clear();
  }
});
export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    const data = await load();
    if (data) {
      const connection = connectServer(data.url, async () => null);
      try {
        context.queryClient.setQueryData(connection.rpc.examples.notes.queryKey(), data.notes, {
          updatedAt: data.updatedAt,
        });
      } finally {
        connection.dispose();
      }
    }
    return data;
  },
  component: Page,
  errorComponent: () => (
    <main>
      <h1>Loom + TanStack Start</h1>
      <p role="alert">Could not load your session. Reconnect to retry.</p>
      <SignIn />
    </main>
  ),
});
function Page() {
  const data = Route.useLoaderData();
  return (
    <main>
      <h1>Loom + TanStack Start</h1>
      {data ? (
        <>
          <p>{data.greeting.message}</p>
          <p>Signed in as {data.greeting.owner}</p>
          <NotesPanel url={data.url} initialNotes={data.notes} sessionId={data.sessionId} />
        </>
      ) : (
        <SignIn />
      )}
    </main>
  );
}
