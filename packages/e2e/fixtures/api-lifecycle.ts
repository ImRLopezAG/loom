import {
  connectDatabase,
  createDispatcher,
  createRevisionReader,
  createSubscriptionPoller,
  createWebSocketSession,
  defineSchema,
  query,
} from "@loom/core/server";
import { defineRelations, sql } from "drizzle-orm";
import * as v from "valibot";

const config = v.parse(
  v.object({
    LOOM_TEST_DATABASE_URL: v.string(),
    LOOM_TEST_LIFECYCLE_SCHEMA: v.pipe(v.string(), v.regex(/^app_[a-f0-9]+$/)),
    LOOM_TEST_LIFECYCLE_METADATA: v.pipe(v.string(), v.regex(/^loom_[a-f0-9]+$/)),
    LOOM_TEST_LIFECYCLE_PORT: v.pipe(v.string(), v.transform(Number), v.integer(), v.minValue(0), v.maxValue(65535)),
  }),
  process.env,
);
const schema = defineSchema(() => ({}));
const connection = await connectDatabase({
  schema,
  relations: defineRelations(schema.tables),
  connectionString: config.LOOM_TEST_DATABASE_URL,
  maxConnections: 2,
});
const revisions = createRevisionReader({
  namespace: config.LOOM_TEST_LIFECYCLE_SCHEMA,
  metadataNamespace: config.LOOM_TEST_LIFECYCLE_METADATA,
  tables: ["counter"],
});
const dispatcher = createDispatcher({
  connection,
  revisions,
  version: "a".repeat(64),
  authorize: async () => {},
  functions: {
    "counter:read": query({
      args: v.null(),
      returns: v.number(),
      handler: async (context) => {
        const result = await context.db.execute<{ value: number }>(
          sql`SELECT value FROM ${sql.identifier(config.LOOM_TEST_LIFECYCLE_SCHEMA)}.counter`,
        );
        return v.parse(v.number(), result.rows[0]?.value);
      },
    }),
  },
});
const poller = createSubscriptionPoller({
  intervalMs: 10,
  readRevisions: () => revisions(connection.db),
  evaluate: dispatcher.evaluate,
});
interface SocketData {
  session?: ReturnType<typeof createWebSocketSession>;
}
const server = Bun.serve<SocketData>({
  hostname: "127.0.0.1",
  port: config.LOOM_TEST_LIFECYCLE_PORT,
  fetch(request, transport) {
    if (transport.upgrade(request, { data: {} })) return;
    return new Response("Upgrade required", { status: 426 });
  },
  websocket: {
    open(socket) {
      // This process-lifecycle fixture supplies a trusted identity; ticket/JWT authority has separate integration tests.
      socket.data.session = createWebSocketSession({
        poller,
        session: { identity: { issuer: "test", subject: "alice" }, expiresAt: Math.floor(Date.now() / 1000) + 60 },
        socket: {
          get readyState() {
            return socket.readyState;
          },
          get bufferedAmount() {
            return socket.getBufferedAmount();
          },
          send(message) {
            socket.send(message);
          },
          close(code, reason) {
            socket.close(code, reason);
          },
        },
      });
    },
    message(socket, message) {
      socket.data.session?.message(message);
    },
    close(socket) {
      socket.data.session?.dispose();
    },
  },
});
process.stdout.write(`${server.port}\n`);
