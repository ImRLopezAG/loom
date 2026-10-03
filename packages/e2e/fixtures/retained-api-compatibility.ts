import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type pg from "pg";
import { defineSchema } from "loom/server";
import { emptySnapshot } from "../../../apps/loom/src/tooling/migrations/adapter";
import { planMigration } from "../../../apps/loom/src/tooling/migrations/planner";
import type { MigrationPlan } from "../../../apps/loom/src/tooling/migrations/planner";
import { planCustomMigration } from "../../../apps/loom/src/tooling/migrations/custom";
import { writeMigration } from "../../../apps/loom/src/tooling/migrations/history";
import { buildGenerationRequiredApi } from "../../../apps/loom/src/tooling/codegen/required-api";
import { bootstrapSession } from "../../../apps/loom/src/tooling/migrations/bootstrap";
import { withMigrationConnection, quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";
import { applyMigrationsOnConnection } from "../../../apps/loom/src/tooling/migrations/runner";
import { recordRuntimeCompatibility } from "../../../apps/loom/src/tooling/migrations/runtime-compatibility";
import { verifyRequiredApiOnTarget } from "../../../apps/loom/src/tooling/migrations/required-api-verification";
import { ormHistoryTable } from "../../../apps/loom/src/tooling/migrations/state";
import { catalogFingerprint } from "../../../apps/loom/src/tooling/migrations/drift";
import { withExtensionDatabase } from "./extension-database";

export const retainedVersion = "a".repeat(64);
export const otherVersion = "b".repeat(64);
const namespace = "app";
const componentNamespace = "component_search";
const metadataNamespace = "loom_meta";
const extensionSchema = "search_extensions";

export type RetainedDependency = "active" | "pending" | "running" | "claimed" | "session";

export async function withRetainedApiFixture(
  operation: (fixture: Awaited<ReturnType<typeof createFixture>>) => Promise<void>,
) {
  await withExtensionDatabase(async (url) => {
    await withMigrationConnection(url, async (client) => {
      const root = await mkdtemp(join(tmpdir(), "loom-retained-api-"));
      const roles = [1, 2].map(() => `runtime_${crypto.randomUUID().replaceAll("-", "")}`);
      const candidateRole = roles[0]!;
      const retainedRole = roles[1]!;
      try {
        const fixture = await createFixture(client, root, candidateRole, retainedRole);
        await operation(fixture);
      } finally {
        await client.query("RESET ROLE");
        for (const role of roles) {
          if ((await client.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [role])).rowCount) {
            await client.query(`GRANT ${quoteIdentifier(role)} TO CURRENT_USER`);
            await client.query(`DROP OWNED BY ${quoteIdentifier(role)}`);
            await client.query(`DROP ROLE ${quoteIdentifier(role)}`);
          }
        }
        await rm(root, { recursive: true, force: true });
      }
    });
  });
}

async function createFixture(client: pg.Client, root: string, candidateRole: string, retainedRole: string) {
  const schema = defineSchema((s) => ({ tasks: { title: s.text() } }), { namespace });
  const initial = await planMigration(await emptySnapshot(namespace), schema);
  assert.equal(initial.format, 2, "The candidate is genuinely extension-free");
  await writeMigration(root, "migrations", "initial", initial);
  const options = { root, migrations: "migrations", namespace, metadataNamespace, runtimeRole: candidateRole };
  await applyMigrationsOnConnection(client, options);
  await client.query("INSERT INTO app.tasks(title) VALUES ('preserved')");
  await bootstrapSession(client, metadataNamespace, retainedRole);
  await client.query(
    `CREATE SCHEMA ${extensionSchema}; CREATE EXTENSION pg_trgm SCHEMA ${extensionSchema} VERSION '1.6'`,
  );
  for (const role of [candidateRole, retainedRole])
    await client.query(`GRANT USAGE ON SCHEMA ${extensionSchema} TO ${quoteIdentifier(role)}`);
  const requiredApi = buildGenerationRequiredApi([
    { mountPath: "", namespace, extensions: {} },
    {
      mountPath: "search",
      namespace: componentNamespace,
      extensions: { pg_trgm: { version: "1.6", schema: extensionSchema } },
    },
  ]);
  assert(requiredApi);
  assert.deepEqual(
    requiredApi.scopes.map((scope) => scope.namespace),
    [componentNamespace],
  );
  const scopedApi = requiredApi.scopes[0]!.requiredApi;
  await verifyRequiredApiOnTarget(client, scopedApi, retainedRole);
  const artifacts: MigrationPlan[] = [initial];

  async function register() {
    assert(requiredApi);
    for (const selected of [namespace, componentNamespace]) {
      const inspection =
        selected === namespace
          ? {
              head: artifacts.at(-1)!.after,
              minimumOrdinal: 0,
              maximumOrdinal: artifacts.length,
              schemas: [initial.after],
              migrationHashes: artifacts.map((artifact) => artifact.hash),
            }
          : {
              head: initial.after,
              minimumOrdinal: 0,
              maximumOrdinal: 0,
              schemas: [initial.after],
              migrationHashes: [],
            };
      await recordRuntimeCompatibility(client, {
        namespace: selected,
        metadataNamespace,
        deployment: "retained",
        version: retainedVersion,
        sourceSchema: initial.after,
        inspection,
        requiredApi,
        runtimeRole: retainedRole,
      });
    }
  }
  await register();

  async function depend(kind: RetainedDependency) {
    if (kind === "active") {
      await client.query(
        `INSERT INTO loom_meta.deployment_activations(deployment,version,project_id,branch_id,endpoint_host,database_name,token_hash,state)
        VALUES('retained',$1,'fixture','fixture','localhost',current_database(),repeat('c',64),'active')`,
        [retainedVersion],
      );
    } else if (kind === "session") {
      await client.query(
        `INSERT INTO loom_meta.client_sessions(namespace,deployment,version,ticket_hash,expires_at)
        VALUES('unrelated_session_scope','retained',$1,repeat('d',64),clock_timestamp()+interval '1 hour')`,
        [retainedVersion],
      );
    } else {
      const running = kind === "running" || kind === "claimed";
      await client.query(
        `INSERT INTO loom_meta.jobs(id,deployment,deduplication_key,fingerprint,call,identity,due_at,max_attempts,retry_delay_seconds,state,lease_owner,lease_expires_at,claim_version)
        VALUES(uuidv7(),'retained',$1,repeat('e',64),$2::jsonb,'{}',clock_timestamp(),1,0,$3,$4,$5,$6)`,
        [
          kind,
          JSON.stringify({ version: kind === "claimed" ? otherVersion : retainedVersion }),
          running ? "running" : "pending",
          running ? "fixture-worker" : null,
          running ? new Date(Date.now() + 3600000) : null,
          kind === "claimed" ? retainedVersion : null,
        ],
      );
    }
  }

  async function append(sql: string, name = "change") {
    const previous = artifacts.at(-1)!;
    const plan = await planCustomMigration(previous.snapshot, schema, sql, "transactional", previous.hash);
    await writeMigration(root, "migrations", name, plan);
    artifacts.push(plan);
    await register();
    return plan;
  }
  const apply = (recoverNontransactional = false) =>
    applyMigrationsOnConnection(client, {
      ...options,
      reviewedHashes: artifacts.slice(1).map((artifact) => artifact.hash),
      recoverNontransactional,
    });

  async function snapshot() {
    return {
      framework: (await client.query("SELECT version,hash FROM loom_meta.framework_migrations ORDER BY version")).rows,
      compatibility: (
        await client.query("SELECT * FROM loom_meta.runtime_compatibility ORDER BY namespace,deployment,version")
      ).rows,
      scopes: (await client.query("SELECT * FROM loom_meta.runtime_scopes ORDER BY namespace,deployment,version")).rows,
      activations: (await client.query("SELECT * FROM loom_meta.deployment_activations ORDER BY deployment,version"))
        .rows,
      jobs: (await client.query("SELECT * FROM loom_meta.jobs ORDER BY id")).rows,
      sessions: (
        await client.query("SELECT * FROM loom_meta.client_sessions ORDER BY namespace,deployment,ticket_hash")
      ).rows,
      history: (await client.query("SELECT * FROM loom_meta.migration_history ORDER BY namespace,ordinal")).rows,
      orm: (
        await client.query(
          `SELECT id,hash,name,created_at FROM loom_meta.${quoteIdentifier(ormHistoryTable(namespace))} ORDER BY id`,
        )
      ).rows,
      recovery: (await client.query("SELECT * FROM loom_meta.nontransactional_migrations ORDER BY namespace")).rows,
      revisions: (await client.query("SELECT * FROM loom_meta.table_revisions ORDER BY namespace,table_name")).rows,
      applicationCatalog: await catalogFingerprint(client, namespace),
      data: (await client.query("SELECT _id,title FROM app.tasks ORDER BY _id")).rows,
      extensions: (
        await client.query(
          "SELECT extname,extversion,extnamespace::regnamespace::text AS schema FROM pg_extension ORDER BY extname",
        )
      ).rows,
      privileges: (
        await client.query(
          "SELECT has_schema_privilege($1::name,'search_extensions','USAGE') AS candidate,has_schema_privilege($2::name,'search_extensions','USAGE') AS retained",
          [candidateRole, retainedRole],
        )
      ).rows,
      metadataPrivilege: (
        await client.query("SELECT has_table_privilege($1::name,'loom_meta.jobs','SELECT') AS allowed", [candidateRole])
      ).rows,
    };
  }
  return {
    client,
    root,
    schema,
    initial,
    artifacts,
    options,
    candidateRole,
    retainedRole,
    requiredApi,
    scopedApi,
    register,
    depend,
    append,
    apply,
    snapshot,
  };
}
