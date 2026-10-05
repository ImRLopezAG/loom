import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { withSession } from "../auth";
import { NotesPanel } from "../components/notes";
const load = createServerFn({ method: "GET" }).handler(async () =>
  withSession(async ({ connection, queryClient, dehydrate }) => {
    const [greeting, notes] = await Promise.all([
      queryClient.query(connection.rpc.examples.greeting.queryOptions({ input: { name: "TanStack Start" } })),
      queryClient.query(connection.rpc.examples.notes.queryOptions()),
    ]);
    return { greeting, notes, hydration: dehydrate() };
  }),
);
export const Route = createFileRoute("/")({
  loader: () => load(),
  component: Page,
  errorComponent: ({ reset }) => (
    <main>
      <h1>Kello + TanStack Start</h1>
      <p role="alert">Could not load this page.</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </main>
  ),
});
function Page() {
  const data = Route.useLoaderData();
  return (
    <main>
      <h1>Kello + TanStack Start</h1>
      {data ? (
        <>
          <p>{data.greeting.message}</p>
          <p>Signed in as {data.greeting.owner}</p>
          <NotesPanel hydration={data.hydration} initialNotes={data.notes} />
        </>
      ) : (
        <NotesPanel />
      )}
    </main>
  );
}
