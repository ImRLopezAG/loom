import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { appendFile } from "node:fs/promises";
import { sql, type SQL } from "drizzle-orm";
import { pgSchema, type AnyPgColumnBuilder } from "drizzle-orm/pg-core";
import pg from "pg";
import * as v from "valibot";
import type { connectDatabase, defineSchema } from "../../../apps/loom/src/core/server/index";

type Reference = { namespace: string; name: string };
type Member = {
  id: string;
  kind: string;
  name: string;
  namespace?: string | null;
  arguments?: { type: Reference; hasDefault: boolean }[];
  returns?: Reference;
  left?: Reference | null;
  right?: Reference | null;
  strict?: boolean;
  publicExecute?: boolean;
  accessMethod?: string;
  input?: Reference | string;
  element?: Reference | null;
  handler?: string;
  output?: string;
  receive?: string;
  send?: string;
  typmodInput?: string;
  identity?: string;
  family?: string;
};
type Manifest = { digest: string; contract: { extension: string; version: string; members: Member[] } };
type NativeScalar = readonly number[] | { kind: "native-text"; text: string };
type NativeFloat = number | { readonly nonfinite: "NaN" | "Infinity" | "-Infinity" };
type NativeValue = NativeScalar | { center: NativeScalar | null; radius: NativeFloat | null };
type NativeArgument = NativeValue | number | string | null;
type NativeCodec = { encode(value: never): string; decode(value: string): NativeValue };
type NativeIndex = {
  method: string;
  opclass: string;
  type: string;
  member: string;
  schema: string;
  digest: string;
  input: { schema: string; type: string; dimensions: number };
};
type PublicServer = { connectDatabase: typeof connectDatabase; defineSchema: typeof defineSchema };
type NativePlan = { "Index Name"?: string | undefined; Plans?: NativePlan[] | undefined };
const planSchema: v.GenericSchema<NativePlan> = v.lazy(() =>
  v.looseObject({
    "Index Name": v.optional(v.string()),
    Plans: v.optional(v.array(planSchema)),
  }),
);
const vectorTypes = v.picklist(["vector", "halfvec", "rabitq4", "rabitq8"]);
const valueTypes = v.picklist([
  "vector",
  "halfvec",
  "rabitq4",
  "rabitq8",
  "sphere_vector",
  "sphere_halfvec",
  "sphere_rabitq4",
  "sphere_rabitq8",
]);
type Api = {
  name: string;
  version: string;
  schema: string;
  apiSupport: { digest?: string };
  companion: {
    name: "vector";
    version: "0.8.6";
    schema: string;
    apiSupport: { status: "verified"; digest: "4e6679e9277c11a3f26d1a920de5f4c1b5401f418c647402a9e611df4a6fb1e4" };
  };
  sql: { overloads: object };
  codecs: Record<string, NativeCodec>;
  field: Record<string, () => { build(name: string): AnyPgColumnBuilder }>;
  arrayField: Record<string, () => { build(name: string): AnyPgColumnBuilder }>;
  indexes: Record<
    "ann" | "annv0",
    Record<v.InferOutput<typeof vectorTypes>, Record<"l2" | "ip" | "cosine", () => NativeIndex>>
  >;
  settings: { probes(value: string): SQL; epsilon(value: string): SQL; prefilter(value: "on" | "off"): SQL };
};
export type LakebaseVectorNativeWitness = {
  member: string;
  scenario: string;
  disposition: "native-call" | "native-index" | "native-type-roundtrip" | "native-catalog-parent";
  status: "passed" | "failed";
  reason?: string;
  sqlstate?: string;
  parents?: string[];
};
const digest = "bfa194865eaeda1069f2743247af32e0609848bdee87f1565e17cefc231fec20";

export function lakebaseVectorCallableMembers(manifest: Manifest): Member[] {
  return manifest.contract.members.filter(
    (m) =>
      m.kind === "operator" ||
      (m.kind === "routine" &&
        !(m.arguments ?? []).some((a) => ["internal", "cstring", "_cstring"].includes(a.type.name)) &&
        !["cstring", "internal", "index_am_handler"].includes(m.returns?.name ?? "")),
  );
}

/** All ordinary calls use native-produced tokens. No hand-written quantization or fake witnesses. */
export async function runLakebaseVectorNative(
  api: Api,
  manifest: Manifest,
  connectionString: string,
  observed: Manifest,
  observedVector: Manifest,
  server: PublicServer,
) {
  // The caller supplies actual public packed kello/server functions; the import above is erased type evidence only.
  const { connectDatabase, defineSchema } = server;
  assert(connectionString, "Exact private parent fixture URL is mandatory; no DATABASE_URL fallback");
  assert.equal(manifest.digest, digest);
  assert.equal(manifest.contract.extension, "lakebase_vector");
  assert.equal(manifest.contract.version, "1.1.1");
  assert.equal(manifest.contract.members.length, 212);
  assert.equal(
    observed.digest,
    digest,
    "Caller must freshly capture the target's complete contract before native invocation",
  );
  assert.deepEqual(observed.contract, manifest.contract);
  assert.equal(api.apiSupport.digest, digest);
  assert.equal(api.version, "1.1.1");
  const callable = lakebaseVectorCallableMembers(manifest);
  assert.equal(callable.length, 64);
  assert.deepEqual(Object.keys(api.sql.overloads).sort(), callable.map((m) => m.id).sort());
  // SAFETY: Exact overload keys were compared with the manifest's 64 ordinary callable signatures above.
  const overloads = api.sql.overloads as Record<string, (...args: NativeArgument[]) => SQL>;
  const client = new pg.Client({ connectionString });
  const fixture = `lakebase_native_${randomUUID().replaceAll("-", "")}`;
  const privilegeRole = `${fixture}_role`;
  const q = pg.escapeIdentifier;
  const ext = q(api.schema);
  const vectorExt = q(api.companion.schema);
  const witnesses: LakebaseVectorNativeWitness[] = [];
  let connection: Awaited<ReturnType<typeof connectDatabase>> | undefined;
  let created = false;
  let roleCreated = false;
  let completed = false;
  const write = async (witness: LakebaseVectorNativeWitness) => {
    witnesses.push(witness);
    if (process.env.LOOM_LAKEBASE_VECTOR_NATIVE_OUTPUT)
      await appendFile(process.env.LOOM_LAKEBASE_VECTOR_NATIVE_OUTPUT, JSON.stringify(witness) + "\n", { mode: 0o600 });
  };
  const witness = async (
    member: string,
    scenario: string,
    disposition: LakebaseVectorNativeWitness["disposition"],
    run: () => Promise<void>,
    parents?: string[],
  ) => {
    try {
      await run();
      await write({ member, scenario, disposition, status: "passed", ...(parents && { parents }) });
    } catch (error) {
      // Failures remain failures; continue only to expose every member's actual disposition.
      const reason = error instanceof Error ? error.message : String(error);
      const parsed = v.safeParse(v.looseObject({ code: v.string() }), error);
      const sqlstate = parsed.success ? parsed.output.code : undefined;
      await write({
        member,
        scenario,
        disposition,
        status: "failed",
        reason: reason.replaceAll(connectionString, "[private fixture]"),
        ...(sqlstate && { sqlstate }),
        ...(parents && { parents }),
      });
    }
  };
  try {
    await client.connect();
    assert.equal(
      Math.floor(Number((await client.query("SHOW server_version_num")).rows[0].server_version_num) / 10000),
      18,
    );
    const installed = await client.query(
      "SELECT e.extname,e.extversion,n.nspname FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname IN ('lakebase_vector','vector')",
    );
    assert.equal(installed.rows.find((r) => r.extname === "lakebase_vector")?.extversion, "1.1.1");
    assert.equal(installed.rows.find((r) => r.extname === "lakebase_vector")?.nspname, api.schema);
    assert.equal(installed.rows.find((r) => r.extname === "vector")?.nspname, api.companion.schema);
    assert.equal(installed.rows.find((r) => r.extname === "vector")?.extversion, api.companion.version);
    assert.equal(observedVector.contract.extension, api.companion.name);
    assert.equal(observedVector.contract.version, api.companion.version);
    assert.equal(observedVector.digest, api.companion.apiSupport.digest);
    await client.query(`CREATE ROLE ${q(privilegeRole)} NOLOGIN`);
    roleCreated = true;
    const types = ["vector", "halfvec", "rabitq4", "rabitq8"];
    const texts = {
      vector: "[3,1,2]",
      halfvec: "[3,1,2]",
      rabitq4: "",
      rabitq8: "",
      sphere_vector: "",
      sphere_halfvec: "",
      sphere_rabitq4: "",
      sphere_rabitq8: "",
    };
    for (const name of ["rabitq4", "rabitq8"])
      texts[v.parse(vectorTypes, name)] = (
        await client.query(`SELECT ${ext}.${q(`quantize_to_${name}`)}($1::${vectorExt}.vector)::text AS value`, [
          texts.vector,
        ])
      ).rows[0].value;
    for (const name of types)
      texts[v.parse(valueTypes, `sphere_${name}`)] = (
        await client.query(
          `SELECT ${ext}.sphere($1::${name === "vector" || name === "halfvec" ? vectorExt : ext}.${q(name)}, $2::real)::text AS value`,
          [texts[v.parse(vectorTypes, name)], "0.5"],
        )
      ).rows[0].value;
    await client.query(`CREATE SCHEMA ${q(fixture)}`);
    created = true;
    await client.query(
      `CREATE TABLE ${q(fixture)}.items (id integer PRIMARY KEY, v ${vectorExt}.vector(3), h ${vectorExt}.halfvec(3), q4 ${ext}.rabitq4(3), q8 ${ext}.rabitq8(3))`,
    );
    await client.query(
      `INSERT INTO ${q(fixture)}.items SELECT n, $1::${vectorExt}.vector, $1::${vectorExt}.halfvec, ${ext}.quantize_to_rabitq4($1::${vectorExt}.vector), ${ext}.quantize_to_rabitq8($1::${vectorExt}.vector) FROM generate_series(1,32) n`,
      [texts.vector],
    );
    const schema = defineSchema(() => ({}));
    connection = await connectDatabase({ schema, relations: {}, connectionString });
    const classes = manifest.contract.members.filter((m) => m.kind === "opclass");
    assert.equal(classes.length, 24);
    const successfulIndexes = new Set<string>();
    const columns = { vector: "v", halfvec: "h", rabitq4: "q4", rabitq8: "q8" };
    for (const [i, member] of classes.entries()) {
      await witness(member.id, "create-and-native-index-scan", "native-index", async () => {
        const name = `idx_${i}`;
        const type = v.parse(v.object({ name: vectorTypes }), member.input).name;
        const metric = member.name.includes("cosine") ? "cosine" : member.name.includes("_ip_") ? "ip" : "l2";
        const contract = api.indexes[member.accessMethod === "lakebase_ann" ? "ann" : "annv0"][type][metric]();
        assert.deepEqual(
          [contract.method, contract.opclass, contract.type, contract.member, contract.schema, contract.digest],
          [member.accessMethod, member.name, type, member.id, api.schema, digest],
        );
        assert.equal(
          contract.input.schema,
          type === "vector" || type === "halfvec" ? api.companion.schema : api.schema,
        );
        await client.query(
          `CREATE INDEX ${q(name)} ON ${q(fixture)}.items USING ${q(contract.method)} (${q(columns[type]!)} ${q(contract.schema)}.${q(contract.opclass)})`,
        );
        const operator = metric === "cosine" ? "<=>" : metric === "ip" ? "<#>" : "<->";
        await client.query("BEGIN");
        try {
          await client.query("SET LOCAL enable_seqscan = off");
          // Each scan has exactly one fixture index, so another opclass cannot supply its witness.
          const inputSchema = type === "vector" || type === "halfvec" ? vectorExt : ext;
          const query = `SELECT id FROM ${q(fixture)}.items ORDER BY ${q(columns[type]!)} OPERATOR(${inputSchema}.${operator}) $1::${inputSchema}.${q(type)} LIMIT 5`;
          const plan = v.parse(
            v.array(v.looseObject({ Plan: planSchema })),
            (await client.query(`EXPLAIN (FORMAT JSON) ${query}`, [texts[type]])).rows[0]["QUERY PLAN"],
          );
          const names: string[] = [];
          const walk = (node: NativePlan) => {
            if (node["Index Name"] !== undefined) names.push(node["Index Name"]);
            for (const child of node.Plans ?? []) walk(child);
          };
          walk(plan[0]!.Plan);
          assert(
            names.includes(name),
            `Planner must invoke the just-created ${member.accessMethod}/${member.name}, observed ${names.join(",")}`,
          );
          assert.equal((await client.query(query, [texts[type]])).rowCount, 5);
        } finally {
          await client.query("ROLLBACK");
        }
        successfulIndexes.add(member.id);
        await client.query(`DROP INDEX ${q(fixture)}.${q(name)}`);
      });
    }
    await client.query(`CREATE INDEX tools_idx ON ${q(fixture)}.items USING lakebase_ann (v ${ext}.vector_l2_ops)`);
    const index = `${q(fixture)}.${q("tools_idx")}`;
    const argument = (ref: Reference): NativeArgument => {
      if (ref.name === "float4") return 0.5;
      if (ref.name === "regclass") return index;
      if (ref.name === "text") return "search";
      if (ref.name === "vector" || ref.name === "halfvec") return [3, 1, 2];
      const codec = api.codecs[ref.name.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())];
      assert(codec, `Missing codec for ${ref.name}`);
      return codec.decode(texts[v.parse(valueTypes, ref.name)]);
    };
    const references = (m: Member) => (m.kind === "routine" ? m.arguments!.map((a) => a.type) : [m.left!, m.right!]);
    const sqlType = (ref: Reference) =>
      `${ref.namespace === "pg_catalog" ? '"pg_catalog"' : ref.namespace === "$extension:vector" ? vectorExt : ext}.${q(ref.name)}`;
    const oracleCall = (m: Member, refs: Reference[], nullSlot = -1, omitDefault = false) => {
      const used = omitDefault ? refs.slice(0, -1) : refs;
      const values = used.map((ref, i) =>
        i === nullSlot
          ? null
          : ref.name === "float4"
            ? "0.5"
            : ref.name === "regclass"
              ? index
              : ref.name === "text"
                ? "search"
                : texts[v.parse(valueTypes, ref.name)],
      );
      const args = used.map((ref, i) => `$${i + 1}::${sqlType(ref)}`);
      const expression =
        m.kind === "routine"
          ? `${ext}.${q(m.name)}(${args.join(",")})`
          : `(${args[0]} OPERATOR(${ext}.${m.name}) ${args[1]})`;
      return { expression, values };
    };
    const expected = async (m: Member, refs: Reference[], nullSlot = -1, omitDefault = false) => {
      const { expression, values } = oracleCall(m, refs, nullSlot, omitDefault);
      const result = m.returns!.name;
      if (result.startsWith("sphere_")) {
        const row = (
          await client.query(
            `SELECT (value).center::text AS center, (value).radius::text AS radius FROM (SELECT ${expression} AS value) native_oracle`,
            values,
          )
        ).rows[0];
        const type = result.slice(7);
        return {
          center:
            row.center === null
              ? null
              : type.startsWith("rabitq")
                ? { kind: "native-text", text: row.center }
                : JSON.parse(row.center),
          radius: row.radius === null ? null : Number(row.radius),
        };
      }
      const value = (await client.query(`SELECT (${expression})::text AS value`, values)).rows[0].value;
      if (value === null || result === "void") return null;
      if (result.startsWith("rabitq")) return { kind: "native-text", text: value };
      if (result === "vector" || result === "halfvec") return JSON.parse(value);
      if (result === "bool") return value === "true";
      if (result === "float4")
        return ["NaN", "Infinity", "-Infinity"].includes(value) ? { nonfinite: value } : Number(value);
      if (result === "bytea") return { hex: value.slice(2).toLowerCase() };
      return value;
    };
    for (const member of callable) {
      const refs = references(member);
      await witness(member.id, "ordinary-valid-call-and-codec", "native-call", async () => {
        const args = refs.map(argument);
        const native = await expected(member, refs);
        const rows = await connection!.transaction((db) =>
          db.select({ value: overloads[member.id]!(...args) }).from(sql.raw("(VALUES (1)) AS native_probe(id)")),
        );
        assert.equal(rows.length, 1);
        assert.deepEqual(rows[0]!.value, native);
        if (member.kind === "routine") {
          const signature = `${q(api.schema)}.${q(member.name)}(${refs.map(sqlType).join(",")})`;
          assert.equal(
            (
              await client.query("SELECT has_function_privilege($1,$2,'EXECUTE') AS allowed", [
                privilegeRole,
                signature,
              ])
            ).rows[0].allowed,
            member.publicExecute,
            "Fresh role has no inherited memberships or explicit grants: native EXECUTE must match the captured PUBLIC contract",
          );
        }
      });
      for (let slot = 0; slot < refs.length; slot++)
        await witness(member.id, `native-null-argument-${slot}`, "native-call", async () => {
          const args = refs.map(argument);
          args[slot] = null;
          const native = await expected(member, refs, slot);
          const rows = await connection!.transaction((db) =>
            db.select({ value: overloads[member.id]!(...args) }).from(sql.raw("(VALUES (1)) AS native_probe(id)")),
          );
          assert.deepEqual(rows[0]!.value, native);
          if (member.strict) assert.equal(native, null);
        });
      if (member.arguments?.some((a) => a.hasDefault))
        await witness(member.id, "native-omitted-default", "native-call", async () => {
          const rows = await connection!.transaction((db) =>
            db
              .select({ value: overloads[member.id]!(...refs.slice(0, -1).map(argument)) })
              .from(sql.raw("(VALUES (1)) AS native_probe(id)")),
          );
          assert.deepEqual(rows[0]!.value, await expected(member, refs, -1, true));
        });
    }
    const typeMembers = manifest.contract.members.filter((m) => m.kind === "type");
    const fieldColumns: Record<string, AnyPgColumnBuilder> = {};
    for (const member of typeMembers) {
      const array = member.name.startsWith("_");
      const name = array ? member.element!.name : member.name;
      const key = name.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
      fieldColumns[member.name] = (array ? api.arrayField : api.field)[key]!().build(member.name);
    }
    const stored = pgSchema(fixture).table("typed_values", fieldColumns);
    await client.query(
      `CREATE TABLE ${q(fixture)}.typed_values (${typeMembers.map((m) => `${q(m.name)} ${ext}.${q(m.name)}`).join(",")})`,
    );
    for (const member of typeMembers)
      await witness(member.id, "native-text-codec-roundtrip", "native-type-roundtrip", async () => {
        const array = member.name.startsWith("_");
        const name = array ? member.element!.name : member.name;
        const key = name.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
        const codec = api.codecs[key];
        assert(codec, member.id);
        const scalar = codec.decode(texts[v.parse(valueTypes, name)]);
        const value = array ? { dimensions: [{ lowerBound: 1, length: 2 }], values: [scalar, null] } : scalar;
        const rows = await connection!.transaction((db) =>
          db
            .insert(stored)
            .values({ [member.name]: value })
            .returning({ value: stored[member.name]! }),
        );
        assert.deepEqual(rows[0]!.value, value);
      });
    for (const member of typeMembers.filter((m) => m.name === "rabitq4" || m.name === "rabitq8")) {
      assert(member.receive && member.send, "Native rabitq binary I/O graph must identify its C routines");
      await witness(
        `routine:${member.receive}`,
        "native-send-bytea-to-binary-bind-receive",
        "native-type-roundtrip",
        async () => {
          const bytes = (
            await client.query(
              `SELECT ${ext}.${q(`_lakebase_vector_${member.name}_send`)}($1::${ext}.${q(member.name)}) AS bytes`,
              [texts[v.parse(valueTypes, member.name)]],
            )
          ).rows[0].bytes;
          assert(Buffer.isBuffer(bytes), "Native send must produce bytea; no JavaScript binary conversion");
          // node-postgres sends Buffer parameters in PostgreSQL binary Bind format, invoking the type's receive routine.
          const actual = (await client.query(`SELECT ($1::${ext}.${q(member.name)})::text AS value`, [bytes])).rows[0]
            .value;
          assert.equal(actual, texts[v.parse(valueTypes, member.name)]);
        },
        [member.id, `routine:${member.send}`],
      );
    }
    await witness("lakebase_vector.settings", "transaction-local-native-settings", "native-call", async () => {
      const before = (await client.query("SELECT current_setting('lakebase_ann.probes') AS probes")).rows[0].probes;
      await connection!.transaction(async (db) => {
        await db.execute(api.settings.probes("auto"));
        await db.execute(api.settings.epsilon("auto"));
        await db.execute(api.settings.prefilter("on"));
        const row = await db.execute(
          sql`SELECT current_setting('lakebase_ann.probes') AS probes, current_setting('lakebase_ann.epsilon') AS epsilon, current_setting('lakebase_ann.prefilter') AS prefilter`,
        );
        assert.deepEqual(row.rows[0], { probes: "auto", epsilon: "auto", prefilter: "on" });
      });
      assert.equal(
        (await client.query("SELECT current_setting('lakebase_ann.probes') AS probes")).rows[0].probes,
        before,
      );
    });
    // Internal callbacks have no ordinary SQL-callable signature. Identify the precise executed native parent.
    const nativeFailures = witnesses.filter((w) => w.status === "failed");
    const dispositionIds = new Set(witnesses.map((w) => w.member));
    for (const member of manifest.contract.members.filter((m) => !dispositionIds.has(m.id))) {
      const parents =
        member.kind === "opfamily"
          ? classes.filter((c) => c.family === member.id.slice("opfamily:".length)).map((c) => c.id)
          : member.kind === "access-method"
            ? classes.filter((c) => c.accessMethod === member.name).map((c) => c.id)
            : member.kind === "other"
              ? classes
                  .filter((c) => member.identity?.endsWith(`of "${c.namespace}".${c.name} USING ${c.accessMethod}`))
                  .map((c) => c.id)
              : member.kind === "relation"
                ? typeMembers.filter((t) => t.name === member.name).map((t) => t.id)
                : member.kind === "routine"
                  ? [
                      ...typeMembers
                        .filter((t) => [t.input, t.output, t.typmodInput].includes(member.id.slice("routine:".length)))
                        .map((t) => t.id),
                      ...manifest.contract.members
                        .filter((m) => m.kind === "access-method" && m.handler === member.id.slice("routine:".length))
                        .flatMap((m) => classes.filter((c) => c.accessMethod === m.name).map((c) => c.id)),
                    ]
                  : [];
      await witness(
        member.id,
        "captured-catalog-graph-and-native-parent",
        "native-catalog-parent",
        async () => {
          assert.equal(
            nativeFailures.length,
            0,
            "Catalog-parent graph cannot be accepted when a native call/index/type failed",
          );
          assert(parents.length > 0, `No explicit native parent mapped for ${member.id}`);
          for (const parent of parents) {
            assert(
              witnesses.some((w) => w.member === parent && w.status === "passed"),
              `Parent ${parent} must have executed successfully`,
            );
            if (parent.startsWith("opclass:")) assert(successfulIndexes.has(parent));
          }
        },
        parents,
      );
    }
    completed = true;
  } finally {
    try {
      await connection?.close();
    } finally {
      try {
        if (created) {
          await client.query(`DROP SCHEMA ${q(fixture)} CASCADE`);
          assert.equal((await client.query("SELECT 1 FROM pg_namespace WHERE nspname=$1", [fixture])).rowCount, 0);
        }
        if (roleCreated) {
          await client.query(`DROP ROLE ${q(privilegeRole)}`);
          assert.equal((await client.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [privilegeRole])).rowCount, 0);
        }
      } finally {
        await client.end();
      }
    }
    const failed = witnesses.filter((w) => w.status === "failed");
    console.info(
      JSON.stringify({
        extension: "lakebase_vector",
        version: "1.1.1",
        manifestDigest: digest,
        completed,
        nativeExecution: completed && !failed.length ? "observed" : "unaccepted",
        witnesses,
        failed: failed.length,
        cleanup: {
          schema: created ? "owned-schema-absence-verified" : "not-created",
          role: roleCreated ? "owned-role-absence-verified" : "not-created",
        },
      }),
    );
  }
  assert.equal(
    witnesses.filter((w) => w.status === "failed").length,
    0,
    "Native lakebase_vector acceptance remains failed; see exact member witnesses",
  );
  assert.equal(
    new Set(witnesses.map((w) => w.member).filter((id) => manifest.contract.members.some((m) => m.id === id))).size,
    212,
  );
  return witnesses;
}
