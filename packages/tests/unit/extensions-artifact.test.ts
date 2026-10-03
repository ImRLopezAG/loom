import { expect, test } from "vite-plus/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defineSchema } from "loom/server";
import {
  emptySnapshot,
  planMigration,
  planCustomMigration,
  validateMigration,
  writeMigration,
  readMigrations,
} from "loom/tooling";
import type { ExtensionPlan } from "../../../apps/loom/src/tooling/migrations/extensions";

const schema = defineSchema((s) => ({ tasks: { title: s.text() } }), { namespace: "app" });
function installation(): ExtensionPlan {
  const extension = { name: "pg_trgm", version: "1.6", schema: "extensions", requires: [] } as const;
  return {
    before: [],
    after: [{ ...extension, requires: [] }],
    requirements: [{ ...extension, requires: [] }],
    operations: [{ kind: "install", before: null, after: { ...extension, requires: [] } }],
    automatic: true,
  };
}

test("legacy generated and custom format 2 artifacts retain their characterized hashes", async () => {
  const generated = await planMigration(await emptySnapshot("app"), schema);
  const custom = await planCustomMigration(
    generated.snapshot,
    schema,
    "UPDATE app.tasks SET title = 'done'",
    "transactional",
    generated.hash,
  );
  expect(generated.format).toBe(2);
  expect(generated.hash).toBe("6eee459facdd8748c4f8914c8ebddf47d0099a0dcb98e79022a75882bf8c725b");
  expect(custom.format).toBe(2);
  expect(custom.hash).toBe("1006dd4b894dae7e139d9db86b11d2b38850bc1c7934e829d1ccd04985089a58");
  await validateMigration(generated);
  await validateMigration(custom);
});

test("installation-only generated and custom format 3 retain their characterized hashes", async () => {
  const installed = installation();
  const generated = await planMigration(await emptySnapshot("app"), schema, [], null, {
    extensions: installed,
    scope: "application",
  });
  const custom = await planCustomMigration(
    generated.snapshot,
    schema,
    "UPDATE app.tasks SET title = 'done'",
    "transactional",
    generated.hash,
    { extensions: { ...installed, before: installed.after, operations: [] }, scope: "application" },
  );
  expect(generated.hash).toBe("be4a923f113df5a3d3eb68ea630bc025c83dcd0378a2d04b7464977d47231b11");
  expect(custom.hash).toBe("277b174f0f04cd68acdf6beb380cd2a646274f69425e1155240e43d507b9ee0d");
  for (const plan of [generated, custom]) {
    expect(Object.hasOwn(plan, "requiredApi")).toBe(false);
    await validateMigration(plan);
  }
});

test("an extension-only artifact joins the application chain without inventing table changes", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-extension-artifact-"));
  try {
    const baseline = await planMigration(await emptySnapshot("app"), schema);
    await writeMigration(root, "migrations", "initial", baseline);
    const plan = await planMigration(baseline.snapshot, schema, [], baseline.hash, {
      extensions: installation(),
      scope: "application",
    });
    expect(plan.format).toBe(3);
    expect(plan.before).toBe(plan.after);
    expect(plan.statements).toEqual([]);
    await writeMigration(root, "migrations", "extensions", plan);
    expect((await readMigrations(root, "migrations")).map((artifact) => artifact.plan.hash)).toEqual([
      baseline.hash,
      plan.hash,
    ]);
    const removed = await planMigration(plan.snapshot, schema, [], plan.hash, {
      extensions: {
        ...installation(),
        before: installation().after,
        after: installation().after,
        requirements: [],
        operations: [],
      },
      scope: "application",
    });
    await writeMigration(root, "migrations", "retain_extension", removed);
    expect(removed.statements.join("\n")).not.toContain("DROP EXTENSION");
    expect((await readMigrations(root, "migrations")).at(-1)?.plan.hash).toBe(removed.hash);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("format 3 hashes bind exact versions, schemas, dependencies and operation order", async () => {
  const plan = await planMigration(await emptySnapshot("app"), schema, [], null, {
    extensions: installation(),
    scope: "application",
  });
  if (plan.format !== 3) throw new Error("Expected extension artifact");
  for (const changed of [
    { ...plan.extensions, requirements: [{ ...plan.extensions.requirements[0]!, version: "1.5" }] },
    { ...plan.extensions, after: [{ ...plan.extensions.after[0]!, schema: "custom_extensions" }] },
    { ...plan.extensions, requirements: [{ ...plan.extensions.requirements[0]!, requires: ["cube"] }] },
    { ...plan.extensions, operations: [] },
  ])
    await expect(validateMigration({ ...plan, extensions: changed })).rejects.toThrow("hash mismatch");
});

test("components can bind requirements and cannot mutate shared extensions", async () => {
  const installed = installation();
  const requirements = { ...installed, before: installed.after, operations: [] };
  const plan = await planMigration(await emptySnapshot("app"), schema, [], null, {
    extensions: requirements,
    scope: "component",
  });
  expect(plan.format).toBe(3);
  await validateMigration(plan);
  await expect(
    planMigration(await emptySnapshot("app"), schema, [], null, { extensions: installed, scope: "component" }),
  ).rejects.toThrow("cannot mutate");
});
