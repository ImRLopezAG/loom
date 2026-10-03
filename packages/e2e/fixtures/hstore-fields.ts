import assert from "node:assert/strict";
import { call } from "@orpc/server";
import { defineRelations } from "drizzle-orm";
import { Context } from "effect";
import pg from "pg";
import * as v from "valibot";
import type { ArrayValues, PostgreSqlArray } from "../../../apps/loom/src/core/extensions/codecs";
import type { HstoreValue } from "../../../apps/loom/src/core/extensions/hstore-codec";
import { createHstoreFields_1_8 } from "../../../apps/loom/src/core/extensions/hstore-fields";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase, type DatabaseConnection } from "../../../apps/loom/src/core/server/database/connection";
import { createProjectProcedures } from "../../../apps/loom/src/core/server/rpc/procedure";
import { bindRpcDatabaseProcedure, createDatabaseMiddleware } from "../../../apps/loom/src/core/server/rpc/database";
import { Invocation } from "../../../apps/loom/src/core/server/effect/runtime";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import {
  hstoreSchema,
  observeNativeHstore,
  observeNativeHstoreArray,
  orderedHstoreEntries,
  withNativeHstore,
} from "./hstore-codec";

export const fieldsApi = createHstoreFields_1_8({
  name: "hstore",
  version: "1.8",
  schema: hstoreSchema,
  apiSupport: { status: "verified", digest: "cea995a9f416f391e531e262624a397016d7fc562ef1c78cb7247dd76d98daf1" },
});
export const defaultMapping: HstoreValue = {
  entries: [
    { key: "default-key", value: null },
    { key: "empty", value: "" },
  ],
};
export const emptyArray: PostgreSqlArray<HstoreValue> = { dimensions: [], values: [] };
// Real field declarations produce the migration. Unicode and quotes in the installation namespace are intentional.
export const fieldsSchema = defineSchema(
  (fields) => ({
    docs: {
      label: fields.text().notNull(),
      value: fieldsApi.field(),
      other: fieldsApi.field().notNull().default(defaultMapping),
      items: fieldsApi.arrayField(),
      many: fieldsApi.arrayField().notNull().default(emptyArray),
    },
    children: {
      parentId: fields.reference("docs").notNull(),
      value: fieldsApi.field(),
      items: fieldsApi.arrayField(),
    },
    // Physically retyped to text by the fixture to inject controlled driver-text faults; never used for native assertions.
    faults: { value: fieldsApi.field(), items: fieldsApi.arrayField() },
  }),
  { namespace: "app" },
);
export const fieldsRelations = defineRelations(fieldsSchema.tables, (r) => ({
  docs: { children: r.many.children({ from: r.docs._id, to: r.children.parentId }) },
  children: { parent: r.one.docs({ from: r.children.parentId, to: r.docs._id }) },
}));
export type FieldsConnection = DatabaseConnection<typeof fieldsRelations>;
export const docsTable = "app.docs";
export const childrenTable = "app.children";

export interface ScalarCase {
  readonly name: string;
  readonly value: HstoreValue;
}
export interface ArrayCase {
  readonly name: string;
  readonly value: PostgreSqlArray<HstoreValue>;
}
const pair = (key: string, value: string | null) => ({ key, value });
export const scalarCorpus: readonly ScalarCase[] = [
  { name: "empty", value: { entries: [] } },
  {
    name: "stored-null-empty-and-null-looking-text",
    value: {
      entries: [pair("stored", null), pair("empty", ""), pair("NULL", "NULL"), pair("null", "null"), pair("", "")],
    },
  },
  {
    name: "delimiters-quotes-backslashes-and-sql",
    value: {
      entries: [
        pair('quote"\\key', "a,=>{}[]'\"\\b"),
        pair("drop;--", "'); DROP TABLE evidence; -- $$ select"),
        pair(" space key ", " space value "),
        pair("back\\slash\\\\", "\\\\path\\file"),
      ],
    },
  },
  {
    name: "prototype-names",
    value: { entries: [pair("__proto__", "data"), pair("constructor", null), pair("toString", "text")] },
  },
  {
    name: "unicode-and-normalization",
    value: {
      entries: [pair("日本語😀", "é é ﻿  "), pair("\u{10400}", "𐐀"), pair("ünï", "  "), pair("é", "é")],
    },
  },
];
export function rankedArray(rank: number, leaves: readonly (HstoreValue | null)[]): PostgreSqlArray<HstoreValue> {
  let values: ArrayValues<HstoreValue> = leaves;
  for (let depth = 1; depth < rank; depth++) values = [values];
  return {
    dimensions: Array.from({ length: rank }, (_, index) => ({
      lowerBound: index - 3,
      length: index === rank - 1 ? leaves.length : 1,
    })),
    values,
  };
}
const arrayLeaves = [scalarCorpus[1]!.value, null, scalarCorpus[0]!.value, scalarCorpus[4]!.value];
export const arrayCorpus: readonly ArrayCase[] = [
  { name: "empty", value: emptyArray },
  {
    name: "rank-one-null-empty-and-nonempty-leaves",
    value: { dimensions: [{ lowerBound: 1, length: 4 }], values: arrayLeaves },
  },
  {
    name: "rank-one-negative-lower-bound",
    value: { dimensions: [{ lowerBound: -5, length: 2 }], values: [scalarCorpus[2]!.value, null] },
  },
  {
    name: "rank-two-lower-bounds",
    value: {
      dimensions: [
        { lowerBound: -2, length: 2 },
        { lowerBound: 3, length: 2 },
      ],
      values: [
        [scalarCorpus[1]!.value, null],
        [scalarCorpus[3]!.value, scalarCorpus[4]!.value],
      ],
    },
  },
  { name: "rank-six", value: rankedArray(6, [scalarCorpus[1]!.value, null, scalarCorpus[0]!.value]) },
  {
    name: "maximum-adjacent-lower-bound",
    value: { dimensions: [{ lowerBound: 2147483646, length: 1 }], values: [scalarCorpus[3]!.value] },
  },
  { name: "all-null-leaves", value: { dimensions: [{ lowerBound: 1, length: 2 }], values: [null, null] } },
];

// PostgreSQL normalizes hstore key order, so Loom values and native observations compare canonically.
export const canonicalHstore = (value: HstoreValue): HstoreValue => ({ entries: orderedHstoreEntries(value.entries) });
const nested = (entry: HstoreValue | null | ArrayValues<HstoreValue>): entry is ArrayValues<HstoreValue> =>
  Array.isArray(entry);
function canonicalValues(values: ArrayValues<HstoreValue>): ArrayValues<HstoreValue> {
  return values.map((entry) => (nested(entry) ? canonicalValues(entry) : entry && canonicalHstore(entry)));
}
export const canonicalArray = (value: PostgreSqlArray<HstoreValue>): PostgreSqlArray<HstoreValue> => ({
  dimensions: value.dimensions,
  values: canonicalValues(value.values),
});
/** Row-major leaves, the order native unnest observes. */
export function flattenLeaves(values: ArrayValues<HstoreValue>): (HstoreValue | null)[] {
  return values.flatMap((entry) => (nested(entry) ? flattenLeaves(entry) : [entry]));
}

// Independent native oracles read stored values through each, hstore_send, array bounds and unnest, never Loom decoders.
export function observeStoredScalar(client: pg.Client, table: string, column: string, id: string) {
  return observeNativeHstore(client, `(select ${column} from ${table} where _id=$1)`, [id]);
}
export function observeStoredArray(
  client: pg.Client,
  table: string,
  column: string,
  id: string,
  value: PostgreSqlArray<HstoreValue> | null,
) {
  return observeNativeHstoreArray(
    client,
    `(select ${column} from ${table} where _id=$1)`,
    [id],
    value && value.dimensions,
    value ? flattenLeaves(value.values).map((leaf) => leaf && leaf.entries) : [],
  );
}
const nativeColumn = v.strictObject({
  name: v.string(),
  schema: v.string(),
  type: v.string(),
  elementSchema: v.nullable(v.string()),
  element: v.nullable(v.string()),
});
export async function nativeColumnTypes(client: pg.Client, table: string, columns: readonly string[]) {
  return v.parse(
    v.array(nativeColumn),
    (
      await client.query(
        `select a.attname name, tn.nspname schema, t.typname type, en.nspname "elementSchema", et.typname element
        from pg_catalog.pg_attribute a
        join pg_catalog.pg_type t on t.oid=a.atttypid
        join pg_catalog.pg_namespace tn on tn.oid=t.typnamespace
        left join pg_catalog.pg_type et on et.oid=t.typelem and t.typcategory='A'
        left join pg_catalog.pg_namespace en on en.oid=et.typnamespace
        where a.attrelid=$1::regclass and a.attname=any($2::text[]) and not a.attisdropped
        order by a.attname`,
        [table, [...columns]],
      )
    ).rows,
  );
}
export async function nativeColumnDefaults(client: pg.Client, table: string) {
  return v.parse(
    v.array(v.strictObject({ name: v.string(), expression: v.string() })),
    (
      await client.query(
        `select a.attname name, pg_catalog.pg_get_expr(d.adbin,d.adrelid) expression
        from pg_catalog.pg_attrdef d
        join pg_catalog.pg_attribute a on a.attrelid=d.adrelid and a.attnum=d.adnum
        where d.adrelid=$1::regclass
        order by a.attname`,
        [table],
      )
    ).rows,
  );
}

export interface HstoreFieldsFixture {
  readonly client: pg.Client;
  readonly connection: FieldsConnection;
  /** One real managed RPC invocation: automatic transaction, caught-decoder poisoning and invocation rollback. */
  readonly invoke: <Result>(
    work: (db: FieldsConnection["db"]) => Promise<Result>,
    operation?: "query" | "mutation",
  ) => Promise<Result>;
}
/**
 * Explicit fixture preparation: native hstore, then the real field declarations' migration as admin, then the application
 * connection. The runtime connection performs no DDL, and this fixture never starts the production runtime.
 */
export async function withHstoreFields(work: (fixture: HstoreFieldsFixture) => Promise<void>) {
  await withNativeHstore(async (client, url) => {
    const desired = await createSnapshot(fieldsSchema);
    for (const statement of await migrationStatements(await emptySnapshot("app"), desired))
      await client.query(statement);
    await client.query("create table public.hstore_field_writes(value text not null)");
    // Connect after installation: the connection resolves native array transports when it is created.
    const connection = await connectDatabase({
      schema: fieldsSchema,
      relations: fieldsRelations,
      connectionString: url,
    });
    async function invoke<Result>(
      operationWork: (db: FieldsConnection["db"]) => Promise<Result>,
      operation: "query" | "mutation" = "mutation",
    ): Promise<Result> {
      const produced: Awaited<Result>[] = [];
      const route = bindRpcDatabaseProcedure(
        createProjectProcedures(fieldsSchema, fieldsRelations)
          .procedure.use(createDatabaseMiddleware(fieldsRelations, "automatic", fieldsSchema))
          .input(v.null())
          .output(v.null())
          .handler(async ({ context }) => {
            produced.push(await operationWork(context.db));
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
      assert.equal(produced.length, 1, "The managed handler returned without completing its work");
      return produced[0]!;
    }
    try {
      await work({ client, connection, invoke });
    } finally {
      await connection.close();
    }
  });
}

/**
 * Controlled driver-text faults. Native hstore never emits malformed text, so the physical columns become text and keep
 * malformed values only to exercise the field decoders' error path. These rows are never native type-output evidence.
 */
export async function prepareDriverTextFaults(client: pg.Client) {
  await client.query(
    "alter table app.faults alter column value type text using value::text, alter column items type text using items::text",
  );
  await client.query(
    `insert into app.faults(_id,"_createdAt",value,items) values (uuidv7(),1,$1,null),(uuidv7(),2,null,$2)`,
    ['"key"=>"unterminated', "{unquoted}"],
  );
}

/**
 * Forwarding observation of the real native query path. Every pg.Client query, whether issued by the pool, a leased
 * transaction client or the fixture's admin client, is recorded and then forwarded unchanged to the native driver;
 * results, errors and ordering are the driver's. The patch is restored before the observation returns.
 */
export async function observeNativeStatements<Result>(work: () => Promise<Result>) {
  const statements: string[] = [];
  const original = pg.Client.prototype.query;
  pg.Client.prototype.query = new Proxy(original, {
    apply(target, receiver, args) {
      const query = v.safeParse(
        v.union([
          v.string(),
          v.pipe(
            v.object({ text: v.string() }),
            v.transform(({ text }) => text),
          ),
        ]),
        args[0],
      );
      statements.push(query.success ? query.output : "");
      // SAFETY: the proxy forwards the original receiver and every argument unchanged. The widened
      // overload permits forwarding only; results and errors still come from the native driver.
      const forward = target as (
        this: pg.Client,
        ...parameters: unknown[]
      ) => pg.Submittable | Promise<pg.QueryResult | pg.QueryArrayResult<unknown[]>> | void;
      return forward.apply(receiver, args);
    },
  });
  try {
    const result = await work();
    return { result, statements };
  } finally {
    pg.Client.prototype.query = original;
  }
}
/** Drizzle spells the managed target table's inserts as `insert into "app"."docs"`. */
export const insertsInto = (statements: readonly string[], table: string) => {
  const escaped = table.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return statements.filter((text) => new RegExp(`^\\s*insert\\s+into\\s+${escaped}(?=[\\s(])`, "i").test(text));
};
/** An error and its nested causes, to account for RPC or driver wrapping. */
export function causeChain(error: Error | undefined): Error[] {
  const chain: Error[] = [];
  for (let current: Error | undefined = error; current && !chain.includes(current);) {
    chain.push(current);
    current = current.cause instanceof Error ? current.cause : undefined;
  }
  return chain;
}
/** PostgreSQL server errors carry a five-character SQLSTATE; application-side encoders and decoders do not. */
export const hasSqlState = (chain: readonly Error[]) =>
  chain.some((error) => v.is(v.object({ code: v.pipe(v.string(), v.regex(/^[0-9A-Z]{5}$/)) }), error));
