import { expect, test } from "vite-plus/test";
import { defineConfig, inspectDevelopmentTarget, withDevelopmentConnection } from "@loom/tooling";
import type { DevelopmentProvider } from "@loom/tooling";

function provider() {
  const branch = { id: "br-developer", name: "developer", protected: false, isDefault: false };
  const project = { id: "project", name: "tasks", regionId: "aws-us-east-2", pgVersion: 18 };
  const endpoint = {
    id: "ep-developer",
    branchId: branch.id,
    type: "read_write" as const,
    autoscalingLimitMinCu: 0.25,
    autoscalingLimitMaxCu: 1,
    suspendTimeout: 300,
  } satisfies Awaited<ReturnType<DevelopmentProvider["listEndpoints"]>>[number];
  const api: DevelopmentProvider = {
    getProject: async () => project,
    listBranches: async () => [branch],
    listEndpoints: async () => [endpoint],
  };
  return { branch, project, endpoint, api };
}
const config = defineConfig({
  project: "tasks",
  provider: {
    projectId: "project",
    targets: {
      development: { branchId: "br-developer" },
      production: { branchId: "br-production" },
    },
  },
});

test("development target inspection binds a PostgreSQL 18 branch and its read-write endpoint", async () => {
  const fake = provider();
  expect(await inspectDevelopmentTarget(config, fake.api)).toEqual({
    projectId: "project",
    branchId: "br-developer",
    endpointId: "ep-developer",
    postgresVersion: 18,
  });
  fake.endpoint.branchId = "br-production";
  await expect(inspectDevelopmentTarget(config, fake.api)).rejects.toThrow("read-write endpoint");
});

test("development inspection rejects protected, default and older PostgreSQL targets", async () => {
  const fake = provider();
  fake.branch.protected = true;
  await expect(inspectDevelopmentTarget(config, fake.api)).rejects.toThrow("protected");
  fake.branch.protected = false;
  fake.branch.isDefault = true;
  await expect(inspectDevelopmentTarget(config, fake.api)).rejects.toThrow("default");
  fake.branch.isDefault = false;
  fake.project.pgVersion = 17;
  await expect(inspectDevelopmentTarget(config, fake.api)).rejects.toThrow("PostgreSQL 18");
});

test("development selection refuses configured protection and shared environment branches before provider access", async () => {
  let reads = 0;
  const fake = provider();
  fake.api.getProject = async () => {
    reads++;
    return fake.project;
  };
  for (const targets of [
    { development: { branchId: "br-developer", protected: true } },
    { development: { branchId: "br-developer" }, production: { branchId: "br-developer" } },
    { development: { branchId: "br-developer" }, preview: { branchId: "br-developer" } },
    {},
  ]) {
    await expect(
      inspectDevelopmentTarget(
        defineConfig({ project: "tasks", provider: { projectId: "project", targets } }),
        fake.api,
      ),
    ).rejects.toThrow();
  }
  expect(reads).toBe(0);
});

test("development inspection fails closed for incomplete protection metadata and mismatched projects", async () => {
  const fake = provider();
  fake.project.id = "other-project";
  await expect(inspectDevelopmentTarget(config, fake.api)).rejects.toThrow("project");
  fake.project.id = "project";
  Object.defineProperty(fake.branch, "protected", { value: undefined });
  await expect(inspectDevelopmentTarget(config, fake.api)).rejects.toThrow();
});

test("development credentials cannot override the selected role, database or direct connection", async () => {
  const fake = provider();
  let ran = false;
  for (const uri of [
    "postgresql://other:secret@ep-developer.example/neondb",
    "postgresql://migrator:secret@ep-developer.example/other",
    "postgresql://migrator:secret@ep-developer-pooler.example/neondb",
    "postgresql://migrator:secret@ep-developer.example/neondb?host=other.example",
    "postgresql://migrator:secret@ep-developer.example/neondb?user=other",
  ]) {
    await expect(
      withDevelopmentConnection(
        { config, databaseName: "neondb", migrationRole: "migrator" },
        async () => {
          ran = true;
        },
        { ...fake.api, getConnectionUri: async () => ({ uri }) },
      ),
    ).rejects.toThrow();
  }
  expect(ran).toBe(false);
});
