import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { withSession } from "../auth";
import { NotesPanel, SignIn } from "../components/notes";
const load = createServerFn({ method: "GET" }).handler(async () =>
  withSession(async ({ connection, queryClient, dehydrate }) => {
    const [greeting, notes] = await Promise.all([
      queryClient.query(connection.rpc.examples.greeting.queryOptions({ input: { name: "TanStack Start" } })),
      queryClient.query(connection.rpc.examples.notes.queryOptions()),
    ]);
    return { url: process.env.LOOM_SERVICE_URL!, greeting, notes, hydration: dehydrate() };
  }),
);
export const Route = createFileRoute("/")({
  loader: () => load(),
  component: Page,
  errorComponent: () => (
    <main>
      <h1>Loom + TanStack Start</h1>
      <p role="alert">Could not load your session.</p>
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
          <NotesPanel url={data.url} hydration={data.hydration} initialNotes={data.notes} />
        </>
      ) : (
        <SignIn />
      )}
    </main>
  );
}
