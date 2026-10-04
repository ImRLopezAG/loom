import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import {
  pgPrewarmDatabaseProofCase,
  pgPrewarmWorkerProofCase,
  pgPrewarmLifecycleProofCases,
} from "../fixtures/pg_prewarm-proof-cases";
import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  prewarmBackend,
  prewarmBlocked,
  prewarmBackendDisposed,
  prewarmBounded,
} from "../fixtures/pg_prewarm-lifecycle";
import { expect } from "bun:test";
import pg from "pg";
import {
  withPgPrewarm,
  PrewarmOperationError,
  type PrewarmSession,
} from "../../../apps/loom/src/tooling/extensions/operations/pg_prewarm";
import { withExtensionDatabase } from "../fixtures/extension-database";
import {
  pgPrewarmDescriptor,
  pgPrewarmInstall,
  pgPrewarmSchema,
  requirePrewarmServerIsolation,
} from "../fixtures/pg_prewarm";

extensionProofTest(
  pgPrewarmDatabaseProofCase,
  async () => {
    await withExtensionDatabase(async (url) => {
      const oracle = new pg.Client({ connectionString: url });
      await oracle.connect();
      const role = `loom_prewarm_role_${crypto.randomUUID().replaceAll("-", "")}`;
      let roleAttempted = false;
      try {
        await oracle.query(pgPrewarmInstall);
        await observeExtensionProofDatabase(url, pgPrewarmDatabaseProofCase.id, "pg_prewarm");
        await extensionProofWitness({ ...pgPrewarmDatabaseProofCase.claims[0]!, schema: pgPrewarmSchema }, async () => {
          const expected = BigInt(
            (
              await oracle.query(
                "SELECT pg_relation_size('prewarm_items')/current_setting('block_size')::bigint AS blocks",
              )
            ).rows[0].blocks,
          );
          // A build/platform that lacks USE_PREFETCH fails actual acceptance here, rather than silently skipping it.
          expect(
            (
              await oracle.query(
                `SELECT "warm ""cache""".pg_prewarm('prewarm_items','prefetch','main',0,0)::text AS blocks`,
              )
            ).rows[0].blocks,
          ).toBe("1");
          let escaped: PrewarmSession | undefined;
          const committedController = new AbortController();
          const result = await withPgPrewarm(
            url,
            pgPrewarmDescriptor,
            async (session) => {
              escaped = session;
              expect(await session.prewarm({ relation: { schema: "public", name: "prewarm_items" } })).toEqual({
                blocks: expected,
                cacheResidency: "not-guaranteed",
              });
              expect(
                await session.prewarm({
                  relation: { schema: "public", name: "prewarm_items" },
                  mode: "read",
                  firstBlock: 0n,
                  lastBlock: 0n,
                }),
              ).toEqual({ blocks: 1n, cacheResidency: "not-guaranteed" });
              // Native valid reversed endpoints describe an empty range, not a rejected request.
              expect(
                await session.prewarm({
                  relation: { schema: "public", name: "prewarm_items" },
                  firstBlock: 1n,
                  lastBlock: 0n,
                }),
              ).toEqual({ blocks: 0n, cacheResidency: "not-guaranteed" });
              expect(
                await session.prewarm({
                  relation: { schema: "public", name: "prewarm_items" },
                  mode: "prefetch",
                  firstBlock: 0n,
                  lastBlock: 0n,
                }),
              ).toEqual({ blocks: 1n, cacheResidency: "not-guaranteed" });
            },
            committedController.signal,
          );
          expect(result.effects.map((effect) => effect.state)).toEqual([
            "acknowledged",
            "acknowledged",
            "acknowledged",
            "acknowledged",
          ]);
          committedController.abort(new Error("Abort after confirmed prewarm commit"));
          expect(result.completion).toBe("committed");
          expect(result.effects.every((effect) => effect.state === "acknowledged")).toBe(true);
          await expect(escaped!.dump()).rejects.toThrow(/inactive|owner/);
          try {
            await withPgPrewarm(url, pgPrewarmDescriptor, async (session) => {
              await session.prewarm({ relation: { schema: "public", name: "prewarm_items" } });
              throw new Error("after warming");
            });
            throw new Error("Expected callback failure");
          } catch (cause) {
            if (!(cause instanceof PrewarmOperationError)) throw cause;
            expect(cause.completion).toBe("rolled-back");
            expect(cause.effects).toEqual([
              { operation: "prewarm", state: "acknowledged", rollback: "not-transactional" },
            ]);
          }
          await expect(
            withPgPrewarm(url, pgPrewarmDescriptor, (session) =>
              session.prewarm({ relation: { schema: "public", name: "prewarm_items" }, firstBlock: expected + 1n }),
            ),
          ).rejects.toBeInstanceOf(PrewarmOperationError);
          await expect(
            oracle.query(`SELECT "warm ""cache""".pg_prewarm('prewarm_items', 'buffer', 'main', $1::int8,NULL)`, [
              (expected + 1n).toString(),
            ]),
          ).rejects.toThrow(/block number/);

          await oracle.query("CREATE INDEX prewarm_items_idx ON prewarm_items(g)");
          await oracle.query("VACUUM prewarm_items");
          await oracle.query("CREATE UNLOGGED TABLE prewarm_unlogged(g integer)");
          await oracle.query("CREATE INDEX prewarm_unlogged_idx ON prewarm_unlogged(g)");
          await oracle.query("CREATE VIEW prewarm_view AS SELECT * FROM prewarm_items");
          for (const [name, fork] of [
            ["prewarm_items", "fsm"],
            ["prewarm_items", "vm"],
            ["prewarm_unlogged", "init"],
            ["prewarm_unlogged_idx", "init"],
          ] as const) {
            const blocks = BigInt(
              (
                await oracle.query(
                  "SELECT pg_relation_size($1::regclass,$2)/current_setting('block_size')::bigint AS blocks",
                  [name, fork],
                )
              ).rows[0].blocks,
            );
            if (name === "prewarm_unlogged") expect(blocks).toBe(0n);
            else expect(blocks).toBeGreaterThan(0n);
            const warmed = await withPgPrewarm(url, pgPrewarmDescriptor, (session) =>
              session.prewarm({
                relation: { schema: "public", name },
                fork,
                mode: "read",
              }),
            );
            expect(warmed.value).toEqual({ blocks, cacheResidency: "not-guaranteed" });
            expect(warmed.effects).toEqual([
              { operation: "prewarm", state: "acknowledged", rollback: "not-transactional" },
            ]);
          }
          for (const [name, fork, code] of [
            ["prewarm_items", "init", "22023"],
            ["prewarm_view", "main", "42809"],
          ] as const) {
            await assert.rejects(
              withPgPrewarm(url, pgPrewarmDescriptor, (session) =>
                session.prewarm({
                  relation: { schema: "public", name },
                  fork,
                }),
              ),
              (error) => {
                assert(error instanceof PrewarmOperationError);
                assert(error.cause instanceof pg.DatabaseError);
                expect(error.cause.code).toBe(code);
                expect(error.completion).toBe("rolled-back");
                expect(error.effects).toEqual([
                  { operation: "prewarm", state: "unknown", rollback: "not-transactional" },
                ]);
                return true;
              },
            );
          }

          roleAttempted = true;
          const roleOutput = process.env.LOOM_EXTENSION_PROOF_ROLE_OUTPUT;
          if (roleOutput) {
            assert(process.env.LOOM_EXTENSION_PROOF_RUN_ID);
            appendFileSync(
              roleOutput,
              JSON.stringify({
                runId: process.env.LOOM_EXTENSION_PROOF_RUN_ID,
                name: role,
                sha256: createHash("sha256").update(role).digest("hex"),
              }) + "\n",
              { mode: 0o600 },
            );
          }
          const password = `pw_${crypto.randomUUID().replaceAll("-", "")}`;
          await oracle.query(
            `CREATE ROLE "${role}" LOGIN PASSWORD '${password}'; GRANT "${role}" TO CURRENT_USER WITH SET TRUE; GRANT USAGE ON SCHEMA public, "warm ""cache""" TO "${role}"`,
          );
          const deniedUrl = new URL(url);
          deniedUrl.username = role;
          deniedUrl.password = password;
          for (const name of ["prewarm_items", "prewarm_items_idx"]) {
            await assert.rejects(
              withPgPrewarm(deniedUrl.href, pgPrewarmDescriptor, (session) =>
                session.prewarm({
                  relation: { schema: "public", name },
                }),
              ),
              (error) => {
                assert(error instanceof PrewarmOperationError);
                assert(error.cause instanceof pg.DatabaseError);
                expect(error.cause.code).toBe("42501");
                expect(error.completion).toBe("rolled-back");
                expect(error.effects).toEqual([
                  { operation: "prewarm", state: "unknown", rollback: "not-transactional" },
                ]);
                return true;
              },
            );
          }
          // Native index permission is SELECT on the parent table; no index grant exists.
          await oracle.query(`GRANT SELECT ON prewarm_items TO "${role}"`);
          for (const name of ["prewarm_items", "prewarm_items_idx"]) {
            const warmed = await withPgPrewarm(deniedUrl.href, pgPrewarmDescriptor, (session) =>
              session.prewarm({
                relation: { schema: "public", name },
                firstBlock: 0n,
                lastBlock: 0n,
              }),
            );
            expect(warmed.value.blocks).toBe(1n);
          }
        });
      } finally {
        try {
          await oracle.query("ROLLBACK");
          if (roleAttempted && (await oracle.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rowCount)
            await oracle.query(
              `GRANT "${role}" TO CURRENT_USER WITH SET TRUE; DROP OWNED BY "${role}"; DROP ROLE "${role}"`,
            );
        } finally {
          await oracle.end();
        }
      }
    });
  },
  120000,
);

for (const definition of pgPrewarmLifecycleProofCases) {
  extensionProofTest(
    definition,
    async () => {
      await withExtensionDatabase(async (url) => {
        const observer = new pg.Client({ connectionString: url });
        await observer.connect();
        try {
          await observer.query(pgPrewarmInstall);
          await observer.query("CREATE TABLE prewarm_blocked AS SELECT * FROM prewarm_items");
          const blockCounts = (
            await observer.query(
              "SELECT pg_relation_size('prewarm_items')/current_setting('block_size')::bigint AS items, pg_relation_size('prewarm_blocked')/current_setting('block_size')::bigint AS blocked",
            )
          ).rows[0];
          await observeExtensionProofDatabase(url, definition.id, "pg_prewarm");
          await extensionProofWitness({ ...definition.claims[0]!, schema: pgPrewarmSchema }, async () => {
            const drain = definition.id === "pg_prewarm.drain";
            const suspended = definition.id === "pg_prewarm.cancel-suspended";
            const controller = new AbortController();
            const reason = new Error("Exact prewarm cancellation cause");
            const entered = Promise.withResolvers<void>();
            const resume = Promise.withResolvers<void>();
            const attempt = Promise.withResolvers<void>();
            const refused = Promise.withResolvers<boolean>();
            const callbackSettled = Promise.withResolvers<void>();
            const work: ReturnType<PrewarmSession["prewarm"]>[] = [];
            let retained: PrewarmSession | undefined;
            let settled = false;
            let published = false;
            let lateRefused = false;
            if (!suspended) {
              await observer.query("BEGIN");
              await observer.query("LOCK TABLE prewarm_blocked IN ACCESS EXCLUSIVE MODE");
            }
            const pending = withPgPrewarm(
              url,
              pgPrewarmDescriptor,
              async (session) => {
                retained = session;
                try {
                  await session.prewarm({ relation: { schema: "public", name: "prewarm_items" } });
                  if (suspended) {
                    entered.resolve();
                    await resume.promise;
                    await assert.rejects(
                      session.prewarm({ relation: { schema: "public", name: "prewarm_items" } }),
                      /inactive|owner/,
                    );
                    lateRefused = true;
                  } else {
                    work.push(session.prewarm({ relation: { schema: "public", name: "prewarm_blocked" } }));
                    work.push(session.prewarm({ relation: { schema: "public", name: "prewarm_items" } }));
                    for (const accepted of work) void accepted.catch(() => undefined);
                    entered.resolve();
                    if (drain) {
                      // This continuation retains the callback owner but enters after callback settlement.
                      void attempt.promise
                        .then(() => session.prewarm({ relation: { schema: "public", name: "prewarm_items" } }))
                        .then(
                          () => refused.resolve(false),
                          () => refused.resolve(true),
                        );
                    } else await Promise.all(work);
                  }
                  published = true;
                  return "drained";
                } finally {
                  callbackSettled.resolve();
                }
              },
              controller.signal,
            );
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
              await prewarmBounded(entered.promise);
              const pid = await prewarmBackend(observer);
              if (!suspended) await prewarmBlocked(observer, pid);
              expect(settled).toBe(false);
              assert(retained);
              await assert.rejects(
                retained.prewarm({ relation: { schema: "public", name: "prewarm_items" } }),
                /inactive|owner/,
              );
              if (drain) {
                await prewarmBounded(callbackSettled.promise);
                attempt.resolve();
                expect(await prewarmBounded(refused.promise)).toBe(true);
                expect(settled).toBe(false);
                await observer.query("ROLLBACK");
                const result = await prewarmBounded(outcome);
                assert(result.value);
                expect(result.value.completion).toBe("committed");
                expect(result.value.effects).toEqual(
                  Array.from({ length: 3 }, () => ({
                    operation: "prewarm",
                    state: "acknowledged",
                    rollback: "not-transactional",
                  })),
                );
                expect(await Promise.all(work)).toEqual([
                  { blocks: BigInt(blockCounts.blocked), cacheResidency: "not-guaranteed" },
                  { blocks: BigInt(blockCounts.items), cacheResidency: "not-guaranteed" },
                ]);
              } else {
                controller.abort(reason);
                const result = await prewarmBounded(outcome);
                assert(result.error instanceof PrewarmOperationError);
                expect(result.error.cause).toBe(reason);
                expect(result.error.completion).toBe("rolled-back");
                expect(result.error.cleanupFailures).toEqual([]);
                expect(result.error.effects).toEqual([
                  { operation: "prewarm", state: "acknowledged", rollback: "not-transactional" },
                  ...(!suspended
                    ? [{ operation: "prewarm", state: "unknown", rollback: "not-transactional" } as const]
                    : []),
                ]);
                expect(published).toBe(false);
                expect(Object.isFrozen(result.error.effects)).toBe(true);
                expect(result.error.effects.every(Object.isFrozen)).toBe(true);
                if (!suspended)
                  expect((await Promise.allSettled(work)).map((result) => result.status)).toEqual([
                    "rejected",
                    "rejected",
                  ]);
              }
              expect(await prewarmBackendDisposed(observer, pid)).toBe(true);
              await assert.rejects(
                retained.prewarm({ relation: { schema: "public", name: "prewarm_items" } }),
                /inactive|owner/,
              );
              await observer.query("ROLLBACK");
              expect(
                (
                  await withPgPrewarm(url, pgPrewarmDescriptor, (session) =>
                    session.prewarm({ relation: { schema: "public", name: "prewarm_items" } }),
                  )
                ).completion,
              ).toBe("committed");
            } finally {
              resume.resolve();
              attempt.resolve();
              controller.abort(reason);
              await observer.query("ROLLBACK");
              await prewarmBounded(pending).catch(() => undefined);
              await prewarmBounded(callbackSettled.promise);
            }
            if (suspended) expect(lateRefused).toBe(true);
          });
        } finally {
          await observer.end();
        }
      });
    },
    120000,
  );
}

extensionProofTest(
  pgPrewarmWorkerProofCase,
  async () => {
    requirePrewarmServerIsolation();
    await withExtensionDatabase(async (url) => {
      const oracle = new pg.Client({ connectionString: url });
      await oracle.connect();
      try {
        await oracle.query(pgPrewarmInstall);
        await observeExtensionProofDatabase(url, pgPrewarmWorkerProofCase.id, "pg_prewarm");
        const rollbackReason = new Error("Rollback after acknowledged worker and dump effects");
        let workerPid: number | undefined;
        let retained: PrewarmSession | undefined;
        await assert.rejects(
          withPgPrewarm(url, pgPrewarmDescriptor, async (session) => {
            retained = session;
            const claim = pgPrewarmWorkerProofCase.claims.find((claim) =>
              claim.member.includes("autoprewarm_start_worker"),
            )!;
            await extensionProofWitness({ ...claim, schema: pgPrewarmSchema }, async () => {
              expect(await session.startWorker()).toEqual({ state: "started", rollback: "not-transactional" });
              // The leader uses BGWORKER_SHMEM_ACCESS without a database connection
              // (PostgreSQL REL_18_STABLE contrib/pg_prewarm/autoprewarm.c).
              // Its shared-memory PID is the native oracle; pg_stat_activity is not
              // guaranteed to expose this process on the Neon compute.
              try {
                await oracle.query(`SELECT "warm ""cache""".autoprewarm_start_worker()`);
                throw new Error("Native duplicate start unexpectedly succeeded");
              } catch (cause) {
                if (!(cause instanceof pg.DatabaseError)) throw cause;
                expect(cause.code).toBe("55000");
                const pid = /autoprewarm worker is already running under PID (\d+)/.exec(cause.message);
                expect(pid).not.toBeNull();
                expect(Number(pid![1])).toBeGreaterThan(0);
                workerPid = Number(pid![1]);
              }
            });
            const dumpClaim = pgPrewarmWorkerProofCase.claims.find((claim) =>
              claim.member.includes("autoprewarm_dump_now"),
            )!;
            await extensionProofWitness({ ...dumpClaim, schema: pgPrewarmSchema }, async () => {
              const dumped = await session.dump();
              expect(dumped.records).toBeGreaterThanOrEqual(0n);
              expect(dumped.rollback).toBe("not-transactional");
              const native = await oracle.query(`SELECT "warm ""cache""".autoprewarm_dump_now()::text AS records`);
              expect(BigInt(native.rows[0].records)).toBeGreaterThanOrEqual(0n);
            });
            throw rollbackReason;
          }),
          (error) => {
            assert(error instanceof PrewarmOperationError);
            expect(error.cause).toBe(rollbackReason);
            expect(error.completion).toBe("rolled-back");
            expect(error.cleanupFailures).toEqual([]);
            expect(error.effects).toEqual([
              { operation: "start-worker", state: "acknowledged", rollback: "not-transactional" },
              { operation: "dump", state: "acknowledged", rollback: "not-transactional" },
            ]);
            return true;
          },
        );
        assert(retained);
        await assert.rejects(retained.startWorker(), /inactive|owner/);
        await assert.rejects(retained.dump(), /inactive|owner/);
        // SQL rollback did not stop the shared worker: native shared-memory PID still agrees.
        await assert.rejects(oracle.query(`SELECT "warm ""cache""".autoprewarm_start_worker()`), (error) => {
          assert(error instanceof pg.DatabaseError);
          expect(error.code).toBe("55000");
          expect(error.message).toContain(`PID ${workerPid}`);
          return true;
        });
        const committed = await withPgPrewarm(url, pgPrewarmDescriptor, (session) => session.dump());
        expect(committed.completion).toBe("committed");
        expect(committed.value.records).toBeGreaterThanOrEqual(0n);
        expect(committed.effects).toEqual([
          { operation: "dump", state: "acknowledged", rollback: "not-transactional" },
        ]);

        const controller = new AbortController();
        const abortReason = new Error("Abort after acknowledged dump");
        const entered = Promise.withResolvers<void>();
        const resume = Promise.withResolvers<void>();
        const callbackSettled = Promise.withResolvers<void>();
        let lateRefused = false;
        const pending = withPgPrewarm(
          url,
          pgPrewarmDescriptor,
          async (session) => {
            try {
              await session.dump();
              entered.resolve();
              await resume.promise;
              await assert.rejects(session.dump(), /inactive|owner/);
              lateRefused = true;
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
          await prewarmBounded(entered.promise);
          const pid = await prewarmBackend(oracle);
          controller.abort(abortReason);
          const error = await prewarmBounded(outcome);
          assert(error instanceof PrewarmOperationError);
          expect(error.cause).toBe(abortReason);
          expect(error.completion).toBe("rolled-back");
          expect(error.cleanupFailures).toEqual([]);
          expect(error.effects).toEqual([{ operation: "dump", state: "acknowledged", rollback: "not-transactional" }]);
          expect(await prewarmBackendDisposed(oracle, pid)).toBe(true);
          // Cancellation disposes the owned SQL backend, while worker and dump remain callable.
          await assert.rejects(oracle.query(`SELECT "warm ""cache""".autoprewarm_start_worker()`), (error) => {
            assert(error instanceof pg.DatabaseError);
            expect(error.code).toBe("55000");
            expect(error.message).toContain(`PID ${workerPid}`);
            return true;
          });
          expect(
            BigInt(
              (await oracle.query(`SELECT "warm ""cache""".autoprewarm_dump_now()::text AS records`)).rows[0].records,
            ),
          ).toBeGreaterThanOrEqual(0n);
        } finally {
          resume.resolve();
          controller.abort(abortReason);
          await prewarmBounded(pending).catch(() => undefined);
          await prewarmBounded(callbackSettled.promise);
        }
        expect(lateRefused).toBe(true);
      } finally {
        await oracle.end();
      }
    });
  },
  120000,
);
