import { expect, test } from "bun:test";
import pg from "pg";
import assert from "node:assert/strict";
import { asc, defineRelations, eq, sql } from "drizzle-orm";
import * as v from "valibot";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { createUuidOssp_1_1 } from "../../../apps/loom/src/core/extensions/adapters/uuid-ossp";
import { uuidCodec } from "../../../apps/loom/src/core/extensions/native-uuid-codec";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { deserializeRpcValue, serializeRpcValue, rpcValue } from "../../../apps/loom/src/core/server/rpc/serialization";
import { evaluateSnapshot } from "../../../apps/loom/src/core/server/rpc/snapshot";

test("PostgreSQL 18 UUID-OSSP 1.1 native constants, algorithms, strict NULLs and UUID canonicalization", async () => {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      const server = await client.query<{ server_version_num: string }>("SHOW server_version_num");
      expect(Number(server.rows[0]!.server_version_num)).toBeGreaterThanOrEqual(180000);
      expect(Number(server.rows[0]!.server_version_num)).toBeLessThan(190000);
      await client.query("CREATE SCHEMA custom; CREATE EXTENSION \"uuid-ossp\" WITH SCHEMA custom VERSION '1.1'");
      const constants = await client.query(
        "SELECT custom.uuid_nil() AS nil, custom.uuid_ns_dns() AS dns, custom.uuid_ns_url() AS url, custom.uuid_ns_oid() AS oid, custom.uuid_ns_x500() AS x500",
      );
      expect(constants.rows).toEqual([
        {
          nil: "00000000-0000-0000-0000-000000000000",
          dns: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
          url: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
          oid: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
          x500: "6ba7b814-9dad-11d1-80b4-00c04fd430c8",
        },
      ]);
      const named = await client.query(
        "SELECT custom.uuid_generate_v3(custom.uuid_ns_dns(), 'www.widgets.com') AS v3, custom.uuid_generate_v5(custom.uuid_ns_dns(), 'www.widgets.com') AS v5, custom.uuid_generate_v3(NULL, 'x') AS null_namespace, custom.uuid_generate_v5(custom.uuid_ns_dns(), NULL) AS null_name",
      );
      expect(named.rows).toEqual([
        {
          v3: "3d813cbb-47fb-32ba-91df-831e1593ac29",
          v5: "21f7f8de-8051-5b89-8680-0195ef798b6a",
          null_namespace: null,
          null_name: null,
        },
      ]);
      const canonical = await client.query("SELECT $1::uuid AS maximum, $2::uuid AS arbitrary", [
        "FFFFFFFF-FFFF-FFFF-FFFF-FFFFFFFFFFFF",
        "a0eebc99-9c0b-0ef8-0b6d-6bb9bd380a11",
      ]);
      expect(canonical.rows).toEqual([
        { maximum: "ffffffff-ffff-ffff-ffff-ffffffffffff", arbitrary: "a0eebc99-9c0b-0ef8-0b6d-6bb9bd380a11" },
      ]);
      const generated = await client.query<{ v1: string; v1mc: string; v4: string }>(
        "SELECT custom.uuid_generate_v1() AS v1, custom.uuid_generate_v1mc() AS v1mc, custom.uuid_generate_v4() AS v4",
      );
      expect(generated.rows[0]!.v1).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-1[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
      expect(generated.rows[0]!.v1mc).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-1[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
      expect(Number.parseInt(generated.rows[0]!.v1mc.slice(24, 26), 16) & 1).toBe(1);
      expect(generated.rows[0]!.v4).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
    } finally {
      await client.end();
    }
  });
});

// oxlint-disable-next-line anti-slop/no-unknown-parameters -- Validate the actual RPC serialization boundary, including decoded native UUIDs and SQL NULL.
function rpcRoundTrip(value: unknown) {
  return deserializeRpcValue(serializeRpcValue(v.parse(rpcValue, value)));
}

test("UUID-OSSP all ten typed routines compose with native UUID storage, defaults, transactions and RPC", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(
      (fields) => ({ names: { id: fields.uuid().notNull(), namespace: fields.uuid(), name: fields.text() } }),
      { namespace: "app" },
    );
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    const extension = createUuidOssp_1_1({
      name: "uuid-ossp",
      version: "1.1",
      schema: 'custom"uuid',
      apiSupport: { status: "verified" },
    });
    try {
      await connection.db.execute(
        sql`create schema "custom""uuid"; create extension "uuid-ossp" with schema "custom""uuid" version '1.1'; create schema app; create table app.names("_id" uuid not null default gen_random_uuid(), "_createdAt" bigint not null default 0, id uuid not null default ${extension.v4()}, namespace uuid, name text)`,
      );
      const installed = await connection.db.execute(
        sql`select e.extversion, n.nspname from pg_catalog.pg_extension e join pg_catalog.pg_namespace n on n.oid=e.extnamespace where e.extname='uuid-ossp'`,
      );
      expect(installed.rows).toEqual([{ extversion: "1.1", nspname: 'custom"uuid' }]);
      await connection.db.execute(
        sql`insert into app.names(namespace,name) values (${extension.namespaceDns()}, 'www.widgets.com')`,
      );
      const inserted = await connection.transaction(async (db) =>
        db
          .insert(schema.tables.names)
          .values({ id: extension.v4(), namespace: extension.namespaceDns(), name: "é你好🙂" })
          .returning(),
      );
      expect(inserted[0]!.id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/);
      const values = await connection.transaction(async (db) =>
        db
          .select({
            nil: extension.nil(),
            dns: extension.namespaceDns(),
            url: extension.namespaceUrl(),
            oid: extension.namespaceOid(),
            x500: extension.namespaceX500(),
            v1: extension.v1(),
            v1mc: extension.v1mc(),
            v4: extension.v4(),
            v3: extension.v3(schema.tables.names.namespace, schema.tables.names.name),
            v5: extension.sql.functions.uuid_generate_v5(schema.tables.names.namespace, schema.tables.names.name),
            id: schema.tables.names.id,
            name: schema.tables.names.name,
          })
          .from(schema.tables.names)
          .orderBy(asc(extension.v3(schema.tables.names.namespace, schema.tables.names.name))),
      );
      expect(
        values.map(({ nil, dns, url, oid, x500, v3, v5, name }) => ({ nil, dns, url, oid, x500, v3, v5, name })),
      ).toEqual([
        {
          nil: "00000000-0000-0000-0000-000000000000",
          dns: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
          url: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
          oid: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
          x500: "6ba7b814-9dad-11d1-80b4-00c04fd430c8",
          v3: "3d813cbb-47fb-32ba-91df-831e1593ac29",
          v5: "21f7f8de-8051-5b89-8680-0195ef798b6a",
          name: "www.widgets.com",
        },
        {
          nil: "00000000-0000-0000-0000-000000000000",
          dns: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
          url: "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
          oid: "6ba7b812-9dad-11d1-80b4-00c04fd430c8",
          x500: "6ba7b814-9dad-11d1-80b4-00c04fd430c8",
          v3: "ed9da1c4-4356-36b3-8999-8c9a183047e2",
          v5: "9000a598-f927-5099-b790-e38d47a5ea3c",
          name: "é你好🙂",
        },
      ]);
      for (const row of values) {
        for (const value of [row.id, row.v1, row.v1mc, row.v4]) expect(uuidCodec.decode(value)).toBe(value);
        expect(row.v1.slice(14, 15)).toBe("1");
        expect(row.v1mc.slice(14, 15)).toBe("1");
        expect(Number.parseInt(row.v1mc.slice(24, 26), 16) & 1).toBe(1);
        expect(row.v4.slice(14, 15)).toBe("4");
      }
      assert.deepEqual(rpcRoundTrip(values), values);
      const variants = await connection.db
        .select({
          namespaceNullV3: extension.v3(null, "name"),
          nameNullV3: extension.v3(extension.namespaceDns(), null),
          namespaceNullV5: extension.v5(null, "name"),
          nameNullV5: extension.v5(extension.namespaceDns(), null),
          emptyV3: extension.v3(extension.namespaceDns(), ""),
          emptyV5: extension.v5(extension.namespaceDns(), ""),
          nestedV3: extension.v3(extension.namespaceDns(), "www.widgets.com"),
          canonicalV5: extension.v5("6BA7B810-9DAD-11D1-80B4-00C04FD430C8", "www.widgets.com"),
          directAliasedV3: extension.v3(
            extension.namespaceDns().as("namespace"),
            sql<string>`'www.widgets.com'`.as("name"),
          ),
          directAliasedV5: extension.v5(
            extension.namespaceDns().as("namespace"),
            sql<string>`'www.widgets.com'`.as("name"),
          ),
          composedV3: extension.v3(extension.namespaceDns(), "é"),
          decomposedV3: extension.v3(extension.namespaceDns(), "e\u0301"),
          composedV5: extension.v5(extension.namespaceDns(), "é"),
          decomposedV5: extension.v5(extension.namespaceDns(), "e\u0301"),
        })
        .from(sql`(values (1)) as fixture(value)`);
      expect(variants).toEqual([
        {
          namespaceNullV3: null,
          nameNullV3: null,
          namespaceNullV5: null,
          nameNullV5: null,
          emptyV3: "c87ee674-4ddc-3efe-a74e-dfe25da5d7b3",
          emptyV5: "4ebd0208-8328-5d69-8c44-ec50939c0967",
          nestedV3: "3d813cbb-47fb-32ba-91df-831e1593ac29",
          canonicalV5: "21f7f8de-8051-5b89-8680-0195ef798b6a",
          directAliasedV3: "3d813cbb-47fb-32ba-91df-831e1593ac29",
          directAliasedV5: "21f7f8de-8051-5b89-8680-0195ef798b6a",
          composedV3: "3a356d77-46a8-3ec1-8205-b80596740632",
          decomposedV3: "9f114bc3-8448-31ed-a79f-45fb09b6a200",
          composedV5: "ebfe0af8-3997-5ade-b634-ba92cf69f557",
          decomposedV5: "39004b7f-2a0b-588c-88f7-aa24552a7636",
        },
      ]);
      assert.deepEqual(rpcRoundTrip(variants), variants);
      const sorted = await connection.db
        .select({ value: extension.v5(schema.tables.names.namespace, schema.tables.names.name).as("value") })
        .from(schema.tables.names)
        .orderBy(asc(sql`value`));
      expect(sorted).toEqual([
        { value: "21f7f8de-8051-5b89-8680-0195ef798b6a" },
        { value: "9000a598-f927-5099-b790-e38d47a5ea3c" },
      ]);
      const subquery = connection.db
        .select({ value: extension.v3(extension.namespaceDns(), "www.widgets.com").as("value") })
        .from(sql`(values (1)) as fixture(value)`)
        .as("derived");
      const composed = await connection.db.select({ value: extension.v5(subquery.value, "é你好🙂") }).from(subquery);
      expect(composed).toEqual([{ value: "27ea83b7-092d-578b-b7aa-84ecf4e0fca6" }]);
      const matched = await connection.db
        .select({ name: schema.tables.names.name })
        .from(schema.tables.names)
        .where(
          eq(
            extension.v3(schema.tables.names.namespace, schema.tables.names.name),
            "3d813cbb-47fb-32ba-91df-831e1593ac29",
          ),
        );
      expect(matched).toEqual([{ name: "www.widgets.com" }]);
    } finally {
      await connection.close();
    }
  });
});

test("UUID-OSSP random and time generators reject automatic live queries, including prepared queries", async () => {
  await withExtensionDatabase(async (url) => {
    const schema = defineSchema(() => ({}));
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    const extension = createUuidOssp_1_1({
      name: "uuid-ossp",
      version: "1.1",
      schema: "custom",
      apiSupport: { status: "verified" },
    });
    try {
      await connection.db.execute(
        sql`create schema custom; create extension "uuid-ossp" with schema custom version '1.1'`,
      );
      for (const expression of [
        extension.v1(),
        extension.v1mc(),
        extension.v4(),
        extension.v5(extension.v4().as("random_namespace"), "name"),
      ]) {
        const query = connection.db.select({ value: expression }).from(sql`(values (1)) as fixture(value)`);
        const prepared = query.prepare();
        const ordinary = await prepared.execute();
        const value = ordinary[0]!.value;
        assert(value !== null);
        expect(uuidCodec.decode(value)).toBe(value);
        await Promise.resolve(
          expect(evaluateSnapshot(async () => query.execute())).rejects.toThrow(
            "Automatic live query cannot observe external extension dependency",
          ),
        );
        await Promise.resolve(
          expect(evaluateSnapshot(async () => prepared.execute())).rejects.toThrow(
            "Automatic live query cannot observe external extension dependency",
          ),
        );
      }
    } finally {
      await connection.close();
    }
  });
});
