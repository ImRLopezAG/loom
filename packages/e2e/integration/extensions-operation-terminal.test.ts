import assert from "node:assert/strict";
import { test } from "bun:test";
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

async function fixture(operation: (url: string, observer: pg.Client) => Promise<void>) {
  await withExtensionDatabase(async (url) => {
    const observer = new pg.Client({ connectionString: url });
    await observer.connect();
    try {
      await observer.query("CREATE SCHEMA terminal_fixture");
      await observer.query("CREATE TABLE terminal_fixture.writes(value integer UNIQUE DEFERRABLE INITIALLY DEFERRED)");
      await operation(url, observer);
    } finally {
      await observer.end();
    }
  });
}

async function bounded<Value>(pending: Promise<Value>): Promise<Value> {
  const timer = new AbortController();
  try {
    return await Promise.race([
      pending,
      setTimeout(8000, undefined, { signal: timer.signal }).then(() => {
        throw new Error("Terminal observation did not settle");
      }),
    ]);
  } finally {
    timer.abort();
  }
}

function session({ client, run }: ExtensionOperationContext) {
  return Object.freeze({
    write(value: number) {
      return run(async () => {
        await client.query("INSERT INTO terminal_fixture.writes VALUES ($1)", [value]);
      });
    },
    nativeFailure() {
      return run(async () => {
        await client.query("SELECT 1/0");
      });
    },
  });
}

test.skipIf(!connectionString)("terminal observation sees same backend reset after commit and rollback", async () => {
  await fixture(async (url, observer) => {
    for (const completion of ["committed", "rolled-back"] as const) {
      let pid = 0;
      let started = "";
      let calls = 0;
      const pending = withExtensionOperation(
        url,
        async (context) => {
          const baseline = await context.client.query(
            "SELECT pg_backend_pid() AS pid, backend_start::text AS started, current_setting('lock_timeout') AS setting FROM pg_stat_activity WHERE pid=pg_backend_pid()",
          );
          pid = baseline.rows[0].pid;
          started = v.parse(v.string(), baseline.rows[0].started);
          assert.equal(baseline.rows[0].setting, "5s");
          await context.client.query("SELECT set_config('lock_timeout', '137ms', true)");
          assert.equal((await context.client.query("SHOW lock_timeout")).rows[0].lock_timeout, "137ms");
          return session(context);
        },
        async (api) => {
          // The terminal observer must wait for admitted, unawaited work too.
          void api.write(1);
          if (completion === "rolled-back") throw undefined;
          return "visible";
        },
        undefined,
        async (context, actual) => {
          calls += 1;
          assert.equal(actual, completion);
          const reset = await context.client.query(
            "SELECT pg_backend_pid() AS pid, backend_start::text AS started, current_setting('lock_timeout') AS setting FROM pg_stat_activity WHERE pid=pg_backend_pid()",
          );
          assert.deepEqual(reset.rows, [{ pid, started, setting: "5s" }]);
          await assert.rejects(
            context.run(async () => undefined),
            /inactive|owner/,
          );
        },
      );
      if (completion === "committed") assert.deepEqual(await pending, { completion, value: "visible" });
      else
        await assert.rejects(
          pending,
          (error) =>
            error instanceof ExtensionOperationError && error.cause === undefined && error.completion === completion,
        );
      assert.equal(calls, 1);
      assert.deepEqual(
        (await observer.query("SELECT * FROM terminal_fixture.writes")).rows,
        completion === "committed" ? [{ value: 1 }] : [],
      );
      await observer.query("TRUNCATE terminal_fixture.writes");
    }
  });
});

test.skipIf(!connectionString)(
  "terminal observation retains initialization failure and its cleanup error",
  async () => {
    await fixture(async (url, observer) => {
      let calls = 0;
      await assert.rejects(
        withExtensionOperation(
          url,
          async (context) => {
            await context.client.query("INSERT INTO terminal_fixture.writes VALUES (1)");
            throw undefined;
          },
          async () => {
            throw new Error("Callback must not run");
          },
          undefined,
          async (context, completion) => {
            calls += 1;
            assert.equal(completion, "rolled-back");
            await context.client.query("SELECT 1/0");
          },
        ),
        (error) => {
          assert(error instanceof ExtensionOperationError);
          assert.equal(error.completion, "rolled-back");
          assert.equal(error.cause, undefined);
          assert.equal(error.cleanupFailures.length, 1);
          assert(error.cleanupFailures[0]?.cause instanceof pg.DatabaseError);
          assert.equal(error.cleanupFailures[0].cause.code, "22012");
          return true;
        },
      );
      assert.equal(calls, 1);
      assert.deepEqual((await observer.query("SELECT * FROM terminal_fixture.writes")).rows, []);
    });
  },
);

test.skipIf(!connectionString)(
  "terminal observation distinguishes acknowledged rollback from unknown COMMIT",
  async () => {
    await fixture(async (url, observer) => {
      let calls = 0;
      await assert.rejects(
        withExtensionOperation(
          url,
          async (context) => {
            await context.client.query("INSERT INTO terminal_fixture.writes VALUES (1)");
            await assert.rejects(context.client.query("SELECT 1/0"));
            return session(context);
          },
          async () => "aborted transaction",
          undefined,
          async (context, completion) => {
            calls += 1;
            assert.equal(completion, "rolled-back");
            assert.equal((await context.client.query("SELECT 1 AS value")).rows[0].value, 1);
          },
        ),
        (error) => error instanceof ExtensionOperationError && error.completion === "rolled-back",
      );
      assert.equal(calls, 1);
      await assert.rejects(
        withExtensionOperation(
          url,
          session,
          async (api) => {
            await api.write(1);
            await api.write(1);
          },
          undefined,
          async () => {
            calls += 1;
          },
        ),
        (error) => error instanceof ExtensionOperationError && error.completion === "unknown",
      );
      assert.equal(calls, 1);
      assert.deepEqual((await observer.query("SELECT * FROM terminal_fixture.writes")).rows, []);
    });
  },
);

test.skipIf(!connectionString)(
  "terminal observation failure preserves confirmed commit without duplicate cleanup",
  async () => {
    await fixture(async (url, observer) => {
      for (const variant of ["native", "undefined"] as const) {
        await assert.rejects(
          withExtensionOperation(
            url,
            session,
            async (api) => {
              await api.write(1);
            },
            undefined,
            async (context) => {
              if (variant === "undefined") throw undefined;
              await context.client.query("SELECT 1/0");
            },
          ),
          (error) => {
            assert(error instanceof ExtensionOperationError);
            assert.equal(error.completion, "committed");
            if (variant === "native") {
              assert(error.cause instanceof pg.DatabaseError);
              assert.equal(error.cause.code, "22012");
            } else assert.equal(error.cause, undefined);
            assert.deepEqual(error.cleanupFailures, []);
            return true;
          },
        );
        assert.deepEqual((await observer.query("SELECT * FROM terminal_fixture.writes")).rows, [{ value: 1 }]);
        await observer.query("TRUNCATE terminal_fixture.writes");
      }
    });
  },
);

test.skipIf(!connectionString)("terminal observation follows caught and unawaited native failures", async () => {
  await fixture(async (url, observer) => {
    for (const caught of [true, false]) {
      let calls = 0;
      let first: unknown;
      await assert.rejects(
        withExtensionOperation(
          url,
          session,
          async (api) => {
            await api.write(1);
            const failure = api.nativeFailure();
            if (caught)
              await failure.catch((cause) => {
                first = cause;
              });
            return "must roll back";
          },
          undefined,
          async (context, completion) => {
            calls += 1;
            assert.equal(completion, "rolled-back");
            assert.equal((await context.client.query("SELECT 1 AS value")).rows[0].value, 1);
          },
        ),
        (error) => {
          assert(error instanceof ExtensionOperationError);
          assert.equal(error.completion, "rolled-back");
          assert(error.cause instanceof pg.DatabaseError);
          assert.equal(error.cause.code, "22012");
          if (caught) assert.equal(error.cause, first);
          assert.deepEqual(error.cleanupFailures, []);
          return true;
        },
      );
      assert.equal(calls, 1);
      assert.deepEqual((await observer.query("SELECT * FROM terminal_fixture.writes")).rows, []);
    }
  });
});

for (const completion of ["committed", "rolled-back"] as const) {
  test.skipIf(!connectionString)(
    `terminal observation retains ${completion} when cancellation rejects its native query`,
    async () => {
      await fixture(async (url, observer) => {
        const controller = new AbortController();
        const entered = Promise.withResolvers<number>();
        const cancellation = new Error("Cancellation during native terminal observation");
        const rollback = new Error("Original callback rollback");
        let observerFailure: unknown;
        let calls = 0;
        const outcome = withExtensionOperation(
          url,
          session,
          async (api) => {
            await api.write(1);
            if (completion === "rolled-back") throw rollback;
            return "durable";
          },
          controller.signal,
          async (context, actual) => {
            calls++;
            assert.equal(actual, completion);
            entered.resolve((await context.client.query("SELECT pg_backend_pid() AS pid")).rows[0].pid);
            try {
              await context.client.query("SELECT pg_sleep(30)");
            } catch (cause) {
              observerFailure = cause;
              throw cause;
            }
          },
        ).then(
          () => {
            throw new Error("Cancelled terminal observation must reject");
          },
          (cause: unknown) => v.parse(v.instance(ExtensionOperationError), cause),
        );
        try {
          const pid = await bounded(entered.promise);
          await bounded(
            (async () => {
              while (true) {
                const activity = await observer.query(
                  "SELECT query,wait_event FROM pg_stat_activity WHERE pid=$1",
                  [pid],
                );
                if (activity.rows[0]?.query === "SELECT pg_sleep(30)" && activity.rows[0].wait_event === "PgSleep")
                  break;
                await setTimeout(20);
              }
            })(),
          );
          controller.abort(cancellation);
          const error = await bounded(outcome);
          assert.equal(error.completion, completion);
          assert.equal(error.cause, completion === "committed" ? cancellation : rollback);
          assert(observerFailure instanceof pg.DatabaseError);
          assert.equal(observerFailure.code, "57P01");
          assert.equal(error.cleanupFailures.length, 1);
          assert.equal(error.cleanupFailures[0]?.cause, observerFailure);
          assert.equal(calls, 1);
          assert.deepEqual((await observer.query("SELECT pid FROM pg_stat_activity WHERE pid=$1", [pid])).rows, []);
          assert.deepEqual(
            (await observer.query("SELECT * FROM terminal_fixture.writes")).rows,
            completion === "committed" ? [{ value: 1 }] : [],
          );
        } finally {
          controller.abort(cancellation);
          await outcome;
        }
      });
    },
  );

  test.skipIf(!connectionString)(
    `terminal observation is awaited through cancellation after ${completion}`,
    async () => {
      await fixture(async (url, observer) => {
        const controller = new AbortController();
        const entered = Promise.withResolvers<number>();
        const resume = Promise.withResolvers<void>();
        const reason = new Error("Cancellation during terminal observation");
        let settled = false;
        let observed = false;
        const pending = withExtensionOperation(
          url,
          session,
          async (api) => {
            await api.write(1);
            if (completion === "rolled-back") throw undefined;
            return "durable";
          },
          controller.signal,
          async (context, actual) => {
            assert.equal(actual, completion);
            entered.resolve((await context.client.query("SELECT pg_backend_pid() AS pid")).rows[0].pid);
            await resume.promise;
            observed = true;
          },
        );
        const outcome = pending.then(
          (value) => {
            settled = true;
            return { value };
          },
          (cause: unknown) => {
            settled = true;
            return { error: v.parse(v.instance(ExtensionOperationError), cause) };
          },
        );
        try {
          const pid = await bounded(entered.promise);
          controller.abort(reason);
          await bounded(
            (async () => {
              while ((await observer.query("SELECT pid FROM pg_stat_activity WHERE pid=$1", [pid])).rows.length) {
                await setTimeout(20);
              }
            })(),
          );
          assert.equal(settled, false, "The owner must await its trusted terminal observation before closing");
          resume.resolve();
          const result = await bounded(outcome);
          assert("error" in result);
          assert(result.error instanceof ExtensionOperationError);
          assert.equal(result.error.completion, completion);
          assert.equal(result.error.cause, completion === "committed" ? reason : undefined);
          assert.deepEqual(result.error.cleanupFailures, []);
          assert.equal(observed, true);
          assert.deepEqual(
            (await observer.query("SELECT * FROM terminal_fixture.writes")).rows,
            completion === "committed" ? [{ value: 1 }] : [],
          );
        } finally {
          resume.resolve();
          await outcome;
        }
      });
    },
  );
}
