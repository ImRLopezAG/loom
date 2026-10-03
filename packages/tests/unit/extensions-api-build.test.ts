import { expect, test } from "vite-plus/test";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { createCitext_1_8 } from "../../../apps/loom/src/core/extensions/adapters/citext";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { buildRequiredApi } from "../../../apps/loom/src/tooling/migrations/required-api";
import {
  buildGenerationRequiredApi,
  validateGenerationRequiredApi,
  generationRequiredApiHash,
} from "../../../apps/loom/src/tooling/codegen/required-api";

const selection = { citext: { version: "1.8", schema: "extensions" } } as const;
const citext = createCitext_1_8({
  name: "citext",
  ...selection.citext,
  apiSupport: { status: "verified", digest: "bf50ef209f828f5cbd517fe1a5f0b1ede7f1bbeac379b75c0b2bc02bf0a8eee3" },
});
const schema = defineSchema(
  () => ({
    tasks: defineTable(
      { title: citext.field(), aliases: citext.arrayField() },
      {
        indexes: [
          { fields: ["title"], extension: citext.indexes.btree(), with: { fillfactor: 80 } },
          { fields: ["title"], extension: citext.indexes.btree(), with: { fillfactor: 80 } },
        ],
      },
    ),
  }),
  { namespace: "app" },
);
const plain = defineSchema((f) => ({ tasks: { title: f.text() } }), { namespace: "app" });

test("generation evidence preserves complete scoped pins and omits installation-only scopes", () => {
  const scopes = [
    { mountPath: "", namespace: "app", extensions: selection, metadata: schema.metadata },
    {
      mountPath: "search",
      namespace: "child",
      extensions: { pg_trgm: { version: "1.6", schema: "extensions" } },
      metadata: plain.metadata,
    },
    { mountPath: "auth", namespace: "auth_scope", extensions: undefined },
  ];
  const evidence = buildGenerationRequiredApi(scopes)!;
  expect(evidence.format).toBe(1);
  expect(evidence.scopes).toHaveLength(2);
  expect(evidence.scopes.find((scope) => scope.mountPath === "")?.requiredApi).toEqual(
    buildRequiredApi(selection, schema.metadata),
  );
  expect(
    evidence.scopes
      .find((scope) => scope.mountPath === "search")
      ?.requiredApi.apis.map(({ manifest }) => manifest.contract.extension),
  ).toEqual(["pg_trgm"]);
  expect(evidence.scopes[0]?.requiredApi.indexes).toHaveLength(2);
  expect(validateGenerationRequiredApi(JSON.parse(JSON.stringify(evidence)))).toEqual(evidence);
  expect(generationRequiredApiHash(buildGenerationRequiredApi([...scopes].reverse()))).toBe(
    generationRequiredApiHash(evidence),
  );
  expect(
    buildGenerationRequiredApi([{ mountPath: "", namespace: "app", extensions: undefined, metadata: plain.metadata }]),
  ).toBeUndefined();
  expect(
    buildGenerationRequiredApi([
      {
        mountPath: "",
        namespace: "app",
        extensions: { citext: { version: "future", schema: "extensions" } },
        metadata: plain.metadata,
      },
    ]),
  ).toBeUndefined();
});

test("generation identity binds software field and ordered index requirements and rejects malformed scopes", () => {
  const evidence = buildGenerationRequiredApi([
    { mountPath: "", namespace: "app", extensions: selection, metadata: schema.metadata },
  ])!;
  const changed = structuredClone(evidence);
  const field = changed.scopes[0]!.requiredApi.fields[0]!;
  field.metadata = { ...field.metadata, codec: "historical:changed" };
  expect(generationRequiredApiHash(changed)).not.toBe(generationRequiredApiHash(evidence));
  const index = structuredClone(evidence);
  index.scopes[0]!.requiredApi.indexes[0]!.declaration = {
    ...index.scopes[0]!.requiredApi.indexes[0]!.declaration,
    with: { fillfactor: 90 },
  };
  expect(generationRequiredApiHash(index)).not.toBe(generationRequiredApiHash(evidence));
  for (const invalid of [
    { ...evidence, foreign: true },
    { format: 1, scopes: [] },
    { ...evidence, scopes: [evidence.scopes[0], evidence.scopes[0]] },
    { ...evidence, scopes: [{ ...evidence.scopes[0], requiredApi: { format: 1, apis: [], fields: [], indexes: [] } }] },
  ])
    expect(() => validateGenerationRequiredApi(invalid)).toThrow();
  expect(() =>
    buildGenerationRequiredApi([
      {
        mountPath: "",
        namespace: "app",
        extensions: { citext: { version: "1.8", schema: "foreign" } },
        metadata: schema.metadata,
      },
    ]),
  ).toThrow(/namespace/);
});
