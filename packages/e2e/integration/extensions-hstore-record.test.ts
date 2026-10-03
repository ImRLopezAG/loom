import { test } from "bun:test";
import pg from "pg";
import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import {
  recordApi as api,
  recordAuthoredSchema,
  recordSchema as schema,
  recordNamespace,
  recordTable,
  wrongRecordTable,
  rowId,
  danglingId,
  withHstoreRecords,
} from "../fixtures/hstore-record";
import { hstoreFunction, observeNativeHstore, orderedHstoreEntries } from "../fixtures/hstore-codec";
import { int4Codec } from "../../../apps/loom/src/core/extensions/native-codecs";
import { textCodec, withCodecSqlType } from "../../../apps/loom/src/core/extensions/codecs";
import { evaluateSnapshot } from "../../../apps/loom/src/core/server/rpc/snapshot";
import { bindSchemaNamespace } from "../../../apps/loom/src/core/schema/define-schema";
import { componentNamespace } from "../../../apps/loom/src/tooling/project/component-namespace";
import type { NamedHstoreRecord } from "../../../apps/loom/src/core/extensions/hstore-record";

const seed = sql`(values (1)) seed(value)`;
const writes = sql`${sql.identifier(recordNamespace)}.${sql.identifier("writes")}`;

test("hstore.record.allThreeNamedMembersUseRealComponentScopeAndNativeAttributeNames", async () => {
  await withHstoreRecords(async ({ client, invoke }) => {
    const native = await observeNativeHstore(
      client,
      `(select ${hstoreFunction("hstore")}(record_shadow.*) from ${recordTable})`,
    );
    await invoke(async (db) => {
      const witness = api.record.tableRow(schema, "recordShadow");
      const actual = await db.select({ value: api.fromRecord(witness) }).from(schema.tables.recordShadow);
      assert.equal(actual.length, 1);
      assert.deepEqual(orderedHstoreEntries(actual[0]!.value.entries), orderedHstoreEntries(native.entries));
      const patched = api.sql.operators["#="](witness, {
        entries: [
          { key: "display_name", value: "after" },
          { key: "record_shadow", value: "new shadow" },
        ],
      });
      const populated = api.populateRecord(witness, {
        entries: [
          { key: "display_name", value: "after" },
          { key: "record_shadow", value: "new shadow" },
        ],
      });
      const projected = await db
        .select({
          name: patched.fields.displayName,
          shadow: patched.fields.recordShadow,
          count: patched.fields.count,
          viaFunction: populated.fields.displayName,
        })
        .from(schema.tables.recordShadow);
      assert.deepEqual(projected, [{ name: "after", shadow: "new shadow", count: 7, viaFunction: "after" }]);
      const sqlOracle = await client.query(
        `select (record_shadow.* operator(${pg.escapeIdentifier(api.schema)}.#=) ${hstoreFunction("hstore")}('display_name','after')).display_name name,(${hstoreFunction("populate_record")}(record_shadow.*,${hstoreFunction("hstore")}('record_shadow','new shadow'))).record_shadow shadow from ${recordTable}`,
      );
      assert.deepEqual(sqlOracle.rows, [{ name: "after", shadow: "new shadow" }]);
      assert.equal(patched.attributes.displayName, "display_name");
      const nested = db
        .select({ name: patched.fields.displayName.as("name") })
        .from(schema.tables.recordShadow)
        .as("record_rewrite");
      assert.deepEqual(await db.select({ name: nested.name }).from(nested), [{ name: "after" }]);
      assert.deepEqual(
        await db
          .select({ name: nested.name })
          .from(sql`(values (1)) seed(value)`)
          .crossJoinLateral(nested),
        [{ name: "after" }],
      );
    });
    const attributes = await client.query<{ name: string; position: number }>(
      "select attname name,attnum position from pg_catalog.pg_attribute where attrelid=$1::regclass and attnum>0 and not attisdropped order by attnum",
      [recordTable],
    );
    assert.equal(attributes.rows.at(-1)?.name, "display_name");
    assert.ok(
      attributes.rows.some(({ position }, index) => position !== index + 1),
      "Dropped attribute must leave a physical-order gap",
    );
  });
});

test("hstore.record.distinguishesNullCompositeFromAllNullFieldsAndRewritesUnmatchedJoin", async () => {
  await withHstoreRecords(async ({ client, invoke }) => {
    await invoke(async (db) => {
      const type = api.record.tableType(schema, "recordShadow");
      const nullFunction = api.populateRecord(type, null);
      const emptyFunction = api.populateRecord(type, { entries: [] });
      const nullOperator = api.sql.operators["#="](type, null);
      const emptyOperator = api.sql.operators["#="](type, { entries: [] });
      const result = await db
        .select({
          nullFunction: nullFunction.isNull,
          emptyFunction: emptyFunction.isNull,
          nullOperator: nullOperator.isNull,
          emptyOperator: emptyOperator.isNull,
          requiredName: emptyFunction.fields.displayName,
          requiredId: emptyFunction.fields._id,
          enumStatus: emptyFunction.fields.status,
        })
        .from(seed);
      assert.deepEqual(result, [
        {
          nullFunction: true,
          emptyFunction: false,
          nullOperator: true,
          emptyOperator: false,
          requiredName: null,
          requiredId: null,
          enumStatus: null,
        },
      ]);
      const raw = await client.query(
        `select (${hstoreFunction("populate_record")}(null::${recordTable},null)) is not distinct from null "nullFunction",(${hstoreFunction("populate_record")}(null::${recordTable},''::${hstoreFunction("hstore")})) is not distinct from null "emptyFunction",(null::${recordTable} operator(${pg.escapeIdentifier(api.schema)}.#=) null) is not distinct from null "nullOperator",(null::${recordTable} operator(${pg.escapeIdentifier(api.schema)}.#=) ''::${hstoreFunction("hstore")}) is not distinct from null "emptyOperator"`,
      );
      assert.deepEqual(raw.rows, [
        { nullFunction: true, emptyFunction: false, nullOperator: true, emptyOperator: false },
      ]);
      const stores = await db
        .select({
          nullType: api.fromRecord(type),
          nullFields: api.fromRecord(emptyFunction.record),
        })
        .from(seed);
      assert.deepEqual(stores[0]!.nullType, stores[0]!.nullFields);
      assert.equal(stores[0]!.nullType.entries.length, Object.keys(emptyFunction.attributes).length);
      assert.ok(stores[0]!.nullType.entries.every(({ value }) => value === null));
      const row = api.record.tableRow(schema, "recordShadow");
      for (const mapping of [null, { entries: [] }] as const) {
        const unchanged = api.populateRecord(row, mapping);
        const unchangedOp = api.sql.operators["#="](row, mapping);
        assert.deepEqual(
          await db
            .select({ name: unchanged.fields.displayName, operatorName: unchangedOp.fields.displayName })
            .from(schema.tables.recordShadow),
          [{ name: "before", operatorName: "before" }],
        );
      }
      const changed = api.sql.operators["#="](row, { entries: [{ key: "display_name", value: "from absent row" }] });
      const changedFunction = api.populateRecord(row, { entries: [{ key: "display_name", value: "from absent row" }] });
      const unmatched = await db
        .select({
          original: api.fromRecord(row),
          isNull: changed.isNull,
          name: changed.fields.displayName,
          functionName: changedFunction.fields.displayName,
          count: changed.fields.count,
        })
        .from(sql`(values (1)) seed(value)`)
        .leftJoin(schema.tables.recordShadow, sql`false`);
      assert.equal(unmatched.length, 1);
      assert.equal(unmatched[0]!.isNull, false);
      assert.equal(unmatched[0]!.name, "from absent row");
      assert.equal(unmatched[0]!.functionName, "from absent row");
      assert.equal(unmatched[0]!.count, null);
      assert.ok(unmatched[0]!.original.entries.every(({ value }) => value === null));
      const unmatchedNative = await client.query(
        `select (record_shadow.*) is not distinct from null original_null,(record_shadow.* operator(${pg.escapeIdentifier(api.schema)}.#=) ${hstoreFunction("hstore")}('display_name','from absent row')) is not distinct from null rewritten_null from (values (1)) seed(value) left join ${recordTable} on false`,
      );
      assert.deepEqual(unmatchedNative.rows, [{ original_null: true, rewritten_null: false }]);
    });
  });
});

test("hstore.record.nativeTextCoercionTypmodsKeysAndRealColumnDecoders", async () => {
  await withHstoreRecords(async ({ client, invoke }) => {
    const entries = [
      { key: "display_name", value: null },
      { key: "displayName", value: "ignored camel key" },
      { key: "unknown", value: "ignored extra key" },
      { key: "count", value: " 19 " },
      { key: "enabled", value: "yes" },
      { key: "giant", value: "-9223372036854775808" },
      { key: "amount", value: "1.235" },
      { key: "token", value: rowId },
      { key: "payload", value: '{"b":2,"a":1}' },
      { key: "status", value: "closed" },
      { key: "parent_ref", value: danglingId },
    ];
    const native = await client.query(
      `with result as (select ${hstoreFunction("populate_record")}(record_shadow.*,${hstoreFunction("hstore")}($1::text[],$2::text[])) value from ${recordTable}) select (value).display_name name,(value).count count,(value).enabled enabled,(value).giant::text giant,(value).amount::text amount,(value).token token,(value).payload payload,(value).status status,(value).parent_ref "parentRef",(value)."_createdAt"::text created from result`,
      [entries.map(({ key }) => key), entries.map(({ value }) => value)],
    );
    assert.equal(native.rows.length, 1);
    assert.deepEqual(native.rows, [
      {
        name: null,
        count: 19,
        enabled: true,
        giant: "-9223372036854775808",
        amount: "1.24",
        token: rowId,
        payload: { a: 1, b: 2 },
        status: "closed",
        parentRef: danglingId,
        created: "42",
      },
    ]);
    await invoke(async (db) => {
      const witness = api.record.tableRow(schema, "recordShadow");
      for (const result of [api.populateRecord(witness, { entries }), api.sql.operators["#="](witness, { entries })]) {
        const actual = await db
          .select({
            name: result.fields.displayName,
            count: result.fields.count,
            enabled: result.fields.enabled,
            giant: result.fields.giant,
            amount: result.fields.amount,
            token: result.fields.token,
            payload: result.fields.payload,
            status: result.fields.status,
            parentRef: result.fields.parentRef,
            created: result.fields._createdAt,
          })
          .from(schema.tables.recordShadow);
        assert.deepEqual(actual, [{ ...native.rows[0], giant: -9223372036854775808n, created: 42 }]);
      }
      const absent = api.populateRecord(witness, { entries: [{ key: "displayName", value: "ignored" }] });
      assert.deepEqual(await db.select({ name: absent.fields.displayName }).from(schema.tables.recordShadow), [
        { name: "before" },
      ]);
      const anonymous = api.record.anonymousRow([
        [int4Codec, 7],
        [textCodec, "日本"],
      ] as const);
      const result = await db.select({ value: api.fromRecord(anonymous) }).from(seed);
      const oracle = await observeNativeHstore(
        client,
        `${hstoreFunction("hstore")}(row(7::pg_catalog.int4,'日本'::pg_catalog.text))`,
      );
      assert.deepEqual(orderedHstoreEntries(result[0]!.value.entries), orderedHstoreEntries(oracle.entries));
    });
    for (const mapping of [
      { entries: [{ key: "count", value: "invalid" }] },
      { entries: [{ key: "amount", value: "1000000.00" }] },
    ]) {
      await assert.rejects(
        invoke(async (db) => {
          await db.execute(sql`insert into ${writes} values (${"must rollback"})`);
          const invalid = api.populateRecord(api.record.tableType(schema, "recordShadow"), mapping);
          await db.select({ count: invalid.fields.count, amount: invalid.fields.amount }).from(seed);
        }, "mutation"),
      );
    }
    assert.deepEqual((await client.query(`select value from ${recordNamespace}.writes`)).rows, []);
  });
});

test("hstore.record.caughtEnumDecodeFailurePoisonsActualMutation", async () => {
  await withHstoreRecords(async ({ client, invoke }) => {
    let caught = 0;
    await assert.rejects(
      invoke(async (db) => {
        await db.execute(sql`insert into ${writes} values (${"before decode"})`);
        const value = api.populateRecord(api.record.tableType(schema, "recordShadow"), {
          entries: [{ key: "status", value: "outside_enum" }],
        });
        try {
          await db.select({ status: value.fields.status }).from(seed);
        } catch {
          caught++;
        }
        await db.execute(sql`insert into ${writes} values (${"after caught decode"})`);
      }, "mutation"),
    );
    assert.equal(caught, 1);
    assert.deepEqual((await client.query(`select value from ${recordNamespace}.writes`)).rows, []);
    // A composite result bypasses the source table's enum CHECK: the output decoder owns this refusal.
    const native = await client.query(
      `select (${hstoreFunction("populate_record")}(null::${recordTable},${hstoreFunction("hstore")}('status','outside_enum'))).status status`,
    );
    assert.deepEqual(native.rows, [{ status: "outside_enum" }]);
    await invoke(async (db) => {
      const value = api.populateRecord(api.record.tableType(schema, "recordShadow"), {
        entries: [{ key: "status", value: "open" }],
      });
      assert.deepEqual(await db.select({ status: value.fields.status }).from(seed), [{ status: "open" }]);
      await db.execute(sql`insert into ${writes} values (${"valid"})`);
    }, "mutation");
    assert.deepEqual((await client.query(`select value from ${recordNamespace}.writes`)).rows, [{ value: "valid" }]);
  });
});

test("hstore.record.componentOwnershipAndExpiredWitnessRefusalsPoisonWrites", async () => {
  await withHstoreRecords(async ({ client, invoke }) => {
    const other = bindSchemaNamespace(recordAuthoredSchema, componentNamespace("other_record"));
    for (const invalidSchema of [recordAuthoredSchema, other]) {
      let caught = 0;
      await assert.rejects(
        invoke(async (db) => {
          await db.execute(sql`insert into ${writes} values (${"wrong component"})`);
          try {
            api.record.tableType(invalidSchema, "recordShadow");
          } catch {
            caught++;
          }
          await db.execute(sql`insert into ${writes} values (${"after caught ownership"})`);
        }, "mutation"),
      );
      assert.equal(caught, 1);
    }
    let captured: NamedHstoreRecord<typeof schema.tables.recordShadow> | undefined;
    await invoke(async () => {
      captured = api.record.tableRow(schema, "recordShadow");
    });
    assert.ok(captured);
    let caughtExpired = 0;
    await assert.rejects(
      invoke(async (db) => {
        await db.execute(sql`insert into ${writes} values (${"expired witness"})`);
        try {
          const value = api.populateRecord(captured!, null);
          await db.select({ name: value.fields.displayName }).from(schema.tables.recordShadow);
        } catch {
          caughtExpired++;
        }
        await db.execute(sql`insert into ${writes} values (${"after caught expired witness"})`);
      }, "mutation"),
    );
    assert.equal(caughtExpired, 1);
    assert.deepEqual((await client.query(`select value from ${recordNamespace}.writes`)).rows, []);
  });
});

test("hstore.record.timestampTextIsSessionDependentAndAutomaticLiveRefusesIt", async () => {
  await withHstoreRecords(async ({ invoke }) => {
    const observed: string[] = [];
    await invoke(async (db) => {
      for (const zone of ["UTC", "America/Los_Angeles"]) {
        await db.execute(sql`select pg_catalog.set_config('TimeZone',${zone},true)`);
        const populated = api.populateRecord(api.record.tableType(schema, "timedRecord"), {
          entries: [{ key: "at", value: "2026-10-03 00:00:00+00" }],
        });
        const rows = await db.select({ text: api.fromRecord(populated.record), at: populated.fields.at }).from(seed);
        assert.equal(rows[0]!.at?.toISOString(), "2026-10-03T00:00:00.000Z");
        const at = rows[0]!.text.entries.find(({ key }) => key === "at")?.value;
        assert.ok(at);
        observed.push(at);
        const direct = await db.execute(
          sql`select ${sql.identifier(api.schema)}.fetchval(${sql.identifier(api.schema)}.hstore(${sql.identifier(api.schema)}.populate_record(null::${sql.identifier(recordNamespace)}.timed_record,${sql.identifier(api.schema)}.hstore('at','2026-10-03 00:00:00+00'))),'at') value`,
        );
        assert.equal(direct.rows[0]!.value, at);
      }
    });
    assert.notEqual(observed[0], observed[1]);
    await assert.rejects(
      evaluateSnapshot(async () => {
        // Catching the procedure error must still preserve the snapshot's session-dependency refusal.
        try {
          await invoke(async (db) => {
            const value = api.populateRecord(api.record.tableType(schema, "timedRecord"), { entries: [] });
            await db.select({ at: value.fields.at }).from(seed);
          });
        } catch {}
      }),
      /session extension dependency/,
    );
  });
});

test("hstore.record.caughtCreatedAtDecodeFailurePoisonsActualMutation", async () => {
  await withHstoreRecords(async ({ client, invoke }) => {
    const native = await client.query(
      `select (${hstoreFunction("populate_record")}(null::${recordTable},${hstoreFunction("hstore")}('_createdAt','9223372036854775807')))."_createdAt"::text created`,
    );
    assert.deepEqual(native.rows, [{ created: "9223372036854775807" }]);
    let caught = 0;
    await assert.rejects(
      invoke(async (db) => {
        await db.execute(sql`insert into ${writes} values (${"before unsafe milliseconds"})`);
        const value = api.populateRecord(api.record.tableType(schema, "recordShadow"), {
          entries: [{ key: "_createdAt", value: "9223372036854775807" }],
        });
        try {
          await db.select({ created: value.fields._createdAt }).from(seed);
        } catch {
          caught++;
        }
        await db.execute(sql`insert into ${writes} values (${"after caught unsafe milliseconds"})`);
      }, "mutation"),
    );
    assert.equal(caught, 1);
    assert.deepEqual((await client.query(`select value from ${recordNamespace}.writes`)).rows, []);
    await invoke(async (db) => {
      const value = api.populateRecord(api.record.tableType(schema, "recordShadow"), {
        entries: [{ key: "_createdAt", value: "42" }],
      });
      assert.deepEqual(await db.select({ created: value.fields._createdAt }).from(seed), [{ created: 42 }]);
    });
  });
});

test("hstore.record.sameNamedWrongNamespaceCannotSupplyTheWitnessedWholeRow", async () => {
  await withHstoreRecords(async ({ client, invoke }) => {
    assert.deepEqual((await client.query(`select display_name from ${wrongRecordTable}`)).rows, [
      { display_name: "wrong namespace" },
    ]);
    await assert.rejects(
      client.query(`select ${hstoreFunction("hstore")}(${recordTable}.*) from ${wrongRecordTable}`),
      /FROM-clause/,
    );
    await assert.rejects(
      invoke(async (db) => {
        await db.execute(sql`insert into ${writes} values (${"wrong physical namespace"})`);
        const witnessed = api.record.tableRow(schema, "recordShadow");
        await db.select({ value: api.fromRecord(witnessed) }).from(sql.raw(wrongRecordTable));
      }, "mutation"),
    );
    assert.deepEqual((await client.query(`select value from ${recordNamespace}.writes`)).rows, []);
    await invoke(async (db) => {
      const witnessed = api.record.tableRow(schema, "recordShadow");
      const rows = await db.select({ value: api.fromRecord(witnessed) }).from(schema.tables.recordShadow);
      assert.equal(rows[0]!.value.entries.find(({ key }) => key === "display_name")?.value, "before");
    });
  });
});

test("hstore.record.anonymousUnreviewedTypeIORefusesBeforeSqlAndDoesNotPoisonTheInvocation", async () => {
  await withHstoreRecords(async ({ invoke }) => {
    await invoke(async (db) => {
      let refused = 0;
      try {
        api.record.anonymousRow([[api.codec, { entries: [] }]] as const);
      } catch (error) {
        assert.match(String(error), /reviewed pg_catalog SQL type/);
        refused++;
      }
      for (const type of [
        { schema: api.schema, name: "hstore", array: true },
        { schema: api.schema, name: "citext", array: true },
        { schema: "pg_catalog", name: "regclass" },
        { schema: "pg_catalog", name: "record" },
        { schema: "pg_catalog", name: "regclass", array: true },
      ]) {
        const codec = withCodecSqlType(textCodec, type);
        try {
          api.record.anonymousRow([[codec, "unsubmitted"]] as const);
        } catch (error) {
          assert.match(String(error), /reviewed pg_catalog SQL type/);
          refused++;
        }
      }
      assert.equal(refused, 6);
      const allowed = api.record.anonymousRow([[int4Codec, 7]] as const);
      const result = await db.select({ value: api.fromRecord(allowed) }).from(seed);
      assert.deepEqual(result, [{ value: { entries: [{ key: "f1", value: "7" }] } }]);
    });
  });
});

test("hstore.record.managedComponentLiveSnapshotTracksQualifiedWholeRowDependency", async () => {
  await withHstoreRecords(async ({ client, withManagedLive }) => {
    const native = await observeNativeHstore(
      client,
      `(select ${hstoreFunction("hstore")}(${recordTable}.*) from ${recordTable})`,
    );
    await withManagedLive(async ({ stream, metadataNamespace, rootNamespace }) => {
      const first = await stream.next();
      assert.equal(first.done, false);
      assert.ok(first.value);
      assert.deepEqual(orderedHstoreEntries(first.value.entries), orderedHstoreEntries(native.entries));
      assert.equal(first.value.entries.find(({ key }) => key === "display_name")?.value, "before");
      const revisions = () =>
        client.query<{ namespace: string; table: string; revision: string }>(
          `select namespace,table_name "table",revision::text revision from ${pg.escapeIdentifier(metadataNamespace)}.table_revisions order by namespace,table_name`,
        );
      const expected = [
        { namespace: rootNamespace, table: "membership", revision: "1" },
        { namespace: recordNamespace, table: "record_shadow", revision: "1" },
        { namespace: recordNamespace, table: "timed_record", revision: "1" },
      ].sort((left, right) => left.namespace.localeCompare(right.namespace) || left.table.localeCompare(right.table));
      assert.deepEqual((await revisions()).rows, expected);
      await client.query(`update ${recordTable} set display_name='after live change'`);
      const after = await stream.next();
      assert.equal(after.done, false);
      assert.ok(after.value);
      const changedNative = await observeNativeHstore(
        client,
        `(select ${hstoreFunction("hstore")}(${recordTable}.*) from ${recordTable})`,
      );
      assert.deepEqual(orderedHstoreEntries(after.value.entries), orderedHstoreEntries(changedNative.entries));
      assert.equal(after.value.entries.find(({ key }) => key === "display_name")?.value, "after live change");
      assert.deepEqual(
        (await revisions()).rows,
        expected.map((row) =>
          row.namespace === recordNamespace && row.table === "record_shadow" ? { ...row, revision: "2" } : row,
        ),
      );
    });
  });
});
