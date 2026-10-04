import { test, expect } from "bun:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";
import type { ExtensionCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { sql, defineRelations } from "drizzle-orm";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { createPgPartman_5_1_0, pgPartmanDigest } from "../../../apps/loom/src/core/extensions/adapters/pg_partman";
import {
  partmanInt8ArrayCodec,
  partmanTimeArrayCodec,
} from "../../../apps/loom/src/core/extensions/adapters/pg_partman-codecs";
import {
  withPgPartman,
  executePgPartmanProcedure,
  type PgPartmanSession,
} from "../../../apps/loom/src/tooling/extensions/operations/pg_partman";
import { pgPartmanNativeCalls } from "../fixtures/pg_partman-native";
import { cleanPgPartmanSchema } from "../fixtures/pg_partman-local-resources";
const descriptor = {
  name: "pg_partman",
  version: "5.1.0",
  schema: "extensions",
  apiSupport: { status: "verified", digest: pgPartmanDigest },
} as const;
const localUrl = process.env.PG_PARTMAN_LOCAL_URL;
test("all four native composites and arrays preserve nulls, bigint, escaping and nondefault bounds", async () => {
  assert(localUrl, "PG_PARTMAN_LOCAL_URL must identify the owned local fixture");
  assert(["127.0.0.1", "localhost"].includes(new URL(localUrl).hostname));
  const oracle = new pg.Client({ connectionString: localUrl });
  await oracle.connect();
  try {
    const api = createPgPartman_5_1_0(descriptor);
    async function roundTrip<Input, Output>(name: string, codec: ExtensionCodec<Input, Output>, value: Input) {
      const result = await oracle.query(`SELECT ($1::extensions.${name})::text AS value`, [codec.encode(value)]);
      assert.deepEqual(codec.decode(result.rows[0].value), value);
    }
    const report = { default_table: 'quoted,"slash\\', count: 9007199254740993n };
    const config = api.part_configCodec.decode(`(${Array(27).fill("").join(",")})`);
    const subconfig = api.part_config_subCodec.decode(`(${Array(23).fill("").join(",")})`);
    const privileges = {
      grantor: "postgres",
      grantee: "postgres",
      table_schema: "own",
      table_name: "report",
      privilege_type: "SELECT",
    };
    await roundTrip("check_default_table", api.check_default_tableCodec, report);
    await roundTrip("part_config", api.part_configCodec, config);
    await roundTrip("part_config_sub", api.part_config_subCodec, subconfig);
    await roundTrip("table_privs", api.table_privsCodec, privileges);
    const dimensions = [{ lowerBound: 0, length: 2 }];
    await roundTrip("check_default_table[]", api.check_default_tableArrayCodec, { dimensions, values: [report, null] });
    await roundTrip("part_config[]", api.part_configArrayCodec, { dimensions, values: [config, null] });
    await roundTrip("part_config_sub[]", api.part_config_subArrayCodec, { dimensions, values: [subconfig, null] });
    await roundTrip("table_privs[]", api.table_privsArrayCodec, { dimensions, values: [privileges, null] });
  } finally {
    await oracle.end();
  }
});
// Missing prerequisites fail this focused gate; never skipped acceptance.
test("native operator routines, catalogs, query composition and non-atomic procedures", async () => {
  assert(localUrl, "PG_PARTMAN_LOCAL_URL must identify owned local fixture");
  assert(["127.0.0.1", "localhost"].includes(new URL(localUrl).hostname));
  const oracle = new pg.Client({ connectionString: localUrl });
  await oracle.connect();
  const own = `partman_${randomUUID().replaceAll("-", "")}`;
  let escaped: PgPartmanSession | undefined;
  const clean = () => cleanPgPartmanSchema(oracle, localUrl, own);
  const setup = async () => {
    await clean();
    await oracle.query(`CREATE SCHEMA "${own}";
      CREATE TABLE "${own}".id_parent(id bigint NOT NULL,payload text) PARTITION BY RANGE(id);
      CREATE TABLE "${own}".time_parent(at timestamptz NOT NULL,payload text) PARTITION BY RANGE(at);
      CREATE TABLE "${own}".new_parent(id bigint NOT NULL) PARTITION BY RANGE(id);
      CREATE TABLE "${own}".target(id bigint NOT NULL,payload text);
      CREATE TABLE "${own}".ordinary_parent(id bigint NOT NULL,payload text);
      CREATE TABLE "${own}".ordinary_child(id bigint NOT NULL,payload text);
      CREATE TABLE "${own}".id_template(id bigint NOT NULL,payload text);
      CREATE TABLE "${own}".time_template(at timestamptz NOT NULL,payload text)`);
    await oracle.query(
      "SELECT extensions.create_parent($1,'id','10',p_premake:=1,p_start_partition:='0',p_jobmon:=false,p_template_table:=$2,p_constraint_cols:=ARRAY['payload'])",
      [`${own}.id_parent`, `${own}.id_template`],
    );
    await oracle.query(
      "SELECT extensions.create_parent($1,'at','1 day',p_premake:=1,p_jobmon:=false,p_template_table:=$2)",
      [`${own}.time_parent`, `${own}.time_template`],
    );
    await oracle.query(
      "INSERT INTO extensions.part_config(parent_table,control,partition_interval,partition_type,jobmon) VALUES($1,'id','10','range',false)",
      [`${own}.ordinary_parent`],
    );
  };
  try {
    const calls = pgPartmanNativeCalls(own);
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.apply_cluster({
        p_parent_schema: calls.apply_cluster[0],
        p_parent_tablename: calls.apply_cluster[1],
        p_child_schema: calls.apply_cluster[2],
        p_child_tablename: calls.apply_cluster[3],
      });
      expect(result === null).toBe(true);
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.apply_constraints({ p_parent_table: calls.apply_constraints[0] });
      expect(result === null).toBe(true);
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.apply_privileges({
        p_parent_schema: calls.apply_privileges[0],
        p_parent_tablename: calls.apply_privileges[1],
        p_child_schema: calls.apply_privileges[2],
        p_child_tablename: calls.apply_privileges[3],
      });
      expect(result === null).toBe(true);
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.autovacuum_off({
        p_parent_schema: calls.autovacuum_off[0],
        p_parent_tablename: calls.autovacuum_off[1],
      });
      expect(result).toEqual(expect.any(Boolean));
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.autovacuum_reset({
        p_parent_schema: calls.autovacuum_reset[0],
        p_parent_tablename: calls.autovacuum_reset[1],
      });
      expect(result).toEqual(expect.any(Boolean));
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.calculate_time_partition_info({
        p_time_interval: calls.calculate_time_partition_info[0],
        p_start_time: { type: "timestamptz", text: calls.calculate_time_partition_info[1] } as const,
      });
      expect(result).toEqual(expect.any(Object));
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.check_automatic_maintenance_value({
        p_automatic_maintenance: calls.check_automatic_maintenance_value[0],
      });
      expect(result).toEqual(expect.any(Boolean));
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.check_control_type({
        p_parent_schema: calls.check_control_type[0],
        p_parent_tablename: calls.check_control_type[1],
        p_control: calls.check_control_type[2],
      });
      expect(Array.isArray(result)).toBe(true);
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.check_default({});
      expect(Array.isArray(result)).toBe(true);
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.check_epoch_type({ p_type: calls.check_epoch_type[0] });
      expect(result).toEqual(expect.any(Boolean));
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.check_name_length({ p_object_name: calls.check_name_length[0] });
      expect(result).toEqual(expect.any(String));
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.check_partition_type({ p_type: calls.check_partition_type[0] });
      expect(result).toEqual(expect.any(Boolean));
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.check_subpart_sameconfig({ p_parent_table: calls.check_subpart_sameconfig[0] });
      expect(Array.isArray(result)).toBe(true);
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.check_subpartition_limits({
        p_parent_table: calls.check_subpartition_limits[0],
        p_type: calls.check_subpartition_limits[1],
      });
      expect(result).toEqual(expect.any(Object));
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.create_parent({
        p_parent_table: calls.create_parent[0],
        p_control: calls.create_parent[1],
        p_interval: calls.create_parent[2],
      });
      expect(result).toEqual(expect.any(Boolean));
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.create_partition_id({
        p_parent_table: calls.create_partition_id[0],
        p_partition_ids: partmanInt8ArrayCodec.decode(calls.create_partition_id[1]),
      });
      expect(result).toEqual(expect.any(Boolean));
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.create_partition_time({
        p_parent_table: calls.create_partition_time[0],
        p_partition_times: partmanTimeArrayCodec.decode(calls.create_partition_time[1]),
      });
      expect(result).toEqual(expect.any(Boolean));
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.create_sub_parent({
        p_top_parent: calls.create_sub_parent[0],
        p_control: calls.create_sub_parent[1],
        p_interval: calls.create_sub_parent[2],
        p_type: calls.create_sub_parent[3],
        p_default_table: calls.create_sub_parent[4],
        p_declarative_check: calls.create_sub_parent[5],
      });
      expect(result).toEqual(expect.any(Boolean));
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.drop_constraints({
        p_parent_table: calls.drop_constraints[0],
        p_child_table: calls.drop_constraints[1],
      });
      expect(result === null).toBe(true);
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.drop_partition_id({
        p_parent_table: calls.drop_partition_id[0],
        p_retention: BigInt(calls.drop_partition_id[1]),
      });
      expect(result).toEqual(expect.any(Number));
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.drop_partition_time({
        p_parent_table: calls.drop_partition_time[0],
        p_retention: calls.drop_partition_time[1],
      });
      expect(result).toEqual(expect.any(Number));
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.dump_partitioned_table_definition({
        p_parent_table: calls.dump_partitioned_table_definition[0],
      });
      expect(result).toEqual(expect.any(String));
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.inherit_replica_identity({
        p_parent_schemaname: calls.inherit_replica_identity[0],
        p_parent_tablename: calls.inherit_replica_identity[1],
        p_child_tablename: calls.inherit_replica_identity[2],
      });
      expect(result === null).toBe(true);
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.inherit_template_properties({
        p_parent_table: calls.inherit_template_properties[0],
        p_child_schema: calls.inherit_template_properties[1],
        p_child_tablename: calls.inherit_template_properties[2],
      });
      expect(result).toEqual(expect.any(Boolean));
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.partition_data_id({ p_parent_table: calls.partition_data_id[0] });
      expect(result).toEqual(expect.any(BigInt));
      return result;
    });
    await setup();
    expect(
      (
        await executePgPartmanProcedure(localUrl, descriptor, {
          procedure: "partition_data_proc",
          arguments: { p_parent_table: calls.partition_data_proc[0] },
        })
      ).atomic,
    ).toBe(false);
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.partition_data_time({ p_parent_table: calls.partition_data_time[0] });
      expect(result).toEqual(expect.any(BigInt));
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.partition_gap_fill({ p_parent_table: calls.partition_gap_fill[0] });
      expect(result).toEqual(expect.any(Number));
      return result;
    });
    await setup();
    expect(
      (
        await executePgPartmanProcedure(localUrl, descriptor, {
          procedure: "reapply_constraints_proc",
          arguments: { p_parent_table: calls.reapply_constraints_proc[0] },
        })
      ).atomic,
    ).toBe(false);
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.reapply_privileges({ p_parent_table: calls.reapply_privileges[0] });
      expect(result === null).toBe(true);
      return result;
    });
    await setup();
    expect(
      (await executePgPartmanProcedure(localUrl, descriptor, { procedure: "run_analyze", arguments: {} })).atomic,
    ).toBe(false);
    await setup();
    expect(
      (await executePgPartmanProcedure(localUrl, descriptor, { procedure: "run_maintenance_proc", arguments: {} }))
        .atomic,
    ).toBe(false);
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.run_maintenance({});
      expect(result === null).toBe(true);
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.show_partition_info({ p_child_table: calls.show_partition_info[0] });
      expect(result).toEqual(expect.any(Object));
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.show_partition_name({
        p_parent_table: calls.show_partition_name[0],
        p_value: calls.show_partition_name[1],
      });
      expect(result).toEqual(expect.any(Object));
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.show_partitions({ p_parent_table: calls.show_partitions[0] });
      expect(Array.isArray(result)).toBe(true);
      return result;
    });
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.stop_sub_partition({ p_parent_table: calls.stop_sub_partition[0] });
      expect(result).toEqual(expect.any(Boolean));
      return result;
    });
    await setup();
    expect(
      (
        await executePgPartmanProcedure(localUrl, descriptor, {
          procedure: "undo_partition_proc",
          arguments: { p_parent_table: calls.undo_partition_proc[0], p_target_table: calls.undo_partition_proc[1] },
        })
      ).atomic,
    ).toBe(false);
    await setup();
    await withPgPartman(localUrl, descriptor, async (session) => {
      escaped = session;
      const result = await session.undo_partition({
        p_parent_table: calls.undo_partition[0],
        p_target_table: calls.undo_partition[1],
      });
      expect(result).toEqual(expect.any(Object));
      return result;
    });
    assert(escaped);
    await assert.rejects(escaped.check_default(), /inactive/);
    await setup();
    const configured = await withPgPartman(localUrl, descriptor, async (session) => {
      const before = await session.part_config(`${own}.id_parent`);
      expect(before).toHaveLength(1);
      await session.configure_part_config(`${own}.id_parent`, {
        premake: 2,
        retention: "100",
        inherit_privileges: null,
      });
      const after = await session.part_config(`${own}.id_parent`);
      expect(after[0]?.premake).toBe(2);
      expect(after[0]?.retention).toBe("100");
      expect(after[0]?.inherit_privileges).toBeNull();
      const prereqs = await session.prerequisites();
      expect(prereqs.jobmon_installed).toBe(false);
      return after;
    });
    expect(configured.completion).toBe("committed");
    await withPgPartman(localUrl, descriptor, async (session) => {
      await session.create_sub_parent({
        p_top_parent: `${own}.id_parent`,
        p_control: "id",
        p_interval: "5",
        p_declarative_check: "yes",
        p_jobmon: false,
      });
      expect(await session.part_config_sub(`${own}.id_parent`)).toHaveLength(1);
      await session.configure_part_config_sub(`${own}.id_parent`, { sub_premake: 2, sub_retention: "100" });
      const sub = await session.part_config_sub(`${own}.id_parent`);
      expect(sub[0]?.sub_premake).toBe(2);
      expect(sub[0]?.sub_retention).toBe("100");
    });
    const held = new pg.Client({ connectionString: localUrl });
    await held.connect();
    try {
      await held.query("SELECT pg_advisory_lock(hashtext('pg_partman run_maintenance'))");
      const locked = await withPgPartman(localUrl, descriptor, (session) =>
        session.run_maintenance({ p_parent_table: `${own}.id_parent`, p_jobmon: false }),
      );
      expect(locked.value).toBeNull();
    } finally {
      await held.end();
    }
    await assert.rejects(
      withPgPartman(localUrl, descriptor, async (session) => {
        await session.configure_part_config(`${own}.id_parent`, { premake: 3 });
        throw new Error("rollback owned config");
      }),
    );
    expect(
      (await oracle.query("SELECT premake FROM extensions.part_config WHERE parent_table=$1", [`${own}.id_parent`]))
        .rows[0].premake,
    ).toBe(2);
    await oracle.query(`INSERT INTO "${own}".id_parent VALUES(100,'outside')`);
    const observed = await withPgPartman(localUrl, descriptor, async (session) => session.check_default());
    expect(observed.value.some((row) => row.default_table === `${own}.id_parent_default` && row.count === 1n)).toBe(
      true,
    );
    const schema = defineSchema(() => ({ items: {} }), { namespace: own });
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: localUrl,
    });
    try {
      const api = createPgPartman_5_1_0(descriptor);
      const result = await connection.transaction((db) =>
        db
          .select({
            name: api.check_name_length("native_api"),
            timestamp: api.calculate_time_partition_info("1 day", {
              type: "timestamptz",
              text: "2026-10-04 12:34:56.123456+00",
            }),
          })
          .from(sql`(SELECT 1) AS one`),
      );
      expect(result[0]?.name).toBe("native_api");
      expect(result[0]?.timestamp.base_timestamp?.text).toBe("2026-10-04 00:00:00.000000+00");
      const rows = api.show_partitionsRows("p", `${own}.id_parent`);
      expect((await connection.transaction((db) => db.select(rows.columns).from(rows.from))).length).toBeGreaterThan(0);
      const catalog = api.part_configRows("c");
      expect(
        (
          await connection.transaction((db) =>
            db
              .select(catalog.columns)
              .from(catalog.from)
              .where(sql`${catalog.columns.parent_table}=${`${own}.id_parent`}`),
          )
        )[0]?.premake,
      ).toBe(2);
    } finally {
      await connection.close();
    }
  } finally {
    await clean();
    await oracle.end();
  }
}, 120000);
