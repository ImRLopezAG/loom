export const wave10GeneratedSelection = {
  citext: { version: "1.8", schema: "case_text" },
  cube: { version: "1.5", schema: "cube_types" },
  autoinc: { version: "1.0", schema: "callbacks" },
  moddatetime: { version: "1.0", schema: "callbacks" },
  pgstattuple: { version: "1.5", schema: "statistics" },
  pgrowlocks: { version: "1.2", schema: "statistics" },
  tsm_system_rows: { version: "1.0", schema: "sampling" },
  tsm_system_time: { version: "1.0", schema: "sampling" },
  intagg: { version: "1.1", schema: "arrays" },
  dict_int: { version: "1.0", schema: "dictionaries" },
} as const;

export const wave10GeneratedSchema = `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
export default defineSchema(f => ({ records: {
  number: f.integer(), updated: f.timestamp(), label: extensions.citext.field(), coordinate: extensions.cube.field(),
} }), {
  namespace: "app",
  triggers: tables => [
    extensions.autoinc.trigger({ name: "assign_number", table: tables.records, events: ["insert"], columns: [{ column: tables.records.number, sequence: { schema: "sequences", name: "record_seq" } }] }),
    extensions.moddatetime.trigger({ name: "touch", table: tables.records, column: tables.records.updated }),
  ],
});`;

export const wave10GeneratedOutput = `v.strictObject({
  equal: v.nullable(v.boolean()), distance: v.nullable(v.union([v.number(), v.strictObject({ nonfinite: v.picklist(["NaN", "Infinity", "-Infinity"]) })])),
  numbers: v.array(v.nullable(v.number())), arrayBounds: v.array(v.strictObject({ lowerBound: v.number(), length: v.number() })),
  sampleRows: v.number(), sampleTimeRows: v.number(),
  pageCount: v.bigint(), lockCount: v.number(), dictionarySchema: v.string(),
  dictionaryName: v.string(), families: v.array(v.string()),
})`;

// This source runs inside each generated scope. Its output crosses the real procedure validator.
export const wave10GeneratedQuery = `
if (Object.keys(extensions.autoinc.sql.functions).length || Object.keys(extensions.moddatetime.sql.functions).length || Object.keys(extensions.dict_int.sql.functions).length) throw new Error("Internal callbacks became RPC-callable");
const [scalar] = await db.select({
  equal: extensions.citext.equal(tables.records.label, "MIXED"),
  distance: extensions.cube.distance(tables.records.coordinate, extensions.cube.fromNumber(2)),
}).from(tables.records).orderBy(tables.records.number).limit(1);
if (!scalar) throw new Error("Missing generated scope fixture");
const [aggregate] = await db.select({ numbers: extensions.intagg.intArrayAggregate(tables.records.number) }).from(tables.records);
if (!aggregate?.numbers) throw new Error("Missing native aggregate");
if (aggregate.numbers.dimensions.length !== 1) throw new Error("This fixture requires a one-dimensional aggregate");
const numbers = aggregate.numbers.values.map(value => {
  if (value !== null && typeof value !== "number") throw new Error("Unexpected aggregate rank");
  return value;
});
const rows = await db.select({ number: sql<number | null>\`\${tables.records.number}\` }).from(extensions.tsm_system_rows.systemRows(tables.records, 1));
const timed = await db.select({ number: sql<number | null>\`\${tables.records.number}\` }).from(extensions.tsm_system_time.systemTime(tables.records, Infinity));
const [pages] = await db.select({ count: extensions.pgstattuple.relationPages(tables.records) }).from(sql.raw("(values (1)) fixture(id)"));
if (!pages) throw new Error("Missing physical statistics");
const locks = extensions.pgrowlocks.rows(tables.records);
const observedLocks = await db.select({ tid: locks.columns.locked_row }).from(locks.from);
const arrayBounds = aggregate.numbers.dimensions.map(({ lowerBound, length }) => ({ lowerBound, length }));
const dictionary = extensions.dict_int.dictionary;
if (dictionary.schema !== "dictionaries" || dictionary.name !== "intdict") throw new Error("Generated dictionary binding differs from selection");
return { ...scalar, numbers, arrayBounds,
  sampleRows: rows.length, sampleTimeRows: timed.length, pageCount: pages.count,
  lockCount: observedLocks.length, dictionarySchema: dictionary.schema, dictionaryName: dictionary.name,
  families: Object.keys(extensions).sort(),
};`;
