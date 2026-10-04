import pg from "pg";
import { call, Procedure } from "@orpc/server";
import assert from "node:assert/strict";
import { defineRelations, sql } from "drizzle-orm";
import { eventIterator } from "../../../apps/loom/src/core/contract";
import { hstoreTextSchema, type HstoreValue } from "../../../apps/loom/src/core/extensions/hstore-codec";
import { Context } from "effect";
import * as v from "valibot";
import { createHstoreRecord_1_8 } from "../../../apps/loom/src/core/extensions/hstore-record";
import { bindSchemaNamespace, defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase, type DatabaseConnection } from "../../../apps/loom/src/core/server/database/connection";
import { createProjectProcedures } from "../../../apps/loom/src/core/server/rpc/procedure";
import { bindRpcDatabaseProcedure, createDatabaseMiddleware } from "../../../apps/loom/src/core/server/rpc/database";
import { Invocation } from "../../../apps/loom/src/core/server/effect/runtime";
import { createRpcRuntime } from "../../../apps/loom/src/core/server/rpc-runtime";
import { createLiveContext } from "../../../apps/loom/src/core/server/rpc/live-context";
import { defineApplication } from "../../../apps/loom/src/core/server/application/definition";
import { defineComponent } from "../../../apps/loom/src/core/server/components/definition";
import { defineRpcAuth } from "../../../apps/loom/src/core/server/auth/rpc-definition";
import { bootstrapSession } from "../../../apps/loom/src/tooling/migrations/bootstrap";
import { componentNamespace } from "../../../apps/loom/src/tooling/project/component-namespace";
import { hstoreSchema, withNativeHstore } from "./hstore-codec";

export const recordAuthoredSchema = defineSchema((field) => ({
  recordShadow: {
    displayName: field.text().notNull(),
    recordShadow: field.text(),
    count: field.integer(),
    enabled: field.boolean(),
    giant: field.bigint(),
    amount: field.numeric({ precision: 8, scale: 2 }),
    token: field.uuid(),
    payload: field.json(),
    status: field.enum(["open", "closed"]).notNull(),
    parentRef: field.reference("recordShadow"),
  },
  timedRecord: { at: field.timestamp() },
}));
export const recordNamespace = componentNamespace("hstore_record");
// SAFETY: bindSchemaNamespace recompiles these same declarations; it changes only the physical namespace.
export const recordSchema = bindSchemaNamespace(recordAuthoredSchema, recordNamespace) as typeof recordAuthoredSchema;
export const recordRelations = defineRelations(recordSchema.tables);
export const recordApi = createHstoreRecord_1_8({
  name: "hstore",
  version: "1.8",
  schema: hstoreSchema,
  apiSupport: { status: "verified", digest: "cea995a9f416f391e531e262624a397016d7fc562ef1c78cb7247dd76d98daf1" },
});
export const wrongRecordNamespace = componentNamespace("wrong_record");
export const wrongRecordTable = `${pg.escapeIdentifier(wrongRecordNamespace)}.record_shadow`;
export const recordTable = `${pg.escapeIdentifier(recordNamespace)}.record_shadow`;
export const rowId = "018ef1b0-4f00-7000-8000-000000000001";
export const danglingId = "018ef1b0-4f00-7000-8000-000000000099";
type Connection = DatabaseConnection<typeof recordRelations>;
export interface ManagedRecordLiveFixture {
  readonly stream: AsyncIteratorObject<HstoreValue, void>;
  readonly metadataNamespace: string;
  readonly rootNamespace: string;
}
export interface HstoreRecordFixture {
  readonly client: pg.Client;
  readonly connection: Connection;
  readonly withManagedLive: (work: (fixture: ManagedRecordLiveFixture) => Promise<void>) => Promise<void>;
  readonly invoke: (work: (db: Connection["db"]) => Promise<void>, operation?: "query" | "mutation") => Promise<void>;
}
export async function withHstoreRecords(work: (fixture: HstoreRecordFixture) => Promise<void>) {
  await withNativeHstore(async (client, url) => {
    await client.query(`create schema ${pg.escapeIdentifier(recordNamespace)}`);
    // Physical order deliberately differs from Kello metadata; a dropped column leaves an attnum gap.
    await client.query(
      `create table ${recordTable} (_id uuid primary key, "_createdAt" bigint not null, record_shadow text, count int4, enabled bool, giant int8, amount numeric(8,2), token uuid, payload jsonb, status text not null check(status in ('open','closed')), parent_ref uuid references ${recordTable}(_id), obsolete text)`,
    );
    await client.query(`alter table ${recordTable} drop column obsolete`);
    await client.query(`alter table ${recordTable} add column display_name text not null`);
    await client.query(
      `create table ${pg.escapeIdentifier(recordNamespace)}.timed_record (_id uuid primary key, "_createdAt" bigint not null, at timestamptz)`,
    );
    await client.query(`create table ${pg.escapeIdentifier(recordNamespace)}.writes (value text)`);
    await client.query(
      `insert into ${recordTable} (_id,"_createdAt",record_shadow,count,enabled,giant,amount,token,payload,status,display_name) values ($1,42,'column shadow',7,true,9223372036854775807,1.25,$1,'{"a":1}','open','before')`,
      [rowId],
    );
    // A real sibling physical table tests SQL range-table identity, independently of graph ownership.
    await client.query(`create schema ${pg.escapeIdentifier(wrongRecordNamespace)}`);
    await client.query(`create table ${wrongRecordTable} (like ${recordTable} including all)`);
    await client.query(`insert into ${wrongRecordTable} select * from ${recordTable}`);
    await client.query(`update ${wrongRecordTable} set display_name='wrong namespace'`);
    const connection = await connectDatabase({
      schema: recordSchema,
      relations: recordRelations,
      connectionString: url,
    });
    const invoke: HstoreRecordFixture["invoke"] = async (operationWork, operation = "query") => {
      const route = bindRpcDatabaseProcedure(
        createProjectProcedures(recordSchema, recordRelations)
          .procedure.use(createDatabaseMiddleware(recordRelations, "automatic", recordSchema))
          .input(v.null())
          .output(v.null())
          .handler(async ({ context }) => {
            await operationWork(context.db);
            return null;
          }),
        {
          connection,
          replay: { metadataNamespace: "loom_fixture_meta", deployment: "fixture" },
          authorize: async () => {},
        },
      );
      const invocation = { identity: null, requestId: crypto.randomUUID(), signal: new AbortController().signal };
      await call(route, null, {
        context: { ...invocation, operation, "effect/context": Context.make(Invocation, invocation) },
      });
    };
    try {
      await work({
        client,
        connection,
        invoke,
        withManagedLive: (liveWork) => withManagedRecordLive(client, url, liveWork),
      });
    } finally {
      await connection.close();
    }
  });
}

/** Explicit fixture bootstrap, then the production mounted runtime and its real revision readers. */
async function withManagedRecordLive(
  client: pg.Client,
  connectionString: string,
  work: (fixture: ManagedRecordLiveFixture) => Promise<void>,
) {
  const metadataNamespace = `loom_hstore_live_${crypto.randomUUID().replaceAll("-", "")}`;
  const rootNamespace = `${metadataNamespace}_app`;
  const runtimeRole = `${metadataNamespace}_role`;
  let bootstrapped = false;
  try {
    await bootstrapSession(client, metadataNamespace, runtimeRole);
    bootstrapped = true;
    await client.query(`create schema ${pg.escapeIdentifier(rootNamespace)}`);
    await client.query(
      `create table ${pg.escapeIdentifier(rootNamespace)}.membership (_id uuid primary key, "_createdAt" bigint not null, allowed boolean not null)`,
    );
    await client.query(`insert into ${pg.escapeIdentifier(rootNamespace)}.membership values ($1,42,true)`, [rowId]);
    await client.query(
      `insert into ${pg.escapeIdentifier(metadataNamespace)}.table_revisions(namespace,table_name,revision) values ($1,'membership',1),($2,'record_shadow',1),($2,'timed_record',1)`,
      [rootNamespace, recordNamespace],
    );
    await client.query(
      `create trigger record_live_revision after insert or update or delete on ${recordTable} for each statement execute function ${pg.escapeIdentifier(metadataNamespace)}.advance_table_revision()`,
    );
    const rootSchema = defineSchema((field) => ({ membership: { allowed: field.boolean().notNull() } }), {
      namespace: rootNamespace,
    });
    const application = defineApplication({ rpc: ({ os }) => ({ os }) });
    application.use(defineComponent({ name: "hstore_record" }));
    const liveValue = v.strictObject({
      entries: v.array(v.strictObject({ key: hstoreTextSchema, value: v.nullable(hstoreTextSchema) })),
    });
    const live = createProjectProcedures(recordSchema, recordRelations)
      .procedure.use(createDatabaseMiddleware(recordRelations, "read", recordSchema))
      .output(eventIterator(liveValue))
      .handler(({ context }) =>
        createLiveContext(context)(async ({ db }) => {
          const witness = recordApi.record.tableRow(recordSchema, "recordShadow");
          const rows = await db.select({ value: recordApi.fromRecord(witness) }).from(recordSchema.tables.recordShadow);
          assert.equal(rows.length, 1);
          // Validate the serializable event DTO; the native codec's public entries type is readonly.
          return v.parse(liveValue, rows[0]!.value);
        }),
      );
    const runtime = await createRpcRuntime({
      schema: rootSchema,
      relations: defineRelations(rootSchema.tables),
      application,
      environment: {},
      connectionString,
      metadataNamespace,
      version: "a".repeat(64),
      deployment: "hstore-record-live",
      assertActive: async () => {},
      config: { realtime: { pollIntervalMs: 100 } },
      auth: defineRpcAuth({
        authorize: async ({ db }) => {
          assert(db);
          const membership = await db.execute<{ allowed: boolean }>(
            sql`select allowed from ${sql.identifier(rootNamespace)}.membership`,
          );
          assert.equal(membership.rows[0]?.allowed, true);
        },
      }),
      scopes: [
        { name: "", dependencies: { hstore_record: "hstore_record" }, schema: rootSchema },
        { name: "hstore_record", dependencies: {}, schema: recordSchema },
      ],
      exposures: [{ scope: "hstore_record", prefix: "records" }],
      procedures: [{ scope: "hstore_record", path: ["live"], visibility: "exported", procedure: live }],
    });
    try {
      const router = runtime.router.records;
      assert(router && !(router instanceof Procedure) && "live" in router && router.live instanceof Procedure);
      const invocation = { identity: null, requestId: crypto.randomUUID(), signal: AbortSignal.timeout(10000) };
      const context = {
        ...invocation,
        expiresAt: Math.floor(Date.now() / 1000) + 60,
        "effect/context": Context.make(Invocation, invocation),
      };
      // SAFETY: this exact exposed leaf declares the eventIterator(HstoreValue) contract above.
      const stream = (await call(router.live, undefined, { context, path: ["live"] })) as AsyncIteratorObject<
        HstoreValue,
        void
      >;
      try {
        await work({ stream, metadataNamespace, rootNamespace });
      } finally {
        await stream.return?.();
      }
    } finally {
      await runtime.stop();
    }
  } finally {
    if (bootstrapped) {
      // Removing the disposable metadata function also removes its child-table trigger.
      await client.query(`drop schema if exists ${pg.escapeIdentifier(metadataNamespace)} cascade`);
      await client.query(`drop schema if exists ${pg.escapeIdentifier(rootNamespace)} cascade`);
      await client.query(`grant ${pg.escapeIdentifier(runtimeRole)} to current_user`);
      await client.query(`drop owned by ${pg.escapeIdentifier(runtimeRole)}`);
      await client.query(`drop role if exists ${pg.escapeIdentifier(runtimeRole)}`);
    }
  }
}
