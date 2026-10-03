import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout } from "node:timers/promises";
import { prepareProject } from "loom/tooling";
import { startDevelopmentRuntime } from "../../../apps/loom/src/tooling/dev/runtime";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";
import { bootstrapSession } from "../../../apps/loom/src/tooling/migrations/bootstrap";
import { buildGenerationRequiredApi } from "../../../apps/loom/src/tooling/codegen/required-api";
import { recordRuntimeCompatibility } from "../../../apps/loom/src/tooling/migrations/runtime-compatibility";
import { withDevRequiredApiFixture } from "./dev-required-api";

export type DevRuntimeRequiredApiFixture = Parameters<Parameters<typeof withDevRuntimeRequiredApiFixture>[0]>[0];

export async function withDevRuntimeRequiredApiFixture(
  operation: (fixture: Awaited<ReturnType<typeof createFixture>>) => Promise<void>,
  configuration: Parameters<typeof withDevRequiredApiFixture>[1] = {},
) {
  await withDevRequiredApiFixture(async (base) => {
    await writeFile(
      join(base.root, "loom/auth.config.ts"),
      'import {defineRpcAuth} from "loom/server"; export default defineRpcAuth({allowAnonymous:true,authorize:()=>{}});',
    );
    const runtimes: Awaited<ReturnType<typeof startDevelopmentRuntime>>["runtime"][] = [];
    try {
      await operation(await createFixture(base, runtimes));
    } finally {
      await Promise.all(runtimes.map((runtime) => runtime.stop()));
    }
  }, configuration);
}

async function createFixture(
  base: Parameters<Parameters<typeof withDevRequiredApiFixture>[0]>[0],
  runtimes: Awaited<ReturnType<typeof startDevelopmentRuntime>>["runtime"][],
) {
  await base.sync();
  await base.client.query(`ALTER ROLE ${quoteIdentifier(base.runtimeRole)} LOGIN PASSWORD 'runtime-test-only'`);
  const candidate = await prepareProject(base.root);
  const runtimeAddress = new URL(base.url);
  runtimeAddress.username = base.runtimeRole;
  runtimeAddress.password = "runtime-test-only";
  const calls = { target: 0, runtimeUri: 0 };
  const callbacks = { runtimeUri: async () => {} };
  const provider = {
    ...base.provider,
    getProject: async (id: string) => {
      calls.target++;
      return base.provider.getProject(id);
    },
    getConnectionUri: async (...args: Parameters<typeof base.provider.getConnectionUri>) => {
      if (args[1].roleName !== base.runtimeRole) return base.provider.getConnectionUri(...args);
      calls.runtimeUri++;
      await callbacks.runtimeUri();
      return { uri: runtimeAddress.href };
    },
  };
  const options = {
    ...base.options,
    sourceVersion: candidate.version,
    deployment: "runtime-api-fixture",
    activationToken: "e".repeat(64),
  };
  async function start(signal?: AbortSignal) {
    const started = await startDevelopmentRuntime({ ...options, ...(signal && { signal }) }, provider);
    runtimes.push(started.runtime);
    return started;
  }
  async function attempt() {
    const started = await start();
    await started.runtime.stop();
    return started;
  }
  async function noRuntimeSessions() {
    const deadline = Date.now() + 5000;
    for (;;) {
      const result = await base.client.query<{ count: number }>(
        "SELECT count(*)::integer AS count FROM pg_stat_activity WHERE datname=current_database() AND usename=$1",
        [base.runtimeRole],
      );
      if (result.rows[0]?.count === 0) return;
      if (Date.now() >= deadline) assert.fail("Runtime fixture leaked a database session");
      await setTimeout(20);
    }
  }
  const generationDirectory = join(base.root, ".loom/generations", candidate.version);
  async function registerRetention() {
    await bootstrapSession(base.client, "loom_meta", base.otherRole);
    await base.client.query(
      "CREATE SCHEMA retained_extensions; CREATE EXTENSION pg_trgm SCHEMA retained_extensions VERSION '1.6'",
    );
    await base.client.query(`GRANT USAGE ON SCHEMA retained_extensions TO ${quoteIdentifier(base.otherRole)}`);
    const requiredApi = buildGenerationRequiredApi([
      {
        mountPath: "retained",
        namespace: "component_retained",
        extensions: { pg_trgm: { version: "1.6", schema: "retained_extensions" } },
      },
    ]);
    assert(requiredApi);
    const artifact = (await base.history())[0]!.artifact;
    await recordRuntimeCompatibility(base.client, {
      namespace: "component_retained",
      metadataNamespace: "loom_meta",
      deployment: "retained",
      version: "a".repeat(64),
      sourceSchema: artifact.after,
      inspection: {
        head: artifact.after,
        minimumOrdinal: 0,
        maximumOrdinal: 0,
        schemas: [artifact.after],
        migrationHashes: [],
      },
      requiredApi,
      runtimeRole: base.otherRole,
    });
    const address = new URL(base.url);
    await base.client.query(
      "INSERT INTO loom_meta.deployment_activations(deployment,version,project_id,branch_id,endpoint_host,database_name,token_hash,state) VALUES('retained',repeat('a',64),$1,$2,$3,current_database(),repeat('c',64),'active')",
      [base.target.projectId, base.target.branchId, address.hostname],
    );
  }
  async function generationBytes() {
    return readFile(join(generationDirectory, "required-api.json"), "utf8");
  }
  return {
    ...base,
    candidate,
    generationDirectory,
    generationBytes,
    options,
    calls,
    callbacks,
    start,
    attempt,
    noRuntimeSessions,
    registerRetention,
  };
}
