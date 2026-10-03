import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { createConnection, createServer, type Socket } from "node:net";
import { setTimeout } from "node:timers/promises";
import { expect, test } from "bun:test";
import pg from "pg";
import * as v from "valibot";
import { dictionaryReference } from "../../../apps/loom/src/core/extensions/adapters/unaccent";
import { ExtensionOperationError } from "../../../apps/loom/src/tooling/extensions/operations";
import {
  restoreUnaccentDictionary,
  withUnaccentDictionaries,
} from "../../../apps/loom/src/tooling/extensions/unaccent";
import { withExtensionDatabase } from "../fixtures/extension-database";

// Operation-completion uncertainty for the Unaccent tooling family (audit gap 4). Authored, not executed.
//
// Provider/target filters, deliberately explicit:
// - LOCAL-ONLY fault injection: a loopback TCP proxy forwards actual PostgreSQL bytes and discards exactly one real
//   server reply after the real COMMIT was dispatched. Nothing is simulated; a remote Neon endpoint cannot be gated
//   this way (TLS, no loopback), so those cases are `skipIf(!local)`, never "passed" elsewhere.
// - SUPERUSER-ONLY: the rolled-back variant needs an event trigger (superuser). Skipped, with a warning, otherwise.
// - ANY TARGET: native path-shaped RULES rejection and the RULES-restoration limitation observation use only the
//   closed tooling entries and independent reads, so they are the cases a provider run can actually witness.
const connectionString = process.env.LOOM_TEST_DATABASE_URL;
const local =
  connectionString && ["localhost", "127.0.0.1", "::1", "[::1]"].includes(new URL(connectionString).hostname);
const superuser = connectionString && local ? await isSuperuser(connectionString) : false;
async function isSuperuser(url: string): Promise<boolean> {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    const result = await client.query<{ superuser: boolean }>(
      "SELECT current_setting('is_superuser')='on' AS superuser",
    );
    return result.rows[0]?.superuser === true;
  } finally {
    await client.end();
  }
}
if (local && !superuser)
  console.warn("UNRESOLVED ROLLED-BACK UNCERTAINTY: the local target migration role is not a superuser");
const timeout = 90_000;

const descriptor = {
  name: "unaccent",
  version: "1.1",
  schema: 'accent"schema',
  apiSupport: { status: "verified", digest: "f983b4bfaa4c974c4ae2eba548249eb86d31d86376d019898b070ff66f9832dd" },
} as const;
// Same disposable installation as the existing Unaccent tooling suite.
const install =
  'CREATE SCHEMA "accent""schema"; CREATE EXTENSION unaccent WITH SCHEMA "accent""schema"; CREATE SCHEMA "custom""dictionaries"; CREATE SCHEMA conflicting; CREATE TEXT SEARCH DICTIONARY conflicting.unaccent(TEMPLATE=pg_catalog.simple)';
const dictionarySchema = 'custom"dictionaries';

async function observe<Value>(url: string, work: (client: pg.Client) => Promise<Value>) {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    return await work(client);
  } finally {
    await client.end();
  }
}
async function bounded<Value>(pending: Promise<Value>): Promise<Value> {
  const timer = new AbortController();
  try {
    return await Promise.race([
      pending,
      setTimeout(8000, undefined, { signal: timer.signal }).then(() => {
        throw new Error("Unaccent operation uncertainty case did not settle");
      }),
    ]);
  } finally {
    timer.abort();
  }
}
async function waitFor(predicate: () => Promise<boolean>, message: string) {
  const expires = performance.now() + 5000;
  while (!(await predicate())) {
    if (performance.now() > expires) throw new Error(message);
    await setTimeout(20);
  }
}

// The installed pg 8.23.1 reports an unexpectedly closed socket as `new Error("Connection terminated unexpectedly")`
// (node_modules pg lib/client.js, the connection `end` handler and _handleErrorEvent). A socket error that arrives
// first may instead carry a transport code; lib/connection.js reportStreamError names ECONNRESET and EPIPE as the
// disconnection codes it recognises. Nothing broader is accepted, and a native SQL error is never a lost connection.
const driverLostConnection = "Connection terminated unexpectedly";
const permittedTransportCodes = v.picklist(["ECONNRESET", "EPIPE"]);
function assertLostConnection(cause: Error): void {
  expect(cause).not.toBeInstanceOf(pg.DatabaseError);
  if (cause.message === driverLostConnection) return;
  if (v.is(v.looseObject({ code: permittedTransportCodes }), cause)) return;
  // Not the driver's connection-loss error and not a permitted transport code: unexpected, so surface it.
  throw cause;
}
/**
 * A rolled-back owner failure whose first cause is a native PostgreSQL error carrying one explicitly permitted
 * SQLSTATE, with no cleanup failure. Anything else (a leaf validation error, a different SQLSTATE, a transport
 * failure, an unknown completion) is rethrown rather than reported as a native refusal.
 */
function nativeRefusal(error: Error, permitted: readonly string[]): string {
  if (
    !(error instanceof ExtensionOperationError) ||
    error.completion !== "rolled-back" ||
    error.cleanupFailures.length > 0 ||
    !(error.cause instanceof pg.DatabaseError) ||
    error.cause.code === undefined ||
    !permitted.includes(error.cause.code)
  )
    throw error;
  return error.cause.code;
}

const dictionaryRow = v.strictObject({
  options: v.nullable(v.string()),
  owner: v.string(),
  templateSchema: v.string(),
  templateName: v.string(),
});
/** Independent native observation of one dictionary: absent is the empty array. */
async function dictionaryState(client: pg.Client, schema: string, name: string) {
  const rows = await client.query(
    `SELECT d.dictinitoption AS options,pg_catalog.pg_get_userbyid(d.dictowner) AS owner,tn.nspname AS "templateSchema",t.tmplname AS "templateName"
     FROM pg_catalog.pg_ts_dict d JOIN pg_catalog.pg_namespace n ON n.oid=d.dictnamespace
     JOIN pg_catalog.pg_ts_template t ON t.oid=d.dicttemplate JOIN pg_catalog.pg_namespace tn ON tn.oid=t.tmplnamespace
     WHERE n.nspname=$1 AND d.dictname=$2`,
    [schema, name],
  );
  return v.parse(v.array(dictionaryRow), rows.rows);
}
async function lexemes(client: pg.Client, schema: string, name: string, text: string) {
  const rows = await client.query(
    "SELECT pg_catalog.ts_lexize(pg_catalog.format('%I.%I',$1::text,$2::text)::pg_catalog.regdictionary,$3::text) AS lexemes",
    [schema, name, text],
  );
  return v.parse(v.tuple([v.strictObject({ lexemes: v.nullable(v.array(v.string())) })]), rows.rows)[0].lexemes;
}
/** The owned backend and its extension advisory lock are gone, however the operation ended. */
async function ownedBackendReleased(client: pg.Client) {
  await waitFor(async () => {
    await client.query("SELECT pg_catalog.pg_stat_clear_snapshot()");
    const sessions = await client.query(
      "SELECT pid FROM pg_catalog.pg_stat_activity WHERE application_name='loom-migrations' AND datname=current_database()",
    );
    return sessions.rows.length === 0;
  }, "An owned operator backend remained after the operation settled");
  const locks = await client.query(
    "SELECT count(*)::int AS count FROM pg_catalog.pg_locks WHERE locktype='advisory' AND database=(SELECT oid FROM pg_catalog.pg_database WHERE datname=current_database())",
  );
  expect(locks.rows).toEqual([{ count: 0 }]);
}

interface WireStatement {
  readonly connection: number;
  readonly sql: string;
}
type DroppedReply =
  | { readonly kind: "complete"; readonly tag: string }
  | { readonly kind: "error"; readonly code: string };

/** Native ErrorResponse fields are (type byte, C string)* terminated by a zero byte. */
function errorCode(body: Buffer): string {
  let offset = 0;
  while (offset < body.length && body[offset] !== 0) {
    const type = String.fromCharCode(body[offset]!);
    const end = body.indexOf(0, offset + 1);
    if (type === "C") return body.toString("utf8", offset + 1, end);
    offset = end + 1;
  }
  throw new Error("Native ErrorResponse carried no SQLSTATE");
}

/**
 * Forward actual PostgreSQL bytes in both directions, record the statements the client really sends, and discard
 * exactly one real server reply to the first COMMIT: the CommandComplete tag ("complete") or the ErrorResponse
 * ("error"). The COMMIT itself is always forwarded and executed by PostgreSQL. Both sockets are then destroyed before
 * the driver sees the reply. No result, error or unknown outcome is ever supplied to the driver or to the owner.
 *
 * The existing transport gate is file-local to extensions-operations-transport.test.ts and cannot be imported without
 * editing that test, so this narrower copy keeps its approach (raw forwarding, discard-then-destroy) and adds the wire
 * record needed to prove "no retry".
 */
async function withDroppedCommitReply(
  url: string,
  mode: "complete" | "error",
  operation: (proxied: string, dropped: Promise<DroppedReply>, wire: readonly WireStatement[]) => Promise<void>,
) {
  const target = new URL(url);
  const sockets = new Set<Socket>();
  const dropped = Promise.withResolvers<DroppedReply>();
  const wire: WireStatement[] = [];
  let connections = 0;
  let settled = false;
  const server = createServer((downstream) => {
    const connection = ++connections;
    const upstream = createConnection({
      host: target.hostname.replace(/^\[|\]$/g, ""),
      port: Number(target.port || "5432"),
    });
    sockets.add(downstream);
    sockets.add(upstream);
    let startup = true;
    let front = Buffer.alloc(0);
    let back = Buffer.alloc(0);
    let commitDispatched = false;
    downstream.on("error", () => undefined);
    upstream.on("error", (error) => downstream.destroy(error));
    downstream.on("close", () => {
      sockets.delete(downstream);
      upstream.destroy();
    });
    upstream.on("close", () => {
      sockets.delete(upstream);
      downstream.destroy();
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
          if (packet[0] === 81 || packet[0] === 80) {
            const body = packet.subarray(5).toString();
            // Q: query text. P: statement name, query text, parameter types.
            const sql = packet[0] === 80 ? body.slice(body.indexOf("\0") + 1).split("\0")[0]! : body.split("\0")[0]!;
            wire.push({ connection, sql });
            if (sql === "COMMIT") commitDispatched = true;
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
        if (commitDispatched && !settled) {
          const body = packet.subarray(5);
          const complete = mode === "complete" && packet[0] === 67 && body.toString() === "COMMIT\0";
          const refused = mode === "error" && packet[0] === 69;
          if (complete || refused) {
            // PostgreSQL has produced its actual reply to COMMIT; disconnect before pg can read it.
            settled = true;
            dropped.resolve(complete ? { kind: "complete", tag: "COMMIT" } : { kind: "error", code: errorCode(body) });
            downstream.destroy();
            upstream.destroy();
            return;
          }
        }
        downstream.write(packet);
      }
    });
  });
  // Node's net types delegate events through InternalEventEmitter, absent from older ambient Node declarations in
  // this workspace. Establish the native EventEmitter base without a cast, as the existing transport gate does.
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
    await operation(proxied.href, dropped.promise, wire);
  } finally {
    for (const socket of sockets) socket.destroy();
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

test.skipIf(!local)(
  "LOCAL-ONLY: a dropped actual COMMIT acknowledgement reports unknown, is never retried, and the dictionary is durable",
  async () => {
    await withExtensionDatabase(async (url) => {
      await observe(url, (client) => client.query(install));
      const reference = dictionaryReference({ schema: dictionarySchema, name: "uncertain_commit" });
      await withDroppedCommitReply(url, "complete", async (proxied, dropped, wire) => {
        let admitted = 0;
        const pending = withUnaccentDictionaries(proxied, descriptor, async (dictionaries) => {
          admitted++;
          const facts = await dictionaries.createDictionary(reference);
          expect(facts.options).toBe("rules = 'unaccent'");
          return "created before the acknowledgement was lost";
        });
        const outcome = pending.then(
          () => undefined,
          (error: Error) => error,
        );
        // The proxy discarded PostgreSQL's actual CommandComplete for the actual COMMIT.
        expect(await bounded(dropped)).toEqual({ kind: "complete", tag: "COMMIT" });
        const error = await bounded(outcome);
        assert(error instanceof ExtensionOperationError);
        // Neither committed nor rolled-back may be claimed; the first cause is the driver's lost-connection error (or a
        // permitted transport code), never a native SQL error.
        expect(error.completion).toBe("unknown");
        assertLostConnection(v.parse(v.instance(Error), error.cause));
        expect(admitted).toBe(1);

        // No retry and no later statement on the owner connection: the wire shows one transaction and one COMMIT.
        const commits = wire.filter((statement) => statement.sql === "COMMIT");
        expect(commits).toHaveLength(1);
        const ownerStatements = wire.filter((statement) => statement.connection === commits[0]!.connection);
        const sql = ownerStatements.map((statement) => statement.sql);
        expect(sql.filter((text) => text === "BEGIN")).toHaveLength(1);
        expect(sql.at(-1)).toBe("COMMIT");
        expect(wire.filter((statement) => statement.sql.startsWith("CREATE TEXT SEARCH DICTIONARY"))).toHaveLength(1);
        expect(wire.some((statement) => statement.sql === "ROLLBACK")).toBe(false);
      });

      await observe(url, async (client) => {
        await ownedBackendReleased(client);
        // A fresh, independent, direct session confirms the actual durable native state: the COMMIT took effect.
        const durable = await dictionaryState(client, dictionarySchema, "uncertain_commit");
        expect(durable).toHaveLength(1);
        expect(durable[0]).toMatchObject({
          options: "rules = 'unaccent'",
          templateSchema: descriptor.schema,
          templateName: "unaccent",
        });
        expect(await lexemes(client, dictionarySchema, "uncertain_commit", "Hôtel")).toEqual(["Hotel"]);
        expect(await lexemes(client, dictionarySchema, "uncertain_commit", "Æther")).toEqual(["AEther"]);
        // The default installed dictionary was not touched by the interrupted operation.
        expect(await dictionaryState(client, descriptor.schema, "unaccent")).toMatchObject([
          { options: "rules = 'unaccent'" },
        ]);
        // A closed owner reads the same facts the independent session saw...
        const inspected = await withUnaccentDictionaries(url, descriptor, (dictionaries) =>
          dictionaries.inspectDictionary(reference),
        );
        expect(inspected.completion).toBe("committed");
        expect(inspected.value).toMatchObject({ options: durable[0]!.options, owner: durable[0]!.owner });
        // ...and an explicit caller retry is a native duplicate, proving the leaf never retried for the caller.
        await assert.rejects(
          withUnaccentDictionaries(url, descriptor, (dictionaries) => dictionaries.createDictionary(reference)),
          (failure) => {
            assert.ok(failure instanceof ExtensionOperationError);
            expect(failure.completion).toBe("rolled-back");
            expect(failure.cause).toBeInstanceOf(pg.DatabaseError);
            expect(v.parse(v.object({ code: v.string() }), failure.cause).code).toBe("23505");
            return true;
          },
        );
      });
    });
  },
  timeout,
);

test.skipIf(!local || !superuser)(
  "LOCAL-ONLY, SUPERUSER-ONLY: a dropped actual native COMMIT error reports unknown while the durable state is rolled back",
  async () => {
    await withExtensionDatabase(async (url) => {
      await observe(url, (client) => client.query(install));
      const reference = dictionaryReference({ schema: dictionarySchema, name: "uncertain_rollback" });
      // A genuine deferred-constraint failure at COMMIT, produced by an event trigger inside the owner's transaction.
      await observe(url, async (client) => {
        await client.query(`CREATE SCHEMA uncertainty_fixture;
          CREATE SEQUENCE uncertainty_fixture.trigger_calls;
          CREATE TABLE uncertainty_fixture.writes (value integer NOT NULL, UNIQUE (value) DEFERRABLE INITIALLY DEFERRED);
          CREATE FUNCTION uncertainty_fixture.fail_at_commit() RETURNS event_trigger LANGUAGE plpgsql AS $fixture$
          BEGIN
            PERFORM nextval('uncertainty_fixture.trigger_calls');
            INSERT INTO uncertainty_fixture.writes VALUES (1);
            INSERT INTO uncertainty_fixture.writes VALUES (1);
          END;
          $fixture$;
          CREATE EVENT TRIGGER uncertainty_fail_at_commit ON ddl_command_end WHEN TAG IN ('CREATE TEXT SEARCH DICTIONARY')
            EXECUTE FUNCTION uncertainty_fixture.fail_at_commit()`);
      });
      try {
        await withDroppedCommitReply(url, "error", async (proxied, dropped, wire) => {
          const pending = withUnaccentDictionaries(proxied, descriptor, async (dictionaries) => {
            await dictionaries.createDictionary(reference);
            return "created, but COMMIT will fail natively";
          });
          const outcome = pending.then(
            () => undefined,
            (error: Error) => error,
          );
          // The discarded reply is PostgreSQL's actual 23505 ErrorResponse to the actual COMMIT.
          expect(await bounded(dropped)).toEqual({ kind: "error", code: "23505" });
          const error = await bounded(outcome);
          assert(error instanceof ExtensionOperationError);
          expect(error.completion).toBe("unknown");
          // The driver never saw the native error, so the first cause is the lost connection, not 23505.
          assertLostConnection(v.parse(v.instance(Error), error.cause));
          expect(wire.filter((statement) => statement.sql === "COMMIT")).toHaveLength(1);
          expect(wire.some((statement) => statement.sql === "ROLLBACK")).toBe(false);
        });
        await observe(url, async (client) => {
          await ownedBackendReleased(client);
          // Durable state: the transaction rolled back, although the owner could not know it.
          expect(await dictionaryState(client, dictionarySchema, "uncertain_rollback")).toEqual([]);
          expect((await client.query("SELECT value FROM uncertainty_fixture.writes")).rows).toEqual([]);
          // The trigger really executed: sequences are not transactional.
          expect(
            (await client.query("SELECT last_value::text AS value,is_called FROM uncertainty_fixture.trigger_calls"))
              .rows,
          ).toEqual([{ value: "1", is_called: true }]);
        });
      } finally {
        await observe(url, (client) => client.query("DROP EVENT TRIGGER IF EXISTS uncertainty_fail_at_commit"));
      }
      // With the failure source removed, a deliberate caller retry commits: the dictionary truly was absent.
      const created = await withUnaccentDictionaries(url, descriptor, (dictionaries) =>
        dictionaries.createDictionary(reference),
      );
      expect(created.completion).toBe("committed");
      await observe(url, async (client) => {
        expect(await dictionaryState(client, dictionarySchema, "uncertain_rollback")).toHaveLength(1);
        expect(await lexemes(client, dictionarySchema, "uncertain_rollback", "Hôtel")).toEqual(["Hotel"]);
      });
    });
  },
  timeout,
);

// Path-shaped or otherwise non-basename RULES. The leaf's own validator only requires a non-empty, NUL-free,
// lossless string, so this rejection is NATIVE, and it happens before any filesystem access: the server rejects the
// name itself (SQLSTATE 22023) and never opens a file. A well-formed but absent basename instead fails when the
// file is opened (F0000), which the control case below contrasts. Whether a leaf-side basename pre-check should exist
// would be a production decision; none is assumed here.
const invalidRulesBasenames = [
  "../unaccent",
  "../../../etc/passwd",
  "/etc/passwd",
  "tsearch_data/unaccent",
  "dir/unaccent",
  "..\\unaccent",
  "C:\\unaccent",
  "~/unaccent",
  "unaccent.rules",
  "UNACCENT",
  "unaccent ",
  "unaccent-rules",
] as const;
test.skipIf(!connectionString)(
  "path-shaped RULES are rejected natively before any file is opened and roll back with the exact first cause",
  async () => {
    await withExtensionDatabase(async (url) => {
      await observe(url, (client) => client.query(install));
      const reference = dictionaryReference({ schema: dictionarySchema, name: "path_rules" });
      for (const rules of invalidRulesBasenames) {
        // Creation with the path-shaped value never creates anything.
        await assert.rejects(
          withUnaccentDictionaries(url, descriptor, (dictionaries) => dictionaries.createDictionary(reference, rules)),
          (error) => {
            assert.ok(error instanceof ExtensionOperationError, rules);
            expect(error.completion, rules).toBe("rolled-back");
            expect(error.cleanupFailures, rules).toEqual([]);
            // A native PostgreSQL error, not a leaf validation or transport failure.
            expect(error.cause, rules).toBeInstanceOf(pg.DatabaseError);
            const native = v.parse(v.object({ code: v.string(), message: v.string() }), error.cause);
            expect(native.code, rules).toBe("22023");
            expect(native.message, rules).toMatch(/invalid text search configuration file name/i);
            return true;
          },
        );
        // A caught path-shaped setRules still poisons the owner, and the prior creation rolls back with it.
        let caught: unknown;
        await assert.rejects(
          withUnaccentDictionaries(url, descriptor, async (dictionaries) => {
            await dictionaries.createDictionary(reference);
            try {
              await dictionaries.setRules(reference, rules);
            } catch (cause) {
              caught = cause;
            }
            return "caught";
          }),
          (error) => {
            assert.ok(error instanceof ExtensionOperationError, rules);
            expect(error.completion, rules).toBe("rolled-back");
            expect(error.cleanupFailures, rules).toEqual([]);
            expect(error.cause, rules).toBe(caught);
            expect(error.cause, rules).toBeInstanceOf(pg.DatabaseError);
            expect(v.parse(v.object({ code: v.string() }), error.cause).code, rules).toBe("22023");
            return true;
          },
        );
        await observe(url, async (client) => {
          expect(await dictionaryState(client, dictionarySchema, "path_rules"), rules).toEqual([]);
        });
      }
      // Control: a well-formed basename that is not installed fails at file access, a different native stage.
      await assert.rejects(
        withUnaccentDictionaries(url, descriptor, (dictionaries) =>
          dictionaries.createDictionary(reference, "loom_missing_rules_20261003"),
        ),
        (error) => {
          assert.ok(error instanceof ExtensionOperationError);
          expect(error.completion).toBe("rolled-back");
          expect(error.cleanupFailures).toEqual([]);
          expect(error.cause).toBeInstanceOf(pg.DatabaseError);
          expect(v.parse(v.object({ code: v.string() }), error.cause).code).toBe("F0000");
          return true;
        },
      );
      await observe(url, async (client) => {
        await ownedBackendReleased(client);
        expect(await dictionaryState(client, descriptor.schema, "unaccent")).toMatchObject([
          { options: "rules = 'unaccent'" },
        ]);
        expect(await lexemes(client, descriptor.schema, "unaccent", "Hôtel")).toEqual(["Hotel"]);
      });
    });
  },
  timeout,
);

test.skipIf(!connectionString)(
  "OBSERVATION, not acceptance: what RULES restoration this target can actually exercise, and what stays unresolved",
  async () => {
    await withExtensionDatabase(async (url) => {
      await observe(url, (client) => client.query(install));
      const installed = dictionaryReference({ schema: descriptor.schema, name: "unaccent" });
      const original = await observe(url, (client) => dictionaryState(client, descriptor.schema, "unaccent"));
      expect(original).toMatchObject([{ options: "rules = 'unaccent'" }]);

      // 1. Ordinary mutation authority over the installed default dictionary, under the owner credentials.
      let mutable = false;
      try {
        const result = await withUnaccentDictionaries(url, descriptor, (dictionaries) =>
          dictionaries.setRules(installed, "unaccent"),
        );
        expect(result.completion).toBe("committed");
        expect(result.value.options).toBe("rules = 'unaccent'");
        mutable = true;
        console.info("Unaccent RULES observation: owner may ALTER the installed default dictionary (same rules).");
      } catch (error) {
        // Only a native insufficient-privilege refusal records a restriction; anything else is unexpected.
        if (!(error instanceof Error)) throw error;
        expect(nativeRefusal(error, ["42501"])).toBe("42501");
        console.info(
          "Unaccent RULES observation: ALTER of the installed default dictionary denied (42501); no restoration claimed.",
        );
      }
      expect(await observe(url, (client) => dictionaryState(client, descriptor.schema, "unaccent"))).toEqual(original);

      // 2. Installed alternative rules, by native enumeration only (never guessed, never provisioned).
      const alternatives = await observe(url, async (client) => {
        try {
          const shared = v.parse(
            v.tuple([v.strictObject({ setting: v.string() })]),
            (await client.query("SELECT setting FROM pg_catalog.pg_config WHERE name='SHAREDIR'")).rows,
          )[0].setting;
          const listing = await client.query("SELECT name FROM pg_catalog.pg_ls_dir($1) AS name", [
            `${shared}/tsearch_data`,
          ]);
          return v
            .parse(v.array(v.strictObject({ name: v.string() })), listing.rows)
            .flatMap((row) => /^([a-z0-9_]+)\.rules$/.exec(row.name)?.[1] ?? [])
            .filter((basename) => basename !== "unaccent");
        } catch (error) {
          // Only a native privilege denial is an enumeration restriction; anything else is unexpected.
          if (!(error instanceof pg.DatabaseError) || error.code !== "42501") throw error;
          console.info("Unaccent RULES observation: installed rules cannot be enumerated here (42501).");
          return undefined;
        }
      });
      if (!mutable || !alternatives?.length) {
        console.info(
          `Unaccent RULES observation: provider drift/restoration UNRESOLVED (mutable=${mutable}, alternatives=${alternatives === undefined ? "unknown" : alternatives.length}).`,
        );
        return;
      }

      // 3. A genuinely installed alternative exists and the owner may alter: exercise drift and the fixed restoration.
      const [alternative] = alternatives;
      assert(alternative);
      let drifted = false;
      let restored = false;
      try {
        try {
          const result = await withUnaccentDictionaries(url, descriptor, (dictionaries) =>
            dictionaries.setRules(installed, alternative),
          );
          expect(result.value.options).toBe(`rules = '${alternative}'`);
          drifted = true;
        } catch (error) {
          // An installed file may not be a valid Unaccent rules file. Only a native file-loading refusal
          // (config_file_error, F0000, which also rolls everything back) means "no drift produced"; anything else
          // is unexpected and rethrown. Restoration then stays UNRESOLVED: there is no native drift to restore.
          if (!(error instanceof Error)) throw error;
          nativeRefusal(error, ["F0000"]);
          console.info(
            `Unaccent RULES observation: installed '${alternative}' refused natively as Unaccent rules (F0000); no drift produced, restoration UNRESOLVED.`,
          );
        }
        if (drifted) {
          // The strict pin now disagrees: operator entries refuse before admitting any callback.
          let entered = false;
          await assert.rejects(
            withUnaccentDictionaries(url, descriptor, async () => {
              entered = true;
            }),
            (error) =>
              error instanceof ExtensionOperationError &&
              error.completion === "rolled-back" &&
              error.cause instanceof Error &&
              /text-search contract mismatch/.test(error.cause.message),
          );
          expect(entered).toBe(false);
          const result = await restoreUnaccentDictionary(url, descriptor);
          expect(result.completion).toBe("committed");
          expect(result.value.options).toBe("rules = 'unaccent'");
          restored = true;
        }
      } finally {
        // Disposable database, but never leave a drift this case itself produced; a failing restore is not swallowed.
        if (drifted && !restored) await restoreUnaccentDictionary(url, descriptor);
      }
      const final = await observe(url, async (client) => ({
        state: await dictionaryState(client, descriptor.schema, "unaccent"),
        hotel: await lexemes(client, descriptor.schema, "unaccent", "Hôtel"),
      }));
      expect(final.state).toMatchObject([{ options: "rules = 'unaccent'" }]);
      expect(final.hotel).toEqual(["Hotel"]);
    });
  },
  timeout,
);
