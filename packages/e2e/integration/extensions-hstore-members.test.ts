import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";
import { sql, defineRelations } from "drizzle-orm";
import expected from "../../../apps/loom/src/tooling/extensions/manifests/hstore.json";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import { captureExtensionSubscript } from "../../../apps/loom/src/tooling/extensions/subscript-capture";
import { createHstore_1_8 } from "../../../apps/loom/src/core/extensions/adapters/hstore";
import { extensionIndexOpclass } from "../../../apps/loom/src/core/extensions/fields";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import {
  hstoreGraphProofCase,
  hstoreGraphMembers,
  hstoreProofFamily,
  hstoreScenario,
} from "../fixtures/hstore-proof-cases";
import { withNativeHstore, hstoreSchema, hstoreType, hstoreFunction } from "../fixtures/hstore-codec";
import { recordHstoreRole } from "../fixtures/hstore-roles";

extensionProofTest(
  hstoreGraphProofCase,
  async () => {
    await withNativeHstore(async (admin, url) => {
      const live = await captureExtensionContract(admin, {
        name: "hstore",
        provider: "neon",
        fixture: "hstore-family-native-graph",
      });
      // Provider label identifies the expected contract; actual provider/profile acceptance belongs to the parent.
      assert.equal(live.digest, expected.digest);
      assert.deepEqual(live.contract, expected.contract);
      const supplement = await captureExtensionSubscript(admin, live, {
        provider: "neon",
        fixture: "hstore-family-native-graph",
      });
      assert.deepEqual(supplement.contract.types, [
        {
          id: "type:$extension:hstore._ghstore",
          handler: "routine:pg_catalog.array_subscript_handler(pg_catalog.internal)",
        },
        {
          id: "type:$extension:hstore._hstore",
          handler: "routine:pg_catalog.array_subscript_handler(pg_catalog.internal)",
        },
        { id: "type:$extension:hstore.ghstore", handler: null },
        {
          id: "type:$extension:hstore.hstore",
          handler: "routine:$extension:hstore.hstore_subscript_handler(pg_catalog.internal)",
        },
      ]);
      await observeExtensionProofDatabase(url, hstoreGraphProofCase.id, "hstore");
      const api = createHstore_1_8({
        name: "hstore",
        version: "1.8",
        schema: hstoreSchema,
        apiSupport: { status: "verified", digest: expected.digest },
      });
      const schema = defineSchema(() => ({ mappings: { scalar: api.field(), matrix: api.arrayField() } }), {
        namespace: "app",
      });
      await admin.query(
        `CREATE SCHEMA app; CREATE TABLE app.mappings (_id uuid NOT NULL, "_createdAt" bigint NOT NULL, scalar ${hstoreType}, matrix ${hstoreType}[])`,
      );
      await admin.query(
        `INSERT INTO app.mappings SELECT gen_random_uuid(),42,${hstoreFunction("hstore")}('key',g::text),ARRAY[${hstoreFunction("hstore")}('key',g::text),NULL] FROM generate_series(1,4096) g`,
      );
      const role = `loom_hstore_${randomUUID().replaceAll("-", "")}`;
      recordHstoreRole(role);
      const address = new URL(url);
      address.username = role;
      address.password = randomBytes(32).toString("hex");
      let restricted: pg.Client | undefined;
      let connection: Awaited<ReturnType<typeof connectDatabase>> | undefined;
      try {
        await admin.query(
          `CREATE ROLE ${pg.escapeIdentifier(role)} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD '${address.password}'`,
        );
        await admin.query(
          `GRANT USAGE ON SCHEMA app,${pg.escapeIdentifier(hstoreSchema)} TO ${pg.escapeIdentifier(role)}; GRANT SELECT,UPDATE ON app.mappings TO ${pg.escapeIdentifier(role)}`,
        );
        restricted = new pg.Client({ connectionString: address.href });
        await restricted.connect();
        assert.deepEqual(
          (
            await restricted.query(
              "SELECT rolcanlogin,rolsuper,rolcreatedb,rolcreaterole,rolreplication,rolbypassrls FROM pg_roles WHERE rolname=current_user",
            )
          ).rows,
          [
            {
              rolcanlogin: true,
              rolsuper: false,
              rolcreatedb: false,
              rolcreaterole: false,
              rolreplication: false,
              rolbypassrls: false,
            },
          ],
        );
        const db = await connectDatabase({
          schema,
          relations: defineRelations(schema.tables),
          connectionString: address.href,
        });
        connection = db;
        async function witness(member: string, assertion: () => Promise<void>) {
          await extensionProofWitness(
            { family: hstoreProofFamily, member, scenario: hstoreScenario(member), schema: hstoreSchema },
            assertion,
          );
        }
        const witnessed = new Set<string>();
        for (const method of ["btree", "hash", "gin", "gist"] as const) {
          const contract = method === "gist" ? api.indexes.gist({ siglen: 32 }) : api.indexes[method]();
          await admin.query(
            `CREATE INDEX hstore_member_index ON app.mappings USING ${method} (scalar ${extensionIndexOpclass(contract)})`,
          );
          try {
            const family = live.contract.members.find(
              (member) => member.kind === "opfamily" && member.accessMethod === method,
            );
            assert(family?.kind === "opfamily");
            const relatives = hstoreGraphMembers.filter(
              (id) =>
                id.includes(`.${method}_hstore_ops`) ||
                family.procedures.some((slot) => `routine:${slot.procedure}` === id),
            );
            for (const member of relatives)
              await witness(member, async () => {
                assert(live.contract.members.some((entry) => entry.id === member));
                // Each exact subordinate slot is present in the captured family; each strategy executes through its own live operator.
                if (member.startsWith("function of access method:")) {
                  const number = Number(member.match(/function (\d+)/)?.[1]);
                  assert(family.procedures.some((slot) => slot.number === number));
                }
                if (member.startsWith("operator of access method:")) {
                  const strategy = Number(member.match(/operator (\d+)/)?.[1]);
                  assert(family.operators.some((slot) => slot.strategy === strategy));
                }
                for (const slot of family.operators) {
                  const operator = live.contract.members.find(
                    (entry) => entry.kind === "operator" && entry.id === `operator:${slot.operator}`,
                  );
                  assert(operator?.kind === "operator");
                  const right =
                    operator.right?.name === "text"
                      ? "$1::text"
                      : operator.right?.name === "_text"
                        ? "ARRAY[$1]::text[]"
                        : `${hstoreFunction("hstore")}('key',$1)`;
                  const argument = operator.right?.name === "text" || operator.right?.name === "_text" ? "key" : "2000";
                  const query = `SELECT _id::text FROM app.mappings WHERE scalar OPERATOR(${pg.escapeIdentifier(hstoreSchema)}.${operator.name}) ${right} ORDER BY _id`;
                  await restricted!.query(
                    "SET enable_seqscan=on; SET enable_indexscan=off; SET enable_bitmapscan=off; SET enable_indexonlyscan=off",
                  );
                  const oracle = await restricted!.query(query, [argument]);
                  await restricted!.query(
                    "SET enable_seqscan=off; SET enable_indexscan=on; SET enable_bitmapscan=on; SET enable_indexonlyscan=on",
                  );
                  const plan = await restricted!.query(`EXPLAIN (FORMAT JSON) ${query}`, [argument]);
                  assert(
                    JSON.stringify(plan.rows).includes("hstore_member_index"),
                    `${method} strategy ${slot.strategy} must use its index`,
                  );
                  assert.deepEqual((await restricted!.query(query, [argument])).rows, oracle.rows);
                }
                witnessed.add(member);
              });
          } finally {
            await admin.query("DROP INDEX app.hstore_member_index");
          }
        }
        for (const member of hstoreGraphMembers.filter((id) => !witnessed.has(id)))
          await witness(member, async () => {
            assert(live.contract.members.some((entry) => entry.id === member));
            if (member.includes("ghstore")) {
              // ghstore is backend GiST storage. Verify rejection and linkage without manufacturing an internal datum.
              const storage = live.contract.members.find(
                (entry) => entry.id === "opclass:$extension:hstore.gist_hstore_ops/gist",
              );
              assert(storage?.kind === "opclass" && storage.storage?.name === "ghstore");
              assert.equal(
                (await restricted!.query(`SELECT ARRAY[]::${pg.escapeIdentifier(hstoreSchema)}.ghstore[]::text value`))
                  .rows[0].value,
                "{}",
              );
              await assert.rejects(
                restricted!.query(`SELECT 'invented'::${pg.escapeIdentifier(hstoreSchema)}.ghstore`),
                (error: { code?: string }) => error.code === "0A000",
              );
            } else if (member.includes("hstore_subscript_handler")) {
              const scalar = schema.tables.mappings.scalar;
              const [row] = await db.transaction((query) =>
                query
                  .select({
                    actual: api.subscript.read(scalar, "key"),
                    missing: api.subscript.read(scalar, "missing"),
                    nullKey: api.subscript.read(scalar, null),
                  })
                  .from(schema.tables.mappings)
                  .limit(1),
              );
              assert(row && row.actual !== null && row.missing === null && row.nullKey === null);
              await db.transaction((query) =>
                query.execute(
                  sql`UPDATE ${schema.tables.mappings} SET ${api.subscript.target(scalar, "added")} = ${"NULL"}`,
                ),
              );
              assert.equal(
                (await restricted!.query("SELECT scalar['added'] value FROM app.mappings LIMIT 1")).rows[0].value,
                "NULL",
              );
              await db.transaction((query) =>
                query.execute(
                  sql`UPDATE ${schema.tables.mappings} SET ${api.subscript.target(scalar, "added")} = NULL`,
                ),
              );
              assert.deepEqual(
                (
                  await restricted!.query(
                    `SELECT scalar['added'] value,${hstoreFunction("exist")}(scalar,'added') present FROM app.mappings LIMIT 1`,
                  )
                ).rows,
                [{ value: null, present: true }],
              );
              await assert.rejects(
                restricted!.query("UPDATE app.mappings SET scalar[NULL::text]='invalid'"),
                (error: { code?: string }) => error.code === "22004",
              );
            } else {
              const rows = await db.transaction((query) =>
                query
                  .select({ scalar: schema.tables.mappings.scalar, matrix: schema.tables.mappings.matrix })
                  .from(schema.tables.mappings)
                  .limit(1),
              );
              assert(rows[0]?.scalar && rows[0].matrix?.dimensions[0]?.length === 2);
              const native = (
                await restricted!.query(
                  `SELECT ${hstoreFunction("hstore_send")}(scalar) bytes, scalar::text text, pg_catalog.array_send(matrix) array_bytes, matrix::text array_text FROM app.mappings LIMIT 1`,
                )
              ).rows[0];
              // Buffer-valued protocol parameter is sent in binary format and invokes native hstore_recv.
              assert.equal(
                (await restricted!.query(`SELECT $1::${hstoreType}::text value`, [native.bytes])).rows[0].value,
                native.text,
              );
              assert.equal(
                (await restricted!.query(`SELECT $1::${hstoreType}[]::text value`, [native.array_bytes])).rows[0].value,
                native.array_text,
              );
            }
          });
        // Internal-pointer and cstring callbacks are absent from the public query map.
        for (const member of hstoreGraphMembers) assert.equal(Object.hasOwn(api.sql.overloads, member), false);
        await admin.query(
          `REVOKE USAGE ON SCHEMA ${pg.escapeIdentifier(hstoreSchema)} FROM ${pg.escapeIdentifier(role)}`,
        );
        await assert.rejects(
          restricted.query(`SELECT ${hstoreFunction("fetchval")}($1::${hstoreType},'key')`, ['"key"=>"value"']),
          (error: { code?: string }) => error.code === "42501",
        );
      } finally {
        await connection?.close();
        await restricted?.end();
        if ((await admin.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rowCount)
          await admin.query(
            `GRANT ${pg.escapeIdentifier(role)} TO CURRENT_USER; DROP OWNED BY ${pg.escapeIdentifier(role)}; DROP ROLE ${pg.escapeIdentifier(role)}`,
          );
        assert.equal((await admin.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rowCount, 0);
      }
    });
  },
  180000,
);
