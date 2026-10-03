import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import pg from "pg";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import {
  captureExtensionSubscript,
  validateExtensionSubscriptCapture,
  type ExtensionSubscriptCapture,
} from "../../../apps/loom/src/tooling/extensions/subscript-capture";
import { verifyExtensionApiContracts } from "../../../apps/loom/src/tooling/extensions/verify";

const hstoreId = "type:$extension:hstore.hstore";
const arrayId = "type:$extension:hstore._hstore";
const ghstoreId = "type:$extension:hstore.ghstore";
const ghstoreArrayId = "type:$extension:hstore._ghstore";
const extensionHandler = "routine:$extension:hstore.hstore_subscript_handler(pg_catalog.internal)";
const arrayHandler = "routine:pg_catalog.array_subscript_handler(pg_catalog.internal)";
// The runner supplies its observed environment profile; this string does not authenticate the provider.
const provider = process.env.LOOM_EXTENSION_TEST_PROVIDER ?? "local-postgresql";

const quote = (identifier: string) => `"${identifier.replaceAll('"', '""')}"`;

/** Independent oracle: the native pointer relationship joined by OID, with no Loom collector code involved. */
async function observePointers(client: pg.Client, namespace: string) {
  const result = await client.query<{
    type: string;
    typeSchema: string;
    handler: string | null;
    handlerSchema: string | null;
    arguments: string | null;
    result: string | null;
  }>(
    `SELECT t.typname AS type,tn.nspname AS "typeSchema",p.proname AS handler,pn.nspname AS "handlerSchema",
      pg_get_function_identity_arguments(p.oid) AS arguments,pg_get_function_result(p.oid) AS result
      FROM pg_type t JOIN pg_namespace tn ON tn.oid=t.typnamespace
      LEFT JOIN pg_proc p ON p.oid=t.typsubscript::oid LEFT JOIN pg_namespace pn ON pn.oid=p.pronamespace
      WHERE tn.nspname=$1 AND t.typname=ANY($2::name[]) ORDER BY t.typname`,
    [namespace, ["hstore", "_hstore", "ghstore", "_ghstore"]],
  );
  return result.rows;
}

async function liveTypeOid(client: pg.Client, namespace: string) {
  const result = await client.query<{ oid: number }>(
    "SELECT t.oid::integer AS oid FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname=$1 AND t.typname='hstore'",
    [namespace],
  );
  return result.rows[0]?.oid;
}

async function isSuperuser(client: pg.Client) {
  const privileges = await client.query<{ superuser: boolean }>(
    "SELECT current_setting('is_superuser')='on' AS superuser",
  );
  return privileges.rows[0]?.superuser === true;
}

async function install(client: pg.Client, namespace: string) {
  await client.query(`CREATE SCHEMA ${quote(namespace)}`);
  await client.query(`CREATE EXTENSION hstore SCHEMA ${quote(namespace)} VERSION '1.8'`);
}

const escapeHstore = (value: string) => value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');

test.skipIf(!process.env.LOOM_TEST_DATABASE_URL)(
  "hstore subscripting relationships resolve all four owned types with stable symbolic digests across schemas and OIDs",
  async () => {
    const artifacts: ExtensionSubscriptCapture[] = [];
    const liveTypeOids: number[] = [];
    for (const [index, namespace] of ['Subscript "One"', "custom_subscript_two"].entries()) {
      await withExtensionDatabase(async (url) => {
        const client = new pg.Client({ connectionString: url });
        await client.connect();
        try {
          if (index) await client.query("CREATE TYPE public.subscript_oid_noise AS ENUM ('noise')");
          await install(client, namespace);
          const source = await captureExtensionContract(client, {
            name: "hstore",
            provider,
            fixture: `disposable-subscript-${index}`,
          });
          const sourceBytes = JSON.stringify(source);
          const artifact = await captureExtensionSubscript(client, source, {
            provider,
            fixture: `disposable-subscript-${index}`,
          });
          artifacts.push(artifact);
          expect(validateExtensionSubscriptCapture(artifact, source)).toEqual(artifact);
          expect(JSON.stringify(source)).toBe(sourceBytes);
          expect(artifact.contract.manifestDigest).toBe(source.digest);
          expect(artifact.provenance.installationSchema).toBe(namespace);
          expect(artifact.contract.types).toEqual([
            { id: ghstoreArrayId, handler: arrayHandler },
            { id: arrayId, handler: arrayHandler },
            { id: ghstoreId, handler: null },
            { id: hstoreId, handler: extensionHandler },
          ]);
          expect(JSON.stringify(artifact.contract)).not.toContain(namespace);
          expect(JSON.stringify(artifact)).not.toContain('"oid":');

          const observed = await observePointers(client, namespace);
          const pointer = (type: string, handler: string | null, handlerSchema: string | null) => ({
            type,
            typeSchema: namespace,
            handler,
            handlerSchema,
            arguments: handler ? "internal" : null,
            result: handler ? "internal" : null,
          });
          expect(observed).toEqual([
            pointer("_ghstore", "array_subscript_handler", "pg_catalog"),
            pointer("_hstore", "array_subscript_handler", "pg_catalog"),
            pointer("ghstore", null, null),
            pointer("hstore", "hstore_subscript_handler", namespace),
          ]);
          const typeOid = await liveTypeOid(client, namespace);
          if (typeOid === undefined) throw new Error("Missing native hstore registration");
          liveTypeOids.push(typeOid);

          // A new backend uses the registered scalar and array callbacks through supported native syntax.
          const native = new pg.Client({ connectionString: url });
          await native.connect();
          try {
            const schema = quote(namespace);
            const key = `quote"'\\é`;
            const container = `"a"=>"1", "b"=>"2", "${escapeHstore(key)}"=>"3"`;
            const result = await native.query(
              `SELECT ($1::${schema}.hstore)['a'] AS present,($1::${schema}.hstore)['missing'] AS missing,
              ($1::${schema}.hstore)[$2::text] AS parameterized,
              (((ARRAY[$1::${schema}.hstore,NULL])[1])['b']) AS element,
              ((ARRAY[$1::${schema}.hstore,NULL])[2]) IS NULL AS "nullElement"`,
              [container, key],
            );
            expect(result.rows).toEqual([
              { present: "1", missing: null, parameterized: "3", element: "2", nullElement: true },
            ]);
          } finally {
            await native.end();
          }
        } finally {
          await client.end();
        }
      });
    }
    expect(liveTypeOids).toHaveLength(2);
    expect(liveTypeOids[0]).not.toBe(liveTypeOids[1]);
    expect(artifacts[0]?.contract).toEqual(artifacts[1]?.contract);
    expect(artifacts[0]?.digest).toBe(artifacts[1]?.digest);
  },
);

test.skipIf(!process.env.LOOM_TEST_DATABASE_URL)(
  "an explicit subscripting pin verifies a healthy installation while historical pins remain manifest-only",
  async () => {
    await withExtensionDatabase(async (url) => {
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      const namespace = 'Pin "Subscript"';
      try {
        await install(client, namespace);
        const manifest = await captureExtensionContract(client, {
          name: "hstore",
          provider,
          fixture: "disposable-subscript-pin",
        });
        const subscripting = await captureExtensionSubscript(client, manifest, {
          provider,
          fixture: "disposable-subscript-pin",
        });
        const historical = { schema: namespace, manifest };
        await verifyExtensionApiContracts(client, [historical]);
        await verifyExtensionApiContracts(client, [{ ...historical, subscripting }]);
        await assert.rejects(
          verifyExtensionApiContracts(client, [{ ...historical, schema: "wrong_schema", subscripting }]),
          /namespace/,
        );
        // A pin whose digest no longer matches its own relationship is corrupt and refused before native verification.
        const different = { ...subscripting, digest: "0".repeat(64) };
        await assert.rejects(
          verifyExtensionApiContracts(client, [{ ...historical, subscripting: different }]),
          /digest/,
        );
        await verifyExtensionApiContracts(client, [{ ...historical, subscripting }]);
      } finally {
        await client.end();
      }
    });
  },
);

test.skipIf(!process.env.LOOM_TEST_DATABASE_URL)(
  "actual pointer, membership and cardinality drift is refused, with provider denials observed instead of assumed",
  async () => {
    await withExtensionDatabase(async (url) => {
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      const namespace = 'Drift "Subscript"';
      const schema = quote(namespace);
      try {
        await install(client, namespace);
        const manifest = await captureExtensionContract(client, {
          name: "hstore",
          provider,
          fixture: "disposable-subscript-drift",
        });
        const options = { provider, fixture: "disposable-subscript-drift" };
        const baseline = await captureExtensionSubscript(client, manifest, options);
        const pointers = await observePointers(client, namespace);
        const requirement = { schema: namespace, manifest, subscripting: baseline };
        const historical = { schema: namespace, manifest };
        const refused = async (pattern: RegExp) => {
          await assert.rejects(captureExtensionSubscript(client, manifest, options), pattern);
          // Membership detachment also changes the base manifest, which the existing checkpoint reports first.
          await assert.rejects(verifyExtensionApiContracts(client, [requirement]), /ubscript|SQL contract mismatch/i);
        };
        const restored = async () => {
          expect(await observePointers(client, namespace)).toEqual(pointers);
          expect((await captureExtensionSubscript(client, manifest, options)).digest).toBe(baseline.digest);
          await verifyExtensionApiContracts(client, [requirement]);
        };

        // Legal on both providers: an extra extension-owned type must not disappear behind a name filter.
        await client.query("BEGIN");
        try {
          await client.query(`CREATE TYPE ${schema}.subscript_owner_noise AS ENUM ('noise')`);
          await client.query(`ALTER EXTENSION hstore ADD TYPE ${schema}.subscript_owner_noise`);
          await assert.rejects(captureExtensionSubscript(client, manifest, options), /four/);
        } finally {
          await client.query("ROLLBACK");
        }
        await restored();

        const superuser = await isSuperuser(client);
        const denied = async (statement: string) => {
          await client.query("SAVEPOINT provider_denial");
          try {
            await assert.rejects(client.query(statement), { code: "42501" });
          } finally {
            await client.query("ROLLBACK TO SAVEPOINT provider_denial");
          }
        };
        const noneStatement = `ALTER TYPE ${schema}.hstore SET (SUBSCRIPT = NONE)`;
        const detachStatement = `ALTER EXTENSION hstore DROP FUNCTION ${schema}.hstore_subscript_handler(pg_catalog.internal)`;
        if (!superuser) {
          // Neon owns the installed objects: observe the actual denials; never report these mutations as executed.
          await client.query("BEGIN");
          try {
            await denied(noneStatement);
            await denied(detachStatement);
          } finally {
            await client.query("ROLLBACK");
          }
          await restored();
          return;
        }

        // Local superuser fixture only. No subscripting expression is evaluated while a pointer is substituted.
        const source = await client.query<{ probin: string; prosrc: string }>(
          `SELECT p.probin,p.prosrc FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
           WHERE n.nspname=$1 AND p.proname='hstore_subscript_handler'`,
          [namespace],
        );
        const copied = source.rows[0];
        if (!copied) throw new Error("Missing native hstore handler source");
        const mutations: [string[], RegExp][] = [
          [[noneStatement], /handler relationship/],
          [
            [`ALTER TYPE ${schema}.hstore SET (SUBSCRIPT = pg_catalog.jsonb_subscript_handler)`],
            /handler relationship/,
          ],
          [
            [
              "CREATE SCHEMA subscript_foreign",
              `CREATE FUNCTION subscript_foreign.hstore_subscript_handler(internal) RETURNS internal LANGUAGE c STRICT IMMUTABLE
               AS ${client.escapeLiteral(copied.probin)},${client.escapeLiteral(copied.prosrc)}`,
              `ALTER TYPE ${schema}.hstore SET (SUBSCRIPT = subscript_foreign.hstore_subscript_handler)`,
            ],
            /foreign|cross-schema/,
          ],
          [[detachStatement], /foreign|cross-schema/],
        ];
        for (const [statements, pattern] of mutations) {
          await client.query("BEGIN");
          try {
            for (const statement of statements) await client.query(statement);
            await refused(pattern);
          } finally {
            await client.query("ROLLBACK");
          }
          await restored();
        }

        // The historical manifest-only checkpoint cannot see a pointer change; the explicit pin can.
        await client.query("BEGIN");
        try {
          await client.query(noneStatement);
          await verifyExtensionApiContracts(client, [historical]);
          await assert.rejects(verifyExtensionApiContracts(client, [requirement]), /ubscripting/);
        } finally {
          await client.query("ROLLBACK");
        }
        await restored();
      } finally {
        await client.end();
      }
    });
  },
);
