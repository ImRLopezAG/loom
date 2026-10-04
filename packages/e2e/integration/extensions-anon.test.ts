import { describe, expect, test } from "bun:test";
import pg from "pg";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/anon.json";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import { withAnon } from "../../../apps/loom/src/tooling/extensions/operations/anon";
import { ANON_FOREIGN_KEY_TRIGGER_IDS } from "../../../apps/loom/src/core/extensions/adapters/anon";
import { anonLocalFixture } from "../fixtures/anon-local-fixture";

// Native characterization on a caller-owned disposable 127.0.0.1 container built from anonLocalFixture.
// This is upstream Dalibo 2.5.1, not the Neon build; it is never provider or typed-adapter acceptance.
const url = process.env.ANON_LOCAL_URL;
const local = url && /@127\.0\.0\.1:\d+\//.test(url) ? url : undefined;
if (!local) console.warn("SKIPPED extensions-anon native characterization: ANON_LOCAL_URL is not a 127.0.0.1 fixture");
const descriptor = {
  name: "anon",
  version: "2.5.1",
  schema: "extensions",
  apiSupport: { status: "verified", digest: manifest.digest },
} as const;

// CREATE EXTENSION loads the library only in its own session; later sessions need it loaded first.
async function withClient<Result>(work: (client: pg.Client) => Promise<Result>, load = true) {
  const client = new pg.Client({ connectionString: local });
  await client.connect();
  try {
    if (load) await client.query("LOAD 'anon'");
    await client.query("BEGIN");
    return await work(client);
  } finally {
    await client.query("ROLLBACK").catch(() => undefined);
    await client.end();
  }
}
// Resolves to the rejection reason; a fulfilled promise fails the test.
const rejection = (promise: Promise<unknown>) =>
  promise.then(
    () => {
      throw new Error("Expected a rejection");
    },
    (error: Error) => error,
  );
const scalar = async (client: pg.Client, sql: string, values: unknown[] = []) =>
  (await client.query<{ value: unknown }>(`SELECT ${sql} AS value`, values)).rows[0]?.value;

describe.skipIf(!local)("anon 2.5.1 native characterization (local upstream fixture)", () => {
  test("installed upstream build differs from the Neon manifest in exactly the provider-patched members", async () => {
    await withClient(async (client) => {
      expect(await scalar(client, "anon.version()")).toBe("2.5.1");
      const captured = await captureExtensionContract(client, { name: "anon", provider: "neon", fixture: "local" });
      const byId = new Map(captured.contract.members.map((member) => [member.id, JSON.stringify(member)]));
      const neon = manifest.contract.members.map((member) => member.id);
      expect(neon.filter((id) => !byId.has(id)).sort()).toEqual([...anonLocalFixture.onlyNeon]);
      expect([...byId.keys()].filter((id) => !neon.includes(id)).sort()).toEqual([...anonLocalFixture.onlyLocal]);
      expect(
        manifest.contract.members
          .filter((member) => byId.has(member.id) && byId.get(member.id) !== JSON.stringify(member))
          .map((member) => member.id),
      ).toEqual(["routine:anon.init()"]);
      // Canonical Neon and local portable rewrite share the same 4 native RI callback identities.
      expect(neon.filter((id) => id.includes("$fk-trigger:")).sort()).toEqual([...ANON_FOREIGN_KEY_TRIGGER_IDS].sort());
      expect([...byId.keys()].filter((id) => id.includes("$fk-trigger:")).sort()).toEqual(
        [...ANON_FOREIGN_KEY_TRIGGER_IDS].sort(),
      );
      expect(neon.some((id) => id.includes("RI_ConstraintTrigger_"))).toBe(false);
      expect([...byId.keys()].some((id) => id.includes("RI_ConstraintTrigger_"))).toBe(false);
      expect(captured.digest).not.toBe(manifest.digest);
    });
  }, 60000);

  test("withAnon fails closed before its callback on the non-Neon contract", async () => {
    let entered = false;
    const attempt = withAnon(local!, descriptor, async () => {
      entered = true;
    });
    expect(await rejection(attempt)).toMatchObject({
      completion: "rolled-back",
      cause: expect.objectContaining({ message: "Extension SQL contract mismatch: anon" }),
    });
    expect(entered).toBe(false);
  });

  test("a fresh session without the loaded library has no label provider or masking settings", async () => {
    await withClient(async (client) => {
      await client.query("CREATE TABLE anon_unloaded(name text)");
      await client.query("SAVEPOINT label");
      expect(
        await rejection(
          client.query(`SECURITY LABEL FOR anon ON COLUMN anon_unloaded.name IS 'MASKED WITH VALUE NULL'`),
        ),
      ).toMatchObject({ message: 'security label provider "anon" is not loaded' });
      await client.query("ROLLBACK TO SAVEPOINT label");
      expect(await rejection(scalar(client, "anon.start_dynamic_masking()"))).toMatchObject({
        message: 'unrecognized configuration parameter "anon.maskschema"',
      });
    }, false);
  });

  test("static masking: labels, trusted-schema rejection, rules view and in-place anonymization", async () => {
    await withClient(async (client) => {
      if (!(await scalar(client, "anon.is_initialized()"))) expect(await scalar(client, "anon.init()")).toBe(true);
      await client.query("CREATE TABLE anon_people(id int PRIMARY KEY, name text, email text)");
      await client.query("INSERT INTO anon_people VALUES (1,'Alice','a@x.io'),(2,'Bob','b@x.io')");
      await client.query(`SECURITY LABEL FOR anon ON COLUMN anon_people.name IS 'MASKED WITH VALUE ''CONFIDENTIAL'''`);
      await client.query(
        `SECURITY LABEL FOR anon ON COLUMN anon_people.email IS 'MASKED WITH FUNCTION anon.partial_email(email)'`,
      );
      await client.query("SAVEPOINT untrusted");
      expect(
        await rejection(
          client.query(
            `SECURITY LABEL FOR anon ON COLUMN anon_people.name IS 'MASKED WITH FUNCTION pg_catalog.pg_sleep(1)'`,
          ),
        ),
      ).toMatchObject({
        message: "Anon: `MASKED WITH FUNCTION pg_catalog.pg_sleep(1)` is not a valid label for a column",
        detail: "pg_catalog.pg_sleep(1) does not belong in a TRUSTED schema",
      });
      await client.query("ROLLBACK TO SAVEPOINT untrusted");
      const rules = await client.query(
        "SELECT attname::text AS column, masking_function AS function, masking_value AS value, priority FROM anon.pg_masking_rules WHERE relname = 'anon_people' ORDER BY attnum",
      );
      expect(rules.rows).toEqual([
        { column: "name", function: null, value: "'CONFIDENTIAL'", priority: 100 },
        { column: "email", function: "anon.partial_email(email)", value: null, priority: 100 },
      ]);
      expect(await scalar(client, "anon.anonymize_table('anon_people'::regclass)")).toBe(true);
      const rows = await client.query("SELECT name, email FROM anon_people ORDER BY id");
      expect(rows.rows).toEqual([
        { name: "CONFIDENTIAL", email: "a******@x.******.io" },
        { name: "CONFIDENTIAL", email: "b******@x.******.io" },
      ]);
    });
  });

  test("masking functions: deterministic, generalizing and partial families", async () => {
    await withClient(async (client) => {
      if (!(await scalar(client, "anon.is_initialized()"))) await scalar(client, "anon.init()");
      expect(await scalar(client, "anon.partial('abcdef',1,'xxxx',1)")).toBe("axxxxf");
      expect(await scalar(client, "anon.partial_email('daamien@gmail.com')")).toBe("da******@gm******.com");
      expect(await scalar(client, "anon.digest('x','salt','sha256')")).toBe(
        "59098e2e749becb74e501e20763edb94b09433e20c2aff0ebc9a061bb92448e6",
      );
      expect(await scalar(client, "anon.generalize_int4range(42,10)::text")).toBe("[40,50)");
      const pseudo = "anon.pseudo_first_name('alice'::text,'salt')";
      expect(await scalar(client, `${pseudo} = ${pseudo}`)).toBe(true);
      expect(await rejection(scalar(client, "anon.pseudo_first_name('alice','salt')"))).toMatchObject({
        message: "could not determine polymorphic type because input has type unknown",
      });
    });
  });

  test("query helpers: version, hex, partial email, and bounded random stay native", async () => {
    await withClient(async (client) => {
      if (!(await scalar(client, "anon.is_initialized()"))) expect(await scalar(client, "anon.init()")).toBe(true);
      expect(await scalar(client, "anon.version()")).toBe("2.5.1");
      expect(await scalar(client, "anon.hex_to_int('ff')")).toBe(255);
      expect(await scalar(client, "anon.partial_email('daamien@gmail.com')")).toBe("da******@gm******.com");
      const email = await scalar(client, "anon.fake_email()");
      expect(email).toBeTypeOf("string");
      expect(String(email)).toMatch(/@/);
      const n = await scalar(client, "anon.random_int_between(1,3)");
      expect(n).toBeGreaterThanOrEqual(1);
      expect(n).toBeLessThanOrEqual(3);
    });
  });

  test("dynamic masking: start creates mask schema; mask_role needs it; stop drops it", async () => {
    const cleanup = new pg.Client({ connectionString: local });
    await cleanup.connect();
    try {
      await cleanup.query("LOAD 'anon'");
      const existing = await cleanup.query<{ value: boolean }>("SELECT to_regnamespace('mask') IS NOT NULL AS value");
      if (existing.rows[0]?.value) await cleanup.query("SELECT anon.stop_dynamic_masking()");
    } finally {
      await cleanup.end();
    }
    await withClient(async (client) => {
      if (!(await scalar(client, "anon.is_initialized()"))) await scalar(client, "anon.init()");
      expect(await scalar(client, "to_regnamespace('mask') IS NOT NULL")).toBe(false);
      await client.query("SAVEPOINT before_mask_role");
      expect(await rejection(scalar(client, "anon.mask_role('postgres'::regrole)"))).toMatchObject({
        message: 'schema "mask" does not exist',
      });
      await client.query("ROLLBACK TO SAVEPOINT before_mask_role");
      expect(await scalar(client, "anon.start_dynamic_masking()")).toBe(true);
      expect(await scalar(client, "current_setting('anon.transparent_dynamic_masking')")).toBe("off");
      expect(await scalar(client, "current_setting('anon.maskschema')")).toBe("mask");
      expect(await scalar(client, "to_regnamespace('mask') IS NOT NULL")).toBe(true);
      expect(await scalar(client, "anon.mask_role('postgres'::regrole)")).toBe(true);
      expect(await scalar(client, "anon.unmask_role('postgres'::regrole)")).toBe(true);
      expect(await scalar(client, "anon.stop_dynamic_masking()")).toBe(true);
      expect(await scalar(client, "to_regnamespace('mask') IS NOT NULL")).toBe(false);
    });
  });

  test("replica masking: start and refresh return NULL without masking rules; stop still succeeds", async () => {
    await withClient(async (client) => {
      if (!(await scalar(client, "anon.is_initialized()"))) await scalar(client, "anon.init()");
      expect(await scalar(client, "anon.start_replica_masking()")).toBeNull();
      expect(await scalar(client, "anon.start_replica_masking('kello_replica')")).toBeNull();
      expect(await scalar(client, "anon.refresh_replica_masking('kello_replica')")).toBeNull();
      expect(await scalar(client, "anon.stop_replica_masking()")).toBe(true);
    });
  });
});
