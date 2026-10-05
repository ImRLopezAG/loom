import { cleanPgPartmanSchema } from "./pg_partman-local-resources";
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import pg from "pg";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/pg_partman.json";

export const pgPartmanDigest = "1033324ad4a4f41c49b1b6676d0d51feaa0b9abffbdf754de1e18a05bc9f6599";
export function pgPartmanNativeCalls(schema: string) {
  const parent = `${schema}.id_parent`;
  const time = `${schema}.time_parent`;
  const child = `${schema}.id_parent_p0`;
  return {
    apply_cluster: [schema, "ordinary_parent", schema, "ordinary_child"],
    apply_constraints: [parent],
    apply_privileges: [schema, "id_parent", schema, "id_parent_p0"],
    autovacuum_off: [schema, "ordinary_parent"],
    autovacuum_reset: [schema, "ordinary_parent"],
    calculate_time_partition_info: ["1 day", "2026-10-04 12:34:56.123456+00"],
    check_automatic_maintenance_value: ["on"],
    check_control_type: [schema, "id_parent", "id"],
    check_default: [],
    check_epoch_type: ["none"],
    check_name_length: ["native_name"],
    check_partition_type: ["range"],
    check_subpart_sameconfig: [parent],
    check_subpartition_limits: [parent, "id"],
    create_parent: [`${schema}.new_parent`, "id", "10"],
    create_partition_id: [parent, "{20}"],
    create_partition_time: [time, "{2026-10-06 00:00:00+00}"],
    create_sub_parent: [parent, "id", "5", "range", true, "yes"],
    drop_constraints: [parent, child],
    drop_partition_id: [parent, "10"],
    drop_partition_time: [time, "30 days"],
    dump_partitioned_table_definition: [parent],
    inherit_replica_identity: [schema, "id_parent", "id_parent_p0"],
    inherit_template_properties: [parent, schema, "id_parent_p0"],
    partition_data_id: [parent],
    partition_data_proc: [parent],
    partition_data_time: [time],
    partition_gap_fill: [parent],
    reapply_constraints_proc: [parent],
    reapply_privileges: [parent],
    run_analyze: [],
    run_maintenance_proc: [],
    run_maintenance: [],
    show_partition_info: [child],
    show_partition_name: [parent, "1"],
    show_partitions: [parent],
    stop_sub_partition: [parent],
    undo_partition_proc: [parent, `${schema}.target`],
    undo_partition: [parent, `${schema}.target`],
  } as const;
}

/** Direct native characterization, separate from adapter tests. Only this disposable database is used. */
export async function characterizePgPartman(connectionString: string, sourceRoot?: string) {
  const url = new URL(connectionString);
  assert(["127.0.0.1", "localhost"].includes(url.hostname), "Local UUID fixture only");
  const client = new pg.Client({ connectionString });
  const schema = `partman_${randomUUID().replaceAll("-", "")}`;
  const records: { member: string; call: string; rows: unknown[]; sourceSha256?: string | undefined }[] = [];
  await client.connect();
  try {
    const installed = await client.query("SELECT extversion FROM pg_extension WHERE extname='pg_partman'");
    assert.equal(installed.rows[0]?.extversion, "5.1.0");
    await client.query("SET TimeZone='UTC'; SET DateStyle='ISO,YMD'; SET IntervalStyle='postgres'");
    const clean = () => cleanPgPartmanSchema(client, connectionString, schema);
    const setup = async () => {
      await clean();
      await client.query(`CREATE SCHEMA "${schema}";
        CREATE TABLE "${schema}".id_parent(id bigint NOT NULL, payload text) PARTITION BY RANGE(id);
        CREATE TABLE "${schema}".time_parent(at timestamptz NOT NULL, payload text) PARTITION BY RANGE(at);
        CREATE TABLE "${schema}".new_parent(id bigint NOT NULL) PARTITION BY RANGE(id);
        CREATE TABLE "${schema}".target(id bigint NOT NULL, payload text);
        CREATE TABLE "${schema}".ordinary_parent(id bigint NOT NULL, payload text);
        CREATE TABLE "${schema}".ordinary_child(id bigint NOT NULL, payload text);
        CREATE TABLE "${schema}".id_template(id bigint NOT NULL, payload text);
        CREATE TABLE "${schema}".time_template(at timestamptz NOT NULL, payload text)`);
      await client.query(
        "SELECT extensions.create_parent($1,'id','10',p_premake:=1,p_start_partition:='0',p_jobmon:=false,p_template_table:=$2,p_constraint_cols:=ARRAY['payload'])",
        [`${schema}.id_parent`, `${schema}.id_template`],
      );
      await client.query(
        "SELECT extensions.create_parent($1,'at','1 day',p_premake:=1,p_jobmon:=false,p_template_table:=$2)",
        [`${schema}.time_parent`, `${schema}.time_template`],
      );
      // Legacy autovacuum helpers reject native partition parents (42809). Their source invokes
      // show_partitions, which requires configuration even for an ordinary transfer-source table.
      await client.query(
        "INSERT INTO extensions.part_config(parent_table,control,partition_interval,partition_type,jobmon) VALUES($1,'id','10','range',false)",
        [`${schema}.ordinary_parent`],
      );
    };
    try {
      const calls = pgPartmanNativeCalls(schema);
      for (const member of manifest.contract.members) {
        if (member.kind !== "routine") continue;
        await setup();
        const args = new Map(Object.entries(calls)).get(member.name);
        assert(args, member.name);
        const inputs = member.arguments!.filter((a) => a.mode === "in" || a.mode === "inout");
        const params = args.map((_, i) => `$${i + 1}::pg_catalog.${inputs[i]!.type.name}`).join(",");
        const call = `${member.routineKind === "procedure" ? "CALL" : "SELECT ROW(r.*)::text AS value FROM"} extensions."${member.name}"(${params})${member.routineKind === "procedure" ? "" : " AS r"}`;
        const result = await client.query(call, [...args]);
        let sourceSha256: string | undefined;
        if (sourceRoot) {
          const bundled = ["check_automatic_maintenance_value", "check_epoch_type", "check_partition_type"].includes(
            member.name,
          )
            ? "tables/tables"
            : `${member.routineKind === "procedure" ? "procedures" : "functions"}/${member.name}`;
          const source = await readFile(`${sourceRoot}/sql/${bundled}.sql`);
          sourceSha256 = createHash("sha256").update(source).digest("hex");
        }
        records.push({ member: member.id, call, rows: result.rows, sourceSha256 });
        console.log(member.name, JSON.stringify(result.rows));
      }
      // Native procedures perform COMMIT. They must execute in an independent top-level CALL.
      await setup();
      await client.query("BEGIN");
      await assert.rejects(
        client.query("CALL extensions.run_analyze()"),
        (error: Error & { code?: string }) => error.code === "2D000",
      );
      await client.query("ROLLBACK");
      const columns = await client.query(
        "SELECT c.relname,a.attname,pg_catalog.format_type(a.atttypid,a.atttypmod) AS type,a.attnotnull FROM pg_catalog.pg_attribute a JOIN pg_catalog.pg_class c ON c.oid=a.attrelid JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='extensions' AND c.relname IN ('part_config','part_config_sub','table_privs','check_default_table') AND a.attnum>0 AND NOT a.attisdropped ORDER BY c.relname,a.attnum",
      );
      return {
        version: "5.1.0",
        postgresMajor: 18,
        digest: pgPartmanDigest,
        schema,
        records,
        columns: columns.rows,
        procedureInTransaction: "2D000",
      };
    } finally {
      await clean();
    }
  } finally {
    await client.end();
  }
}
