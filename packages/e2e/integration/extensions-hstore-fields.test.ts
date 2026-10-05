import { test } from "bun:test";
import assert from "node:assert/strict";
import { ORPCError } from "@orpc/server";
import { eq, isNotNull, sql } from "drizzle-orm";
import * as v from "valibot";
import type { HstoreValue } from "../../../apps/loom/src/core/extensions/hstore-codec";
import { deserializeRpcValue, rpcValue, serializeRpcValue } from "../../../apps/loom/src/core/server/rpc/serialization";
import {
  createSnapshot,
  inspectSnapshot,
  migrationStatements,
  snapshotHash,
} from "../../../apps/loom/src/tooling/migrations/adapter";
import {
  hstoreSchema,
  observeNativeHstore,
  observeNativeHstoreArray,
  orderedHstoreEntries,
} from "../fixtures/hstore-codec";
import {
  arrayCorpus,
  canonicalArray,
  canonicalHstore,
  causeChain,
  childrenTable,
  defaultMapping,
  docsTable,
  emptyArray,
  fieldsSchema,
  hasSqlState,
  insertsInto,
  nativeColumnDefaults,
  nativeColumnTypes,
  observeNativeStatements,
  observeStoredArray,
  observeStoredScalar,
  prepareDriverTextFaults,
  rankedArray,
  scalarCorpus,
  withHstoreFields,
  type FieldsConnection,
} from "../fixtures/hstore-fields";

const docs = fieldsSchema.tables.docs;
const children = fieldsSchema.tables.children;
const faults = fieldsSchema.tables.faults;
async function rejection(work: () => Promise<void>): Promise<Error | undefined> {
  try {
    await work();
  } catch (error) {
    return error instanceof Error ? error : new Error(String(error));
  }
  return undefined;
}
// Encoders and decoders fail before PostgreSQL; their messages come from valibot or the hstore codecs.
const codecFailure = (error: Error) =>
  v.isValiError(error) || /^(Expected|Invalid|Duplicate|PostgreSQL|Ragged)/.test(error.message);
const entriesOf = (value: HstoreValue | null) => orderedHstoreEntries(value?.entries ?? []);

test("hstoreFields.migrationInstallsNativeScalarAndArrayTypesAndRoundTripsSnapshotsAndDefaults", async () => {
  await withHstoreFields(async ({ client, connection }) => {
    // The quoted Unicode installation namespace owns both the scalar type and its native array type.
    assert.deepEqual(await nativeColumnTypes(client, docsTable, ["value", "other", "items", "many"]), [
      { name: "items", schema: hstoreSchema, type: "_hstore", elementSchema: hstoreSchema, element: "hstore" },
      { name: "many", schema: hstoreSchema, type: "_hstore", elementSchema: hstoreSchema, element: "hstore" },
      { name: "other", schema: hstoreSchema, type: "hstore", elementSchema: null, element: null },
      { name: "value", schema: hstoreSchema, type: "hstore", elementSchema: null, element: null },
    ]);
    assert.deepEqual(await nativeColumnTypes(client, childrenTable, ["value", "items"]), [
      { name: "items", schema: hstoreSchema, type: "_hstore", elementSchema: hstoreSchema, element: "hstore" },
      { name: "value", schema: hstoreSchema, type: "hstore", elementSchema: null, element: null },
    ]);
    const desired = await createSnapshot(fieldsSchema);
    const inspected = await inspectSnapshot(connection.db, "app");
    assert.equal(snapshotHash(inspected), snapshotHash(desired));
    assert.deepEqual(await migrationStatements(inspected, desired), []);
    // Evaluate the installed default expressions natively, rather than comparing generated SQL spellings.
    const defaults = new Map((await nativeColumnDefaults(client, docsTable)).map((row) => [row.name, row.expression]));
    const other = await observeNativeHstore(client, defaults.get("other")!);
    assert.deepEqual(orderedHstoreEntries(other.entries), entriesOf(defaultMapping));
    const many = await observeNativeHstoreArray(client, defaults.get("many")!, [], [], []);
    assert.equal(many.text, "{}");
    assert.equal(defaults.has("value"), false);
    assert.equal(defaults.has("items"), false);
  });
});

test("hstoreFields.managedScalarInsertUpdateReturningAndReadsMatchNativeEachSendAndNull", async () => {
  await withHstoreFields(async ({ client, invoke }) => {
    for (const [index, { name, value }] of scalarCorpus.entries()) {
      const [row] = await invoke((db) =>
        db
          .insert(docs)
          .values({ label: name, value })
          .returning({ id: docs._id, value: docs.value, other: docs.other, many: docs.many }),
      );
      assert.ok(row?.value, name);
      assert.deepEqual(canonicalHstore(row.value), canonicalHstore(value), name);
      assert.deepEqual(canonicalHstore(row.other), canonicalHstore(defaultMapping), name);
      assert.deepEqual(row.many, emptyArray, name);
      const stored = await observeStoredScalar(client, docsTable, "value", row.id);
      assert.deepEqual(orderedHstoreEntries(stored.entries), entriesOf(value), name);
      assert.equal(stored.binary?.entries.length, value.entries.length, name);
      const read = await invoke(
        (db) => db.select({ value: docs.value }).from(docs).where(eq(docs._id, row.id)),
        "query",
      );
      assert.deepEqual(
        read.map((entry) => entry.value && canonicalHstore(entry.value)),
        [canonicalHstore(value)],
        name,
      );
      const next = scalarCorpus[(index + 1) % scalarCorpus.length]!.value;
      const [updated] = await invoke((db) =>
        db.update(docs).set({ value: next }).where(eq(docs._id, row.id)).returning({ value: docs.value }),
      );
      assert.ok(updated?.value, name);
      assert.deepEqual(canonicalHstore(updated.value), canonicalHstore(next), name);
      const replaced = await observeStoredScalar(client, docsTable, "value", row.id);
      assert.deepEqual(orderedHstoreEntries(replaced.entries), entriesOf(next), name);
      // An empty mapping and whole SQL NULL are different native states.
      await invoke((db) =>
        db
          .update(docs)
          .set({ value: { entries: [] } })
          .where(eq(docs._id, row.id)),
      );
      const empty = await observeStoredScalar(client, docsTable, "value", row.id);
      assert.equal(empty.text, "", name);
      assert.deepEqual(empty.entries, [], name);
      await invoke((db) => db.update(docs).set({ value: null }).where(eq(docs._id, row.id)));
      const missing = await observeStoredScalar(client, docsTable, "value", row.id);
      assert.equal(missing.text, null, name);
      assert.equal(missing.binary, null, name);
    }
    // One multi-row statement preserves each row's value and returning order.
    const batch = await invoke((db) =>
      db
        .insert(docs)
        .values(scalarCorpus.map(({ name, value }) => ({ label: `batch-${name}`, value })))
        .returning({ id: docs._id, value: docs.value }),
    );
    assert.equal(batch.length, scalarCorpus.length);
    for (const [index, row] of batch.entries()) {
      const { value } = scalarCorpus[index]!;
      assert.deepEqual(row.value && canonicalHstore(row.value), canonicalHstore(value));
      const native = await observeStoredScalar(client, docsTable, "value", row.id);
      assert.deepEqual(orderedHstoreEntries(native.entries), entriesOf(value));
    }
  });
});

test("hstoreFields.managedArrayInsertUpdateReturningAndReadsMatchNativeBoundsAndUnnest", async () => {
  await withHstoreFields(async ({ client, invoke }) => {
    for (const [index, { name, value }] of arrayCorpus.entries()) {
      const [row] = await invoke((db) =>
        db.insert(docs).values({ label: name, items: value }).returning({ id: docs._id, items: docs.items }),
      );
      assert.ok(row?.items, name);
      assert.deepEqual(canonicalArray(row.items), canonicalArray(value), name);
      await observeStoredArray(client, docsTable, "items", row.id, value);
      const read = await invoke(
        (db) => db.select({ items: docs.items }).from(docs).where(eq(docs._id, row.id)),
        "query",
      );
      assert.deepEqual(
        read.map((entry) => entry.items && canonicalArray(entry.items)),
        [canonicalArray(value)],
        name,
      );
      const next = arrayCorpus[(index + 1) % arrayCorpus.length]!.value;
      const [updated] = await invoke((db) =>
        db.update(docs).set({ items: next }).where(eq(docs._id, row.id)).returning({ items: docs.items }),
      );
      assert.ok(updated?.items, name);
      assert.deepEqual(canonicalArray(updated.items), canonicalArray(next), name);
      await observeStoredArray(client, docsTable, "items", row.id, next);
      // The empty array and whole SQL NULL are different native states.
      await invoke((db) => db.update(docs).set({ items: emptyArray }).where(eq(docs._id, row.id)));
      await observeStoredArray(client, docsTable, "items", row.id, emptyArray);
      await invoke((db) => db.update(docs).set({ items: null }).where(eq(docs._id, row.id)));
      await observeStoredArray(client, docsTable, "items", row.id, null);
    }
    // Every native rank from one through six keeps its bounds and nullable leaves.
    for (let rank = 1; rank <= 6; rank++) {
      const value = rankedArray(rank, [scalarCorpus[1]!.value, null, scalarCorpus[4]!.value]);
      const [row] = await invoke((db) =>
        db
          .insert(docs)
          .values({ label: `rank-${rank}`, items: value })
          .returning({ id: docs._id, items: docs.items }),
      );
      assert.ok(row?.items, `rank ${rank}`);
      assert.deepEqual(canonicalArray(row.items), canonicalArray(value), `rank ${rank}`);
      await observeStoredArray(client, docsTable, "items", row.id, value);
    }
  });
});

test("hstoreFields.wholeNullStoredNullAndEmptyStayDistinctNatively", async () => {
  await withHstoreFields(async ({ client, invoke }) => {
    const storedNull: HstoreValue = { entries: [{ key: "k", value: null }] };
    const nullLeaf = { dimensions: [{ lowerBound: 1, length: 1 }], values: [null] };
    const rows = await invoke((db) =>
      db
        .insert(docs)
        .values([
          { label: "distinct-1-sql-null", value: null, items: null },
          { label: "distinct-2-empty", value: { entries: [] }, items: emptyArray },
          { label: "distinct-3-stored-null", value: storedNull, items: nullLeaf },
        ])
        .returning({ label: docs.label, value: docs.value, items: docs.items }),
    );
    assert.deepEqual(rows, [
      { label: "distinct-1-sql-null", value: null, items: null },
      { label: "distinct-2-empty", value: { entries: [] }, items: emptyArray },
      { label: "distinct-3-stored-null", value: storedNull, items: nullLeaf },
    ]);
    const native = await client.query(
      `select label, value is null as "wholeValue", items is null as "wholeItems", pg_catalog.cardinality(items) cardinality
      from app.docs where label like 'distinct-%' order by label`,
    );
    assert.deepEqual(native.rows, [
      { label: "distinct-1-sql-null", wholeValue: true, wholeItems: true, cardinality: null },
      { label: "distinct-2-empty", wholeValue: false, wholeItems: false, cardinality: 0 },
      { label: "distinct-3-stored-null", wholeValue: false, wholeItems: false, cardinality: 1 },
    ]);
    const ids = v.parse(
      v.array(v.strictObject({ id: v.string() })),
      (await client.query("select _id id from app.docs where label='distinct-3-stored-null'")).rows,
    );
    const stored = await observeStoredScalar(client, docsTable, "value", ids[0]!.id);
    assert.deepEqual(stored.entries, [{ key: "k", value: null }]);
    await observeStoredArray(client, docsTable, "items", ids[0]!.id, nullLeaf);
  });
});

test("hstoreFields.defaultsApplyToOmittedFieldsWithoutFillingNullableFields", async () => {
  await withHstoreFields(async ({ client, invoke }) => {
    const [row] = await invoke((db) =>
      db
        .insert(docs)
        .values({ label: "defaults" })
        .returning({ id: docs._id, value: docs.value, other: docs.other, items: docs.items, many: docs.many }),
    );
    assert.ok(row);
    assert.equal(row.value, null);
    assert.equal(row.items, null);
    assert.deepEqual(canonicalHstore(row.other), canonicalHstore(defaultMapping));
    assert.deepEqual(row.many, emptyArray);
    const other = await observeStoredScalar(client, docsTable, "other", row.id);
    assert.deepEqual(orderedHstoreEntries(other.entries), entriesOf(defaultMapping));
    await observeStoredArray(client, docsTable, "many", row.id, emptyArray);
    assert.equal((await observeStoredScalar(client, docsTable, "value", row.id)).text, null);
    await observeStoredArray(client, docsTable, "items", row.id, null);
  });
});

test("hstoreFields.nestedRelationalJsonProjectionsDecodeFieldsAndSurviveRpcSerialization", async () => {
  await withHstoreFields(async ({ client, invoke }) => {
    const parent = scalarCorpus[1]!.value;
    const parentItems = arrayCorpus[3]!.value;
    const [root] = await invoke((db) =>
      db.insert(docs).values({ label: "parent", value: parent, items: parentItems }).returning({ id: docs._id }),
    );
    assert.ok(root);
    const childValues = [
      { value: scalarCorpus[2]!.value, items: arrayCorpus[1]!.value },
      { value: null, items: null },
      { value: scalarCorpus[4]!.value, items: emptyArray },
    ];
    const inserted = await invoke((db) =>
      db
        .insert(children)
        .values(childValues.map((child) => ({ parentId: root.id, ...child })))
        .returning({ id: children._id }),
    );
    assert.equal(inserted.length, childValues.length);
    const nested = await invoke(
      (db) =>
        db.query.docs.findMany({
          columns: { value: true, items: true },
          with: { children: { columns: { _id: true, value: true, items: true } } },
        }),
      "query",
    );
    assert.equal(nested.length, 1);
    const [only] = nested;
    assert.ok(only?.value && only.items);
    assert.deepEqual(canonicalHstore(only.value), canonicalHstore(parent));
    assert.deepEqual(canonicalArray(only.items), canonicalArray(parentItems));
    assert.equal(only.children.length, childValues.length);
    // Each nested child is compared with independent native observations by identity, never by relation order.
    for (const child of only.children) {
      const index = inserted.findIndex((entry) => entry.id === child._id);
      assert.notEqual(index, -1);
      const expected = childValues[index]!;
      assert.deepEqual(child.value && canonicalHstore(child.value), expected.value && canonicalHstore(expected.value));
      assert.deepEqual(child.items && canonicalArray(child.items), expected.items && canonicalArray(expected.items));
      const native = await observeStoredScalar(client, childrenTable, "value", child._id);
      assert.deepEqual(orderedHstoreEntries(native.entries), entriesOf(expected.value));
      assert.equal(native.text === null, expected.value === null);
      await observeStoredArray(client, childrenTable, "items", child._id, expected.items);
    }
    const parentRow = await observeStoredScalar(client, docsTable, "value", root.id);
    assert.deepEqual(orderedHstoreEntries(parentRow.entries), entriesOf(parent));
    assert.deepEqual(deserializeRpcValue(serializeRpcValue(v.parse(rpcValue, nested))), nested);
  });
});

test("hstoreFields.invalidInputsFailInEncodersBeforeAnyTargetInsertReachesTheNativeDriver", async () => {
  await withHstoreFields(async ({ client, connection }) => {
    const mapping = scalarCorpus[1]!.value;
    // SAFETY: these negative fixtures deliberately bypass the fixed TypeScript wrapper to reach runtime validation.
    const invalidScalars: readonly { readonly name: string; readonly input: never }[] = [
      { name: "dictionary", input: { key: "value" } as never },
      { name: "text", input: "key=>value" as never },
      { name: "map", input: new Map([["key", "value"]]) as never },
      { name: "undefined-value", input: { entries: [{ key: "k", value: undefined }] } as never },
      { name: "extra-property", input: { entries: [], extra: true } as never },
      { name: "nul-key", input: { entries: [{ key: "a\0b", value: "x" }] } as never },
      { name: "unpaired-surrogate", input: { entries: [{ key: "k", value: "\ud800" }] } as never },
      { name: "duplicate-keys", input: { entries: [...mapping.entries, ...mapping.entries] } as never },
    ];
    // SAFETY: these negative fixtures bypass the fixed array wrapper to reach runtime validation before native INSERTs.
    const invalidArrays: readonly { readonly name: string; readonly input: never }[] = [
      { name: "erased-bounds", input: [mapping] as never },
      { name: "missing-dimensions", input: { values: [mapping] } as never },
      { name: "string-leaf", input: { dimensions: [{ lowerBound: 1, length: 1 }], values: ["a=>b"] } as never },
      { name: "cardinality", input: { dimensions: [{ lowerBound: 1, length: 2 }], values: [mapping] } as never },
      {
        name: "bound-overflow",
        input: { dimensions: [{ lowerBound: 2147483647, length: 1 }], values: [mapping] } as never,
      },
      {
        name: "rank-seven",
        input: {
          dimensions: Array.from({ length: 7 }, () => ({ lowerBound: 1, length: 1 })),
          values: [[[[[[[mapping]]]]]]],
        } as never,
      },
    ];
    const target = '"app"."docs"';
    // Valid controls prove this observer sees real application INSERTs on the same native query path.
    const scalarControl = await observeNativeStatements(async () =>
      connection.db.insert(docs).values({ label: "control-scalar", value: mapping }).returning({ id: docs._id }),
    );
    assert.equal(scalarControl.result.length, 1);
    assert.equal(insertsInto(scalarControl.statements, target).length, 1, "scalar control INSERT was not observed");
    const controlItems = arrayCorpus[1]!.value;
    const arrayControl = await observeNativeStatements(async () =>
      connection.db.insert(docs).values({ label: "control-array", items: controlItems }).returning({ id: docs._id }),
    );
    assert.equal(arrayControl.result.length, 1);
    assert.equal(insertsInto(arrayControl.statements, target).length, 1, "array control INSERT was not observed");
    for (const field of ["value", "items"] as const) {
      for (const { name, input } of field === "value" ? invalidScalars : invalidArrays) {
        const attempt = await observeNativeStatements(() =>
          rejection(async () => {
            const label = `bad-${name}`;
            const row = field === "value" ? { label, value: input } : { label, items: input };
            await connection.db.insert(docs).values(row);
          }),
        );
        const failure = attempt.result;
        assert.ok(failure, `${field}:${name} was not rejected`);
        const chain = causeChain(failure);
        // A PostgreSQL rejection would carry a SQLSTATE; these failures must be application encoders.
        assert.equal(hasSqlState(chain), false, `${field}:${name} reached PostgreSQL`);
        assert.ok(chain.some(codecFailure), `${field}:${name} failed outside the field codec: ${failure.message}`);
        assert.deepEqual(insertsInto(attempt.statements, target), [], `${field}:${name} attempted an INSERT`);
        const validated = await fieldsSchema.validators.docs.insert["~standard"].validate(
          field === "value" ? { label: name, value: input } : { label: name, items: input },
        );
        assert.ok(validated.issues?.length, `${field}:${name} validator accepted`);
      }
    }
    const valid = await fieldsSchema.validators.docs.insert["~standard"].validate({ label: "valid", value: mapping });
    assert.equal(valid.issues, undefined);
    // The native table holds only the two controls.
    assert.deepEqual((await client.query("select label from app.docs order by label")).rows, [
      { label: "control-array" },
      { label: "control-scalar" },
    ]);
  });
});

interface DecodeWitness {
  selectOne: boolean;
  afterWrite: boolean;
  completed: boolean;
  inside: readonly { readonly value: string }[] | undefined;
  caught: Error | undefined;
}
test("hstoreFields.caughtFieldDecodeFailurePoisonsManagedMutationAndRollsBackBeforeAndAfter", async () => {
  await withHstoreFields(async ({ client, connection, invoke }) => {
    await prepareDriverTextFaults(client);
    const writes = () => client.query("select value from public.hstore_field_writes order by value");
    // Controlled driver-text faults exercise the field decoders' error path; they say nothing about native hstore output.
    const decoderMessage = { value: /Unterminated native hstore text/, items: /Expected quoted native hstore text/ };
    for (const boundary of ["database", "rpc"] as const) {
      for (const column of ["value", "items"] as const) {
        const witness: DecodeWitness = {
          selectOne: false,
          afterWrite: false,
          completed: false,
          inside: undefined,
          caught: undefined,
        };
        const operationWork = async (db: FieldsConnection["db"]) => {
          await db.execute(sql`insert into public.hstore_field_writes values (${`before-${column}`})`);
          try {
            await db.select({ fault: faults[column] }).from(faults).where(isNotNull(faults[column]));
          } catch (cause) {
            if (cause instanceof Error) witness.caught = cause;
          }
          // The PostgreSQL transaction remains usable, but the invocation is poisoned by the caught decode failure.
          assert.deepEqual((await db.execute(sql`select 1 value`)).rows, [{ value: 1 }]);
          witness.selectOne = true;
          await db.execute(sql`insert into public.hstore_field_writes values (${`after-${column}`})`);
          witness.afterWrite = true;
          witness.inside = v.parse(
            v.array(v.strictObject({ value: v.string() })),
            (await db.execute(sql`select value from public.hstore_field_writes order by value`)).rows,
          );
          witness.completed = true;
          return "returned";
        };
        const failure = await rejection(async () => {
          if (boundary === "database") await connection.transaction(operationWork);
          else await invoke(operationWork);
        });
        // Independent witnesses, asserted outside the invocation's rejection, prove the continuation really ran.
        assert.equal(witness.selectOne, true, `${column}: SELECT 1 did not succeed after the catch`);
        assert.equal(witness.afterWrite, true, `${column}: the after-catch write did not complete`);
        assert.equal(witness.completed, true, `${column}: the handler did not complete`);
        assert.deepEqual(witness.inside, [{ value: `after-${column}` }, { value: `before-${column}` }], column);
        const caught = witness.caught;
        assert.ok(caught, `${column}: the fault SELECT did not fail`);
        const decode = causeChain(caught);
        assert.equal(hasSqlState(decode), false, `${column}: the fault failed in PostgreSQL, not in the decoder`);
        const decoderFailure = decode.find((error) => decoderMessage[column].test(error.message));
        assert.ok(decoderFailure, `${column}: unexpected fault cause ${caught.message}`);
        // The database retains the original decoder error; the public RPC boundary deliberately redacts it.
        assert.ok(failure, `${column}: the invocation did not reject`);
        const rejectedCauses = causeChain(failure);
        assert.equal(hasSqlState(rejectedCauses), false, `${column}: the invocation rejected for a PostgreSQL error`);
        if (boundary === "database")
          assert.ok(
            rejectedCauses.includes(decoderFailure),
            `${column}: the rejection lost the original decoder cause`,
          );
        else {
          assert.ok(failure instanceof ORPCError);
          assert.equal(failure.code, "INTERNAL_SERVER_ERROR");
          assert.equal(failure.message, "Internal server error");
          assert.equal(failure.cause, undefined);
        }
        assert.deepEqual((await writes()).rows, [], column);
      }
    }
    // A later invocation inherits no sticky failure and commits its work.
    const fresh = await invoke(async (db) => {
      await db.execute(sql`insert into public.hstore_field_writes values (${"fresh"})`);
      return db
        .select({ id: faults._id })
        .from(faults)
        .where(sql`false`);
    });
    assert.deepEqual(fresh, []);
    assert.deepEqual((await writes()).rows, [{ value: "fresh" }]);
  });
});
