import assert from "node:assert/strict";
import { defineRelations, sql, type SQL } from "drizzle-orm";
import pg from "pg";
import * as v from "valibot";
import type { ExtensionCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { createRdkit_4_8_0, rdkitKinds, type RdkitKind } from "../../../apps/loom/src/core/extensions/adapters/rdkit";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { withRdkit } from "../../../apps/loom/src/tooling/extensions/operations/rdkit";
import { rdkitManifest as manifest } from "../../../apps/loom/src/tooling/extensions/annotations/rdkit";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { withRdkitDatabase } from "../fixtures/rdkit-database";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import {
  quoteRdkitIdentifier as quote,
  rdkitNativeCases,
  rdkitPublicValue,
  type RdkitPublicValue,
  rdkitNativeSql,
  rdkitSeedSql,
  type RdkitSeed,
} from "../fixtures/rdkit-native-cases";
import {
  rdkitGraphProofCase,
  rdkitOrdinaryProofCase,
  rdkitSchemaProofCase,
  rdkitToolingProofCase,
} from "../fixtures/rdkit-proof-cases";

const schema = 'Chem"日本';
const descriptor = {
  name: "rdkit",
  version: "4.8.0",
  schema,
  apiSupport: { status: "verified", digest: manifest.digest },
} as const;
const install = `CREATE SCHEMA ${quote(schema)}; DROP EXTENSION rdkit; CREATE EXTENSION rdkit WITH SCHEMA ${quote(schema)} VERSION '4.8.0'`;
const members = new Map(manifest.contract.members.map((row) => [row.id, row]));
// pg_catalog.text renders float4/float8 with shortest-exact digits, so Number() equals the decoded wire value.

interface NativeFailure {
  readonly code: string;
  readonly message: string;
}
async function nativeError(work: () => Promise<object>): Promise<NativeFailure | undefined> {
  try {
    await work();
  } catch (cause) {
    const error = cause instanceof Error && cause.cause instanceof Error ? cause.cause : cause;
    assert(error instanceof Error);
    return { code: "code" in error ? String(error.code) : "unknown", message: error.message };
  }
  return undefined;
}

extensionProofTest(
  rdkitOrdinaryProofCase,
  async () => {
    await withRdkitDatabase(async (url) => {
      const api = createRdkit_4_8_0(descriptor);
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      const tables = defineSchema(() => ({}));
      const connection = await connectDatabase({
        connectionString: url,
        schema: tables,
        relations: defineRelations(tables.tables),
      });
      try {
        await client.query(install);
        await observeExtensionProofDatabase(url, rdkitOrdinaryProofCase.id, "rdkit");
        const seeds = new Map<RdkitSeed, string>();
        const seed = async (name: RdkitSeed) => {
          if (!seeds.has(name))
            seeds.set(name, (await client.query<{ value: string }>(rdkitSeedSql(schema, name))).rows[0]!.value);
          return seeds.get(name)!;
        };
        const calls = Object.entries({ ...api.sql.overloads, ...api.sql.casts });
        for (const entry of rdkitNativeCases(rdkitOrdinaryProofCase.claims.map((claim) => claim.member))) {
          const claim = rdkitOrdinaryProofCase.claims.find((row) => row.member === entry.id)!;
          await extensionProofWitness({ ...claim, schema }, async () => {
            const texts = await Promise.all(entry.arguments.map((argument) => seed(argument.seed)));
            const values = entry.arguments.map((argument, index) => rdkitPublicValue(argument.type, texts[index]!));
            const helper = calls.find(([id]) => id === entry.id)?.[1];
            assert(helper, `Missing public helper ${entry.id}`);
            // SAFETY: the values come from the captured argument types of this exact member identity.
            const call = helper as (...values: readonly (RdkitPublicValue | SQL)[]) => SQL;
            // SQL-language wrappers resolve unqualified cartridge functions; the transaction-local path makes them visible.
            const path = entry.searchPath
              ? sql.raw(`SET LOCAL search_path TO ${quote(schema)}, pg_catalog`)
              : undefined;
            const select = (expression: SQL, from = sql`(values (1)) as fixture(value)`) =>
              connection.transaction(async (db) => {
                if (path) await db.execute(path);
                return db.select({ value: expression }).from(from);
              });
            const aggregateType = entry.arguments[0]?.type;
            const aggregateSqlType =
              aggregateType &&
              sql.raw(
                `${aggregateType.namespace === "pg_catalog" ? "pg_catalog" : quote(schema)}.${quote(aggregateType.name)}`,
              );
            const aggregateValues =
              aggregateSqlType &&
              sql`(values (${texts[0]}::${aggregateSqlType}), (${texts[0]}::${aggregateSqlType})) as fixture(value)`;
            const adapter =
              entry.kind === "aggregate" && aggregateValues
                ? () => select(call(sql`fixture.value`), aggregateValues)
                : () => select(call(...values));
            const native = async (searchPath: boolean) => {
              await client.query("BEGIN");
              try {
                if (searchPath) await client.query(`SET LOCAL search_path TO ${quote(schema)}, pg_catalog`);
                return await client.query<{ value: string | null }>(rdkitNativeSql(schema, entry), texts);
              } finally {
                await client.query("ROLLBACK");
              }
            };
            if (entry.searchPath) {
              // Without the schema on search_path PostgreSQL and the public helper fail identically.
              const unqualified = await nativeError(() => native(false));
              assert.equal(unqualified?.code, "42883", entry.id);
              assert.deepEqual(
                await nativeError(() =>
                  connection.transaction((db) =>
                    db.select({ value: call(...values) }).from(sql`(values (1)) as fixture(value)`),
                  ),
                ),
                unqualified,
              );
            }
            const nativeFailure = await nativeError(() => native(entry.searchPath));
            if (entry.failure) {
              // Shell operators and out-of-aggregate transition calls: the public helper surfaces the same native error.
              assert(nativeFailure, `${entry.id} expected native ${entry.failure}`);
              assert.deepEqual(await nativeError(adapter), nativeFailure);
              return;
            }
            assert.equal(nativeFailure, undefined, `${entry.id}: ${nativeFailure?.message}`);
            const expected = rdkitPublicValue(entry.result, (await native(entry.searchPath)).rows[0]!.value);
            assert.deepEqual(
              (await adapter()).map((row) => row.value),
              [expected],
              entry.id,
            );
            const member = members.get(entry.id);
            if (entry.kind === "routine" && member?.kind === "routine" && member.strict && values.length) {
              const nulls = values.map((value, index) => (index === 0 ? null : value));
              assert.deepEqual(
                (await select(call(...nulls))).map((row) => row.value),
                [null],
                `${entry.id} strict NULL`,
              );
            }
          });
        }
      } finally {
        await connection.close();
        await client.end();
      }
    });
  },
  300_000,
);

type RdkitApi = ReturnType<typeof createRdkit_4_8_0>;
function column(kind: RdkitKind) {
  switch (kind) {
    case "mol":
      return "m";
    case "qmol":
      return "q";
    case "xqmol":
      return "x";
    case "reaction":
      return "r";
    case "bfp":
      return "b";
    case "sfp":
      return "f";
  }
}
function searchProbe(kind: RdkitKind, s: string) {
  switch (kind) {
    case "mol":
      return `m OPERATOR(${s}.@>) 'c1ccccc1'::${s}.mol`;
    case "qmol":
      return `q OPERATOR(${s}.<@) 'Oc1ccccc1'::${s}.mol`;
    case "reaction":
      return `r OPERATOR(${s}.@>) 'C=O>>CO'::${s}.reaction`;
    case "bfp":
      return `b OPERATOR(${s}.%) ${s}.morganbv_fp('Oc1ccccc1'::${s}.mol)`;
    case "sfp":
      return `f OPERATOR(${s}.%) ${s}.morgan_fp('Oc1ccccc1'::${s}.mol)`;
    case "xqmol":
      throw new Error("rdkit 4.8.0 declares no xqmol operator class");
  }
}
function publicField(api: RdkitApi, kind: RdkitKind, array: boolean) {
  const family = api[kind];
  return (array ? family.arrayField() : family.field()).metadata.extension;
}
/** Native text through the public family codec and back to its PostgreSQL parameter. */
function cycle<Value>(codec: ExtensionCodec<Value, Value>, text: string) {
  return v.parse(v.string(), codec.encode(codec.decode(text)));
}
function codecCycle(api: RdkitApi, kind: RdkitKind, array: boolean, text: string) {
  switch (kind) {
    case "mol":
      return array ? cycle(api.mol.arrayCodec, text) : cycle(api.mol.codec, text);
    case "qmol":
      return array ? cycle(api.qmol.arrayCodec, text) : cycle(api.qmol.codec, text);
    case "xqmol":
      return array ? cycle(api.xqmol.arrayCodec, text) : cycle(api.xqmol.codec, text);
    case "reaction":
      return array ? cycle(api.reaction.arrayCodec, text) : cycle(api.reaction.codec, text);
    case "bfp":
      return array ? cycle(api.bfp.arrayCodec, text) : cycle(api.bfp.codec, text);
    case "sfp":
      return array ? cycle(api.sfp.arrayCodec, text) : cycle(api.sfp.codec, text);
  }
}

extensionProofTest(
  rdkitSchemaProofCase,
  async () => {
    await withRdkitDatabase(async (url) => {
      const api = createRdkit_4_8_0(descriptor);
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      try {
        await client.query(install);
        await observeExtensionProofDatabase(url, rdkitSchemaProofCase.id, "rdkit");
        const s = quote(schema);
        await client.query(
          `CREATE TABLE chem (id int PRIMARY KEY, m ${s}.mol, q ${s}.qmol, r ${s}.reaction, b ${s}.bfp, f ${s}.sfp, ms ${s}.mol[], qs ${s}.qmol[], rs ${s}.reaction[], bs ${s}.bfp[], fs ${s}.sfp[], xs ${s}.xqmol[], x ${s}.xqmol)`,
        );
        await client.query(
          `INSERT INTO chem SELECT i, m, m::${s}.qmol, ('[C:1]=[O:2]>>[C:1][O:2]')::${s}.reaction, ${s}.morganbv_fp(m), ${s}.morgan_fp(m),
           '[-2:-1]={NULL,c1ccccc1}'::${s}.mol[] || ARRAY[m], ARRAY[m::${s}.qmol], ARRAY['C=O>>CO'::${s}.reaction], ARRAY[${s}.morganbv_fp(m)], ARRAY[${s}.morgan_fp(m)],
           ARRAY[${s}.mol_to_xqmol(m)], ${s}.mol_to_xqmol(m)
         FROM (SELECT i, ${s}.mol_from_smiles((ARRAY['Oc1ccccc1','c1ccccc1','CCO','CCN','c1ccncc1'])[i]::cstring) AS m FROM generate_series(1,5) i) fixture`,
        );
        for (const claim of rdkitSchemaProofCase.claims) {
          await extensionProofWitness({ ...claim, schema }, async () => {
            const member = members.get(claim.member);
            assert(member);
            if (member.kind === "type") {
              if (member.name === "_internal") {
                const shell = await client.query(
                  "SELECT t.typtype, t.typinput::text AS input, t.typoutput::text AS output FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname=$1 AND t.typname='_internal'",
                  [schema],
                );
                assert.deepEqual(shell.rows, [{ typtype: "p", input: "shell_in", output: "shell_out" }]);
                return;
              }
              const array = member.name.startsWith("_");
              const kind = rdkitKinds.find((name) => name === (array ? member.name.slice(1) : member.name));
              assert(kind, claim.member);
              assert.equal(publicField(api, kind, array)?.member, claim.member);
              const rows = (
                await client.query<{ value: string }>(
                  `SELECT ${column(kind)}${array ? "s" : ""}::text AS value FROM chem ORDER BY id`,
                )
              ).rows;
              for (const row of rows) {
                // Scalar codecs pass native text through exactly; array codecs also spell default bounds ([1:1]=).
                const parameter = codecCycle(api, kind, array, row.value);
                if (!array) assert.equal(parameter, row.value, claim.member);
                // xqmol output is not a native fixed point on first re-parse, so compare native re-parses only.
                const reparse = async (text: string): Promise<string | undefined> =>
                  (
                    await client.query<{ value: string }>(
                      `SELECT ($1::${s}.${quote(kind)}${array ? "[]" : ""})::text AS value`,
                      [text],
                    )
                  ).rows[0]?.value;
                assert.equal(await reparse(parameter), await reparse(row.value), claim.member);
              }
              return;
            }
            assert(member.kind === "opclass");
            const index = Object.entries(api.indexes).find(([name]) => `${name}_ops` === member.name)?.[1];
            assert.equal(index?.().member, claim.member);
            const kind = rdkitKinds.find((name) => name === member.input.name);
            assert(kind, claim.member);
            const target = column(kind);
            const create = `CREATE INDEX probe ON chem USING ${member.accessMethod} (${target} ${s}.${quote(member.name)})`;
            if (member.accessMethod === "hash") {
              // Upstream registers hashvarlena(internal) with internal left/right types, so PostgreSQL 18 finds no
              // support function 1 for the column type and refuses every hash index on these classes.
              assert.deepEqual(await nativeError(() => client.query(create)), {
                code: "XX000",
                message: 'missing support function 1 for attribute 1 of index "probe"',
              });
              return;
            }
            await client.query(create);
            const predicate =
              member.accessMethod === "btree"
                ? `${target} OPERATOR(${s}.=) (SELECT ${target} FROM chem WHERE id=1)`
                : searchProbe(kind, s);
            await client.query("SET enable_seqscan=on; SET enable_indexscan=off; SET enable_bitmapscan=off");
            const sequential = (await client.query(`SELECT id FROM chem WHERE ${predicate} ORDER BY id`)).rows;
            await client.query("SET enable_seqscan=off; SET enable_indexscan=on; SET enable_bitmapscan=on");
            const plan = (await client.query(`EXPLAIN (FORMAT JSON) SELECT id FROM chem WHERE ${predicate}`)).rows[0]![
              "QUERY PLAN"
            ];
            assert.match(JSON.stringify(plan), /"Index Name":"probe"/, claim.member);
            const indexed = (await client.query(`SELECT id FROM chem WHERE ${predicate} ORDER BY id`)).rows;
            assert.deepEqual(indexed, sequential, claim.member);
            assert(sequential.length > 0, claim.member);
            await client.query(
              "RESET enable_seqscan; RESET enable_indexscan; RESET enable_bitmapscan; DROP INDEX probe",
            );
          });
        }
      } finally {
        await client.end();
      }
    });
  },
  300_000,
);

extensionProofTest(
  rdkitGraphProofCase,
  async () => {
    await withRdkitDatabase(async (url) => {
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      try {
        await client.query(install);
        await observeExtensionProofDatabase(url, rdkitGraphProofCase.id, "rdkit");
        const [claim] = rdkitGraphProofCase.claims;
        await extensionProofWitness({ ...claim!, schema }, async () => {
          const s = quote(schema);
          const proc = `'${s.replaceAll("'", "''")}.gbfp_sortsupport(internal)'::regprocedure`;
          const owners = await client.query(
            `SELECT 'amproc' FROM pg_catalog.pg_amproc WHERE amproc=${proc}
           UNION ALL SELECT 'aggregate' FROM pg_catalog.pg_aggregate WHERE ${proc} IN (aggtransfn, aggfinalfn, aggcombinefn, aggserialfn, aggdeserialfn, aggmtransfn, aggminvtransfn, aggmfinalfn)
           UNION ALL SELECT 'type' FROM pg_catalog.pg_type WHERE ${proc} IN (typinput, typoutput, typreceive, typsend, typmodin, typmodout, typanalyze, typsubscript)
           UNION ALL SELECT 'operator' FROM pg_catalog.pg_operator WHERE ${proc} IN (oprcode, oprrest, oprjoin)
           UNION ALL SELECT 'support' FROM pg_catalog.pg_proc WHERE prosupport=${proc}
           UNION ALL SELECT 'cast' FROM pg_catalog.pg_cast WHERE castfunc=${proc}`,
          );
          assert.deepEqual(owners.rows, []);
          const extension = await client.query(
            `SELECT 1 FROM pg_catalog.pg_depend d JOIN pg_catalog.pg_extension e ON e.oid=d.refobjid WHERE e.extname='rdkit' AND d.objid=${proc} AND d.deptype='e'`,
          );
          assert.equal(extension.rowCount, 1);
          const slots = await client.query<{ family: string; numbers: number[] }>(
            `SELECT f.opfname AS family, pg_catalog.array_agg(p.amprocnum ORDER BY p.amprocnum)::int[] AS numbers
           FROM pg_catalog.pg_opfamily f JOIN pg_catalog.pg_amproc p ON p.amprocfamily=f.oid
           WHERE f.opfnamespace=${`'${s.replaceAll("'", "''")}'::regnamespace`} AND f.opfname IN ('gist_bfp_ops','gist_mol_ops') GROUP BY 1 ORDER BY 1`,
          );
          // Upstream defaults: RDK_PGSQL_MOL_GIST_SORTSUPPORT=ON attaches slot 11; RDK_PGSQL_BFP_GIST_SORTSUPPORT=OFF does not.
          assert.deepEqual(slots.rows, [
            { family: "gist_bfp_ops", numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
            { family: "gist_mol_ops", numbers: [1, 2, 3, 4, 5, 6, 7, 11] },
          ]);
        });
      } finally {
        await client.end();
      }
    });
  },
  120_000,
);

extensionProofTest(
  rdkitToolingProofCase,
  async () => {
    await withRdkitDatabase(async (url) => {
      const api = createRdkit_4_8_0(descriptor);
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      try {
        await client.query(install);
        await observeExtensionProofDatabase(url, rdkitToolingProofCase.id, "rdkit");
        const s = quote(schema);
        await client.query(
          `CREATE TABLE reactions (r ${s}.reaction); INSERT INTO reactions VALUES ('[C:1](=[O:2])O>>[C:1](=[O:2])N'), ('CC>>CO')`,
        );
        const [claim] = rdkitToolingProofCase.claims;
        await extensionProofWitness({ ...claim!, schema }, async () => {
          const id = claim!.member;
          assert.equal(Object.hasOwn(api.sql.overloads, id), false);
          assert.deepEqual(api.reactionSubstructMatch, { member: id, authority: "operator" });
          const search = `SELECT r::text AS value FROM ${s}.has_reaction_substructmatch('C(=O)O>>C(=O)N', 'public.reactions', 'r') AS r`;
          // Unqualified ?> in the PL/pgSQL body fails unless the cartridge schema is on search_path.
          assert.equal((await nativeError(() => client.query(search)))?.code, "42883");
          await client.query(`SET search_path TO ${s}, public`);
          const native = (await client.query<{ value: string }>(search)).rows.map((row) => ({
            kind: "reaction",
            text: row.value,
          }));
          // The native function leaves session planner settings changed on the caller's backend.
          assert.equal((await client.query("SELECT current_setting('enable_seqscan') AS value")).rows[0]!.value, "off");
          await client.query(
            "RESET search_path; RESET enable_seqscan; RESET enable_indexscan; RESET enable_bitmapscan",
          );
          const result = await withRdkit(url, descriptor, (session) =>
            session.hasReactionSubstructMatch("C(=O)O>>C(=O)N", "public.reactions", "r"),
          );
          assert.equal(result.completion, "committed");
          assert.deepEqual(result.value, native);
          assert(native.length > 0);
        });
      } finally {
        await client.end();
      }
    });
  },
  120_000,
);
