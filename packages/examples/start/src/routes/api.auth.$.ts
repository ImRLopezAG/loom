import { createFileRoute } from "@tanstack/react-router";
import { handler } from "../auth";
export const Route = createFileRoute("/api/auth/$")({
  server: { handlers: { ANY: ({ request }) => handler(request) } },
});
