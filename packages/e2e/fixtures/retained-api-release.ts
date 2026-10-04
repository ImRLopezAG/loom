import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generateRelease, prepareProject } from "kello/tooling";
import type { NeonReleaseJournal } from "kello/tooling";
import { buildGenerationRequiredApi } from "../../../apps/loom/src/tooling/codegen/required-api";
import { loadProject } from "../../../apps/loom/src/tooling/project/load";
import { bootstrapSession } from "../../../apps/loom/src/tooling/migrations/bootstrap";
import {
  acquireExtensionLock,
  quoteIdentifier,
  withMigrationConnection,
} from "../../../apps/loom/src/tooling/migrations/connection";
import { projectMigrationScopes } from "../../../apps/loom/src/tooling/migrations/component-scopes";
import { applyMigrations } from "../../../apps/loom/src/tooling/migrations/runner";
import { recordRuntimeCompatibility } from "../../../apps/loom/src/tooling/migrations/runtime-compatibility";
import { verifyRequiredApiOnTarget } from "../../../apps/loom/src/tooling/migrations/required-api-verification";
import { inspectReleaseRequiredApi } from "../../../apps/loom/src/tooling/deploy/neon/required-api-release";
import { historySnapshot, withFrameworkPrefixFixture } from "./framework-prefix-readiness";
import type { FrameworkPrefixFixture } from "./framework-prefix-readiness";

export const retainedVersion = "9".repeat(64);
export type ReleaseRetention = "active" | "pending" | "session";

async function establishRetainedComponent(
  fixture: FrameworkPrefixFixture,
  dependency: ReleaseRetention,
  retainedRole: string,
) {
  await applyMigrations({
    connectionString: fixture.url,
    root: fixture.root,
    migrations: fixture.migrations,
    namespace: fixture.namespace,
    metadataNamespace: fixture.metadataNamespace,
    runtimeRole: fixture.runtimeRole,
  });
  assert.equal(fixture.artifact.plan.format, 2, "Incoming release is genuinely extension-free");
  const componentNamespace = `search_${crypto.randomUUID().replaceAll("-", "")}`;
  const extensionSchema = `ext_${crypto.randomUUID().replaceAll("-", "")}`;
  const requiredApi = buildGenerationRequiredApi([
    { mountPath: "", namespace: fixture.namespace, extensions: {} },
    {
      mountPath: "search",
      namespace: componentNamespace,
      extensions: { pg_trgm: { version: "1.6", schema: extensionSchema } },
    },
  ]);
  assert(requiredApi);
  assert.deepEqual(
    requiredApi.scopes.map(({ namespace }) => namespace),
    [componentNamespace],
  );
  await withMigrationConnection(fixture.url, async (client) => {
    await acquireExtensionLock(client);
    await bootstrapSession(client, fixture.metadataNamespace, retainedRole);
    await client.query(
      `CREATE SCHEMA ${quoteIdentifier(extensionSchema)}; CREATE EXTENSION pg_trgm SCHEMA ${quoteIdentifier(extensionSchema)} VERSION '1.6'`,
    );
    for (const role of [fixture.runtimeRole, retainedRole])
      await client.query(`GRANT USAGE ON SCHEMA ${quoteIdentifier(extensionSchema)} TO ${quoteIdentifier(role)}`);
    await verifyRequiredApiOnTarget(client, requiredApi.scopes[0]!.requiredApi, retainedRole);
    await recordRuntimeCompatibility(client, {
      namespace: componentNamespace,
      metadataNamespace: fixture.metadataNamespace,
      deployment: "retained",
      version: retainedVersion,
      sourceSchema: fixture.artifact.plan.after,
      inspection: {
        head: fixture.artifact.plan.after,
        minimumOrdinal: 0,
        maximumOrdinal: 0,
        schemas: [fixture.artifact.plan.after],
        migrationHashes: [],
      },
      requiredApi,
      runtimeRole: retainedRole,
    });
    const meta = quoteIdentifier(fixture.metadataNamespace);
    if (dependency === "active") {
      const address = new URL(fixture.url);
      await client.query(
        `INSERT INTO ${meta}.deployment_activations(deployment,version,project_id,branch_id,endpoint_host,database_name,token_hash,state)
         VALUES('retained',$1,'project','br-preview',$2,current_database(),repeat('9',64),'active')`,
        [retainedVersion, address.hostname],
      );
    } else if (dependency === "pending") {
      await client.query(
        `INSERT INTO ${meta}.jobs(id,deployment,deduplication_key,fingerprint,call,identity,due_at,max_attempts,retry_delay_seconds,state)
         VALUES(uuidv7(),'retained','retained-proof',repeat('9',64),$1::jsonb,'{}',clock_timestamp(),1,0,'pending')`,
        [JSON.stringify({ version: retainedVersion })],
      );
    } else {
      await client.query(
        `INSERT INTO ${meta}.client_sessions(namespace,deployment,version,ticket_hash,expires_at)
         VALUES('unrelated_scope','retained',$1,repeat('9',64),clock_timestamp()+interval '1 hour')`,
        [retainedVersion],
      );
    }
  });
  return { ...fixture, retainedRole, componentNamespace, extensionSchema, requiredApi };
}

export type RetainedReleaseFixture = Awaited<ReturnType<typeof establishRetainedComponent>>;

export async function withRetainedReleaseFixture(
  operation: (fixture: RetainedReleaseFixture) => Promise<void>,
  dependency: ReleaseRetention = "session",
) {
  await withFrameworkPrefixFixture(async (base) => {
    const retainedRole = `retained_${crypto.randomUUID().replaceAll("-", "")}`;
    try {
      const fixture = await establishRetainedComponent(base, dependency, retainedRole);
      await operation(fixture);
    } finally {
      if ((await base.admin.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [retainedRole])).rowCount) {
        await base.admin.query(`GRANT ${quoteIdentifier(retainedRole)} TO CURRENT_USER`);
        await base.admin.query(`DROP OWNED BY ${quoteIdentifier(retainedRole)}`);
        await base.admin.query(`DROP ROLE ${quoteIdentifier(retainedRole)}`);
      }
    }
  });
}

export async function retainedReleaseSnapshot(fixture: RetainedReleaseFixture) {
  return {
    ...(await historySnapshot(fixture)),
    sessions: (
      await fixture.admin.query(
        `SELECT * FROM ${quoteIdentifier(fixture.metadataNamespace)}.client_sessions ORDER BY namespace,deployment,ticket_hash`,
      )
    ).rows,
    privileges: (
      await fixture.admin.query(
        `SELECT has_schema_privilege($1::name,$3,'USAGE') AS candidate,
                has_schema_privilege($2::name,$3,'USAGE') AS retained,
                has_table_privilege($1::name,$4,'SELECT') AS metadata_select`,
        [fixture.runtimeRole, fixture.retainedRole, fixture.extensionSchema, `${fixture.metadataNamespace}.jobs`],
      )
    ).rows,
    extensions: (
      await fixture.admin.query(
        "SELECT extname,extversion,extnamespace::regnamespace::text AS schema FROM pg_extension ORDER BY extname",
      )
    ).rows,
  };
}

export async function completeProviderJournal(journal: NeonReleaseJournal) {
  const functions = [
    { role: "service", functionId: "service", deploymentId: 1, slug: "service" },
    { role: "worker", functionId: "worker", deploymentId: 1, slug: "worker" },
  ] satisfies Extract<Parameters<NeonReleaseJournal["complete"]>[0], { stage: "bootstrap" }>["functions"];
  await journal.complete({ stage: "bootstrap", artifactHash: "d".repeat(64), functions });
  await journal.complete({ stage: "triggers", triggers: [], bindings: {} });
  await journal.complete({ stage: "functions", artifactHash: "e".repeat(64), functions });
  await journal.complete({ stage: "health" });
  await journal.complete({ stage: "activated" });
  await journal.complete({ stage: "complete", enabledTriggerIds: [] });
}

export async function writeReleaseDeclaration(
  fixture: FrameworkPrefixFixture,
  quarantine: "clone" | "preserve" = "preserve",
) {
  const { inputHash: _inputHash, activationToken: _activationToken, ...options } = fixture.options;
  await writeFile(
    join(fixture.root, "release.json"),
    JSON.stringify({
      ...options,
      quarantine,
      format: 1,
      slugs: { service: "service", worker: "worker" },
      activationTokenEnv: "DEPLOY_TOKEN",
      variables: { LOOM_DATABASE_URL: "RUNTIME_URL" },
    }),
  );
}

export async function makeVersion27(fixture: FrameworkPrefixFixture) {
  const meta = quoteIdentifier(fixture.metadataNamespace);
  await fixture.admin.query("BEGIN");
  try {
    await fixture.admin.query(
      `ALTER TABLE ${meta}.runtime_compatibility DROP COLUMN required_api, DROP COLUMN runtime_role`,
    );
    await fixture.admin.query(`DELETE FROM ${meta}.framework_migrations WHERE version>=28`);
    await fixture.admin.query("COMMIT");
  } catch (cause) {
    await fixture.admin.query("ROLLBACK");
    throw cause;
  }
}

export async function selectHostAndComponentApis(fixture: FrameworkPrefixFixture) {
  const configPath = join(fixture.root, "kello.config.ts");
  const config = await readFile(configPath, "utf8");
  const migrationUrlEnv = `LOOM_RETAINED_RELEASE_${crypto.randomUUID().replaceAll("-", "").toUpperCase()}`;
  const updatedConfig = config.replace(
    '"database":{',
    `"database":{"migrationUrlEnv":${JSON.stringify(migrationUrlEnv)},"extensions":{"pg_trgm":{"version":"1.6"},"citext":{"version":"1.8"}},`,
  );
  assert.notEqual(updatedConfig, config, "Fixture config must select actual host extension APIs");
  await writeFile(configPath, updatedConfig);
  const component = join(fixture.root, "kello/components/search");
  await mkdir(component, { recursive: true });
  await writeFile(
    join(component, "setup.ts"),
    'import {defineComponent} from "kello"; export default defineComponent({name:"search",extensions:{pg_trgm:{versions:["1.6"]}}});',
  );
  await writeFile(
    join(component, "schema.ts"),
    'import {defineSchema} from "kello/server"; export default defineSchema((f)=>({items:{title:f.text()}}));',
  );
  await writeFile(
    join(fixture.root, "kello/app.config.ts"),
    'import {defineApplication} from "kello"; import search from "./components/search/setup"; const app=defineApplication({rpc:({os})=>({os})}); app.use(search); export default app;',
  );
  process.env[migrationUrlEnv] = fixture.url;
  let generated: Awaited<ReturnType<typeof generateRelease>>;
  try {
    await prepareProject(fixture.root);
    generated = await generateRelease(fixture.root, "typed");
  } finally {
    delete process.env[migrationUrlEnv];
  }
  const project = await loadProject(fixture.root);
  const app = generated.scopes.find(({ mountPath }) => mountPath === "")!.artifact.plan;
  const scopes = projectMigrationScopes(project);
  const options = {
    ...fixture.options,
    version: project.version,
    migrationHashes: [fixture.artifact.plan.hash, app.hash],
    schema: { minimum: app.after, maximum: app.after, target: app.after },
    componentScopes: generated.scopes
      .filter(({ mountPath }) => mountPath !== "")
      .map((scope) => ({
        mountPath: scope.mountPath,
        namespace: scope.namespace,
        migrations: scopes.find(({ mountPath }) => mountPath === scope.mountPath)!.migrations,
        migrationHashes: [scope.artifact.plan.hash],
        schema: {
          minimum: scope.artifact.plan.after,
          maximum: scope.artifact.plan.after,
          target: scope.artifact.plan.after,
        },
      })),
  };
  const requiredApi = await inspectReleaseRequiredApi(project);
  assert(requiredApi);
  assert.deepEqual(requiredApi.scopes.map(({ mountPath }) => mountPath).sort(), ["", "search"]);
  return { ...fixture, options, requiredApi };
}
