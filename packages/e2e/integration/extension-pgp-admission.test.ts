import assert from "node:assert/strict";
import { setTimeout } from "node:timers/promises";
import { expect, test } from "bun:test";
import pg from "pg";
import { defineRelations, sql, type SQL } from "drizzle-orm";
import { text, pgTable } from "drizzle-orm/pg-core";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { Cache } from "drizzle-orm/cache/core";
import * as v from "valibot";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import {
  connectDatabase,
  withTransactionSignal,
  failInvocationDecoding,
} from "../../../apps/loom/src/core/server/database/connection";
import { scopedDatabase } from "../../../apps/loom/src/core/server/database/context";
import { createSqlFunction, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { binaryCodec, textCodec, nullableCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";

// Fixture definitions reproduce captured native identities, not a new public adapter.
const signatures = [
  "pgp_pub_decrypt_bytea(bytea,bytea,text,text)",
  "pgp_pub_decrypt_bytea(bytea,bytea,text)",
  "pgp_pub_decrypt_bytea(bytea,bytea)",
  "pgp_pub_decrypt(bytea,bytea,text,text)",
  "pgp_pub_decrypt(bytea,bytea,text)",
  "pgp_pub_decrypt(bytea,bytea)",
  "pgp_pub_encrypt_bytea(bytea,bytea,text)",
  "pgp_pub_encrypt_bytea(bytea,bytea)",
  "pgp_pub_encrypt(text,bytea,text)",
  "pgp_pub_encrypt(text,bytea)",
  "pgp_sym_decrypt_bytea(bytea,text,text)",
  "pgp_sym_decrypt_bytea(bytea,text)",
  "pgp_sym_decrypt(bytea,text,text)",
  "pgp_sym_decrypt(bytea,text)",
  "pgp_sym_encrypt_bytea(bytea,text,text)",
  "pgp_sym_encrypt_bytea(bytea,text)",
  "pgp_sym_encrypt(text,text,text)",
  "pgp_sym_encrypt(text,text)",
] as const;
const extensionSchema = 'admission"functions';
const fixture = sql`(values (1)) fixture(id)`;
const writes = pgTable("admission_writes", { value: text() });
const nullableText = nullableCodec(textCodec);
const nullableBinary = nullableCodec(binaryCodec);
type FixtureValue = string | { hex: string } | SQL<string>;
type FixtureRoutine = (...values: FixtureValue[]) => SQL;
interface PgpRow {
  value: string | { hex: string } | null;
}
interface RetainedPgpExecution {
  execute: () => Promise<PgpRow[]>;
}
function expression(signature: (typeof signatures)[number], first?: SQL<string>): SQL {
  const [name, args] = signature.split("(");
  assert(name && args);
  const types = args.slice(0, -1).split(",");
  const result = name.includes("encrypt") || name.endsWith("bytea") ? nullableBinary : nullableText;
  const codecs = types.map((type) => (type === "text" ? nullableText : nullableBinary));
  const call = createSqlFunction({
    schema: extensionSchema,
    name,
    member: `routine:$extension:pgcrypto.${signature.replace(/\b(bytea|text)\b/g, "pg_catalog.$1")}`,
    arguments: codecs,
    result,
    dependencies: [],
    authority: "query",
    observability: "tables",
  });
  const values: FixtureValue[] = types.map((type, index) =>
    type === "bytea" ? { hex: "00" } : index === 0 ? "fixture text" : index === 1 ? "fixture password" : "",
  );
  if (first) values[0] = first;
  // The finite native signatures and checked codecs establish dynamic fixture
  // arguments; parse their callable boundary instead of widening public APIs.
  const routine = v.parse(
    v.custom<FixtureRoutine>((input) => v.is(v.function(), input)),
    call,
  );
  return routine(...values);
}
const encryptCall = createSqlFunction({
  schema: extensionSchema,
  name: "pgp_sym_encrypt",
  member: "routine:$extension:pgcrypto.pgp_sym_encrypt(pg_catalog.text,pg_catalog.text)",
  arguments: [nullableText, nullableText] as const,
  result: nullableBinary,
  dependencies: [],
  authority: "query",
  observability: "tables",
} as const);
const encrypt = (first?: SQL<string>) => encryptCall(first ?? "fixture text", "fixture password");
function roundtrip(first?: SQL<string>) {
  const decrypt = createSqlFunction({
    schema: extensionSchema,
    name: "pgp_sym_decrypt",
    member: "routine:$extension:pgcrypto.pgp_sym_decrypt(pg_catalog.bytea,pg_catalog.text)",
    arguments: [nullableBinary, nullableText] as const,
    result: nullableText,
    dependencies: [],
    authority: "query",
    observability: "tables",
  } as const);
  return decrypt(encrypt(first), "fixture password");
}
const digest = createSqlFunction({
  schema: extensionSchema,
  name: "digest",
  member: "routine:$extension:pgcrypto.digest(pg_catalog.text,pg_catalog.text)",
  arguments: [nullableText, nullableText] as const,
  result: nullableBinary,
  dependencies: [],
  authority: "query",
  observability: "tables",
} as const);

async function bounded<Result>(pending: Promise<Result>, message: string): Promise<Result> {
  const timer = new AbortController();
  try {
    return await Promise.race([
      pending,
      setTimeout(5000, undefined, { signal: timer.signal }).then(() => {
        throw new Error(message);
      }),
    ]);
  } finally {
    timer.abort();
  }
}
async function waitFor(predicate: () => Promise<boolean>, message: string) {
  const end = performance.now() + 5000;
  while (!(await predicate())) {
    if (performance.now() > end) throw new Error(message);
    await setTimeout(20);
  }
}
async function withTarget(
  env: "LOOM_TEST_DATABASE_URL" | "LOOM_TEST_OLD_DATABASE_URL",
  operation: (url: string) => Promise<void>,
) {
  const address = process.env[env];
  assert(address, `Missing required ${env} PGP admission fixture`);
  const admin = new pg.Client({ connectionString: address });
  const name = `loom_pgp_admission_${crypto.randomUUID().replaceAll("-", "")}`;
  const url = new URL(address);
  url.pathname = `/${name}`;
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE ${quoteIdentifier(name)}`);
    await operation(url.href);
  } finally {
    await admin.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(name)} WITH (FORCE)`);
    await admin.end();
  }
}

type Event = { text: string; client: pg.PoolClient; phase: "before" | "after"; backend?: number; transaction: boolean };
type Hook = (event: Event) => Promise<void>;
type NativeQueryConfig = string | pg.QueryConfig;
type NativeQueryCallback = (cause: Error | null, result?: pg.QueryResult) => void;
type NativeQueryArguments = [
  config: NativeQueryConfig,
  valuesOrCallback?: pg.QueryConfig["values"] | NativeQueryCallback,
  callback?: NativeQueryCallback,
];
type NativeQueryDispatch = (config: NativeQueryConfig, values?: pg.QueryConfig["values"]) => Promise<pg.QueryResult>;
const nativeCallback = v.custom<NativeQueryCallback>((input) => v.is(v.function(), input));
const nativeQueryConfig = v.custom<NativeQueryConfig>((input) =>
  v.is(v.union([v.string(), v.looseObject({ text: v.string() })]), input),
);
const nativeQueryArguments = v.tupleWithRest(
  [nativeQueryConfig, v.optional(v.union([v.array(v.unknown()), nativeCallback])), v.optional(nativeCallback)],
  v.never(),
);
// Mandatory protective boundary: on OLD18 every fixture PGP submission is intercepted
// before the underlying acquired client's native query. Version rows are never fabricated.
function transportSentry(pool: pg.Pool, old: boolean) {
  const events: Event[] = [];
  const originals = new Map<pg.PoolClient, pg.PoolClient["query"]>();
  const state = new Map<pg.PoolClient, { transaction: boolean; backend?: number }>();
  let attempts = 0;
  let native = 0;
  let hook: Hook | undefined;
  const affected = (text: string) =>
    /"admission""functions"\."pgp_(?:pub|sym)_(?:encrypt|decrypt)(?:_bytea)?"\(/.test(text);
  const install = (client: pg.PoolClient) => {
    if (originals.has(client)) return;
    const restore = client.query.bind(client);
    const original: NativeQueryDispatch = restore;
    originals.set(client, restore);
    state.set(client, { transaction: false });
    // This fixture uses native text/config submissions in promise and callback
    // forms. Validation retains the original config and values identities.
    const observeNativeQuery = (...originalArgs: NativeQueryArguments) => {
      v.parse(nativeQueryArguments, originalArgs);
      const [config, valuesOrCallback, finalCallback] = originalArgs;
      const callback = v.is(nativeCallback, valuesOrCallback) ? valuesOrCallback : finalCallback;
      const values = v.is(nativeCallback, valuesOrCallback) ? undefined : valuesOrCallback;
      const run = async () => {
        const text = v.is(v.string(), config) ? config : config.text;
        const lease = state.get(client)!;
        const before: Event = { text, client, phase: "before", ...lease };
        events.push(before);
        if (affected(text)) {
          attempts++;
          if (old) throw new Error("OLD18 PROTECTIVE SENTRY: missing PGP admission attempted native submission");
          native++;
        }
        await hook?.(before);
        const result = await original(config, values);
        if (/^begin(?:\s|$)/i.test(text)) {
          lease.transaction = true;
          const witness = await original("select pg_backend_pid() as pid");
          lease.backend = v.parse(v.array(v.object({ pid: v.number() })), witness.rows)[0]!.pid;
        }
        if (/^(commit|rollback)$/i.test(text)) lease.transaction = false;
        const after: Event = { text, client, phase: "after", ...lease };
        events.push(after);
        await hook?.(after);
        return result;
      };
      const pending = run();
      if (callback) {
        void pending.then(
          (result) => callback(null, result),
          (cause) => callback(v.parse(v.instance(Error), cause)),
        );
        return;
      }
      return pending;
    };
    // Validate the test-only overload bridge at its callable boundary; actual
    // native calls above use a named promise/callback dispatch contract.
    client.query = v.parse(
      v.custom<pg.PoolClient["query"]>((input) => v.is(v.function(), input)),
      observeNativeQuery,
    );
  };
  pool.on("acquire", install);
  return {
    events,
    affected,
    setHook(next?: Hook) {
      hook = next;
    },
    clear() {
      events.length = 0;
      attempts = 0;
      native = 0;
    },
    counts() {
      return { attemptedAffected: attempts, nativeAffected: native };
    },
    dispose() {
      pool.off("acquire", install);
      for (const [client, original] of originals) client.query = original;
    },
  };
}
async function setup(url: string, old: boolean) {
  const schema = defineSchema(() => ({}));
  const relations = defineRelations(schema.tables);
  const connection = await connectDatabase({ schema, relations, connectionString: url, maxConnections: 1 });
  const sentry = transportSentry(connection.pool, old);
  await connection.db.execute(
    sql`create schema "admission""functions"; create extension pgcrypto with schema "admission""functions"; create table admission_writes(value text)`,
  );
  const version = await connection.db.execute(sql`show server_version_num`);
  expect(version.rows).toHaveLength(1);
  if (old) expect(version.rows[0]!.server_version_num).toBe("180000");
  else expect(Number(version.rows[0]!.server_version_num)).toBeGreaterThanOrEqual(180006);
  sentry.clear();
  return {
    connection,
    sentry,
    relations,
    close: async () => {
      await connection.close();
      sentry.dispose();
    },
  };
}
function pinned(sentry: ReturnType<typeof transportSentry>, expected: number) {
  const observed = sentry.events.filter(
    (event) => event.phase === "after" && /^show server_version_num$/i.test(event.text),
  );
  expect(observed).toHaveLength(expected);
  for (const event of observed) {
    expect(event.transaction).toBe(true);
    expect(event.backend).toBeNumber();
  }
  return observed;
}
const admissionError = (cause: unknown) => {
  assert(cause instanceof Error);
  assert.match(cause.message, /PGP.*PostgreSQL 18\.6/i);
  return true;
};

// Both ordinary and named prepared paths: real old backend, exact18 contracts, zero native old PGP even in RED.
test("old18 all18 checked PGP root ordinary and named prepared refuse before native submission", async () => {
  await withTarget("LOOM_TEST_OLD_DATABASE_URL", async (url) => {
    const { connection, sentry, close } = await setup(url, true);
    try {
      for (const [index, signature] of signatures.entries()) {
        for (const mode of ["ordinary", "prepared"] as const) {
          sentry.clear();
          const query = connection.db.select({ value: expression(signature).as("value") }).from(fixture);
          const compiled = query.toSQL();
          expect(compiled.sql).toContain('"admission""functions"');
          expect(sentry.events).toEqual([]); // construction/compilation is I/O-free
          await assert.rejects(
            mode === "ordinary" ? query.execute() : query.prepare(`old_pgp_${index}`).execute(),
            admissionError,
          );
          pinned(sentry, 1);
          expect(sentry.counts()).toEqual({ attemptedAffected: 0, nativeAffected: 0 });
          expect(sentry.events.some((e) => e.phase === "after" && /^rollback$/i.test(e.text))).toBe(true);
        }
      }
      const selected = connection.db
        .select({ value: encrypt().as("value") })
        .from(fixture)
        .as("nested_pgp");
      await assert.rejects(
        connection.db
          .select({ value: selected.value, hash: digest("abc", "sha256") })
          .from(selected)
          .prepare("old_composed")
          .execute(),
        admissionError,
      );
      expect(sentry.counts()).toEqual({ attemptedAffected: 0, nativeAffected: 0 });
      sentry.clear();
      const [row] = await connection.db
        .select({ hash: digest("abc", "sha256") })
        .from(fixture)
        .prepare("unaffected_hash")
        .execute();
      expect(row!.hash).toEqual({ hex: "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad" });
      expect(sentry.events.some((e) => /^(begin|show server_version_num)/i.test(e.text))).toBe(false);
    } finally {
      console.info("old18 PGP sentry evidence", sentry.counts());
      await close();
    }
  });
}, 60_000);

for (const mode of ["owned", "plain", "savepoint"] as const) {
  test(`old18 caught admission poisons ${mode} ordinary/prepared scope, preserves first cause and fresh generation`, async () => {
    await withTarget("LOOM_TEST_OLD_DATABASE_URL", async (url) => {
      const { connection, sentry, close } = await setup(url, true);
      const observer = new pg.Client({ connectionString: url });
      await observer.connect();
      try {
        for (const prepared of [false, true]) {
          let first: unknown;
          let retained: RetainedPgpExecution | undefined;
          const operation: Parameters<typeof connection.db.transaction>[0] = async (tx) => {
            await tx.execute(sql`insert into admission_writes values ('must rollback')`);
            const attempt = async (db: typeof tx) => {
              retained = db.select({ value: encrypt() }).from(fixture).prepare();
              try {
                await (prepared ? retained.execute() : db.select({ value: encrypt() }).from(fixture).execute());
              } catch (cause) {
                first ??= cause;
                admissionError(cause);
              }
              try {
                await db.select({ value: encrypt() }).from(fixture).execute();
              } catch (cause) {
                expect(cause).toBe(first);
              }
              expect((await db.execute(sql`select 1 as value`)).rows).toEqual([{ value: 1 }]);
            };
            if (mode === "savepoint")
              await tx
                .transaction(async (nested) => {
                  await attempt(nested);
                  throw new Error("savepoint caller rollback");
                })
                .catch(() => {});
            else await attempt(tx);
          };
          const pending = mode === "owned" ? connection.transaction(operation) : connection.db.transaction(operation);
          await assert.rejects(pending, (cause) => {
            expect(cause).toBe(first);
            return admissionError(cause);
          });
          expect((await observer.query("select * from admission_writes")).rows).toEqual([]);
          assert(retained);
          await assert.rejects(retained.execute(), /inactive|closed/i);
          expect(sentry.counts()).toEqual({ attemptedAffected: 0, nativeAffected: 0 });
        }
        // Same max=1 transport, two completed generations: each observes native version anew.
        const before = pinned(sentry, 2).length;
        await assert.rejects(connection.db.select({ value: encrypt() }).from(fixture).execute(), admissionError);
        pinned(sentry, before + 1);
      } finally {
        await observer.end();
        await close();
      }
    });
  }, 60_000);
}

test("safe checked root and named prepared use one BEGIN-pinned backend and preserve overload native errors", async () => {
  await withTarget("LOOM_TEST_DATABASE_URL", async (url) => {
    const { connection, sentry, close } = await setup(url, false);
    try {
      for (const prepared of [false, true]) {
        sentry.clear();
        const query = connection.db.select({ value: roundtrip(), pid: sql<number>`pg_backend_pid()` }).from(fixture);
        const [row] = await (prepared ? query.prepare("safe_roundtrip").execute() : query.execute());
        expect(row!.value).toBe("fixture text");
        const [observed] = pinned(sentry, 1);
        expect(row!.pid).toBe(v.parse(v.number(), observed!.backend));
        const pgp = sentry.events.filter((e) => e.phase === "before" && sentry.affected(e.text));
        expect(pgp).toHaveLength(1);
        expect(pgp[0]!.client).toBe(observed!.client);
        expect(pgp[0]!.transaction).toBe(true);
        expect(sentry.events.at(-1)!.text).toBe("commit");
      }
      // This seam does not claim genuine public-key semantics; valid native error is the admission witness.
      for (const [index, signature] of signatures.entries()) {
        if (!signature.includes("pub_") && signature.includes("encrypt")) continue;
        sentry.clear();
        await assert.rejects(
          connection.db
            .select({ value: expression(signature) })
            .from(fixture)
            .prepare(`safe_overload_${index}`)
            .execute(),
          (cause) => {
            let error = cause;
            while (error instanceof Error && error.cause) error = error.cause;
            assert(error instanceof pg.DatabaseError);
            expect(error.code).toBe("39000");
            return true;
          },
        );
        pinned(sentry, 1);
        expect(sentry.counts()).toEqual({ attemptedAffected: 1, nativeAffected: 1 });
      }
    } finally {
      await close();
    }
  });
}, 60_000);

for (const mode of ["owned", "plain", "savepoint", "relations"] as const) {
  test(`safe root-prepared ${mode} rebinding sees uncommitted writes and pinned authority`, async () => {
    await withTarget("LOOM_TEST_DATABASE_URL", async (url) => {
      const { connection, sentry, relations, close } = await setup(url, false);
      // Root preparation must keep its exact compiled Query/mapper/name while rebinding the native executor.
      const prepared = connection.db
        .select({
          value: roundtrip(sql<string>`${writes.value}`),
          pid: sql<number>`pg_backend_pid()`,
          readOnly: sql<string>`current_setting('transaction_read_only')`,
          role: sql<string>`current_user`,
        })
        .from(writes)
        .prepare(`same_domain_${mode}`);
      try {
        const operation: Parameters<typeof connection.db.transaction>[0] = async (tx) => {
          await tx.execute(sql`insert into admission_writes values ('uncommitted fixture')`);
          const [authority] = v.parse(
            v.array(v.object({ pid: v.number(), role: v.string() })),
            (await tx.execute(sql`select pg_backend_pid() as pid,current_user as role`)).rows,
          );
          const run = async () => {
            const [row] = await prepared.execute();
            expect(row!.value).toBe("uncommitted fixture");
            expect(row!.pid).toBe(authority!.pid);
            expect(row!.role).toBe(authority!.role);
            expect(row!.readOnly).toBe("off");
          };
          if (mode === "savepoint") await tx.transaction(run);
          else if (mode === "relations") {
            const child = scopedDatabase(tx, defineRelations({}));
            await child.execute(sql`select 1`);
            await run();
          } else await run();
        };
        await (mode === "plain" ? connection.db.transaction(operation) : connection.transaction(operation));
        pinned(sentry, 1);
        sentry.clear();
        await connection.transaction(async (tx) => {
          await tx.execute(sql`set transaction read only`);
          const [row] = await prepared.execute();
          expect(row!.readOnly).toBe("on");
        });
        pinned(sentry, 1);
        expect(relations).toBeDefined();
      } finally {
        await close();
      }
    });
  }, 60_000);
}

test("foreign-domain root-prepared refusal is sticky and retained lease cannot revive", async () => {
  await withTarget("LOOM_TEST_DATABASE_URL", async (url) => {
    const first = await setup(url, false);
    const schema = defineSchema(() => ({}));
    const foreign = await connectDatabase({ schema, relations: defineRelations(schema.tables), connectionString: url });
    const foreignSentry = transportSentry(foreign.pool, false);
    const prepared = foreign.db.select({ value: roundtrip() }).from(fixture).prepare("foreign_root");
    try {
      let failure: unknown;
      await assert.rejects(
        first.connection.transaction(async (tx) => {
          await tx.execute(sql`insert into admission_writes values ('foreign must rollback')`);
          try {
            await prepared.execute();
          } catch (cause) {
            failure = cause;
            assert.match(String(cause), /different.*(connection|database|domain)/i);
          }
        }),
        (cause) => cause === failure,
      );
      expect(foreignSentry.counts()).toEqual({ attemptedAffected: 0, nativeAffected: 0 });
      expect((await first.connection.db.execute(sql`select * from admission_writes`)).rows).toEqual([]);
    } finally {
      await foreign.close();
      foreignSentry.dispose();
      await first.close();
    }
  });
}, 60_000);

for (const old of [false, true]) {
  test(`${old ? "old" : "safe"} accepted unawaited PGP drains mapping before terminal cleanup and refuses new admission`, async () => {
    await withTarget(old ? "LOOM_TEST_OLD_DATABASE_URL" : "LOOM_TEST_DATABASE_URL", async (url) => {
      const { connection, sentry, close } = await setup(url, old);
      const entered = Promise.withResolvers<void>();
      const resume = Promise.withResolvers<void>();
      let retained: RetainedPgpExecution | undefined;
      let mapped = false;
      let outcome: Promise<unknown> | undefined;
      sentry.setHook(async (event) => {
        if (event.phase === "after" && /^show server_version_num$/i.test(event.text)) {
          entered.resolve();
          await resume.promise;
        }
      });
      try {
        const pending = connection.transaction(async (tx) => {
          await tx.execute(sql`insert into admission_writes values ('drain fixture')`);
          retained = tx.select({ value: roundtrip() }).from(fixture).prepare();
          outcome = retained.execute().then(
            (result) => {
              mapped = true;
              return result;
            },
            (cause) => {
              if (old) admissionError(cause);
              else throw cause;
            },
          );
          await entered.promise;
          return "callback settled";
        });
        const settled = pending.then(
          (value) => ({ value, cause: undefined }),
          (cause) => ({ value: undefined, cause }),
        );
        await bounded(entered.promise, "Admission observation never entered");
        await setTimeout(30);
        expect(sentry.events.some((e) => /^(commit|rollback)$/i.test(e.text))).toBe(false);
        assert(retained);
        await assert.rejects(retained.execute(), /inactive|closed|admission/i);
        resume.resolve();
        const result = await bounded(settled, "Accepted PGP failed to drain");
        await outcome;
        if (old) {
          admissionError(result.cause);
          expect(mapped).toBe(false);
          expect((await connection.db.execute(sql`select * from admission_writes`)).rows).toEqual([]);
        } else {
          expect(result.value).toBe("callback settled");
          expect(mapped).toBe(true);
        }
        await assert.rejects(retained.execute(), /inactive|closed/i);
        expect(sentry.counts().nativeAffected).toBe(old ? 0 : 1);
      } finally {
        resume.resolve();
        sentry.setHook();
        await close();
      }
    });
  }, 60_000);
}

test("caught thrown undefined codec failure remains the first shared transaction cause", async () => {
  await withTarget("LOOM_TEST_DATABASE_URL", async (url) => {
    const { connection, close } = await setup(url, false);
    try {
      let resolved = false;
      await connection
        .transaction(async (tx) => {
          await tx.execute(sql`insert into admission_writes values ('undefined first cause')`);
          failInvocationDecoding(undefined);
          await tx
            .select({ value: roundtrip() })
            .from(fixture)
            .execute()
            .catch(() => {});
        })
        .then(
          () => {
            resolved = true;
          },
          (cause) => {
            expect(cause).toBeUndefined();
          },
        );
      expect(resolved).toBe(false);
      expect((await connection.db.execute(sql`select * from admission_writes`)).rows).toEqual([]);
    } finally {
      await close();
    }
  });
}, 60_000);

for (const phase of ["before-acquire", "version", "pgp-running", "suspended"] as const) {
  test(`PGP cancellation ${phase} revokes the lease and native cleanup precedes fresh acquisition`, async () => {
    await withTarget("LOOM_TEST_DATABASE_URL", async (url) => {
      const { connection, sentry, close } = await setup(url, false);
      const observer = new pg.Client({ connectionString: url });
      await observer.connect();
      const controller = new AbortController();
      const reason = new Error(`PGP abort ${phase}`);
      const entered = Promise.withResolvers<void>();
      const resume = Promise.withResolvers<void>();
      let backend: number | undefined;
      let retained: RetainedPgpExecution | undefined;
      let held: pg.PoolClient | undefined;
      let pending: Promise<unknown> | undefined;
      try {
        if (phase === "before-acquire") held = await connection.pool.connect();
        if (phase === "version")
          sentry.setHook(async (event) => {
            if (event.phase === "after" && /^show server_version_num$/i.test(event.text)) {
              backend = event.backend;
              entered.resolve();
              await resume.promise;
            }
          });
        pending = withTransactionSignal(controller.signal, () =>
          connection.transaction(async (tx) => {
            const [row] = v.parse(
              v.array(v.object({ pid: v.number() })),
              (await tx.execute(sql`select pg_backend_pid() as pid`)).rows,
            );
            backend = row!.pid;
            retained = tx
              .select({
                value:
                  phase === "pgp-running"
                    ? roundtrip(sql<string>`(select 'fixture text' from pg_sleep(20))`)
                    : roundtrip(),
              })
              .from(fixture)
              .prepare();
            await retained.execute();
            if (phase === "suspended") {
              entered.resolve();
              await resume.promise;
              await assert.rejects(retained.execute(), /inactive|closed/i);
            }
          }),
        );
        const outcome = pending.then(
          () => ({ cause: undefined, resolved: true }),
          (cause) => ({ cause, resolved: false }),
        );
        if (phase === "pgp-running")
          await waitFor(async () => {
            if (backend === undefined) return false;
            const row = (await observer.query("select wait_event from pg_stat_activity where pid=$1", [backend]))
              .rows[0];
            return row?.wait_event === "PgSleep";
          }, "Native safe PGP did not start waiting");
        else if (phase !== "before-acquire") await bounded(entered.promise, "Cancellation barrier not reached");
        controller.abort(reason);
        const result = await bounded(outcome, "PGP cancellation did not reject");
        expect(result.resolved).toBe(false);
        expect(result.cause).toBe(reason);
        resume.resolve();
        held?.release();
        held = undefined;
        if (backend !== undefined)
          await waitFor(async () => {
            const row = (await observer.query("select state,xact_start from pg_stat_activity where pid=$1", [backend]))
              .rows[0];
            return !row || (row.state !== "active" && row.xact_start === null);
          }, "Cancelled PGP retained a native statement/transaction");
        sentry.setHook();
        if (phase === "before-acquire" || phase === "version") expect(sentry.counts().nativeAffected).toBe(0);
        const [fresh] = await connection.db.select({ value: roundtrip() }).from(fixture).execute();
        expect(fresh!.value).toBe("fixture text");
        expect(connection.pool.waitingCount).toBe(0);
        expect(connection.pool.idleCount).toBe(connection.pool.totalCount);
      } finally {
        resume.resolve();
        held?.release();
        controller.abort(reason);
        await pending?.catch(() => {});
        await observer.end();
        await close();
      }
    });
  }, 60_000);
}

for (const named of [false, true]) {
  for (const firstCause of ["abort", "undefined"] as const) {
    test(`PGP cancellation after native success blocks ${named ? "named" : "ordinary"} mapper and execute publication with ${firstCause} first cause`, async () => {
      await withTarget("LOOM_TEST_DATABASE_URL", async (url) => {
        const { connection, sentry, close } = await setup(url, false);
        const controller = new AbortController();
        const reason = new Error("PGP abort after successful native response");
        const entered = Promise.withResolvers<void>();
        const resume = Promise.withResolvers<void>();
        let mapperCalls = 0;
        let executeOutcome: Promise<{ resolved: boolean; cause: unknown }> | undefined;
        let pending: Promise<unknown> | undefined;
        sentry.setHook(async (event) => {
          if (event.phase === "after" && sentry.affected(event.text)) {
            // This barrier retains the real successful native response before
            // the executor's rows extraction and Drizzle's mapper continuation.
            entered.resolve();
            await resume.promise;
          }
        });
        try {
          pending = withTransactionSignal(controller.signal, () =>
            connection.transaction(async (tx) => {
              const query = tx
                .select({
                  value: roundtrip().mapWith({
                    mapFromDriverValue(value: string) {
                      mapperCalls++;
                      expect(value).toBe("fixture text");
                      return value;
                    },
                  }),
                })
                .from(fixture);
              const execute = named ? query.prepare("cancel_success_named").execute() : query.execute();
              // Retain and observe the executor independently of the outer
              // transaction's abort race; neither fulfillment may escape.
              executeOutcome = execute.then(
                () => ({ resolved: true, cause: undefined }),
                (cause) => ({ resolved: false, cause }),
              );
              await entered.promise;
              if (firstCause === "undefined") failInvocationDecoding(undefined);
              await execute;
            }),
          );
          const outerOutcome = pending.then(
            () => ({ resolved: true, cause: undefined }),
            (cause) => ({ resolved: false, cause }),
          );
          await bounded(entered.promise, "Successful native PGP response was not retained");
          expect(sentry.counts()).toEqual({ attemptedAffected: 1, nativeAffected: 1 });
          expect(mapperCalls).toBe(0);
          const expected = firstCause === "abort" ? reason : undefined;
          controller.abort(reason);
          const outer = await bounded(outerOutcome, "Post-native PGP cancellation did not reject transaction");
          expect(outer.resolved).toBe(false);
          expect(outer.cause).toBe(expected);
          resume.resolve();
          assert(executeOutcome);
          const retained = await bounded(executeOutcome, "Retained PGP execute did not settle after response release");
          expect(mapperCalls).toBe(0);
          expect(retained.resolved).toBe(false);
          expect(retained.cause).toBe(expected);
        } finally {
          resume.resolve();
          controller.abort(reason);
          await pending?.catch(() => {});
          await executeOutcome;
          sentry.setHook();
          await close();
        }
      });
    }, 60_000);
  }
}

test("PGP cancellation during successful mapper blocks separately retained execute publication", async () => {
  await withTarget("LOOM_TEST_DATABASE_URL", async (url) => {
    const { connection, sentry, close } = await setup(url, false);
    const controller = new AbortController();
    const reason = new Error("PGP abort during successful mapper");
    let mapperCalls = 0;
    let executeOutcome: Promise<{ resolved: boolean; cause: unknown }> | undefined;
    try {
      const pending = withTransactionSignal(controller.signal, () =>
        connection.transaction(async (tx) => {
          const execute = tx
            .select({
              value: roundtrip().mapWith({
                mapFromDriverValue(value: string) {
                  expect(value).toBe("fixture text");
                  mapperCalls++;
                  controller.abort(reason);
                  return value;
                },
              }),
            })
            .from(fixture)
            .prepare("cancel_during_mapper")
            .execute();
          executeOutcome = execute.then(
            () => ({ resolved: true, cause: undefined }),
            (cause) => ({ resolved: false, cause }),
          );
          await execute;
        }),
      );
      await assert.rejects(
        bounded(pending, "Mapper cancellation failed to reject transaction"),
        (cause) => cause === reason,
      );
      assert(executeOutcome);
      const retained = await bounded(executeOutcome, "Mapper cancellation failed to reject retained execute");
      expect(retained.resolved).toBe(false);
      expect(retained.cause).toBe(reason);
      expect(mapperCalls).toBe(1);
      expect(sentry.counts()).toEqual({ attemptedAffected: 1, nativeAffected: 1 });
    } finally {
      controller.abort(reason);
      await executeOutcome;
      await close();
    }
  });
}, 60_000);

type CachedPgpRows = [string][];
type ExecuteSettlement = "pending" | "fulfilled" | "rejected";
for (let hops = 1; hops <= 8; hops++) {
  test(`PGP cancellation postmapper microtask hop ${hops} respects retained execute settlement`, async () => {
    await withTarget("LOOM_TEST_DATABASE_URL", async (url) => {
      const { connection, sentry, close } = await setup(url, false);
      const controller = new AbortController();
      const reason = new Error(`PGP abort at postmapper microtask hop ${hops}`);
      const aborted = Promise.withResolvers<void>();
      let execute: Promise<PgpRow[]> | undefined;
      let executeOutcome: Promise<{ resolved: boolean; cause: unknown }> | undefined;
      let transaction: Promise<unknown> | undefined;
      let executeAtAbort: ExecuteSettlement | undefined;
      let transactionAtAbort: ExecuteSettlement | undefined;
      let mapperCalls = 0;
      const trace: string[] = [];
      const scheduleAbort = (remaining: number) => {
        queueMicrotask(() => {
          assert(execute);
          trace.push(`hop ${hops - remaining + 1}: ${Bun.peek.status(execute)}`);
          if (remaining > 1) {
            scheduleAbort(remaining - 1);
            return;
          }
          assert(transaction);
          // Bun's native status read observes settlement synchronously. A
          // delayed .then observer cannot distinguish this publication gap.
          executeAtAbort = Bun.peek.status(execute);
          transactionAtAbort = Bun.peek.status(transaction);
          controller.abort(reason);
          aborted.resolve();
        });
      };
      try {
        transaction = withTransactionSignal(controller.signal, () =>
          connection.transaction(async (tx) => {
            execute = tx
              .select({
                value: roundtrip().mapWith({
                  mapFromDriverValue(value: string) {
                    expect(value).toBe("fixture text");
                    mapperCalls++;
                    trace.push("real Drizzle mapper");
                    // Installed Drizzle maps a native executor's rows in a
                    // .then continuation. Its async execute then settles;
                    // accept awaits that result, then must check authority
                    // and resolve its retained task in one continuation.
                    scheduleAbort(hops);
                    return value;
                  },
                }),
              })
              .from(fixture)
              .prepare(`cancel_postmapper_hop_${hops}`)
              .execute();
            executeOutcome = execute.then(
              () => ({ resolved: true, cause: undefined }),
              (cause) => ({ resolved: false, cause }),
            );
            await execute;
          }),
        );
        const outerOutcome = transaction.then(
          () => ({ resolved: true, cause: undefined }),
          (cause) => ({ resolved: false, cause }),
        );
        await bounded(aborted.promise, "Postmapper microtask cancellation did not execute");
        assert(executeOutcome);
        const retained = await bounded(executeOutcome, "Postmapper retained execute did not settle");
        const outer = await bounded(outerOutcome, "Postmapper outer transaction did not settle");
        console.info("PGP postmapper publication witness", {
          hops,
          executeAtAbort,
          transactionAtAbort,
          retainedResolved: retained.resolved,
          trace,
        });
        expect(mapperCalls).toBe(1);
        expect(sentry.counts()).toEqual({ attemptedAffected: 1, nativeAffected: 1 });
        assert(executeAtAbort);
        if (executeAtAbort === "fulfilled") {
          // Cancellation after publication cannot retroactively revoke a
          // result that was already delivered with valid authority.
          expect(retained.resolved).toBe(true);
        } else {
          expect(retained.resolved).toBe(false);
          expect(retained.cause).toBe(reason);
        }
        if (transactionAtAbort === "fulfilled") expect(outer.resolved).toBe(true);
        else {
          expect(outer.resolved).toBe(false);
          expect(outer.cause).toBe(reason);
        }
      } finally {
        controller.abort(reason);
        await transaction?.catch(() => {});
        await executeOutcome;
        await close();
      }
    });
  }, 60_000);
}

interface NativeSessionCacheFixture {
  cache: Cache;
}
class HeldNativePgpCache extends Cache {
  readonly entered = Promise.withResolvers<void>();
  readonly resume = Promise.withResolvers<void>();
  readonly rows = new Map<string, CachedPgpRows>();
  misses = 0;
  hits = 0;
  strategy() {
    return "explicit" as const;
  }
  async get(key: string): Promise<CachedPgpRows | undefined> {
    const rows = this.rows.get(key);
    if (!rows) {
      this.misses++;
      return undefined;
    }
    this.hits++;
    this.entered.resolve();
    await this.resume.promise;
    return rows;
  }
  async put(key: string, response: CachedPgpRows): Promise<void> {
    // Store only actual driver rows from the first native cache miss.
    this.rows.set(key, v.parse(v.array(v.tuple([v.string()])), response));
  }
  async onMutate(): Promise<void> {}
}

test("PGP cancellation private-session native cache characterization rejects delayed warm hit", async () => {
  await withTarget("LOOM_TEST_DATABASE_URL", async (url) => {
    const { connection, sentry, close } = await setup(url, false);
    const controller = new AbortController();
    const reason = new Error("PGP abort during real warm cache delivery");
    const cache = new HeldNativePgpCache();
    let executeOutcome: Promise<{ resolved: boolean; cause: unknown }> | undefined;
    let pending: Promise<unknown> | undefined;
    try {
      pending = withTransactionSignal(controller.signal, () =>
        connection.transaction(async (tx) => {
          // Characterize the installed native session's private cache field;
          // connectDatabase exposes no public cache configuration option.
          const session = v.parse(
            v.custom<NativeSessionCacheFixture>((input) =>
              v.is(v.object({ cache: v.custom<Cache>((value) => value instanceof Cache) }), input),
            ),
            tx._.session,
          );
          session.cache = cache;
          const prepared = tx
            .select({ value: roundtrip() })
            .from(fixture)
            .$withCache({ tag: "held-native-pgp", autoInvalidate: false })
            .prepare("held_native_cache");
          const [warm] = await prepared.execute();
          expect(warm!.value).toBe("fixture text");
          expect(cache.misses).toBe(1);
          expect(cache.rows.size).toBe(1);
          expect(sentry.counts().nativeAffected).toBe(1);
          const execute = prepared.execute();
          executeOutcome = execute.then(
            () => ({ resolved: true, cause: undefined }),
            (cause) => ({ resolved: false, cause }),
          );
          await execute;
        }),
      );
      const outerOutcome = pending.then(
        () => ({ resolved: true, cause: undefined }),
        (cause) => ({ resolved: false, cause }),
      );
      await bounded(cache.entered.promise, "Real warm native cache hit was not retained");
      controller.abort(reason);
      const outer = await bounded(outerOutcome, "Warm cache cancellation failed to reject transaction");
      expect(outer.resolved).toBe(false);
      expect(outer.cause).toBe(reason);
      cache.resume.resolve();
      assert(executeOutcome);
      const retained = await bounded(executeOutcome, "Warm cache cancellation failed to reject retained execute");
      expect(retained.resolved).toBe(false);
      expect(retained.cause).toBe(reason);
      expect(cache.hits).toBe(1);
      expect(sentry.counts()).toEqual({ attemptedAffected: 1, nativeAffected: 1 });
    } finally {
      cache.resume.resolve();
      controller.abort(reason);
      await pending?.catch(() => {});
      await executeOutcome;
      await close();
    }
  });
}, 60_000);

test("lost native COMMIT acknowledgment rejects without retry or claiming rollback, preserving first cause over cleanup failure", async () => {
  await withTarget("LOOM_TEST_DATABASE_URL", async (url) => {
    const { connection, sentry, close } = await setup(url, false);
    const observer = new pg.Client({ connectionString: url });
    await observer.connect();
    const unknown = new Error("test lost native COMMIT acknowledgment");
    const cleanup = new Error("test secondary rollback cleanup failure");
    let commits = 0;
    sentry.setHook(async (event) => {
      if (event.phase === "after" && /^commit$/i.test(event.text)) {
        commits++;
        throw unknown;
      }
      if (event.phase === "before" && /^rollback$/i.test(event.text)) throw cleanup;
    });
    try {
      await assert.rejects(
        connection.transaction(async (tx) => {
          await tx.execute(sql`insert into admission_writes values ('commit actually reached backend')`);
          return tx.select({ value: roundtrip() }).from(fixture).execute();
        }),
        (cause) => {
          let primary = cause;
          while (primary instanceof Error && primary.cause) primary = primary.cause;
          expect(primary).toBe(unknown);
          return true;
        },
      );
      expect(commits).toBe(1);
      expect(sentry.counts().nativeAffected).toBe(1);
      // Real independent evidence: this injected AFTER-native fault committed. Never label rejection as rollback.
      expect((await observer.query("select value from admission_writes")).rows).toEqual([
        { value: "commit actually reached backend" },
      ]);
      sentry.setHook();
      expect((await connection.db.execute(sql`select 1 as value`)).rows).toEqual([{ value: 1 }]);
    } finally {
      sentry.setHook();
      await observer.end();
      await close();
    }
  });
}, 60_000);

// Pure compile witness is useful on both targets but cannot replace native admission evidence.
test("checked PGP fixture compilation retains its exact18 contracts without backend I/O", () => {
  const dialect = extensionSqlDialect(nodePgCodecs);
  for (const signature of signatures)
    expect(dialect.sqlToQuery(sql`select ${expression(signature)}`).sql).toContain('"admission""functions"');
});
