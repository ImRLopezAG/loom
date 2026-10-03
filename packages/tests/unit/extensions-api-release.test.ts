import { expect, test } from "vite-plus/test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import type pg from "pg";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { createCitext_1_8 } from "../../../apps/loom/src/core/extensions/adapters/citext";
import { buildGenerationRequiredApi } from "../../../apps/loom/src/tooling/codegen/required-api";
import { emptySnapshot } from "../../../apps/loom/src/tooling/migrations/adapter";
import { buildRequiredApi } from "../../../apps/loom/src/tooling/migrations/required-api";
import { planMigration } from "../../../apps/loom/src/tooling/migrations/planner";
import { writeMigration } from "../../../apps/loom/src/tooling/migrations/history";
import {
  inspectReleaseRequiredApi,
  verifyReleaseRequiredApi,
} from "../../../apps/loom/src/tooling/deploy/neon/required-api-release";

const selection = { citext: { version: "1.8", schema: "extensions" } } as const;
const citext = createCitext_1_8({
  name: "citext",
  ...selection.citext,
  apiSupport: { status: "verified", digest: "bf50ef209f828f5cbd517fe1a5f0b1ede7f1bbeac379b75c0b2bc02bf0a8eee3" },
});
const schema = defineSchema(
  () => ({
    tasks: defineTable(
      { title: citext.field() },
      {
        indexes: [{ fields: ["title"], extension: citext.indexes.btree(), with: { fillfactor: 80 } }],
      },
    ),
  }),
  { namespace: "app" },
);

test("release API evidence agrees with actual source scopes and every committed head before database access", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-release-api-head-"));
  const version = "a".repeat(64);
  const project = {
    root,
    version,
    config: { database: { namespace: "app", migrations: "migrations", extensions: selection } },
    schema,
    componentScopes: [],
    authScopes: [],
  };
  const evidence = buildGenerationRequiredApi([
    { mountPath: "", namespace: "app", extensions: selection, metadata: schema.metadata },
  ])!;
  const directory = join(root, ".loom/generations", version);
  const sidecar = join(directory, "required-api.json");
  const entry = { name: "citext" as const, ...selection.citext, requires: [] };
  const extensions = {
    before: [],
    after: [entry],
    requirements: [entry],
    operations: [{ kind: "install" as const, before: null, after: entry }],
    automatic: true,
  };
  try {
    await mkdir(directory, { recursive: true });
    await writeFile(sidecar, JSON.stringify(evidence));
    await expect(inspectReleaseRequiredApi(project)).rejects.toThrow(/committed|required API/i);
    const legacy = await planMigration(await emptySnapshot("app"), schema, [], null, {
      scope: "application",
      extensions,
    });
    await writeMigration(root, "migrations", "initial", legacy);
    await expect(inspectReleaseRequiredApi(project)).rejects.toThrow(/committed|required API/i);
    await rm(join(root, "migrations"), { recursive: true });
    const typed = await planMigration(await emptySnapshot("app"), schema, [], null, {
      scope: "application",
      extensions,
      requiredApi: buildRequiredApi(selection, schema.metadata)!,
    });
    await writeMigration(root, "migrations", "initial", typed);
    expect(await inspectReleaseRequiredApi(project)).toEqual(evidence);
    for (const changed of [
      { ...evidence, scopes: [{ ...evidence.scopes[0]!, mountPath: "foreign" }] },
      { ...evidence, scopes: [{ ...evidence.scopes[0]!, namespace: "foreign" }] },
    ]) {
      await writeFile(sidecar, JSON.stringify(changed));
      await expect(inspectReleaseRequiredApi(project)).rejects.toThrow(/source|required API/i);
    }
    const codec = structuredClone(evidence);
    codec.scopes[0]!.requiredApi.fields[0]!.metadata.codec = "historical:other";
    const index = structuredClone(evidence);
    index.scopes[0]!.requiredApi.indexes[0]!.declaration.with = { fillfactor: 90 };
    for (const changed of [codec, index]) {
      await writeFile(sidecar, JSON.stringify(changed));
      await expect(inspectReleaseRequiredApi(project)).rejects.toThrow(/source|required API/i);
    }
    await rm(sidecar);
    await expect(inspectReleaseRequiredApi(project)).rejects.toThrow(/source|required API/i);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("fresh release gate validates all scopes before native I/O and omits extension-free evidence", async () => {
  const evidence = buildGenerationRequiredApi([
    { mountPath: "", namespace: "app", extensions: selection, metadata: schema.metadata },
  ])!;
  let calls = 0;
  const client: Pick<pg.Client, "query"> = {
    query: () => {
      calls++;
      throw new Error("Unexpected native I/O");
    },
  };
  await verifyReleaseRequiredApi(client, undefined, "runtime");
  const duplicate = { ...evidence, scopes: [...evidence.scopes, evidence.scopes[0]!] };
  await expect(verifyReleaseRequiredApi(client, duplicate, "runtime")).rejects.toThrow(/Duplicate/);
  const altered = structuredClone(evidence);
  altered.scopes[0]!.requiredApi.apis[0]!.manifest.digest = "0".repeat(64);
  await expect(verifyReleaseRequiredApi(client, altered, "runtime")).rejects.toThrow();
  await expect(verifyReleaseRequiredApi(client, evidence, "bad\0role")).rejects.toThrow();
  expect(calls).toBe(0);
});
