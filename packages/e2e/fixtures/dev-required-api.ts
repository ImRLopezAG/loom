import assert from "node:assert/strict";
import { mkdir, mkdtemp, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type pg from "pg";
import { initializeProject, prepareProject } from "loom/tooling";
import type { LoomExtensionsInput } from "loom/tooling";
import { loadProject } from "../../../apps/loom/src/tooling/project/load";
import { synchronizeDevelopment } from "../../../apps/loom/src/tooling/dev/sync";
import type { DevelopmentDatabaseProvider } from "../../../apps/loom/src/tooling/dev/connection";
import { developmentOrmTable, readDevelopmentHistory } from "../../../apps/loom/src/tooling/dev/history";
import { withMigrationConnection, quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";
import { projectMigrationScopes } from "../../../apps/loom/src/tooling/migrations/component-scopes";
import { migrationHash } from "../../../apps/loom/src/tooling/migrations/planner";
import type { MigrationPlan } from "../../../apps/loom/src/tooling/migrations/planner";
import { validateMigration } from "../../../apps/loom/src/tooling/migrations/history";
import { buildRequiredApi } from "../../../apps/loom/src/tooling/migrations/required-api";
import { catalogFingerprint } from "../../../apps/loom/src/tooling/migrations/drift";
import { withExtensionDatabase } from "./extension-database";

export const typedDevExtensions = {
  pg_trgm: { version: "1.6", schema: "search_extensions" },
  citext: { version: "1.8", schema: "search_extensions" },
};

export type DevRequiredApiFixture = Awaited<ReturnType<typeof createFixture>>;

interface DevRequiredApiFixtureConfig {
  readonly extensions?: LoomExtensionsInput;
  readonly component?: boolean;
  readonly namespace?: string;
  readonly emptyComponent?: boolean;
}

export async function withDevRequiredApiFixture(
  operation: (fixture: DevRequiredApiFixture) => Promise<void>,
  configuration: DevRequiredApiFixtureConfig = {},
) {
  const config = {
    extensions: configuration.extensions ?? typedDevExtensions,
    component: configuration.component ?? false,
    namespace: configuration.namespace ?? "app",
    emptyComponent: configuration.emptyComponent ?? false,
  };
  await withExtensionDatabase(async (url) => {
    const root = await mkdtemp(join(tmpdir(), "loom-dev-required-api-"));
    const migrationUrlEnv = `LOOM_DEV_REQUIRED_API_${crypto.randomUUID().replaceAll("-", "").toUpperCase()}`;
    process.env[migrationUrlEnv] = url;
    const roles = [0, 1].map(() => `dev_api_${crypto.randomUUID().replaceAll("-", "")}`);
    try {
      await withMigrationConnection(url, async (client) => {
        await operation(await createFixture(client, url, root, roles, migrationUrlEnv, config));
      });
    } finally {
      delete process.env[migrationUrlEnv];
      await withMigrationConnection(url, async (client) => {
        for (const role of roles) {
          if ((await client.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rowCount) {
            await client.query(`GRANT ${quoteIdentifier(role)} TO CURRENT_USER`);
            await client.query(`DROP OWNED BY ${quoteIdentifier(role)}`);
            await client.query(`DROP ROLE ${quoteIdentifier(role)}`);
          }
        }
      });
      await rm(root, { recursive: true, force: true });
    }
  });
}

async function createFixture(
  client: pg.Client,
  url: string,
  root: string,
  roles: string[],
  migrationUrlEnv: string,
  config: Required<DevRequiredApiFixtureConfig>,
) {
  const { extensions, component, namespace, emptyComponent } = config;
  const runtimeRole = roles[0]!;
  const otherRole = roles[1]!;
  const address = new URL(url);
  const target = {
    projectId: "project",
    branchId: "br-developer",
    branchName: "developer",
    endpointId: address.hostname.split(".")[0]!,
    postgresVersion: 18 as const,
  };
  const provider: DevelopmentDatabaseProvider = {
    getProject: async () => ({ id: "project", name: "tasks", regionId: "test", pgVersion: 18 }),
    listBranches: async () => [{ id: target.branchId, name: target.branchName, protected: false, isDefault: false }],
    listEndpoints: async () => [
      {
        id: target.endpointId,
        branchId: target.branchId,
        type: "read_write",
        autoscalingLimitMinCu: 0.25,
        autoscalingLimitMaxCu: 1,
        suspendTimeout: 300,
      },
    ],
    getConnectionUri: async () => ({ uri: url }),
  };
  const options = {
    root,
    runtimeRole,
    databaseName: decodeURIComponent(address.pathname.slice(1)),
    migrationRole: decodeURIComponent(address.username),
  };
  await initializeProject(root, "tasks");
  await mkdir(join(root, "node_modules"));
  for (const name of ["loom", "valibot", "drizzle-orm"])
    await symlink(
      await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
      join(root, "node_modules", name),
    );
  await writeFile(
    join(root, "loom.config.ts"),
    `import {defineConfig} from "loom/tooling"; export default defineConfig(${JSON.stringify({
      project: "tasks",
      database: { namespace, extensions, migrationUrlEnv },
      provider: { projectId: target.projectId, targets: { development: { branchId: target.branchId } } },
    })});`,
  );
  async function schema(extra = "") {
    await writeFile(
      join(root, "loom/schema.ts"),
      `import {defineSchema,defineTable} from "loom/server"; import {sql} from "drizzle-orm"; import {text} from "drizzle-orm/pg-core";
       export default defineSchema((s)=>({tasks:defineTable({title:s.text().notNull()${extra}}, {publicFields:["_id","title"]})}),{namespace:${JSON.stringify(namespace)}});`,
    );
    return prepareProject(root);
  }
  await schema();
  if (component) {
    const directory = join(root, "loom/components/search");
    await mkdir(directory, { recursive: true });
    await writeFile(
      join(directory, "setup.ts"),
      'import {defineComponent} from "loom"; export default defineComponent({name:"search",extensions:{pg_trgm:{versions:["1.6"]}}});',
    );
    await writeFile(
      join(directory, "schema.ts"),
      'import {defineSchema} from "loom/server"; export default defineSchema((s)=>({items:{title:s.text()}}));',
    );
    await writeFile(
      join(root, "loom/app.config.ts"),
      `import {defineApplication} from "loom"; import search from "./components/search/setup";
       ${emptyComponent ? 'import empty from "./components/empty/setup";' : ""}
       const app=defineApplication({rpc:({os})=>({os})}); ${emptyComponent ? "app.use(empty);" : ""} app.use(search); export default app;`,
    );
    if (emptyComponent) {
      const empty = join(root, "loom/components/empty");
      await mkdir(empty, { recursive: true });
      await writeFile(
        join(empty, "setup.ts"),
        'import {defineComponent} from "loom"; export default defineComponent({name:"empty"});',
      );
      await writeFile(
        join(empty, "schema.ts"),
        'import {defineSchema} from "loom/server"; export default defineSchema((s)=>({items:{title:s.text()}}));',
      );
    }
  }
  async function sync(role = runtimeRole) {
    const candidate = await prepareProject(root);
    return synchronizeDevelopment({ ...options, runtimeRole: role, sourceVersion: candidate.version }, provider);
  }
  async function history(selected = namespace) {
    return readDevelopmentHistory(client, "loom_meta", selected, target);
  }
  // Model immutable historical format-3 evidence using the existing canonical hash and validator.
  async function setSavedPins(present: boolean) {
    const project = await loadProject(root);
    for (const scope of projectMigrationScopes(project)) {
      const rows = await history(scope.namespace);
      assert.equal(rows.length, 1, "Rewrite only the fixture's initial historical artifact");
      const original = rows[0]!.artifact;
      assert.equal(original.format, 3);
      if (original.format !== 3) throw new Error("Expected installation context");
      const { requiredApi: _old, ...installation } = original;
      const requiredApi = present
        ? buildRequiredApi(scope.extensions, "metadata" in scope.schema ? scope.schema.metadata : undefined)
        : undefined;
      const content = { ...installation, ...(requiredApi && { requiredApi }) };
      const artifact: MigrationPlan = { ...content, hash: migrationHash(content) };
      await validateMigration(artifact);
      await client.query("BEGIN");
      try {
        await client.query(
          "UPDATE loom_meta.development_history SET artifact=$1,artifact_hash=$2 WHERE namespace=$3 AND ordinal=1",
          [JSON.stringify(artifact), artifact.hash, scope.namespace],
        );
        await client.query(
          `UPDATE loom_meta.${quoteIdentifier(developmentOrmTable(scope.namespace))} SET hash=$1 WHERE name='development_1'`,
          [artifact.hash],
        );
        await client.query("COMMIT");
      } catch (cause) {
        await client.query("ROLLBACK");
        throw cause;
      }
    }
  }
  async function snapshot() {
    const project = await loadProject(root);
    const scopes = projectMigrationScopes(project);
    const catalogs = [];
    const orm = [];
    // One PostgreSQL client executes one query at a time; keep fixture observation serial.
    for (const scope of scopes) {
      catalogs.push([scope.namespace, await catalogFingerprint(client, scope.namespace)]);
      const relation = `loom_meta.${quoteIdentifier(developmentOrmTable(scope.namespace))}`;
      const exists = (await client.query("SELECT to_regclass($1) AS relation", [relation])).rows[0].relation;
      orm.push([scope.namespace, exists ? (await client.query(`SELECT * FROM ${relation} ORDER BY id`)).rows : []]);
    }
    return {
      framework: (await client.query("SELECT version,hash FROM loom_meta.framework_migrations ORDER BY version")).rows,
      development: (await client.query("SELECT * FROM loom_meta.development_history ORDER BY namespace,ordinal")).rows,
      release: (await client.query("SELECT * FROM loom_meta.migration_history ORDER BY namespace,ordinal")).rows,
      ownership: (await client.query("SELECT * FROM loom_meta.component_namespaces ORDER BY namespace")).rows,
      compatibility: (
        await client.query("SELECT * FROM loom_meta.runtime_compatibility ORDER BY namespace,deployment,version")
      ).rows,
      activations: (await client.query("SELECT * FROM loom_meta.deployment_activations ORDER BY deployment,version"))
        .rows,
      jobs: (await client.query("SELECT * FROM loom_meta.jobs ORDER BY id")).rows,
      sessions: (
        await client.query("SELECT * FROM loom_meta.client_sessions ORDER BY namespace,deployment,ticket_hash")
      ).rows,
      catalogs,
      orm,
      jobsPrivileges: (
        await client.query(
          "SELECT rolname,has_table_privilege(oid,'loom_meta.jobs','SELECT') AS can_select,has_table_privilege(oid,'loom_meta.jobs','DELETE') AS can_delete FROM pg_roles WHERE rolname=ANY($1::text[]) ORDER BY rolname",
          [roles],
        )
      ).rows,
      metadataAcl: (
        await client.query(
          `SELECT n.nspowner AS owner,acl.grantor,acl.grantee,acl.privilege_type,acl.is_grantable
           FROM pg_catalog.pg_namespace n
           LEFT JOIN LATERAL pg_catalog.aclexplode(COALESCE(n.nspacl,pg_catalog.acldefault('n',n.nspowner))) AS acl ON true
           WHERE n.nspname='loom_meta'
           ORDER BY n.nspowner,acl.grantor,acl.grantee,acl.privilege_type,acl.is_grantable`,
        )
      ).rows,
      roleMarkers: (
        await client.query(
          "SELECT rolname,shobj_description(oid,'pg_authid') AS marker FROM pg_roles WHERE rolname=ANY($1::text[]) ORDER BY rolname",
          [roles],
        )
      ).rows,
    };
  }
  return {
    client,
    root,
    url,
    target,
    provider,
    options,
    namespace,
    runtimeRole,
    otherRole,
    schema,
    sync,
    history,
    setSavedPins,
    snapshot,
  };
}
