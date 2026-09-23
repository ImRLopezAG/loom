import { expect, test } from "vite-plus/test";
import { defineConfig, disableNeonTriggers, prepareNeonScheduleTriggers } from "@loom/tooling";
import type { DeploymentTriggerProvider } from "@loom/tooling";

function fixture() {
  const branch = { id: "br-preview", name: "preview", protected: false, isDefault: false };
  const triggers: Awaited<ReturnType<DeploymentTriggerProvider["listBranchTriggers"]>> = [];
  const calls: string[] = [];
  const state = { failName: "", ignoreDisable: false, renameAfterWrite: false };
  const provider: DeploymentTriggerProvider = {
    getProject: async () => ({ id: "project", name: "tasks", regionId: "aws-us-east-2", pgVersion: 18 }),
    listBranches: async () => [branch],
    listEndpoints: async () => [
      {
        id: "ep-preview",
        branchId: branch.id,
        type: "read_write",
        autoscalingLimitMinCu: 0.25,
        autoscalingLimitMaxCu: 1,
        suspendTimeout: 300,
      },
    ],
    listBranchFunctions: async () => [
      {
        id: "fn-worker",
        name: "worker",
        slug: "loomworker",
        invocationUrl: "https://example.test",
        activeDeploymentId: 1,
        currentDeployment: { id: 1, status: "completed" },
      },
    ],
    listBranchTriggers: async () => structuredClone(triggers),
    createBranchTrigger: async (_projectId, _branchId, input) => {
      calls.push(`create:${input.name}`);
      if (input.name === state.failName) throw new Error("secret provider failure");
      if (input.type !== "schedule") throw new Error("Unexpected trigger type");
      const created = {
        type: "schedule" as const,
        triggerId: `trigger-${input.name}`,
        name: input.name,
        functionSlug: input.functionSlug,
        functionPath: input.functionPath ?? "/",
        enabled: state.ignoreDisable || (input.enabled ?? true),
        inherited: false,
        cron: input.cron,
        nextRunAt: null,
      };
      triggers.push(created);
      if (state.renameAfterWrite) branch.name = "changed";
      return structuredClone(created);
    },
    updateBranchTrigger: async (_projectId, _branchId, id, input) => {
      calls.push(`update:${id}`);
      const current = triggers.find((trigger) => trigger.triggerId === id);
      if (!current) throw new Error("Missing trigger");
      current.enabled = state.ignoreDisable || (input.enabled ?? current.enabled);
      if (current.type === "schedule" && input.type === "schedule") current.cron = input.cron ?? current.cron;
      if (state.renameAfterWrite) branch.name = "changed";
      return structuredClone(current);
    },
  };
  const config = defineConfig({
    project: "tasks",
    provider: { projectId: "project", targets: { preview: { branchId: branch.id } } },
  });
  const options = {
    config,
    environment: "preview" as const,
    workerSlug: "loomworker",
    schedules: [
      { name: "wake", schedule: "* * * * *", binding: { kind: "wake" as const, name: "wake" } },
      { name: "daily", schedule: "0 0 * * *", binding: { kind: "cron" as const, name: "daily", cron: "tasks:daily" } },
    ],
  };
  return { branch, provider, triggers, calls, state, options };
}

test("schedule preparation creates disabled triggers and binds their provider IDs", async () => {
  const f = fixture();
  const result = await prepareNeonScheduleTriggers(f.options, f.provider);
  expect(result.bindings).toEqual({
    "trigger-wake": { kind: "wake", name: "wake" },
    "trigger-daily": { kind: "cron", name: "daily", cron: "tasks:daily" },
  });
  expect(f.triggers.every((trigger) => !trigger.enabled && trigger.functionPath === "/api/loom/triggers")).toBe(true);
  await prepareNeonScheduleTriggers(f.options, f.provider);
  expect(f.calls).toEqual(["create:wake", "create:daily"]);
  f.options.schedules[0]!.schedule = "*/5 * * * *";
  await prepareNeonScheduleTriggers(f.options, f.provider);
  expect(f.calls.at(-1)).toBe("update:trigger-wake");
  expect(f.triggers[0]).toMatchObject({ triggerId: "trigger-wake", cron: "*/5 * * * *", enabled: false });
});

test("trigger disabling includes inherited schedules and storage events only for selected workers", async () => {
  const f = fixture();
  await prepareNeonScheduleTriggers(f.options, f.provider);
  for (const trigger of f.triggers) {
    trigger.enabled = true;
    trigger.inherited = true;
  }
  f.triggers.push({
    type: "storage_object_created",
    triggerId: "storage",
    name: "uploads",
    functionSlug: "loomworker",
    functionPath: "/api/loom/triggers",
    bucketName: "uploads",
    enabled: true,
    inherited: true,
  });
  f.triggers.push({
    type: "schedule",
    triggerId: "other",
    name: "other",
    functionSlug: "otherworker",
    functionPath: "/",
    cron: "* * * * *",
    nextRunAt: null,
    enabled: true,
    inherited: false,
  });
  const result = await disableNeonTriggers(
    { config: f.options.config, environment: "preview", workerSlugs: ["loomworker"] },
    f.provider,
  );
  expect(result.triggers.map((trigger) => trigger.triggerId)).toEqual(["trigger-wake", "trigger-daily", "storage"]);
  expect(
    f.triggers.filter((trigger) => trigger.functionSlug === "loomworker").every((trigger) => !trigger.enabled),
  ).toBe(true);
  expect(f.triggers.find((trigger) => trigger.triggerId === "other")?.enabled).toBe(true);
  const count = f.calls.length;
  await disableNeonTriggers(
    { config: f.options.config, environment: "preview", workerSlugs: ["loomworker"] },
    f.provider,
  );
  expect(f.calls).toHaveLength(count);
});

test("a failed preparation is redacted and resumes existing names without duplicate creation", async () => {
  const f = fixture();
  f.state.failName = "daily";
  await expect(prepareNeonScheduleTriggers(f.options, f.provider)).rejects.toThrow(
    "Could not prepare Neon schedule triggers",
  );
  expect(f.triggers).toHaveLength(1);
  f.state.failName = "";
  await prepareNeonScheduleTriggers(f.options, f.provider);
  expect(f.calls).toEqual(["create:wake", "create:daily", "create:daily"]);
  expect(f.triggers).toHaveLength(2);
});

test("trigger preparation rejects input errors and refuses a name owned by another worker", async () => {
  const f = fixture();
  await expect(
    prepareNeonScheduleTriggers(
      { ...f.options, schedules: [f.options.schedules[0]!, f.options.schedules[0]!] },
      f.provider,
    ),
  ).rejects.toThrow();
  await expect(
    prepareNeonScheduleTriggers(
      { ...f.options, schedules: [{ name: "wake", schedule: "61 * * * *", binding: { kind: "wake", name: "wake" } }] },
      f.provider,
    ),
  ).rejects.toThrow();
  await expect(
    prepareNeonScheduleTriggers(
      { ...f.options, schedules: [{ name: "wake", schedule: "* * * * *", binding: { kind: "wake", name: "other" } }] },
      f.provider,
    ),
  ).rejects.toThrow();
  f.triggers.push({
    type: "schedule",
    triggerId: "other",
    name: "wake",
    functionSlug: "otherworker",
    functionPath: "/",
    cron: "* * * * *",
    nextRunAt: null,
    enabled: false,
    inherited: false,
  });
  await expect(prepareNeonScheduleTriggers(f.options, f.provider)).rejects.toThrow();
  expect(f.calls).toHaveLength(0);
});

test("trigger operations reject target drift and a provider that leaves work enabled", async () => {
  const f = fixture();
  f.state.renameAfterWrite = true;
  await expect(prepareNeonScheduleTriggers(f.options, f.provider)).rejects.toThrow();
  expect(f.calls).toEqual(["create:wake"]);
  f.branch.name = "preview";
  f.state.renameAfterWrite = false;
  f.state.ignoreDisable = true;
  await expect(prepareNeonScheduleTriggers(f.options, f.provider)).rejects.toThrow();
  await expect(
    disableNeonTriggers({ config: f.options.config, environment: "preview", workerSlugs: ["loomworker"] }, f.provider),
  ).rejects.toThrow();
});
