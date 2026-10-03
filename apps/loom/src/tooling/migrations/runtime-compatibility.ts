import type pg from "pg";
import * as v from "valibot";
import { assertMigrationConnection, databaseIdentifier, quoteIdentifier } from "./connection";
import type { ReleaseSchemaInspection } from "../deploy/compatibility";
import { generationRequiredApiHash, validateGenerationRequiredApi } from "../codegen/required-api";
import type { GenerationRequiredApi } from "../codegen/required-api";

interface Scope {
  readonly namespace: string;
  readonly metadataNamespace: string;
}
interface RuntimeCompatibility extends Scope {
  readonly deployment: string;
  readonly version: string;
  readonly sourceSchema: string;
  readonly inspection: ReleaseSchemaInspection;
  readonly requiredApi?: GenerationRequiredApi;
  readonly runtimeRole?: string;
}
const hashes = v.array(v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)));
export class RuntimeCompatibilityError extends Error {
  constructor() {
    super("Active runtime, queued job or client session lacks compatibility with the pending migration range");
  }
}

/** Called only after the release source and declared range have been validated under deployment ownership. */
export async function recordRuntimeCompatibility(client: pg.Client, options: RuntimeCompatibility): Promise<void> {
  assertMigrationConnection(client);
  if ((options.requiredApi === undefined) !== (options.runtimeRole === undefined))
    throw new Error("Runtime required API evidence and runtime role must be supplied together");
  const requiredApi =
    options.requiredApi === undefined ? undefined : validateGenerationRequiredApi(options.requiredApi);
  // Registration records the configured Loom role, whose bootstrap and migration contracts use ordinary identifiers.
  const runtimeRole = options.runtimeRole === undefined ? undefined : v.parse(databaseIdentifier, options.runtimeRole);
  const requiredApiHash = generationRequiredApiHash(requiredApi);
  if (!options.inspection.schemas.includes(options.sourceSchema))
    throw new Error("Runtime schema range excludes its source");
  const meta = quoteIdentifier(options.metadataNamespace);
  const current = await client.query<{ ordinal: number; active: boolean }>(
    `SELECT COALESCE((SELECT max(ordinal) FROM ${meta}.migration_history WHERE namespace=$1),0) AS ordinal,
      EXISTS (SELECT 1 FROM ${meta}.deployment_activations WHERE deployment=$2 AND version=$3 AND state='active') AS active`,
    [options.namespace, options.deployment, options.version],
  );
  const observed = current.rows[0];
  if (
    !observed ||
    (observed.active &&
      (observed.ordinal < options.inspection.minimumOrdinal || observed.ordinal > options.inspection.maximumOrdinal))
  )
    throw new Error("Active runtime compatibility must include the current database");
  const existing = await client.query<{
    namespace: string;
    source_schema: string;
    migration_hashes: string[];
    // JSONB is untrusted persisted evidence and is normalized before any registration write.
    required_api: unknown;
    api_absent: boolean;
    runtime_role: string | null;
  }>(
    `SELECT namespace,source_schema,migration_hashes,required_api,required_api IS NULL AS api_absent,runtime_role
      FROM ${meta}.runtime_compatibility WHERE deployment=$1 AND version=$2`,
    [options.deployment, options.version],
  );
  for (const row of existing.rows) {
    if (row.api_absent !== (row.runtime_role === null))
      throw new Error("Stored runtime required API evidence and runtime role are incomplete");
    const originalApi = row.api_absent ? undefined : validateGenerationRequiredApi(row.required_api);
    const originalRole = row.runtime_role === null ? undefined : v.parse(databaseIdentifier, row.runtime_role);
    if (generationRequiredApiHash(originalApi) !== requiredApiHash || originalRole !== runtimeRole)
      throw new Error("Original runtime required API evidence or runtime role changed");
  }
  const previous = existing.rows.find((row) => row.namespace === options.namespace);
  if (
    previous &&
    (previous.source_schema !== options.sourceSchema ||
      v
        .parse(hashes, previous.migration_hashes)
        .some((hash, index) => hash !== options.inspection.migrationHashes[index]))
  )
    throw new Error("Runtime compatibility history changed");
  await client.query(
    `INSERT INTO ${meta}.runtime_scopes(deployment,version,namespace) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,
    [options.deployment, options.version, options.namespace],
  );
  await client.query(
    `INSERT INTO ${meta}.runtime_compatibility(namespace,deployment,version,source_schema,minimum_ordinal,maximum_ordinal,migration_hashes,required_api,runtime_role)
      VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9)
      ON CONFLICT(namespace,deployment,version) DO UPDATE SET minimum_ordinal=EXCLUDED.minimum_ordinal, maximum_ordinal=EXCLUDED.maximum_ordinal, migration_hashes=EXCLUDED.migration_hashes`,
    [
      options.namespace,
      options.deployment,
      options.version,
      options.sourceSchema,
      options.inspection.minimumOrdinal,
      options.inspection.maximumOrdinal,
      JSON.stringify(options.inspection.migrationHashes),
      requiredApi === undefined ? null : JSON.stringify(requiredApi),
      runtimeRole ?? null,
    ],
  );
}

/** Check declared dependencies from active grants, queued/running jobs and unexpired client sessions. */
export async function assertRuntimeCompatibility(
  client: pg.Client,
  scope: Scope,
  migrationHashes: readonly string[],
  appliedCount: number,
  proposed?: Pick<RuntimeCompatibility, "deployment" | "version" | "inspection">,
): Promise<void> {
  assertMigrationConnection(client);
  if (appliedCount === migrationHashes.length) return;
  const meta = quoteIdentifier(scope.metadataNamespace);
  const dependencies = await client.query<{
    deployment: string;
    version: string | null;
    active: boolean;
    minimum_ordinal: number | null;
    maximum_ordinal: number | null;
    migration_hashes: string[] | null;
  }>(
    `WITH dependencies AS (
      SELECT deployment,version,true AS active FROM ${meta}.deployment_activations WHERE state='active'
      UNION ALL SELECT deployment,COALESCE(claim_version,call->>'version'),false FROM ${meta}.jobs WHERE state IN ('pending','running')
      UNION ALL SELECT deployment,version,true FROM ${meta}.client_sessions cs WHERE expires_at>clock_timestamp() AND (namespace=$1 OR EXISTS (SELECT 1 FROM ${meta}.runtime_scopes s WHERE s.namespace=$1 AND s.deployment=cs.deployment AND s.version=cs.version))
    ), grouped AS (SELECT deployment,version,bool_or(active) AS active FROM dependencies GROUP BY deployment,version)
    SELECT d.deployment,d.version,d.active,c.minimum_ordinal,c.maximum_ordinal,c.migration_hashes FROM grouped d
      LEFT JOIN ${meta}.runtime_compatibility c ON c.namespace=$1 AND c.deployment=d.deployment AND c.version=d.version
      WHERE NOT EXISTS (SELECT 1 FROM ${meta}.component_namespaces n WHERE n.namespace=$1)
        OR EXISTS (SELECT 1 FROM ${meta}.runtime_scopes s WHERE s.namespace=$1 AND s.deployment=d.deployment AND s.version=d.version)`,
    [scope.namespace],
  );
  const expectedHashes = JSON.stringify(migrationHashes);
  for (const dependency of dependencies.rows) {
    const proof =
      proposed && dependency.deployment === proposed.deployment && dependency.version === proposed.version
        ? {
            minimum_ordinal: proposed.inspection.minimumOrdinal,
            maximum_ordinal: proposed.inspection.maximumOrdinal,
            migration_hashes: proposed.inspection.migrationHashes,
          }
        : dependency;
    if (
      !dependency.version ||
      proof.minimum_ordinal === null ||
      proof.maximum_ordinal === null ||
      proof.minimum_ordinal > (dependency.active ? appliedCount : appliedCount + 1) ||
      proof.maximum_ordinal < migrationHashes.length ||
      !proof.migration_hashes ||
      JSON.stringify(v.parse(hashes, proof.migration_hashes)) !== expectedHashes
    )
      throw new RuntimeCompatibilityError();
  }
}
