"use client";

import dynamic from "next/dynamic";

const NotesPanel = dynamic(() => import("../../components/notes").then((module) => module.NotesPanel), {
  ssr: false,
  loading: () => <p role="status">Loading application…</p>,
});

export default function ClientPage() {
  return (
    <main>
      <h1>Loom + Next.js · Client only</h1>
      <NotesPanel />
    </main>
  );
}
