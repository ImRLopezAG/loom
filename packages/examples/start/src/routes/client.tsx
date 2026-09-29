import { createFileRoute } from "@tanstack/react-router";
import { NotesPanel } from "../components/notes";

export const Route = createFileRoute("/client")({
  ssr: false,
  component: ClientPage,
  pendingComponent: () => <p role="status">Loading application…</p>,
  errorComponent: ({ reset }) => (
    <main>
      <p role="alert">Could not load this page.</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </main>
  ),
});

function ClientPage() {
  return (
    <main>
      <h1>Loom + TanStack Start · Client only</h1>
      <NotesPanel />
    </main>
  );
}
