import assert from "node:assert/strict";
import { test, expect } from "bun:test";
import { createConnection, createServer, type Socket } from "node:net";
import { EventEmitter } from "node:events";
import { setTimeout } from "node:timers/promises";
import pg from "pg";
import * as v from "valibot";
import {
  ExtensionOperationError,
  withExtensionOperation,
  type ExtensionOperationContext,
} from "../../../apps/loom/src/tooling/extensions/operations";
import { withExtensionDatabase } from "../fixtures/extension-database";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
const local =
  connectionString && ["localhost", "127.0.0.1", "::1", "[::1]"].includes(new URL(connectionString).hostname);

/** Forward actual PostgreSQL bytes, dropping one native reply or holding final FIN. No driver results supplied. */
async function withNativeTransportGate(
  url: string,
  mode: "commit" | "termination" | "close",
  operation: (url: string, observed: Promise<void>, releaseClose: () => void) => Promise<void>,
) {
  const target = new URL(url);
  const sockets = new Set<Socket>();
  const observed = Promise.withResolvers<void>();
  const releaseClose = Promise.withResolvers<void>();
  const server = createServer({ allowHalfOpen: mode === "close" }, (downstream) => {
    const upstream = createConnection({
      host: target.hostname.replace(/^\[|\]$/g, ""),
      port: Number(target.port || "5432"),
    });
    sockets.add(downstream);
    sockets.add(upstream);
    let startup = true;
    let front = Buffer.alloc(0);
    let back = Buffer.alloc(0);
    let discard = false;
    let commitForwarded = false;
    let readyForwarded = false;
    let terminateReceived = false;
    let postgresClosed = false;
    let clientHalfClosed = false;
    const observeHeldClose = () => {
      if (
        mode === "close" &&
        commitForwarded &&
        readyForwarded &&
        terminateReceived &&
        postgresClosed &&
        clientHalfClosed
      ) {
        observed.resolve();
        void releaseClose.promise.then(() => downstream.end());
      }
    };
    downstream.on("error", () => undefined);
    upstream.on("error", (error) => downstream.destroy(error));
    downstream.on("close", () => {
      sockets.delete(downstream);
      upstream.destroy();
    });
    downstream.on("end", () => {
      clientHalfClosed = true;
      observeHeldClose();
    });
    upstream.on("close", () => {
      sockets.delete(upstream);
      if (mode === "close" && commitForwarded && readyForwarded && terminateReceived) {
        // PostgreSQL actually accepted Terminate and closed. The client has sent its FIN, but
        // allowHalfOpen keeps our writable side open, retaining its end() until explicitly released.
        postgresClosed = true;
        observeHeldClose();
      } else downstream.destroy();
    });
    downstream.on("data", (chunk: Buffer) => {
      front = Buffer.concat([front, chunk]);
      for (;;) {
        if (startup) {
          if (front.length < 4) break;
          const length = front.readUInt32BE(0);
          if (front.length < length) break;
          front = front.subarray(length);
          startup = false;
        } else {
          if (front.length < 5) break;
          const length = front.readUInt32BE(1) + 1;
          if (front.length < length) break;
          const packet = front.subarray(0, length);
          front = front.subarray(length);
          if (packet[0] === 88) terminateReceived = true;
          if (packet[0] === 81 || packet[0] === 80) {
            const body = packet.subarray(5).toString();
            const query = packet[0] === 80 ? body.slice(body.indexOf("\0") + 1).split("\0")[0] : body.split("\0")[0];
            if (
              (mode === "commit" && query === "COMMIT") ||
              (mode === "termination" && query?.includes("pg_terminate_backend"))
            )
              discard = true;
          }
        }
      }
      upstream.write(chunk);
    });
    upstream.on("data", (chunk: Buffer) => {
      back = Buffer.concat([back, chunk]);
      while (back.length >= 5) {
        const length = back.readUInt32BE(1) + 1;
        if (back.length < length) return;
        const packet = back.subarray(0, length);
        back = back.subarray(length);
        const actualCommit = packet[0] === 67 && packet.subarray(5).toString() === "COMMIT\0";
        const actualTerminationRow = packet[0] === 68;
        if (discard && (mode === "commit" ? actualCommit : actualTerminationRow)) {
          // PostgreSQL has produced its actual reply; disconnect before forwarding it to pg.
          observed.resolve();
          downstream.destroy();
          upstream.destroy();
          return;
        }
        downstream.write(packet);
        if (actualCommit) commitForwarded = true;
        if (commitForwarded && packet[0] === 90 && packet[5] === 73) readyForwarded = true;
      }
    });
  });
  // Node26 net types delegate events through InternalEventEmitter, absent from older ambient
  // Node event declarations in this workspace. Establish the actual native base without a cast.
  if (!(server instanceof EventEmitter)) throw new Error("Native PostgreSQL proxy server is not an EventEmitter");
  await new Promise<void>((resolve, reject) => {
    server.on("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = v.parse(v.looseObject({ port: v.number() }), server.address());
  const proxied = new URL(url);
  proxied.hostname = "127.0.0.1";
  proxied.port = String(address.port);
  proxied.searchParams.set("sslmode", "disable");
  try {
    await operation(proxied.href, observed.promise, () => releaseClose.resolve());
  } finally {
    releaseClose.resolve();
    for (const socket of sockets) socket.destroy();
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

function fixture({ client, run }: ExtensionOperationContext) {
  return Object.freeze({
    insert: () =>
      run(async () => {
        await client.query("INSERT INTO public.operator_transport VALUES (1)");
      }),
    pid: () =>
      run(async () => v.parse(v.number(), (await client.query("SELECT pg_backend_pid() AS pid")).rows[0]?.pid)),
  });
}

async function bounded<Value>(pending: Promise<Value>): Promise<Value> {
  const timer = new AbortController();
  try {
    return await Promise.race([
      pending,
      setTimeout(8000, undefined, { signal: timer.signal }).then(() => {
        throw new Error("Native transport gate did not settle");
      }),
    ]);
  } finally {
    timer.abort();
  }
}

test.skipIf(!local)("lost actual COMMIT reply reports unknown while direct observer sees durable write", async () => {
  await withExtensionDatabase(async (url) => {
    const observer = new pg.Client({ connectionString: url });
    await observer.connect();
    try {
      await observer.query("CREATE TABLE public.operator_transport (value integer NOT NULL)");
      await withNativeTransportGate(url, "commit", async (proxied, dropped) => {
        let admitted = 0;
        const pending = withExtensionOperation(proxied, fixture, async (session) => {
          admitted++;
          await session.insert();
          return "committed but unseen";
        });
        const outcome = pending.then(
          () => undefined,
          (error: Error) => error,
        );
        await bounded(dropped);
        const error = await bounded(outcome);
        assert(error instanceof ExtensionOperationError);
        expect(error.completion).toBe("unknown");
        expect((await observer.query("SELECT * FROM public.operator_transport")).rows).toEqual([{ value: 1 }]);
        expect(admitted).toBe(1);
      });
    } finally {
      await observer.end();
    }
  });
});

test.skipIf(!local)("lost actual termination reply exposes cleanup failure beside exact abort cause", async () => {
  await withExtensionDatabase(async (url) => {
    const observer = new pg.Client({ connectionString: url });
    await observer.connect();
    try {
      await observer.query("CREATE TABLE public.operator_transport (value integer NOT NULL)");
      await withNativeTransportGate(url, "termination", async (proxied, dropped) => {
        const controller = new AbortController();
        const reason = new Error("Native cleanup reply lost");
        const entered = Promise.withResolvers<number>();
        const resume = Promise.withResolvers<void>();
        const pending = withExtensionOperation(
          proxied,
          fixture,
          async (session) => {
            await session.insert();
            entered.resolve(await session.pid());
            await resume.promise;
            return "revoked";
          },
          controller.signal,
        );
        const outcome = pending.then(
          () => undefined,
          (error: Error) => error,
        );
        try {
          const pid = await bounded(entered.promise);
          controller.abort(reason);
          await bounded(dropped);
          const error = await bounded(outcome);
          assert(error instanceof ExtensionOperationError);
          expect(error.cause).toBe(reason);
          expect(error.completion).toBe("unknown");
          expect(error.cleanupFailures.length).toBeGreaterThan(0);
          expect((await observer.query("SELECT pid FROM pg_stat_activity WHERE pid=$1", [pid])).rows).toEqual([]);
          expect((await observer.query("SELECT * FROM public.operator_transport")).rows).toEqual([]);
        } finally {
          resume.resolve();
          await pending.catch(() => undefined);
        }
      });
    } finally {
      await observer.end();
    }
  });
});

test.skipIf(!local)(
  "abort after confirmed native COMMIT while final close is pending retains committed completion",
  async () => {
    await withExtensionDatabase(async (url) => {
      const observer = new pg.Client({ connectionString: url });
      await observer.connect();
      try {
        await observer.query("CREATE TABLE public.operator_transport (value integer NOT NULL)");
        await withNativeTransportGate(url, "close", async (proxied, closing, releaseClose) => {
          const controller = new AbortController();
          let settled = false;
          let admitted = 0;
          const pending = withExtensionOperation(
            proxied,
            fixture,
            async (session) => {
              admitted++;
              await session.insert();
              return "confirmed before close";
            },
            controller.signal,
          );
          const outcome = pending.then(
            (value) => {
              settled = true;
              return value;
            },
            (cause) => {
              settled = true;
              throw cause;
            },
          );
          void outcome.catch(() => undefined);
          try {
            // The proxy forwarded actual COMMIT and idle ReadyForQuery, then observed actual
            // client Terminate and PostgreSQL close. Only downstream FIN is still held.
            await bounded(closing);
            expect(settled).toBe(false);
            expect((await observer.query("SELECT * FROM public.operator_transport")).rows).toEqual([{ value: 1 }]);
            controller.abort(new Error("Aborted after confirmed commit before end settled"));
            expect(settled).toBe(false);
            releaseClose();
            expect(await bounded(outcome)).toEqual({ completion: "committed", value: "confirmed before close" });
            expect(admitted).toBe(1);
            expect((await observer.query("SELECT * FROM public.operator_transport")).rows).toEqual([{ value: 1 }]);
          } finally {
            releaseClose();
            await bounded(pending).catch(() => undefined);
          }
        });
      } finally {
        await observer.end();
      }
    });
  },
);
