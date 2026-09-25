import { createFileRoute } from "@tanstack/react-router";
import { session } from "../lib/session";
export const Route = createFileRoute("/api/session")({
  server: {
    handlers: {
      GET: ({ request }) => session(request),
      POST: ({ request }) => session(request),
      DELETE: ({ request }) => session(request),
    },
  },
});
