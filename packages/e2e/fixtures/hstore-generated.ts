/** Generated handlers execute every portable captured identity; host receipts are separate. */
export const hstoreGeneratedPlacement = "custom_hstore";
export const hstoreGeneratedHandler = `const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
if (binding !== context.extensions) throw new Error("RPC and Effect Hstore differ");
const api = binding.hstore;
const version: "1.8" = api.version;
const placement: 'custom_hstore' = api.schema;
const mapping = api.value([
  { key: "stored", value: null },
  { key: "string", value: "NULL" },
  { key: "key", value: "日本" },
  { key: "__proto__", value: "data" },
]);
const other = api.value([
  { key: "stored", value: null },
  { key: "new", value: "new" },
]);
const textArray = { dimensions: [{ lowerBound: -2, length: 2 }], values: ["key", "value"] };
const cases = [
  {
    member: "cast:$extension:hstore.hstore->pg_catalog.json",
    expression: api.sql.overloads["cast:$extension:hstore.hstore->pg_catalog.json"](mapping),
  },
  {
    member: "cast:$extension:hstore.hstore->pg_catalog.jsonb",
    expression: api.sql.overloads["cast:$extension:hstore.hstore->pg_catalog.jsonb"](mapping),
  },
  {
    member: "cast:pg_catalog._text->$extension:hstore.hstore",
    expression: api.sql.overloads["cast:pg_catalog._text->$extension:hstore.hstore"](textArray),
  },
  {
    member: "operator:$extension:hstore.-($extension:hstore.hstore,$extension:hstore.hstore)",
    expression: api.sql.overloads["operator:$extension:hstore.-($extension:hstore.hstore,$extension:hstore.hstore)"](
      mapping,
      other,
    ),
  },
  {
    member: "operator:$extension:hstore.-($extension:hstore.hstore,pg_catalog._text)",
    expression: api.sql.overloads["operator:$extension:hstore.-($extension:hstore.hstore,pg_catalog._text)"](
      mapping,
      textArray,
    ),
  },
  {
    member: "operator:$extension:hstore.-($extension:hstore.hstore,pg_catalog.text)",
    expression: api.sql.overloads["operator:$extension:hstore.-($extension:hstore.hstore,pg_catalog.text)"](
      mapping,
      "key",
    ),
  },
  {
    member: "operator:$extension:hstore.->($extension:hstore.hstore,pg_catalog._text)",
    expression: api.sql.overloads["operator:$extension:hstore.->($extension:hstore.hstore,pg_catalog._text)"](
      mapping,
      textArray,
    ),
  },
  {
    member: "operator:$extension:hstore.->($extension:hstore.hstore,pg_catalog.text)",
    expression: api.sql.overloads["operator:$extension:hstore.->($extension:hstore.hstore,pg_catalog.text)"](
      mapping,
      "key",
    ),
  },
  {
    member: "operator:$extension:hstore.?($extension:hstore.hstore,pg_catalog.text)",
    expression: api.sql.overloads["operator:$extension:hstore.?($extension:hstore.hstore,pg_catalog.text)"](
      mapping,
      "key",
    ),
  },
  {
    member: "operator:$extension:hstore.?&($extension:hstore.hstore,pg_catalog._text)",
    expression: api.sql.overloads["operator:$extension:hstore.?&($extension:hstore.hstore,pg_catalog._text)"](
      mapping,
      textArray,
    ),
  },
  {
    member: "operator:$extension:hstore.?|($extension:hstore.hstore,pg_catalog._text)",
    expression: api.sql.overloads["operator:$extension:hstore.?|($extension:hstore.hstore,pg_catalog._text)"](
      mapping,
      textArray,
    ),
  },
  {
    member: "operator:$extension:hstore.@>($extension:hstore.hstore,$extension:hstore.hstore)",
    expression: api.sql.overloads["operator:$extension:hstore.@>($extension:hstore.hstore,$extension:hstore.hstore)"](
      mapping,
      other,
    ),
  },
  {
    member: "operator:$extension:hstore.#<#($extension:hstore.hstore,$extension:hstore.hstore)",
    expression: api.sql.overloads["operator:$extension:hstore.#<#($extension:hstore.hstore,$extension:hstore.hstore)"](
      mapping,
      other,
    ),
  },
  {
    member: "operator:$extension:hstore.#<=#($extension:hstore.hstore,$extension:hstore.hstore)",
    expression: api.sql.overloads["operator:$extension:hstore.#<=#($extension:hstore.hstore,$extension:hstore.hstore)"](
      mapping,
      other,
    ),
  },
  {
    member: "operator:$extension:hstore.#>#($extension:hstore.hstore,$extension:hstore.hstore)",
    expression: api.sql.overloads["operator:$extension:hstore.#>#($extension:hstore.hstore,$extension:hstore.hstore)"](
      mapping,
      other,
    ),
  },
  {
    member: "operator:$extension:hstore.#>=#($extension:hstore.hstore,$extension:hstore.hstore)",
    expression: api.sql.overloads["operator:$extension:hstore.#>=#($extension:hstore.hstore,$extension:hstore.hstore)"](
      mapping,
      other,
    ),
  },
  {
    member: "operator:$extension:hstore.%#(,$extension:hstore.hstore)",
    expression: api.sql.overloads["operator:$extension:hstore.%#(,$extension:hstore.hstore)"](mapping),
  },
  {
    member: "operator:$extension:hstore.%%(,$extension:hstore.hstore)",
    expression: api.sql.overloads["operator:$extension:hstore.%%(,$extension:hstore.hstore)"](mapping),
  },
  {
    member: "operator:$extension:hstore.<@($extension:hstore.hstore,$extension:hstore.hstore)",
    expression: api.sql.overloads["operator:$extension:hstore.<@($extension:hstore.hstore,$extension:hstore.hstore)"](
      mapping,
      other,
    ),
  },
  {
    member: "operator:$extension:hstore.<>($extension:hstore.hstore,$extension:hstore.hstore)",
    expression: api.sql.overloads["operator:$extension:hstore.<>($extension:hstore.hstore,$extension:hstore.hstore)"](
      mapping,
      other,
    ),
  },
  {
    member: "operator:$extension:hstore.=($extension:hstore.hstore,$extension:hstore.hstore)",
    expression: api.sql.overloads["operator:$extension:hstore.=($extension:hstore.hstore,$extension:hstore.hstore)"](
      mapping,
      other,
    ),
  },
  {
    member: "operator:$extension:hstore.||($extension:hstore.hstore,$extension:hstore.hstore)",
    expression: api.sql.overloads["operator:$extension:hstore.||($extension:hstore.hstore,$extension:hstore.hstore)"](
      mapping,
      other,
    ),
  },
  {
    member: "routine:$extension:hstore.akeys($extension:hstore.hstore)",
    expression: api.sql.overloads["routine:$extension:hstore.akeys($extension:hstore.hstore)"](mapping),
  },
  {
    member: "routine:$extension:hstore.avals($extension:hstore.hstore)",
    expression: api.sql.overloads["routine:$extension:hstore.avals($extension:hstore.hstore)"](mapping),
  },
  {
    member: "routine:$extension:hstore.defined($extension:hstore.hstore,pg_catalog.text)",
    expression: api.sql.overloads["routine:$extension:hstore.defined($extension:hstore.hstore,pg_catalog.text)"](
      mapping,
      "key",
    ),
  },
  {
    member: "routine:$extension:hstore.delete($extension:hstore.hstore,$extension:hstore.hstore)",
    expression: api.sql.overloads[
      "routine:$extension:hstore.delete($extension:hstore.hstore,$extension:hstore.hstore)"
    ](mapping, other),
  },
  {
    member: "routine:$extension:hstore.delete($extension:hstore.hstore,pg_catalog._text)",
    expression: api.sql.overloads["routine:$extension:hstore.delete($extension:hstore.hstore,pg_catalog._text)"](
      mapping,
      textArray,
    ),
  },
  {
    member: "routine:$extension:hstore.delete($extension:hstore.hstore,pg_catalog.text)",
    expression: api.sql.overloads["routine:$extension:hstore.delete($extension:hstore.hstore,pg_catalog.text)"](
      mapping,
      "key",
    ),
  },
  {
    member: "routine:$extension:hstore.each($extension:hstore.hstore)",
    expression: api.sql.overloads["routine:$extension:hstore.each($extension:hstore.hstore)"](mapping),
  },
  {
    member: "routine:$extension:hstore.exist($extension:hstore.hstore,pg_catalog.text)",
    expression: api.sql.overloads["routine:$extension:hstore.exist($extension:hstore.hstore,pg_catalog.text)"](
      mapping,
      "key",
    ),
  },
  {
    member: "routine:$extension:hstore.exists_all($extension:hstore.hstore,pg_catalog._text)",
    expression: api.sql.overloads["routine:$extension:hstore.exists_all($extension:hstore.hstore,pg_catalog._text)"](
      mapping,
      textArray,
    ),
  },
  {
    member: "routine:$extension:hstore.exists_any($extension:hstore.hstore,pg_catalog._text)",
    expression: api.sql.overloads["routine:$extension:hstore.exists_any($extension:hstore.hstore,pg_catalog._text)"](
      mapping,
      textArray,
    ),
  },
  {
    member: "routine:$extension:hstore.fetchval($extension:hstore.hstore,pg_catalog.text)",
    expression: api.sql.overloads["routine:$extension:hstore.fetchval($extension:hstore.hstore,pg_catalog.text)"](
      mapping,
      "key",
    ),
  },
  {
    member: "routine:$extension:hstore.hs_concat($extension:hstore.hstore,$extension:hstore.hstore)",
    expression: api.sql.overloads[
      "routine:$extension:hstore.hs_concat($extension:hstore.hstore,$extension:hstore.hstore)"
    ](mapping, other),
  },
  {
    member: "routine:$extension:hstore.hs_contained($extension:hstore.hstore,$extension:hstore.hstore)",
    expression: api.sql.overloads[
      "routine:$extension:hstore.hs_contained($extension:hstore.hstore,$extension:hstore.hstore)"
    ](mapping, other),
  },
  {
    member: "routine:$extension:hstore.hs_contains($extension:hstore.hstore,$extension:hstore.hstore)",
    expression: api.sql.overloads[
      "routine:$extension:hstore.hs_contains($extension:hstore.hstore,$extension:hstore.hstore)"
    ](mapping, other),
  },
  {
    member: "routine:$extension:hstore.hstore_cmp($extension:hstore.hstore,$extension:hstore.hstore)",
    expression: api.sql.overloads[
      "routine:$extension:hstore.hstore_cmp($extension:hstore.hstore,$extension:hstore.hstore)"
    ](mapping, other),
  },
  {
    member: "routine:$extension:hstore.hstore_eq($extension:hstore.hstore,$extension:hstore.hstore)",
    expression: api.sql.overloads[
      "routine:$extension:hstore.hstore_eq($extension:hstore.hstore,$extension:hstore.hstore)"
    ](mapping, other),
  },
  {
    member: "routine:$extension:hstore.hstore_ge($extension:hstore.hstore,$extension:hstore.hstore)",
    expression: api.sql.overloads[
      "routine:$extension:hstore.hstore_ge($extension:hstore.hstore,$extension:hstore.hstore)"
    ](mapping, other),
  },
  {
    member: "routine:$extension:hstore.hstore_gt($extension:hstore.hstore,$extension:hstore.hstore)",
    expression: api.sql.overloads[
      "routine:$extension:hstore.hstore_gt($extension:hstore.hstore,$extension:hstore.hstore)"
    ](mapping, other),
  },
  {
    member: "routine:$extension:hstore.hstore_hash_extended($extension:hstore.hstore,pg_catalog.int8)",
    expression: api.sql.overloads[
      "routine:$extension:hstore.hstore_hash_extended($extension:hstore.hstore,pg_catalog.int8)"
    ](mapping, 1n),
  },
  {
    member: "routine:$extension:hstore.hstore_hash($extension:hstore.hstore)",
    expression: api.sql.overloads["routine:$extension:hstore.hstore_hash($extension:hstore.hstore)"](mapping),
  },
  {
    member: "routine:$extension:hstore.hstore_le($extension:hstore.hstore,$extension:hstore.hstore)",
    expression: api.sql.overloads[
      "routine:$extension:hstore.hstore_le($extension:hstore.hstore,$extension:hstore.hstore)"
    ](mapping, other),
  },
  {
    member: "routine:$extension:hstore.hstore_lt($extension:hstore.hstore,$extension:hstore.hstore)",
    expression: api.sql.overloads[
      "routine:$extension:hstore.hstore_lt($extension:hstore.hstore,$extension:hstore.hstore)"
    ](mapping, other),
  },
  {
    member: "routine:$extension:hstore.hstore_ne($extension:hstore.hstore,$extension:hstore.hstore)",
    expression: api.sql.overloads[
      "routine:$extension:hstore.hstore_ne($extension:hstore.hstore,$extension:hstore.hstore)"
    ](mapping, other),
  },
  {
    member: "routine:$extension:hstore.hstore_send($extension:hstore.hstore)",
    expression: api.sql.overloads["routine:$extension:hstore.hstore_send($extension:hstore.hstore)"](mapping),
  },
  {
    member: "routine:$extension:hstore.hstore_to_array($extension:hstore.hstore)",
    expression: api.sql.overloads["routine:$extension:hstore.hstore_to_array($extension:hstore.hstore)"](mapping),
  },
  {
    member: "routine:$extension:hstore.hstore_to_json_loose($extension:hstore.hstore)",
    expression: api.sql.overloads["routine:$extension:hstore.hstore_to_json_loose($extension:hstore.hstore)"](mapping),
  },
  {
    member: "routine:$extension:hstore.hstore_to_json($extension:hstore.hstore)",
    expression: api.sql.overloads["routine:$extension:hstore.hstore_to_json($extension:hstore.hstore)"](mapping),
  },
  {
    member: "routine:$extension:hstore.hstore_to_jsonb_loose($extension:hstore.hstore)",
    expression: api.sql.overloads["routine:$extension:hstore.hstore_to_jsonb_loose($extension:hstore.hstore)"](mapping),
  },
  {
    member: "routine:$extension:hstore.hstore_to_jsonb($extension:hstore.hstore)",
    expression: api.sql.overloads["routine:$extension:hstore.hstore_to_jsonb($extension:hstore.hstore)"](mapping),
  },
  {
    member: "routine:$extension:hstore.hstore_to_matrix($extension:hstore.hstore)",
    expression: api.sql.overloads["routine:$extension:hstore.hstore_to_matrix($extension:hstore.hstore)"](mapping),
  },
  {
    member: "routine:$extension:hstore.hstore_version_diag($extension:hstore.hstore)",
    expression: api.sql.overloads["routine:$extension:hstore.hstore_version_diag($extension:hstore.hstore)"](mapping),
  },
  {
    member: "routine:$extension:hstore.hstore(pg_catalog._text,pg_catalog._text)",
    expression: api.sql.overloads["routine:$extension:hstore.hstore(pg_catalog._text,pg_catalog._text)"](
      textArray,
      textArray,
    ),
  },
  {
    member: "routine:$extension:hstore.hstore(pg_catalog._text)",
    expression: api.sql.overloads["routine:$extension:hstore.hstore(pg_catalog._text)"](textArray),
  },
  {
    member: "routine:$extension:hstore.hstore(pg_catalog.text,pg_catalog.text)",
    expression: api.sql.overloads["routine:$extension:hstore.hstore(pg_catalog.text,pg_catalog.text)"]("key", "key"),
  },
  {
    member: "routine:$extension:hstore.isdefined($extension:hstore.hstore,pg_catalog.text)",
    expression: api.sql.overloads["routine:$extension:hstore.isdefined($extension:hstore.hstore,pg_catalog.text)"](
      mapping,
      "key",
    ),
  },
  {
    member: "routine:$extension:hstore.isexists($extension:hstore.hstore,pg_catalog.text)",
    expression: api.sql.overloads["routine:$extension:hstore.isexists($extension:hstore.hstore,pg_catalog.text)"](
      mapping,
      "key",
    ),
  },
  {
    member: "routine:$extension:hstore.skeys($extension:hstore.hstore)",
    expression: api.sql.overloads["routine:$extension:hstore.skeys($extension:hstore.hstore)"](mapping),
  },
  {
    member: "routine:$extension:hstore.slice_array($extension:hstore.hstore,pg_catalog._text)",
    expression: api.sql.overloads["routine:$extension:hstore.slice_array($extension:hstore.hstore,pg_catalog._text)"](
      mapping,
      textArray,
    ),
  },
  {
    member: "routine:$extension:hstore.slice($extension:hstore.hstore,pg_catalog._text)",
    expression: api.sql.overloads["routine:$extension:hstore.slice($extension:hstore.hstore,pg_catalog._text)"](
      mapping,
      textArray,
    ),
  },
  {
    member: "routine:$extension:hstore.svals($extension:hstore.hstore)",
    expression: api.sql.overloads["routine:$extension:hstore.svals($extension:hstore.hstore)"](mapping),
  },
  {
    member: "routine:$extension:hstore.tconvert(pg_catalog.text,pg_catalog.text)",
    expression: api.sql.overloads["routine:$extension:hstore.tconvert(pg_catalog.text,pg_catalog.text)"]("key", "key"),
  },
];
for (const item of cases) {
  const rows = await context.db.select({ value: item.expression }).from(sql.raw("(values(1)) fixture(id)"));
  if (!rows.length) throw new Error(\`Missing result for \${item.member}\`);
}
const witness = api.record.tableType(schema, "records");
const converted = api.sql.overloads["routine:$extension:hstore.hstore(pg_catalog.record)"](witness);
const populated = api.sql.overloads[
  "routine:$extension:hstore.populate_record(pg_catalog.anyelement,$extension:hstore.hstore)"
](witness, api.value([{ key: "label", value: "populated" }]));
const replaced = api.sql.overloads["operator:$extension:hstore.#=(pg_catalog.anyelement,$extension:hstore.hstore)"](
  witness,
  api.value([{ key: "label", value: "replaced" }]),
);
const [records] = await context.db
  .select({ converted, populated: populated.fields.label, replaced: replaced.fields.label })
  .from(sql.raw("(values(1)) fixture(id)"));
if (
  !records ||
  records.populated !== "populated" ||
  records.replaced !== "replaced" ||
  !records.converted.entries.some(({ key, value }) => key === "label" && value === null)
)
  throw new Error("Wrong record decode");
const [result] = await context.db
  .select({
    stored: api.get(mapping, "stored"),
    literal: api.get(mapping, "string"),
    missing: api.get(mapping, "absent"),
    exists: api.hasKey(mapping, "stored"),
    defined: api.isDefined(mapping, "stored"),
    keys: api.keys(mapping),
    json: api.toJsonb(mapping),
  })
  .from(sql.raw("(values(1)) fixture(id)"));
if (
  !result ||
  result.stored !== null ||
  result.literal !== "NULL" ||
  result.missing !== null ||
  result.exists !== true ||
  result.defined !== false ||
  result.keys?.dimensions[0]?.length !== 4 ||
  result.json?.type !== "jsonb"
)
  throw new Error("Wrong native Hstore decode");
const members = [
  ...cases.map(({ member }) => member),
  "routine:$extension:hstore.hstore(pg_catalog.record)",
  "routine:$extension:hstore.populate_record(pg_catalog.anyelement,$extension:hstore.hstore)",
  "operator:$extension:hstore.#=(pg_catalog.anyelement,$extension:hstore.hstore)",
].sort();
if (members.join("\\n") !== Object.keys(api.sql.overloads).sort().join("\\n"))
  throw new Error("Wrong generated member inventory");
`;
export const hstoreGeneratedOutput =
  'v.object({version:v.literal("1.8"),placement:v.literal(\'custom_hstore\'),members:v.array(v.string()),populated:v.literal("populated"),replaced:v.literal("replaced")})';
