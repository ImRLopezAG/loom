import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import pg from "pg";
import * as v from "valibot";
import { setTimeout } from "node:timers/promises";
import { withExtensionDatabase } from "../fixtures/extension-database";
import {
  ExtensionOperationError,
  withExtensionOperation,
  type ExtensionOperationContext,
} from "../../../apps/loom/src/tooling/extensions/operations";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;

function fixture(namespace: string) {
  return ({ client, run }: ExtensionOperationContext) =>
    Object.freeze({
      insert(value: number) {
        return run(async () => {
          const parsed = v.parse(v.pipe(v.number(), v.integer()), value);
          await client.query(`INSERT INTO "${namespace}".writes VALUES ($1)`, [parsed]);
        });
      },
      fail(cause: unknown) {
        return run(async () => {
          throw cause;
        });
      },
      decode(mode: "value" | "null" | "missing") {
        return run(async () => {
          const result = await client.query(
            mode === "missing"
              ? "SELECT 1 AS value WHERE false"
              : mode === "null"
                ? "SELECT NULL AS value"
                : "SELECT 'wrong' AS value",
          );
          return v.parse(v.number(), result.rows[0]?.value);
        });
      },
      nativeFailure() {
        return run(async () => {
          await client.query("SELECT 1/0");
        });
      },
      pid() {
        return run(async () => {
          const result = await client.query("SELECT pg_catalog.pg_backend_pid() AS pid");
          return v.parse(v.number(), result.rows[0]?.pid);
        });
      },
      hold(key: number) {
        return run(async () => {
          await client.query("SELECT pg_catalog.pg_advisory_xact_lock($1::bigint)", [key]);
        });
      },
      blockedWrite(key: number, value: number, fail = false) {
        return run(async () => {
          await client.query("SELECT pg_catalog.pg_advisory_xact_lock($1::bigint)", [key]);
          await client.query(`INSERT INTO "${namespace}".writes VALUES ($1)`, [value]);
          if (fail) await client.query("SELECT 1/0");
        });
      },
      trace(value: number) {
        return run(async () => {
          await client.query(`INSERT INTO "${namespace}".trace (value) VALUES ($1)`, [value]);
        });
      },
      pipeline(key: number) {
        return run(async () => {
          await client.query(`INSERT INTO "${namespace}".trace (value) VALUES (1)`);
          await client.query("SELECT pg_catalog.pg_advisory_xact_lock($1::bigint)", [key]);
          await client.query(`INSERT INTO "${namespace}".trace (value) VALUES (2)`);
        });
      },
    });
}

async function withFixture(operation: (url: string, observer: pg.Client, namespace: string) => Promise<void>) {
  await withExtensionDatabase(async (url) => {
    const namespace = "operator_fixture";
    const observer = new pg.Client({ connectionString: url });
    await observer.connect();
    try {
      await observer.query(`CREATE SCHEMA "${namespace}"`);
      await observer.query(
        `CREATE TABLE "${namespace}".writes (value integer NOT NULL, UNIQUE(value) DEFERRABLE INITIALLY DEFERRED)`,
      );
      await observer.query(
        `CREATE TABLE "${namespace}".trace (id integer GENERATED ALWAYS AS IDENTITY, value integer NOT NULL)`,
      );
      await observer.query("SET stats_fetch_consistency = 'none'");
      await operation(url, observer, namespace);
    } finally {
      await observer.end();
    }
  });
}

async function waitFor(predicate: () => Promise<boolean>, message: string) {
  const expires = performance.now() + 5000;
  while (!(await predicate())) {
    if (performance.now() > expires) throw new Error(message);
    await setTimeout(20);
  }
}
async function bounded<Value>(pending: Promise<Value>): Promise<Value> {
  const timer = new AbortController();
  try {
    return await Promise.race([
      pending,
      setTimeout(8000, undefined, { signal: timer.signal }).then(() => {
        throw new Error("Operator scope did not settle");
      }),
    ]);
  } finally {
    timer.abort();
  }
}

async function absent(observer: pg.Client, pid: number) {
  // Current-activity snapshots are retained within the observer's blocking transaction.
  // Clear that snapshot before requiring exact backend absence, without releasing its blocker.
  await observer.query("SELECT pg_catalog.pg_stat_clear_snapshot()");
  return (await observer.query("SELECT pid FROM pg_catalog.pg_stat_activity WHERE pid=$1", [pid])).rows.length === 0;
}
async function blocked(observer: pg.Client, pid: number) {
  await observer.query("SELECT pg_catalog.pg_stat_clear_snapshot()");
  return (
    (await observer.query("SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1", [pid])).rows[0]
      ?.wait_event_type === "Lock"
  );
}

test.skipIf(!connectionString)("operator catches still poison the owned transaction before commit", async () => {
  if (!connectionString) throw new Error("Missing database URL");
  await withFixture(async (url, observer, namespace) => {
    let firstCause: unknown;
    await assert.rejects(
      withExtensionOperation(url, fixture(namespace), async (session) => {
        await session.insert(1);
        try {
          await session.insert(1.5);
        } catch (cause) {
          firstCause = cause;
        }
        return "caught";
      }),
      (error) =>
        error instanceof ExtensionOperationError && error.cause === firstCause && error.completion === "rolled-back",
    );
    expect((await observer.query(`SELECT * FROM "${namespace}".writes`)).rows).toEqual([]);
    const result = await withExtensionOperation(url, fixture(namespace), async (session) => {
      await session.insert(2);
      return "accepted";
    });
    expect(result).toEqual({ completion: "committed", value: "accepted" });
    expect((await observer.query(`SELECT * FROM "${namespace}".writes`)).rows).toEqual([{ value: 2 }]);
  });
});

test.skipIf(!connectionString)(
  "operator preserves exact caught decoder, native and arbitrary first causes",
  async () => {
    await withFixture(async (url, observer, namespace) => {
      for (const variant of ["value", "null", "missing", "native", "undefined", "string"] as const) {
        let firstCause: unknown;
        let caught = false;
        await assert.rejects(
          withExtensionOperation(url, fixture(namespace), async (session) => {
            await session.insert(1);
            try {
              if (variant === "native") await session.nativeFailure();
              else if (variant === "undefined") await session.fail(undefined);
              else if (variant === "string") await session.fail("exact cause");
              else await session.decode(variant);
            } catch (cause) {
              firstCause = cause;
              caught = true;
            }
            // Later accepted work must refuse before SQL and retain the first failure.
            await assert.rejects(session.insert(2), (cause) => cause === firstCause);
            return "caught";
          }),
          (error) =>
            error instanceof ExtensionOperationError &&
            error.cause === firstCause &&
            error.completion === "rolled-back",
        );
        expect(caught).toBe(true);
        expect((await observer.query(`SELECT * FROM "${namespace}".writes`)).rows).toEqual([]);
      }
    });
  },
);

for (const failing of [false, true]) {
  test.skipIf(!connectionString)(
    `operator drains unawaited ${failing ? "failed" : "successful"} work and closes admission during drain`,
    async () => {
      await withFixture(async (url, observer, namespace) => {
        const key = Number.parseInt(crypto.randomUUID().slice(0, 8), 16);
        await observer.query("BEGIN");
        await observer.query("SELECT pg_advisory_xact_lock($1::bigint)", [key]);
        const entered = Promise.withResolvers<number>();
        const attempt = Promise.withResolvers<void>();
        const attempted = Promise.withResolvers<boolean>();
        let retained: ReturnType<ReturnType<typeof fixture>> | undefined;
        let settled = false;
        const pending = withExtensionOperation(url, fixture(namespace), async (session) => {
          retained = session;
          entered.resolve(await session.pid());
          await session.insert(1);
          void session.blockedWrite(key, 2, failing);
          // This continuation inherits the exact callback owner, but first enters after callback settlement.
          void attempt.promise
            .then(() => session.insert(99))
            .then(
              () => attempted.resolve(false),
              () => attempted.resolve(true),
            );
          return "drained";
        });
        const outcome = pending.then(
          (value) => {
            settled = true;
            return { value, error: undefined };
          },
          (error: Error) => {
            settled = true;
            return { value: undefined, error };
          },
        );
        try {
          const pid = await bounded(entered.promise);
          await waitFor(() => blocked(observer, pid), "Admitted pipeline never reached native lock");
          expect(settled).toBe(false);
          attempt.resolve();
          expect(await bounded(attempted.promise)).toBe(true);
          assert(retained);
          await assert.rejects(retained.insert(99), /inactive|owner/);
          expect((await observer.query(`SELECT * FROM "${namespace}".writes`)).rows).toEqual([]);
          await observer.query("ROLLBACK");
          const result = await bounded(outcome);
          if (failing) {
            assert(result.error instanceof ExtensionOperationError);
            expect(result.error.completion).toBe("rolled-back");
            expect((await observer.query(`SELECT * FROM "${namespace}".writes`)).rows).toEqual([]);
          } else {
            expect(result.value).toEqual({ completion: "committed", value: "drained" });
            expect((await observer.query(`SELECT * FROM "${namespace}".writes ORDER BY value`)).rows).toEqual([
              { value: 1 },
              { value: 2 },
            ]);
          }
          await assert.rejects(retained.insert(100), /inactive|owner/);
        } finally {
          attempt.resolve();
          await observer.query("ROLLBACK");
          await pending.catch(() => undefined);
        }
      });
    },
  );
}

test.skipIf(!connectionString)(
  "operator drains already-running native work after callback rejection before rollback",
  async () => {
    await withFixture(async (url, observer, namespace) => {
      const key = Number.parseInt(crypto.randomUUID().slice(0, 8), 16);
      const cause = new Error("Exact callback rejection before admitted native failure");
      const entered = Promise.withResolvers<number>();
      const rejectCallback = Promise.withResolvers<void>();
      const callbackRejected = Promise.withResolvers<void>();
      let settled = false;
      await observer.query("BEGIN");
      await observer.query("SELECT pg_advisory_xact_lock($1::bigint)", [key]);
      const pending = withExtensionOperation(url, fixture(namespace), async (session) => {
        const pid = await session.pid();
        await session.insert(1);
        void session.blockedWrite(key, 2, true);
        entered.resolve(pid);
        try {
          await rejectCallback.promise;
        } finally {
          callbackRejected.resolve();
        }
        return "must not publish";
      });
      const outcome = pending.then(
        () => {
          settled = true;
          return undefined;
        },
        (error: Error) => {
          settled = true;
          return error;
        },
      );
      try {
        const pid = await bounded(entered.promise);
        await waitFor(() => blocked(observer, pid), "Admitted operation never reached native blocker");
        rejectCallback.reject(cause);
        await bounded(callbackRejected.promise);
        // Observe after callback rejection, before releasing the already-running admitted statement.
        expect(await blocked(observer, pid)).toBe(true);
        expect(settled).toBe(false);
        expect((await observer.query(`SELECT * FROM "${namespace}".writes`)).rows).toEqual([]);
        await observer.query("ROLLBACK");
        const error = await bounded(outcome);
        assert(error instanceof ExtensionOperationError);
        expect(error.cause).toBe(cause);
        expect(error.completion).toBe("rolled-back");
        expect(error.cleanupFailures).toEqual([]);
        expect((await observer.query(`SELECT * FROM "${namespace}".writes`)).rows).toEqual([]);
      } finally {
        rejectCallback.reject(cause);
        await observer.query("ROLLBACK");
        await pending.catch(() => undefined);
      }
    });
  },
);

test.skipIf(!connectionString)("operator refuses live cross-owner use", async () => {
  await withFixture(async (url, observer, namespace) => {
    const entered = Promise.withResolvers<void>();
    const resume = Promise.withResolvers<void>();
    let retained: ReturnType<ReturnType<typeof fixture>> | undefined;
    const first = withExtensionOperation(url, fixture(namespace), async (session) => {
      retained = session;
      await session.insert(1);
      entered.resolve();
      await resume.promise;
      return "first";
    });
    void first.catch(() => undefined);
    try {
      await bounded(entered.promise);
      const second = await withExtensionOperation(url, fixture(namespace), async (session) => {
        assert(retained);
        await assert.rejects(retained.insert(99), /different owner/);
        await session.insert(2);
        return "second";
      });
      expect(second.completion).toBe("committed");
      resume.resolve();
      expect((await bounded(first)).completion).toBe("committed");
      expect((await observer.query(`SELECT * FROM "${namespace}".writes ORDER BY value`)).rows).toEqual([
        { value: 1 },
        { value: 2 },
      ]);
    } finally {
      resume.resolve();
      await first.catch(() => undefined);
    }
  });
});

test.skipIf(!connectionString)("operator serializes whole accepted pipelines across native awaits", async () => {
  await withFixture(async (url, observer, namespace) => {
    const key = Number.parseInt(crypto.randomUUID().slice(0, 8), 16);
    await observer.query("BEGIN");
    await observer.query("SELECT pg_advisory_xact_lock($1::bigint)", [key]);
    const entered = Promise.withResolvers<number>();
    const pending = withExtensionOperation(url, fixture(namespace), async (session) => {
      entered.resolve(await session.pid());
      void session.pipeline(key);
      void session.trace(3);
      return "ordered";
    });
    void pending.catch(() => undefined);
    try {
      const pid = await bounded(entered.promise);
      await waitFor(() => blocked(observer, pid), "Pipeline did not reach native barrier");
      await observer.query("ROLLBACK");
      await bounded(pending);
      expect((await observer.query(`SELECT value FROM "${namespace}".trace ORDER BY id`)).rows).toEqual([
        { value: 1 },
        { value: 2 },
        { value: 3 },
      ]);
    } finally {
      await observer.query("ROLLBACK");
      await pending.catch(() => undefined);
    }
  });
});

test.skipIf(!connectionString)("operator observes initialization abort before admitting callback", async () => {
  await withFixture(async (url, observer, namespace) => {
    const controller = new AbortController();
    const reason = new Error("Initialization abort");
    let admitted = false;
    await assert.rejects(
      withExtensionOperation(
        url,
        (context) => {
          controller.abort(reason);
          return fixture(namespace)(context);
        },
        async () => {
          admitted = true;
          return "forbidden";
        },
        controller.signal,
      ),
      (error) =>
        error instanceof ExtensionOperationError && error.cause === reason && error.completion === "rolled-back",
    );
    expect(admitted).toBe(false);
    expect(
      (
        await observer.query(
          "SELECT pid FROM pg_stat_activity WHERE application_name='loom-migrations' AND datname=current_database()",
          [],
        )
      ).rows,
    ).toEqual([]);
  });
});

for (const suspended of [false, true]) {
  test.skipIf(!connectionString)(
    `operator cancellation disposes ${suspended ? "suspended JavaScript" : "native blocked work"} before return`,
    async () => {
      await withFixture(async (url, observer, namespace) => {
        const controller = new AbortController();
        const reason = new Error("Exact cancellation cause");
        const key = Number.parseInt(crypto.randomUUID().slice(0, 8), 16);
        const entered = Promise.withResolvers<number>();
        const resume = Promise.withResolvers<void>();
        const callbackSettled = Promise.withResolvers<void>();
        let retained: ReturnType<ReturnType<typeof fixture>> | undefined;
        let lateRefused = false;
        let published = false;
        if (!suspended) {
          await observer.query("BEGIN");
          await observer.query("SELECT pg_advisory_xact_lock($1::bigint)", [key]);
        }
        const pending = withExtensionOperation(
          url,
          fixture(namespace),
          async (session) => {
            retained = session;
            try {
              const pid = await session.pid();
              await session.insert(1);
              await session.hold(key + 1);
              entered.resolve(pid);
              if (suspended) {
                await resume.promise;
                await assert.rejects(session.insert(99), /inactive|owner/);
                lateRefused = true;
              } else await session.blockedWrite(key, 2);
              published = true;
              return "late";
            } finally {
              callbackSettled.resolve();
            }
          },
          controller.signal,
        );
        const outcome = pending.then(
          () => undefined,
          (error: Error) => error,
        );
        try {
          const pid = await bounded(entered.promise);
          if (!suspended) await waitFor(() => blocked(observer, pid), "Native operation did not block");
          controller.abort(reason);
          const error = await bounded(outcome);
          assert(error instanceof ExtensionOperationError);
          expect(error.cause).toBe(reason);
          expect(error.completion).toBe("rolled-back");
          expect(error.cleanupFailures).toEqual([]);
          expect(await absent(observer, pid)).toBe(true);
          expect(
            (await observer.query("SELECT count(*)::int AS count FROM pg_locks WHERE pid=$1", [pid])).rows[0]?.count,
          ).toBe(0);
          expect((await observer.query(`SELECT * FROM "${namespace}".writes`)).rows).toEqual([]);
          expect(published).toBe(false);
          assert(retained);
          await assert.rejects(retained.insert(100), /inactive|owner/);
          await observer.query("ROLLBACK");
          expect(
            (
              await withExtensionOperation(url, fixture(namespace), async (session) => {
                await session.insert(3);
                return "fresh";
              })
            ).completion,
          ).toBe("committed");
        } finally {
          resume.resolve();
          await observer.query("ROLLBACK");
          await pending.catch(() => undefined);
          await bounded(callbackSettled.promise);
        }
        if (suspended) expect(lateRefused).toBe(true);
      });
    },
  );
}

test.skipIf(!connectionString)(
  "operator observes real deferred COMMIT rejection and successful commit survives later abort",
  async () => {
    await withFixture(async (url, observer, namespace) => {
      await assert.rejects(
        withExtensionOperation(url, fixture(namespace), async (session) => {
          await session.insert(1);
          await session.insert(1);
          return "deferred violation";
        }),
        (error) =>
          error instanceof ExtensionOperationError &&
          error.cause instanceof pg.DatabaseError &&
          error.cause.code === "23505" &&
          error.completion === "unknown",
      );
      expect((await observer.query(`SELECT * FROM "${namespace}".writes`)).rows).toEqual([]);
      const controller = new AbortController();
      const result = await withExtensionOperation(
        url,
        fixture(namespace),
        async (session) => {
          await session.insert(2);
          return "visible";
        },
        controller.signal,
      );
      controller.abort(new Error("After confirmed commit"));
      expect(result).toEqual({ completion: "committed", value: "visible" });
      expect((await observer.query(`SELECT * FROM "${namespace}".writes`)).rows).toEqual([{ value: 2 }]);
      // Native characterization: promise fulfillment alone does not mean an aborted COMMIT committed.
      await observer.query("BEGIN");
      await assert.rejects(observer.query("SELECT 1/0"));
      expect((await observer.query("COMMIT")).command).toBe("ROLLBACK");
    });
  },
);

test.skipIf(!connectionString)(
  "operator refuses actual COMMIT command ROLLBACK from an aborted native transaction",
  async () => {
    await withFixture(async (url, observer, namespace) => {
      await assert.rejects(
        withExtensionOperation(
          url,
          async (context) => {
            // Trusted native characterization only: leave a real aborted transaction for the owner's COMMIT.
            // Callback still receives the closed fixture surface, never this client or transaction control.
            await context.client.query(`INSERT INTO "${namespace}".writes VALUES (1)`);
            await assert.rejects(context.client.query("SELECT 1/0"));
            return fixture(namespace)(context);
          },
          async () => "must not publish",
        ),
        (error) =>
          error instanceof ExtensionOperationError &&
          error.completion === "rolled-back" &&
          error.cause instanceof Error &&
          /COMMIT completed as ROLLBACK/.test(error.cause.message),
      );
      expect((await observer.query(`SELECT * FROM "${namespace}".writes`)).rows).toEqual([]);
    });
  },
);
