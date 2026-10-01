import { withSession } from "../auth";
import { NotesPanel, NoteList } from "../components/notes";
export const dynamic = "force-dynamic";
export default async function Page() {
  const data = await withSession(async ({ connection, queryClient, dehydrate }) => {
    const [greeting, notes] = await Promise.all([
      queryClient.query(connection.rpc.examples.greeting.queryOptions({ input: { name: "Next.js" } })),
      queryClient.query(connection.rpc.examples.notes.queryOptions()),
    ]);
    return { greeting, notes, hydration: dehydrate() };
  });
  return (
    <main>
      <h1>Loom + Next.js</h1>
      {data ? (
        <>
          <p>{data.greeting.message}</p>
          <p>Signed in as {data.greeting.owner}</p>
          <NotesPanel hydration={data.hydration} initialNotes={data.notes} />
          <noscript>
            <NoteList notes={data.notes} />
          </noscript>
        </>
      ) : (
        <NotesPanel />
      )}
    </main>
  );
}
