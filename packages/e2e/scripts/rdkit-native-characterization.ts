import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import pg from "pg";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/rdkit.json";
import { rdkitAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/rdkit";
import {
  quoteRdkitIdentifier,
  rdkitNativeCases,
  rdkitNativeSql,
  rdkitSeedSql,
  type RdkitSeed,
} from "../fixtures/rdkit-native-cases";

// Disposable local oracle built from packages/e2e/scripts/rdkit-native.Dockerfile. Never a provider receipt.
const url = process.env.RDKIT_PROOF_URL;
if (!url || !["127.0.0.1", "localhost", "[::1]"].includes(new URL(url).hostname))
  throw new Error("A disposable local rdkit oracle URL is required");
const output = process.env.RDKIT_PROOF_OUTPUT;
if (!output) throw new Error("RDKIT_PROOF_OUTPUT must name a scratch evidence file");
const schema = 'Chem"日本';
const s = quoteRdkitIdentifier(schema);
const database = `loom_rdkit_${crypto.randomUUID().replaceAll("-", "")}`;
const admin = new pg.Client({ connectionString: url });
await admin.connect();
await admin.query(`CREATE DATABASE ${quoteRdkitIdentifier(database)}`);
const target = new URL(url);
target.pathname = `/${database}`;
const client = new pg.Client({ connectionString: target.href });
const normalize = (value: string) =>
  value.replaceAll(`${s}.`, "$extension:rdkit.").replaceAll(`${schema}.`, "$extension:rdkit.");
try {
  await client.connect();
  await client.query(`CREATE SCHEMA ${s}; CREATE EXTENSION rdkit WITH SCHEMA ${s} VERSION '4.8.0'`);
  const captured = await captureExtensionContract(client, {
    name: "rdkit",
    provider: "neon",
    fixture: "local-exact-primary-source-oracle",
  });
  const identity = (
    await client.query(
      `SELECT ${s}.rdkit_version() AS cartridge, ${s}.rdkit_toolkit_version() AS toolkit, pg_catalog.version() AS server, (SELECT extversion FROM pg_catalog.pg_extension WHERE extname='rdkit') AS installed`,
    )
  ).rows[0];

  const seeds = new Map<RdkitSeed, string>();
  async function seed(name: RdkitSeed) {
    if (!seeds.has(name))
      seeds.set(name, (await client.query<{ value: string }>(rdkitSeedSql(schema, name))).rows[0]!.value);
    return seeds.get(name)!;
  }
  const queryIds = rdkitAnnotations.filter((row) => row.disposition === "query").map((row) => row.id);
  const query: { id: string; status: string; value?: string | null; error?: { code: string; message: string } }[] = [];
  await client.query("BEGIN");
  for (const entry of rdkitNativeCases(queryIds)) {
    const values = await Promise.all(entry.arguments.map((argument) => seed(argument.seed)));
    await client.query("SAVEPOINT member_proof");
    try {
      const row = (await client.query<{ value: string | null }>(rdkitNativeSql(schema, entry), values)).rows[0]!;
      query.push({ id: entry.id, status: "observed", value: row.value });
    } catch (cause) {
      if (!(cause instanceof Error)) throw cause;
      query.push({
        id: entry.id,
        status: "native-error",
        error: { code: "code" in cause ? String(cause.code) : "unknown", message: cause.message },
      });
    } finally {
      await client.query("ROLLBACK TO SAVEPOINT member_proof");
    }
  }
  await client.query("ROLLBACK");

  // Every catalog slot that can own a routine. An empty list is the native proof of an unattached function.
  const references = (
    await client.query<{ routine: string; owner: string }>(
      `WITH members AS (
         SELECT d.objid AS oid FROM pg_catalog.pg_depend d JOIN pg_catalog.pg_extension e ON e.oid=d.refobjid
         WHERE e.extname='rdkit' AND d.classid='pg_catalog.pg_proc'::regclass AND d.deptype='e'),
       slots(oid, owner) AS (
         SELECT t.typinput::oid, 'type-input:'||t.oid::regtype FROM pg_catalog.pg_type t UNION ALL
         SELECT t.typoutput::oid, 'type-output:'||t.oid::regtype FROM pg_catalog.pg_type t UNION ALL
         SELECT t.typreceive::oid, 'type-receive:'||t.oid::regtype FROM pg_catalog.pg_type t UNION ALL
         SELECT t.typsend::oid, 'type-send:'||t.oid::regtype FROM pg_catalog.pg_type t UNION ALL
         SELECT t.typmodin::oid, 'type-typmodin:'||t.oid::regtype FROM pg_catalog.pg_type t UNION ALL
         SELECT t.typmodout::oid, 'type-typmodout:'||t.oid::regtype FROM pg_catalog.pg_type t UNION ALL
         SELECT t.typanalyze::oid, 'type-analyze:'||t.oid::regtype FROM pg_catalog.pg_type t UNION ALL
         SELECT t.typsubscript::oid, 'type-subscript:'||t.oid::regtype FROM pg_catalog.pg_type t UNION ALL
         SELECT a.aggtransfn::oid, 'aggregate-transition:'||a.aggfnoid::regprocedure FROM pg_catalog.pg_aggregate a UNION ALL
         SELECT a.aggfinalfn::oid, 'aggregate-final:'||a.aggfnoid::regprocedure FROM pg_catalog.pg_aggregate a UNION ALL
         SELECT a.aggcombinefn::oid, 'aggregate-combine:'||a.aggfnoid::regprocedure FROM pg_catalog.pg_aggregate a UNION ALL
         SELECT a.aggserialfn::oid, 'aggregate-serial:'||a.aggfnoid::regprocedure FROM pg_catalog.pg_aggregate a UNION ALL
         SELECT a.aggdeserialfn::oid, 'aggregate-deserial:'||a.aggfnoid::regprocedure FROM pg_catalog.pg_aggregate a UNION ALL
         SELECT a.aggmtransfn::oid, 'aggregate-moving-transition:'||a.aggfnoid::regprocedure FROM pg_catalog.pg_aggregate a UNION ALL
         SELECT a.aggminvtransfn::oid, 'aggregate-moving-inverse:'||a.aggfnoid::regprocedure FROM pg_catalog.pg_aggregate a UNION ALL
         SELECT a.aggmfinalfn::oid, 'aggregate-moving-final:'||a.aggfnoid::regprocedure FROM pg_catalog.pg_aggregate a UNION ALL
         SELECT p.amproc::oid, 'amproc:'||f.opfname||'/'||m.amname||':'||p.amprocnum FROM pg_catalog.pg_amproc p JOIN pg_catalog.pg_opfamily f ON f.oid=p.amprocfamily JOIN pg_catalog.pg_am m ON m.oid=f.opfmethod UNION ALL
         SELECT o.oprcode::oid, 'operator-code:'||o.oid::regoperator FROM pg_catalog.pg_operator o UNION ALL
         SELECT o.oprrest::oid, 'operator-restrict:'||o.oid::regoperator FROM pg_catalog.pg_operator o UNION ALL
         SELECT o.oprjoin::oid, 'operator-join:'||o.oid::regoperator FROM pg_catalog.pg_operator o UNION ALL
         SELECT p.prosupport::oid, 'planner-support:'||p.oid::regprocedure FROM pg_catalog.pg_proc p UNION ALL
         SELECT c.castfunc, 'cast:'||c.castsource::regtype||'->'||c.casttarget::regtype FROM pg_catalog.pg_cast c UNION ALL
         SELECT t.tgfoid, 'trigger:'||t.tgname FROM pg_catalog.pg_trigger t UNION ALL
         SELECT a.amhandler::oid, 'access-method:'||a.amname FROM pg_catalog.pg_am a)
       SELECT pn.nspname||'.'||p.proname||'('||COALESCE((SELECT pg_catalog.string_agg(tn.nspname||'.'||ty.typname, ',' ORDER BY a.ordinality)
           FROM unnest(p.proargtypes) WITH ORDINALITY a(type, ordinality) JOIN pg_catalog.pg_type ty ON ty.oid=a.type
           JOIN pg_catalog.pg_namespace tn ON tn.oid=ty.typnamespace), '')||')' AS routine, COALESCE(sl.owner, '') AS owner
       FROM members m JOIN pg_catalog.pg_proc p ON p.oid=m.oid JOIN pg_catalog.pg_namespace pn ON pn.oid=p.pronamespace
       LEFT JOIN slots sl ON sl.oid=m.oid ORDER BY 1, 2`,
    )
  ).rows;
  const graph = new Map<string, string[]>();
  for (const row of references) {
    const owners = graph.get(normalize(row.routine)) ?? [];
    if (row.owner) owners.push(normalize(row.owner));
    graph.set(normalize(row.routine), owners);
  }
  const families = (
    await client.query<{ family: string; method: string; procedures: string[] }>(
      `SELECT f.opfname AS family, m.amname AS method,
         pg_catalog.array_agg(p.amprocnum||':'||p.amproc::regprocedure::text ORDER BY p.amprocnum) AS procedures
       FROM pg_catalog.pg_opfamily f JOIN pg_catalog.pg_am m ON m.oid=f.opfmethod
       JOIN pg_catalog.pg_namespace n ON n.oid=f.opfnamespace LEFT JOIN pg_catalog.pg_amproc p ON p.amprocfamily=f.oid
       WHERE n.nspname=$1 AND m.amname='gist' GROUP BY 1, 2 ORDER BY 1`,
      [schema],
    )
  ).rows.map((row) => ({ ...row, procedures: row.procedures.map(normalize) }));
  const shell = (
    await client.query<{ operator: string; code: string; negator: string }>(
      `SELECT o.oid::regoperator::text AS operator, o.oprcode::text AS code, o.oprnegate::regoperator::text AS negator
       FROM pg_catalog.pg_operator o JOIN pg_catalog.pg_namespace n ON n.oid=o.oprnamespace
       WHERE n.nspname=$1 AND o.oprcode=0`,
      [schema],
    )
  ).rows.map((row) => ({ operator: normalize(row.operator), code: row.code, negator: normalize(row.negator) }));

  // has_reaction_substructmatch: native session-level SETs survive the call on the same backend.
  await client.query(
    `CREATE TABLE public.reactions (r ${s}.reaction); INSERT INTO public.reactions VALUES ('[C:1](=[O:2])O>>[C:1](=[O:2])N'), ('CC>>CO')`,
  );
  const settings = async () =>
    (
      await client.query<{ seq: string; idx: string; bitmap: string }>(
        "SELECT current_setting('enable_seqscan') AS seq, current_setting('enable_indexscan') AS idx, current_setting('enable_bitmapscan') AS bitmap",
      )
    ).rows[0];
  const search = `SELECT r::text AS value FROM ${s}.has_reaction_substructmatch('C(=O)O>>C(=O)N', 'public.reactions', 'r') AS r`;
  // The PL/pgSQL body uses unqualified ?> and @>, so it only resolves when the cartridge schema is on search_path.
  let unqualified: { code: string; message: string } | undefined;
  await client.query("BEGIN");
  try {
    await client.query(search);
  } catch (cause) {
    if (!(cause instanceof Error)) throw cause;
    unqualified = { code: "code" in cause ? String(cause.code) : "unknown", message: cause.message };
  }
  await client.query("ROLLBACK");
  await client.query(`SET search_path TO ${s}, public`);
  const before = await settings();
  const reactionRows = (await client.query<{ value: string }>(search)).rows.map((row) => row.value);
  const after = await settings();
  await client.query("RESET enable_seqscan; RESET enable_indexscan; RESET enable_bitmapscan");
  await client.query("BEGIN");
  await client.query(search);
  await client.query("ROLLBACK");
  const afterRollback = await settings();
  await client.query("RESET search_path");
  const internalIds = rdkitAnnotations.filter((row) => row.disposition === "internal").map((row) => row.id);
  const report = {
    extension: "rdkit",
    version: "4.8.0",
    oracle: {
      recipe: "packages/e2e/scripts/rdkit-native.Dockerfile",
      source: "https://github.com/rdkit/rdkit/archive/refs/tags/Release_2025_09_1.tar.gz",
      sourceSha256: "7fb3510b69af358009e2d0763c1d9665ac34f4c2cd3314cf5210ee3d5a33d501",
      identity,
    },
    manifestDigest: manifest.digest,
    capturedDigest: captured.digest,
    exactManifestIdentity: captured.digest === manifest.digest,
    query,
    observed: query.filter((row) => row.status === "observed").length,
    nativeErrors: query.filter((row) => row.status === "native-error"),
    callbackGraph: Object.fromEntries(
      internalIds.filter((id) => id.startsWith("routine:")).map((id) => [id, graph.get(id.slice(8)) ?? null]),
    ),
    gistFamilies: families,
    shellOperators: shell,
    reactionSearch: { unqualified, rows: reactionRows, before, after, afterRollback },
    digest: createHash("sha256").update(JSON.stringify(query)).digest("hex"),
    providerAcceptance: "pending",
    publicExportAcceptance: "pending",
  };
  await writeFile(output, JSON.stringify(report, null, 2) + "\n");
  console.log(
    JSON.stringify({
      exactManifestIdentity: report.exactManifestIdentity,
      identity,
      queryMembers: query.length,
      observed: report.observed,
      nativeErrors: report.nativeErrors.map((row) => row.id),
      unownedCallbacks: Object.entries(report.callbackGraph)
        .filter(([, owners]) => !owners?.length)
        .map(([id]) => id),
      shellOperators: shell,
      reactionSearch: report.reactionSearch,
    }),
  );
  if (!report.exactManifestIdentity) process.exitCode = 1;
} finally {
  await client.end();
  await admin.query(`DROP DATABASE IF EXISTS ${quoteRdkitIdentifier(database)} WITH (FORCE)`);
  await admin.end();
}
