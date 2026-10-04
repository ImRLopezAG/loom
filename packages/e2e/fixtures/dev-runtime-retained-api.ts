import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { prepareProject } from "kello/tooling";
import { startDevelopmentRuntime } from "../../../apps/loom/src/tooling/dev/runtime";
import { loadProject } from "../../../apps/loom/src/tooling/project/load";
import { projectMigrationScopes } from "../../../apps/loom/src/tooling/migrations/component-scopes";
import { bootstrapSession } from "../../../apps/loom/src/tooling/migrations/bootstrap";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";
import { withDevRuntimeRequiredApiFixture } from "./dev-runtime-required-api";

export async function withDevRuntimeRetainedApiFixture(
  operation: (fixture: Awaited<ReturnType<typeof createFixture>>) => Promise<void>,
  configuration: Parameters<typeof withDevRuntimeRequiredApiFixture>[1] = {},
) {
  await withDevRuntimeRequiredApiFixture(async (base) => {
    const additionalRuntimes: Awaited<ReturnType<typeof startDevelopmentRuntime>>["runtime"][] = [];
    try {
      await operation(await createFixture(base, additionalRuntimes));
    } finally {
      await Promise.all(additionalRuntimes.map((runtime) => runtime.stop()));
    }
  }, configuration);
}

async function createFixture(
  base: Parameters<Parameters<typeof withDevRuntimeRequiredApiFixture>[0]>[0],
  additionalRuntimes: Awaited<ReturnType<typeof startDevelopmentRuntime>>["runtime"][],
) {
  const project = await loadProject(base.root);
  const namespaces = projectMigrationScopes(project)
    .map((scope) => scope.namespace)
    .sort();
  async function assertRegistrationTable() {
    const result = await base.client.query<{ relation: string | null }>(
      "SELECT to_regclass('loom_meta.development_runtime_api')::text AS relation",
    );
    assert.equal(
      result.rows[0]?.relation,
      "loom_meta.development_runtime_api",
      "Authenticated framework synchronization must provide development API proof storage",
    );
  }
  async function registrations() {
    await assertRegistrationTable();
    return (
      await base.client.query<{
        namespace: string;
        deployment: string;
        version: string;
        required_api: unknown;
        api_absent: boolean;
        runtime_role: string | null;
      }>(
        "SELECT namespace,deployment,version,required_api,required_api IS NULL AS api_absent,runtime_role FROM loom_meta.development_runtime_api ORDER BY deployment,version,namespace",
      )
    ).rows;
  }
  async function scopes() {
    return (
      await base.client.query<{ deployment: string; version: string; namespace: string }>(
        "SELECT deployment,version,namespace FROM loom_meta.runtime_scopes ORDER BY deployment,version,namespace",
      )
    ).rows;
  }
  async function registrationState() {
    return { registrations: await registrations(), scopes: await scopes() };
  }
  async function prepareOtherRole() {
    await bootstrapSession(base.client, "loom_meta", base.otherRole);
    await base.client.query(`ALTER ROLE ${quoteIdentifier(base.otherRole)} LOGIN PASSWORD 'runtime-test-only'`);
    const schemas = (
      await base.client.query<{ name: string }>(
        "SELECT DISTINCT n.nspname AS name FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname <> 'plpgsql'",
      )
    ).rows;
    for (const { name } of schemas)
      await base.client.query(`GRANT USAGE ON SCHEMA ${quoteIdentifier(name)} TO ${quoteIdentifier(base.otherRole)}`);
  }
  async function startAsOtherRole() {
    const address = new URL(base.url);
    address.username = base.otherRole;
    address.password = "runtime-test-only";
    const provider = {
      ...base.provider,
      getConnectionUri: async (...args: Parameters<typeof base.provider.getConnectionUri>) =>
        args[1].roleName === base.otherRole ? { uri: address.href } : base.provider.getConnectionUri(...args),
    };
    const started = await startDevelopmentRuntime({ ...base.options, runtimeRole: base.otherRole }, provider);
    additionalRuntimes.push(started.runtime);
    await started.runtime.stop();
    return started;
  }
  async function selectExtensionFreeIncomingSource() {
    const configFile = join(base.root, "kello.config.ts");
    const source = await readFile(configFile, "utf8");
    const serialized = source.match(/defineConfig\((\{[\s\S]*\})\)/)?.[1];
    assert(serialized, "Expected fixture's serialized defineConfig source");
    const config = JSON.parse(serialized);
    config.database.namespace = "incoming";
    config.database.extensions = {};
    await writeFile(
      configFile,
      `import {defineConfig} from "kello/tooling"; export default defineConfig(${JSON.stringify(config)});`,
    );
    await writeFile(
      join(base.root, "kello/schema.ts"),
      'import {defineSchema,defineTable} from "kello/server"; export default defineSchema((s)=>({tasks:defineTable({title:s.text().notNull()},{publicFields:["_id","title"]})}),{namespace:"incoming"});',
    );
    return prepareProject(base.root);
  }
  return {
    ...base,
    namespaces,
    registrations,
    scopes,
    registrationState,
    assertRegistrationTable,
    prepareOtherRole,
    startAsOtherRole,
    selectExtensionFreeIncomingSource,
  };
}
