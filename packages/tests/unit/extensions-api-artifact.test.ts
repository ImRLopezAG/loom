import { expect, test } from "vite-plus/test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as v from "valibot";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { createCitext_1_8 } from "../../../apps/loom/src/core/extensions/adapters/citext";
import { emptySnapshot } from "../../../apps/loom/src/tooling/migrations/adapter";
import { planMigration, migrationHash } from "../../../apps/loom/src/tooling/migrations/planner";
import { planCustomMigration } from "../../../apps/loom/src/tooling/migrations/custom";
import {
  hasMigrationChanges,
  readMigrations,
  validateMigration,
  writeMigration,
  planValidator,
} from "../../../apps/loom/src/tooling/migrations/history";
import {
  buildRequiredApi,
  requiredApiHash,
  validateRequiredApi,
} from "../../../apps/loom/src/tooling/migrations/required-api";
import { extensionBindingsSource } from "../../../apps/loom/src/tooling/codegen/extensions";
import type { ExtensionPlan } from "../../../apps/loom/src/tooling/migrations/extensions";
import legacy from "../fixtures/legacy-extension-api-artifacts.json";
import { projectMigrationScopes } from "../../../apps/loom/src/tooling/migrations/component-scopes";
import { compileBetterAuthSchema } from "loom/better-auth";
import type { ExtensionFieldMetadata } from "../../../apps/loom/src/core/extensions/values";

const selection = { citext: { version: "1.8", schema: "extensions" } } as const;
const citext = createCitext_1_8({
  name: "citext",
  ...selection.citext,
  apiSupport: { status: "verified", digest: "bf50ef209f828f5cbd517fe1a5f0b1ede7f1bbeac379b75c0b2bc02bf0a8eee3" },
});
const plain = defineSchema((s) => ({ tasks: { title: s.text() } }), { namespace: "app" });
const schema = defineSchema(
  () => ({
    tasks: defineTable(
      { title: citext.field(), aliases: citext.arrayField() },
      {
        indexes: [
          { fields: ["title"], extension: citext.indexes.btree() },
          { fields: ["title"], extension: citext.indexes.pattern() },
        ],
      },
    ),
  }),
  { namespace: "app" },
);
function installation(install = false): ExtensionPlan {
  const entry = { name: "citext", ...selection.citext, requires: [] } satisfies ExtensionPlan["after"][number];
  return {
    before: install ? [] : [entry],
    after: [entry],
    requirements: [entry],
    operations: install ? [{ kind: "install", before: null, after: entry }] : [],
    automatic: true,
  };
}
type Mutable<T> = { -readonly [Key in keyof T]: T[Key] extends object ? Mutable<T[Key]> : T[Key] };
function copied<T>(value: T): Mutable<T> {
  return structuredClone(value);
}

test("literal old artifacts validate and round-trip without acquiring required API keys", async () => {
  for (const [generated, custom] of [
    [legacy.artifacts.generated2, legacy.artifacts.custom2],
    [legacy.artifacts.generated3, legacy.artifacts.custom3],
  ]) {
    const root = await mkdtemp(join(tmpdir(), "loom-old-api-artifacts-"));
    try {
      const first = v.parse(planValidator, generated),
        second = v.parse(planValidator, custom);
      for (const plan of [first, second]) {
        await validateMigration(plan);
        expect(Object.hasOwn(plan, "requiredApi")).toBe(false);
      }
      await writeMigration(root, "migrations", "initial", first);
      await writeMigration(root, "migrations", "custom", second);
      expect((await readMigrations(root, "migrations")).map(({ plan }) => plan)).toEqual([first, second]);
      expect(() =>
        v.parse(planValidator, {
          ...legacy.artifacts.generated2,
          requiredApi: { format: 1, apis: [], fields: [], indexes: [] },
        }),
      ).toThrow();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
});

test("only accepted configured bindings persist API evidence and schema use requires independent selection", () => {
  expect(buildRequiredApi(undefined, plain.metadata)).toBeUndefined();
  expect(buildRequiredApi({}, plain.metadata)).toBeUndefined();
  for (const [name, version] of [
    ["citext", "unknown"],
    ["pgcrypto", "1.3"],
    ["unaccent", "future"],
  ]) {
    const selected = { [name!]: { version: version!, schema: "extensions" } };
    expect(buildRequiredApi(selected, plain.metadata)).toBeUndefined();
    expect(extensionBindingsSource(selected)).toContain('"status":"unverified"');
  }
  expect(buildRequiredApi(selection, plain.metadata)?.apis.map(({ manifest }) => manifest.contract.extension)).toEqual([
    "citext",
  ]);
  expect(() => buildRequiredApi(undefined, schema.metadata)).toThrow("Missing configured");
  expect(() => buildRequiredApi({ citext: { ...selection.citext, schema: "other" } }, schema.metadata)).toThrow(
    "namespace",
  );
});

test("full field and multiset index metadata survive while record order is canonical", () => {
  const payload = buildRequiredApi(selection, schema.metadata)!;
  expect(payload.fields.find(({ field }) => field === "aliases")?.metadata.value.kind).toBe("object");
  expect(payload.fields.find(({ field }) => field === "title")?.metadata).toEqual(
    schema.metadata.entities[0]?.fields.find(({ name }) => name === "title")?.extension,
  );
  const reversed = {
    ...schema.metadata,
    entities: schema.metadata.entities.map((entity) => ({
      ...entity,
      options: { ...entity.options, indexes: [...entity.options.indexes!].reverse() },
    })),
  };
  expect(requiredApiHash(buildRequiredApi(selection, reversed))).toBe(requiredApiHash(payload));
  const modified = copied(payload);
  modified.fields[0]!.metadata.parameters = { z: 1, a: 2 };
  const reordered = copied(modified);
  reordered.fields[0]!.metadata.parameters = { a: 2, z: 1 };
  expect(requiredApiHash(modified)).toBe(requiredApiHash(reordered));
  for (const metadata of [
    { codec: "changed" },
    { typmods: [3] },
    { parameters: { dimensions: 3 } },
    { value: { kind: "string", pattern: "changed" } },
    { search: { filter: false, comparison: false, order: false, text: false } },
    { storage: { schema: "extensions", type: "citext", dimensions: 1 } },
  ] satisfies Partial<ExtensionFieldMetadata>[]) {
    const changed = copied(payload);
    changed.fields.find(({ field }) => field === "title")!.metadata = {
      ...changed.fields.find(({ field }) => field === "title")!.metadata,
      ...metadata,
    };
    expect(requiredApiHash(changed)).not.toBe(requiredApiHash(payload));
  }
  const options = copied(payload);
  options.indexes[0]!.declaration = { ...options.indexes[0]!.declaration, unique: true, with: { fillfactor: 80 } };
  expect(requiredApiHash(options)).not.toBe(requiredApiHash(payload));
});

test("strict API validators reject nested unknown keys, forged members, digests, placement and duplicates", () => {
  const payload = buildRequiredApi(selection, schema.metadata)!;
  const invalid: unknown[] = [
    { ...payload, format: 2 },
    { ...payload, foreign: true },
    { ...payload, apis: [payload.apis[0], payload.apis[0]] },
    { ...payload, fields: [payload.fields[0], payload.fields[0]] },
    { ...payload, apis: [{ ...payload.apis[0], schema: "other" }] },
    { ...payload, apis: [{ ...payload.apis[0], textSearch: { foreign: true } }] },
    { ...payload, fields: [{ ...payload.fields[0], metadata: { ...payload.fields[0]!.metadata, foreign: true } }] },
    {
      ...payload,
      fields: [
        {
          ...payload.fields[0],
          metadata: {
            ...payload.fields[0]!.metadata,
            value: { kind: "array", items: { kind: "string", foreign: true } },
          },
        },
      ],
    },
  ];
  const digest = copied(payload);
  digest.apis[0]!.manifest.digest = "00".repeat(32);
  invalid.push(digest);
  const member = copied(payload);
  member.fields[0]!.metadata.member = "type:forged";
  invalid.push(member);
  const nested = copied(payload);
  nested.indexes[0]!.declaration.extension = {
    ...nested.indexes[0]!.declaration.extension!,
    options: { siglen: Infinity },
  };
  invalid.push(nested);
  const dimensions = copied(payload);
  dimensions.fields[0]!.metadata.storage = { schema: "extensions", type: "citext", dimensions: -1 };
  invalid.push(dimensions);
  for (const input of invalid) expect(() => validateRequiredApi(input, installation())).toThrow();
});

test("typed evidence addition, software metadata changes and explicit removal persist with empty SQL", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-required-api-artifacts-"));
  try {
    const first = await planMigration(await emptySnapshot("app"), plain, [], null, {
      scope: "application",
      extensions: installation(true),
    });
    await writeMigration(root, "migrations", "initial", first);
    const requiredApi = buildRequiredApi(selection, plain.metadata)!;
    const second = await planMigration(first.snapshot, plain, [], first.hash, {
      scope: "application",
      extensions: installation(),
      requiredApi,
    });
    expect(second.before).toBe(second.after);
    expect(second.statements).toEqual([]);
    expect(hasMigrationChanges(second, first)).toBe(true);
    await writeMigration(root, "migrations", "typed", second);
    expect(await readFile(join(root, "migrations", `${second.hash}_typed`, "migration.sql"), "utf8")).toBe("\n");
    const third = await planMigration(second.snapshot, plain, [], second.hash, {
      scope: "application",
      extensions: installation(),
    });
    expect(Object.hasOwn(third, "requiredApi")).toBe(false);
    expect(hasMigrationChanges(third, second)).toBe(true);
    await writeMigration(root, "migrations", "remove_claim", third);
    expect((await readMigrations(root, "migrations")).at(-1)?.plan).toEqual(third);
    const custom = await planCustomMigration(third.snapshot, plain, "SELECT 1", "transactional", third.hash, {
      scope: "application",
      extensions: installation(),
      requiredApi,
    });
    expect(custom).toHaveProperty("requiredApi", requiredApi);
    await writeMigration(root, "migrations", "custom", custom);
    if (second.format !== 3) throw new Error("Expected typed format 3");
    const changed = copied(requiredApi);
    const routine = changed.apis[0]!.manifest.contract.members.find((member) => member.kind === "routine");
    if (!routine || routine.kind !== "routine") throw new Error("Missing captured routine");
    routine.returns = { namespace: "pg_catalog", name: "bool" };
    await expect(validateMigration({ ...second, requiredApi: changed })).rejects.toThrow();
    expect(() => migrationHash({ ...second, requiredApi: changed })).toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("component builders persist only the resolved subset", async () => {
  const host = { ...selection, pg_trgm: { version: "1.6", schema: "extensions" } };
  expect(buildRequiredApi(host, plain.metadata)?.apis).toHaveLength(2);
  const payload = buildRequiredApi(selection, schema.metadata)!;
  const component = await planMigration(await emptySnapshot("app"), schema, [], null, {
    scope: "component",
    extensions: installation(),
    requiredApi: payload,
  });
  expect(component).toHaveProperty("requiredApi.apis", payload.apis);
  await validateMigration(component);
});

test("actual auth scope projection retains native tables and never inherits host typed APIs", async () => {
  const auth = compileBetterAuthSchema({}, "auth_test");
  const scopes = projectMigrationScopes({
    config: { database: { namespace: "app", migrations: "migrations", extensions: selection } },
    schema: plain,
    componentScopes: [],
    authScopes: [{ mountPath: "auth", namespace: "auth_test", schema: auth }],
  });
  const native = scopes.find(({ mountPath }) => mountPath === "auth")!;
  expect(native.extensions).toBeUndefined();
  expect(native.schema).toEqual({ namespace: "auth_test", tables: auth.ownedTables, retainRemoved: true });
  expect("metadata" in native.schema).toBe(false);
  const plan = await planMigration(await emptySnapshot(native.namespace), native.schema, [], null, {
    scope: "component",
    extensions: installation(),
  });
  expect(Object.hasOwn(plan, "requiredApi")).toBe(false);
  await validateMigration(plan);
});
