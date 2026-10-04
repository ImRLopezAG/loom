import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import pg from "pg";
import {
  prepareProject,
  startDevelopmentRuntime as startPublicDevelopmentRuntime,
  synchronizeDevelopment as synchronizePublicDevelopment,
} from "kello/tooling";
import { resolveSelectedExtension } from "../../../apps/loom/src/tooling/codegen/extensions";
import { buildGenerationRequiredApi } from "../../../apps/loom/src/tooling/codegen/required-api";
import type { GenerationRequiredApi } from "../../../apps/loom/src/tooling/codegen/required-api";
import { developmentOrmTable } from "../../../apps/loom/src/tooling/dev/history";
import { startDevelopmentRuntime as startSourceDevelopmentRuntime } from "../../../apps/loom/src/tooling/dev/runtime";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import {
  captureExtensionTextSearch,
  createExtensionTextSearchCapture,
} from "../../../apps/loom/src/tooling/extensions/text-search-capture";
import type { ExtensionTextSearchCapture } from "../../../apps/loom/src/tooling/extensions/text-search-capture";
import { bootstrapSession } from "../../../apps/loom/src/tooling/migrations/bootstrap";
import {
  acquireExtensionLock,
  quoteIdentifier,
  withMigrationConnection,
} from "../../../apps/loom/src/tooling/migrations/connection";
import { migrationHash } from "../../../apps/loom/src/tooling/migrations/planner";
import { applyMigrations } from "../../../apps/loom/src/tooling/migrations/runner";
import type { RequiredApi } from "../../../apps/loom/src/tooling/migrations/required-api";
import { recordRuntimeCompatibility } from "../../../apps/loom/src/tooling/migrations/runtime-compatibility";
import { verifyRequiredApiOnTarget } from "../../../apps/loom/src/tooling/migrations/required-api-verification";
import { withDevRuntimeRequiredApiFixture } from "./dev-runtime-required-api";
import type { DevRuntimeRequiredApiFixture } from "./dev-runtime-required-api";
import { withExtensionDatabase } from "./extension-database";
import { withFrameworkPrefixFixture } from "./framework-prefix-readiness";
import { retainedVersion } from "./retained-api-release";
import type { RetainedReleaseFixture, ReleaseRetention } from "./retained-api-release";

/** Reviewed identity of the Unaccent 1.1 family on PostgreSQL 18 / Neon. */
export const unaccentManifestDigest = "f983b4bfaa4c974c4ae2eba548249eb86d31d86376d019898b070ff66f9832dd";
export const unaccentGraphDigest = "9bfba15f9043a004cea04315c1c52dec6ce8a19f4a5e828a369234ac1644ba2d";
export const unaccentSchema = "accent_lifecycle";
export const retainedUnaccentSchema = "retained_accent";
export const unaccentProvider = "neon";

/** Unaccent selected for the application scope only; the selected placement is deliberately not `extensions`. */
export const unaccentExtensions = { unaccent: { version: "1.1", schema: unaccentSchema } };

export async function withUnaccentDevRuntime(
  operation: (fixture: DevRuntimeRequiredApiFixture) => Promise<void>,
  configuration: Parameters<typeof withDevRuntimeRequiredApiFixture>[1] = { extensions: unaccentExtensions },
) {
  await withDevRuntimeRequiredApiFixture(operation, configuration);
}

/** Whether the disposable target's migration role can alter extension-owned objects (superuser targets only). */
export async function targetIsSuperuser(): Promise<boolean> {
  const connectionString = process.env.LOOM_TEST_DATABASE_URL;
  if (!connectionString) return false;
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    const result = await client.query<{ superuser: boolean }>(
      "SELECT current_setting('is_superuser')='on' AS superuser",
    );
    return result.rows[0]?.superuser === true;
  } finally {
    await client.end();
  }
}

/** The existing public tooling entries, run against the same fixture so lifecycle claims name the entry they used. */
export function publicLifecycle(fixture: DevRuntimeRequiredApiFixture) {
  const { root, runtimeRole, options, provider } = fixture;
  async function sync(role = runtimeRole) {
    const candidate = await prepareProject(root);
    return synchronizePublicDevelopment(
      {
        root,
        runtimeRole: role,
        databaseName: options.databaseName,
        migrationRole: options.migrationRole,
        sourceVersion: candidate.version,
      },
      provider,
    );
  }
  async function attempt(sourceVersion = options.sourceVersion) {
    const started = await startPublicDevelopmentRuntime({ ...options, sourceVersion }, provider);
    try {
      return started.binding;
    } finally {
      await started.runtime.stop();
    }
  }
  return { sync, attempt };
}
export type LifecycleEntry = "source" | "public";
export function lifecycle(fixture: DevRuntimeRequiredApiFixture, entry: LifecycleEntry) {
  return entry === "public"
    ? publicLifecycle(fixture)
    : {
        sync: (role?: string) => fixture.sync(role),
        // The existing fixture starts only its initial candidate; an explicit later version uses the same source function.
        attempt: async (sourceVersion?: string) => {
          if (sourceVersion === undefined) return (await fixture.attempt()).binding;
          const started = await startSourceDevelopmentRuntime({ ...fixture.options, sourceVersion }, fixture.provider);
          try {
            return started.binding;
          } finally {
            await started.runtime.stop();
          }
        },
      };
}

/** Native extension-owned dictionary actions. Observation only: no lifecycle result is inferred from them. */
export async function observeGraph(client: pg.Client) {
  const manifest = await captureExtensionContract(client, {
    name: "unaccent",
    provider: unaccentProvider,
    fixture: "unaccent-required-api-lifecycle",
  });
  return captureExtensionTextSearch(client, manifest, {
    provider: unaccentProvider,
    fixture: "unaccent-required-api-lifecycle",
  });
}
export async function driftDictionary(client: pg.Client, schema: string) {
  const target = quoteIdentifier(schema);
  // The historical member manifest does not record dictionary pointers; the supplemental graph must catch this.
  await client.query(`ALTER EXTENSION unaccent DROP TEXT SEARCH DICTIONARY ${target}.unaccent;
    DROP TEXT SEARCH DICTIONARY ${target}.unaccent;
    CREATE TEXT SEARCH DICTIONARY ${target}.unaccent (TEMPLATE=pg_catalog.simple);
    ALTER EXTENSION unaccent ADD TEXT SEARCH DICTIONARY ${target}.unaccent`);
}
export async function restoreDictionary(client: pg.Client, schema: string) {
  const target = quoteIdentifier(schema);
  await client.query(`ALTER EXTENSION unaccent DROP TEXT SEARCH DICTIONARY ${target}.unaccent;
    DROP TEXT SEARCH DICTIONARY ${target}.unaccent;
    CREATE TEXT SEARCH DICTIONARY ${target}.unaccent (TEMPLATE=${target}.unaccent, RULES='unaccent');
    ALTER EXTENSION unaccent ADD TEXT SEARCH DICTIONARY ${target}.unaccent`);
}

/**
 * Structurally valid drift: the dictionary keeps its owner, template and callbacks and only its RULES differ, so the
 * native capture SUCCEEDS and only the graph digest can disagree with the pin. The rules basename must be genuinely
 * installed on the target (see discoverAlternateRules); nothing is created or invented here.
 */
export async function driftRules(client: pg.Client, schema: string, rules: string) {
  await client.query(
    `ALTER TEXT SEARCH DICTIONARY ${quoteIdentifier(schema)}.unaccent (RULES = ${pg.escapeLiteral(rules)})`,
  );
}
export async function restoreRules(client: pg.Client, schema: string) {
  await client.query(`ALTER TEXT SEARCH DICTIONARY ${quoteIdentifier(schema)}.unaccent (RULES = 'unaccent')`);
}

/** Native capability failures that legitimately mean "this target cannot enumerate or load alternative rules". */
const enumerationRestrictions = ["42501", "58P01"] as const; // insufficient_privilege, undefined_file
const rulesFileLoadingFailure = "F0000"; // config_file_error: the file cannot be loaded or parsed as Unaccent rules
function isNativeFailure(error: Error, permitted: readonly string[]): boolean {
  return error instanceof pg.DatabaseError && error.code !== undefined && permitted.includes(error.code);
}

/**
 * Find a genuinely installed alternative rules file that PostgreSQL itself accepts for Unaccent. Enumeration is by native
 * `pg_ls_dir` over the server's `tsearch_data` directory (superuser targets only); each candidate is only probed inside a
 * rolled-back transaction. Only these failures mean "no usable alternative here" and yield undefined: a native
 * insufficient-privilege or undefined-file error while enumerating, and a native config-file error (F0000) from the ALTER.
 * Every other failure propagates, and the graph capture and digest checks run OUTSIDE any catch, so a capture or graph
 * regression fails the file instead of silently skipping digest-comparison coverage. Nothing is ever fabricated.
 */
export async function discoverAlternateRules(): Promise<string | undefined> {
  if (!(await targetIsSuperuser())) return undefined;
  let found: string | undefined;
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      await client.query(`CREATE SCHEMA ${quoteIdentifier(unaccentSchema)}`);
      await client.query(`CREATE EXTENSION unaccent SCHEMA ${quoteIdentifier(unaccentSchema)} VERSION '1.1'`);
      let candidates: string[];
      try {
        const shared = await client.query<{ setting: string }>(
          "SELECT setting FROM pg_catalog.pg_config WHERE name='SHAREDIR'",
        );
        const listing = await client.query<{ name: string }>("SELECT name FROM pg_catalog.pg_ls_dir($1) AS name", [
          `${shared.rows[0]!.setting}/tsearch_data`,
        ]);
        candidates = listing.rows
          .flatMap((row) => /^([a-z0-9_]+)\.rules$/.exec(row.name)?.[1] ?? [])
          .filter((basename) => basename !== "unaccent")
          .sort();
      } catch (error) {
        if (!(error instanceof Error) || !isNativeFailure(error, enumerationRestrictions)) throw error;
        return;
      }
      for (const candidate of candidates) {
        await client.query("BEGIN");
        try {
          let accepted = true;
          try {
            await driftRules(client, unaccentSchema, candidate);
          } catch (error) {
            if (!(error instanceof Error) || !isNativeFailure(error, [rulesFileLoadingFailure])) throw error;
            accepted = false;
          }
          // Not an Unaccent rules file: the failed ALTER aborts the transaction, so skip to its rollback.
          if (!accepted) continue;
          // PostgreSQL accepted the alternative. From here a failing capture, an unchanged digest or unexpected options
          // are regressions, not "no alternative": they are never caught.
          const drifted = await observeGraph(client);
          assert.notEqual(
            drifted.digest,
            unaccentGraphDigest,
            `installed '${candidate}' left the graph digest unchanged`,
          );
          assert.equal(drifted.contract.dictionaries[0]?.options, `rules = '${candidate}'`);
          found = candidate;
          return;
        } finally {
          await client.query("ROLLBACK");
        }
      }
    } finally {
      await client.end();
    }
  });
  return found;
}

/** A self-consistent graph whose digest is not the reviewed pin, built with the production validator. */
export function alternateGraph(): ExtensionTextSearchCapture {
  const selected = resolveSelectedExtension("unaccent", unaccentExtensions.unaccent);
  assert(selected.manifest && selected.textSearch);
  return createExtensionTextSearchCapture(
    selected.manifest,
    {
      ...selected.textSearch.contract,
      dictionaries: selected.textSearch.contract.dictionaries.map((dictionary) => ({
        ...dictionary,
        options: "rules = 'different'",
      })),
    },
    selected.textSearch.provenance,
  );
}
export function withAlternateGraph(requiredApi: RequiredApi): RequiredApi {
  const graph = alternateGraph();
  assert.notEqual(graph.digest, unaccentGraphDigest);
  return { ...requiredApi, apis: requiredApi.apis.map((api) => ({ ...api, textSearch: graph })) };
}
export function withAlternateGraphEvidence(evidence: GenerationRequiredApi): GenerationRequiredApi {
  return {
    ...evidence,
    scopes: evidence.scopes.map((scope) => ({ ...scope, requiredApi: withAlternateGraph(scope.requiredApi) })),
  };
}

/** Persisted generation evidence is a file; replace it with exact bytes. */
export async function writeGenerationEvidence(fixture: DevRuntimeRequiredApiFixture, evidence: GenerationRequiredApi) {
  await writeFile(`${fixture.generationDirectory}/required-api.json`, `${JSON.stringify(evidence, null, 2)}\n`);
}

/** Replace the saved development head's pin with the existing canonical hash, so only the pin content differs. */
export async function replaceSavedPin(
  fixture: DevRuntimeRequiredApiFixture,
  replace: (pin: RequiredApi) => RequiredApi,
) {
  const original = (await fixture.history())[0]!.artifact;
  assert(original.format === 3 && original.requiredApi);
  const content = { ...original, requiredApi: replace(original.requiredApi) };
  const artifact = { ...content, hash: migrationHash(content) };
  await fixture.client.query(
    "UPDATE loom_meta.development_history SET artifact=$1,artifact_hash=$2 WHERE namespace=$3 AND ordinal=1",
    [JSON.stringify(artifact), artifact.hash, fixture.namespace],
  );
  await fixture.client.query(
    `UPDATE loom_meta.${quoteIdentifier(developmentOrmTable(fixture.namespace))} SET hash=$1 WHERE name='development_1'`,
    [artifact.hash],
  );
  return original;
}
export async function restoreSavedPin(
  fixture: DevRuntimeRequiredApiFixture,
  original: NonNullable<Awaited<ReturnType<DevRuntimeRequiredApiFixture["history"]>>[number]["artifact"]>,
) {
  await fixture.client.query(
    "UPDATE loom_meta.development_history SET artifact=$1,artifact_hash=$2 WHERE namespace=$3 AND ordinal=1",
    [JSON.stringify(original), original.hash, fixture.namespace],
  );
  await fixture.client.query(
    `UPDATE loom_meta.${quoteIdentifier(developmentOrmTable(fixture.namespace))} SET hash=$1 WHERE name='development_1'`,
    [original.hash],
  );
}

/** Original retained development evidence for an Unaccent component, under a distinct saved role. */
export async function registerUnaccentRetention(fixture: DevRuntimeRequiredApiFixture) {
  const { client, otherRole } = fixture;
  await bootstrapSession(client, "loom_meta", otherRole);
  await client.query(
    `CREATE SCHEMA ${retainedUnaccentSchema}; CREATE EXTENSION unaccent SCHEMA ${retainedUnaccentSchema} VERSION '1.1'`,
  );
  await client.query(`GRANT USAGE ON SCHEMA ${retainedUnaccentSchema} TO ${quoteIdentifier(otherRole)}`);
  const requiredApi = buildGenerationRequiredApi([
    {
      mountPath: "retained",
      namespace: "component_retained",
      extensions: { unaccent: { version: "1.1", schema: retainedUnaccentSchema } },
    },
  ]);
  assert(requiredApi);
  assert.equal(requiredApi.scopes[0]!.requiredApi.apis[0]!.textSearch?.digest, unaccentGraphDigest);
  // The healthy retained target passes the existing native verification before any lifecycle entry runs.
  await verifyRequiredApiOnTarget(client, requiredApi.scopes[0]!.requiredApi, otherRole);
  const artifact = (await fixture.history())[0]!.artifact;
  await recordRuntimeCompatibility(client, {
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
    runtimeRole: otherRole,
  });
  const address = new URL(fixture.url);
  await client.query(
    "INSERT INTO loom_meta.deployment_activations(deployment,version,project_id,branch_id,endpoint_host,database_name,token_hash,state) VALUES('retained',repeat('a',64),$1,$2,$3,current_database(),repeat('c',64),'active')",
    [fixture.target.projectId, fixture.target.branchId, address.hostname],
  );
  return { requiredApi, schema: retainedUnaccentSchema, role: otherRole };
}
/** The original evidence exactly as persisted in the database, not as rebuilt by the test. */
export async function readRetainedEvidence(client: pg.Client, namespace: string, metadataNamespace = "loom_meta") {
  const rows = await client.query<{ required_api: GenerationRequiredApi | null; runtime_role: string | null }>(
    `SELECT required_api,runtime_role FROM ${quoteIdentifier(metadataNamespace)}.runtime_compatibility WHERE namespace=$1 AND deployment='retained'`,
    [namespace],
  );
  assert.equal(rows.rows.length, 1);
  return rows.rows[0]!;
}
export async function replaceRetainedEvidence(
  client: pg.Client,
  namespace: string,
  evidence: GenerationRequiredApi,
  metadataNamespace = "loom_meta",
) {
  await client.query(
    `UPDATE ${quoteIdentifier(metadataNamespace)}.runtime_compatibility SET required_api=$1::jsonb WHERE namespace=$2 AND deployment='retained'`,
    [JSON.stringify(evidence), namespace],
  );
}

/**
 * Release retention for Unaccent. The existing retained release fixture is not parameterized (its establishment step
 * is private and selects pg_trgm), so only that Unaccent-specific registration is reproduced here; every lifecycle
 * entry (applyMigrations, withNeonReleaseDatabase, planProjectRelease) remains the existing public/source one.
 */
export async function withUnaccentRetainedReleaseFixture(
  operation: (fixture: RetainedReleaseFixture) => Promise<void>,
  dependency: ReleaseRetention = "session",
) {
  await withFrameworkPrefixFixture(async (base) => {
    const retainedRole = `retained_${crypto.randomUUID().replaceAll("-", "")}`;
    try {
      await applyMigrations({
        connectionString: base.url,
        root: base.root,
        migrations: base.migrations,
        namespace: base.namespace,
        metadataNamespace: base.metadataNamespace,
        runtimeRole: base.runtimeRole,
      });
      assert.equal(base.artifact.plan.format, 2, "Incoming release is genuinely extension-free");
      const componentNamespace = `search_${crypto.randomUUID().replaceAll("-", "")}`;
      const extensionSchema = `ext_${crypto.randomUUID().replaceAll("-", "")}`;
      const requiredApi = buildGenerationRequiredApi([
        { mountPath: "", namespace: base.namespace, extensions: {} },
        {
          mountPath: "search",
          namespace: componentNamespace,
          extensions: { unaccent: { version: "1.1", schema: extensionSchema } },
        },
      ]);
      assert(requiredApi);
      assert.deepEqual(
        requiredApi.scopes.map(({ namespace }) => namespace),
        [componentNamespace],
      );
      assert.equal(requiredApi.scopes[0]!.requiredApi.apis[0]!.textSearch?.digest, unaccentGraphDigest);
      await withMigrationConnection(base.url, async (client) => {
        await acquireExtensionLock(client);
        await bootstrapSession(client, base.metadataNamespace, retainedRole);
        await client.query(
          `CREATE SCHEMA ${quoteIdentifier(extensionSchema)}; CREATE EXTENSION unaccent SCHEMA ${quoteIdentifier(extensionSchema)} VERSION '1.1'`,
        );
        for (const role of [base.runtimeRole, retainedRole])
          await client.query(`GRANT USAGE ON SCHEMA ${quoteIdentifier(extensionSchema)} TO ${quoteIdentifier(role)}`);
        await verifyRequiredApiOnTarget(client, requiredApi.scopes[0]!.requiredApi, retainedRole);
        await recordRuntimeCompatibility(client, {
          namespace: componentNamespace,
          metadataNamespace: base.metadataNamespace,
          deployment: "retained",
          version: retainedVersion,
          sourceSchema: base.artifact.plan.after,
          inspection: {
            head: base.artifact.plan.after,
            minimumOrdinal: 0,
            maximumOrdinal: 0,
            schemas: [base.artifact.plan.after],
            migrationHashes: [],
          },
          requiredApi,
          runtimeRole: retainedRole,
        });
        const meta = quoteIdentifier(base.metadataNamespace);
        if (dependency === "active") {
          const address = new URL(base.url);
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
      await operation({ ...base, retainedRole, componentNamespace, extensionSchema, requiredApi });
    } finally {
      if ((await base.admin.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [retainedRole])).rowCount) {
        await base.admin.query(`GRANT ${quoteIdentifier(retainedRole)} TO CURRENT_USER`);
        await base.admin.query(`DROP OWNED BY ${quoteIdentifier(retainedRole)}`);
        await base.admin.query(`DROP ROLE ${quoteIdentifier(retainedRole)}`);
      }
    }
  });
}
