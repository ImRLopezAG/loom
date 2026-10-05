import type pg from "pg";
import * as v from "valibot";
import { generationRequiredApiHash, validateGenerationRequiredApi } from "../codegen/required-api";
import type { GenerationRequiredApi } from "../codegen/required-api";
import { assertExtensionLock, databaseIdentifier, quoteIdentifier } from "../migrations/connection";
import { ownsProcedureUpgrade } from "../migrations/procedure-upgrade";
import {
  canReadDevelopmentApi,
  parseStoredRequiredApi,
  readRetainedApiFramework,
  sameScopes,
} from "../migrations/retained-api";
import { validateRequiredApiForTarget } from "../migrations/required-api-verification";

interface DevelopmentApiRegistration {
  readonly metadataNamespace: string;
  readonly deployment: string;
  readonly version: string;
  readonly namespaces: readonly string[];
  readonly requiredApi: GenerationRequiredApi | undefined;
  readonly runtimeRole: string;
}
interface DevelopmentApiRow {
  namespace: string;
  required_api: unknown;
  api_absent: boolean;
  runtime_role: string | null;
}
// This records only legacy-absence authority under the existing session locks, never a native API result.
const freshRegistrationAuthorities = new WeakMap<pg.Client, string>();

/** The verified development owner checks the entire candidate identity, including quarantined restarts, before credentials. */
export async function assertDevelopmentApiRegistration(
  client: pg.Client,
  options: DevelopmentApiRegistration,
): Promise<boolean> {
  assertExtensionLock(client);
  const framework = await readRetainedApiFramework(client, options.metadataNamespace);
  if (framework.state !== "current" || !canReadDevelopmentApi(framework))
    throw new Error("Development synchronization is required before API registration");
  const namespaces = options.namespaces
    .map((namespace) => v.parse(databaseIdentifier, namespace))
    .sort((left, right) => left.localeCompare(right));
  if (!namespaces.length || new Set(namespaces).size !== namespaces.length)
    throw new Error("Invalid development registration scope set");
  const requiredApi =
    options.requiredApi === undefined ? undefined : validateGenerationRequiredApi(options.requiredApi);
  const configuredRole = v.parse(databaseIdentifier, options.runtimeRole);
  const runtimeRole = requiredApi ? configuredRole : undefined;
  const requiredApiHash = generationRequiredApiHash(requiredApi);
  if (requiredApi)
    for (const scope of requiredApi.scopes) {
      validateRequiredApiForTarget(scope.requiredApi);
      if (!namespaces.includes(scope.namespace))
        throw new Error("Development API evidence includes an unregistered scope");
    }
  const metadata = quoteIdentifier(options.metadataNamespace);
  const parameters = [options.deployment, options.version];
  const release = await client.query(
    `SELECT 1 FROM ${metadata}.runtime_compatibility WHERE deployment=$1 AND version=$2`,
    parameters,
  );
  if (release.rows.length) throw new Error("Development API registration conflicts with original release authority");
  const saved = await client.query<DevelopmentApiRow>(
    `SELECT namespace,required_api,required_api IS NULL AS api_absent,runtime_role FROM ${metadata}.development_runtime_api WHERE deployment=$1 AND version=$2 ORDER BY namespace`,
    parameters,
  );
  const scopes = await client.query<{ namespace: string }>(
    `SELECT namespace FROM ${metadata}.runtime_scopes WHERE deployment=$1 AND version=$2 ORDER BY namespace`,
    parameters,
  );
  // Parse every original full payload before comparing or allowing a first write.
  for (const row of saved.rows) {
    const { requiredApi: originalApi, runtimeRole: originalRole } = parseStoredRequiredApi(
      row,
      "Original development required API evidence and role are incomplete",
    );
    if (generationRequiredApiHash(originalApi) !== requiredApiHash || originalRole !== runtimeRole)
      throw new Error("Original development required API evidence or runtime role changed");
  }
  if (saved.rows.length) {
    freshRegistrationAuthorities.delete(client);
    if (
      !sameScopes(
        namespaces,
        saved.rows.map((row) => row.namespace).sort((left, right) => left.localeCompare(right)),
      ) ||
      !sameScopes(
        namespaces,
        scopes.rows.map((row) => row.namespace).sort((left, right) => left.localeCompare(right)),
      )
    )
      throw new Error("Original development registration scope identity changed");
    return true;
  }
  const activation = ownsProcedureUpgrade(client, options);
  const authority = JSON.stringify([
    options.metadataNamespace,
    options.deployment,
    options.version,
    namespaces,
    requiredApiHash,
    configuredRole,
  ]);
  if (activation && freshRegistrationAuthorities.get(client) !== authority)
    throw new Error("Original development registration requires its pre-upgrade legacy identity check");
  const dependent = await client.query<{ retained: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM ${metadata}.deployment_activations WHERE deployment=$1 AND version=$2 AND state IN ('active','retired'))
      OR EXISTS(SELECT 1 FROM ${metadata}.jobs WHERE deployment=$1 AND (call->>'version'=$2 OR (NOT $3::boolean AND claim_version=$2)) AND state IN ('pending','running'))
      OR EXISTS(SELECT 1 FROM ${metadata}.client_sessions WHERE deployment=$1 AND version=$2 AND expires_at>clock_timestamp()) AS retained`,
    [...parameters, activation],
  );
  if (scopes.rows.length || dependent.rows[0]?.retained !== false)
    throw new Error("Original development API evidence is missing; legacy retained identity cannot be registered");
  // The upgrade validates and fences transfers before its callback. Their new claim_version does not
  // establish an original API proof for this fresh candidate; immutable call.version still does.
  if (!activation) freshRegistrationAuthorities.set(client, authority);
  return false;
}

/** Only the final fresh-verified callback may persist evidence inside its existing activation transaction. No retry rewrites an original row. */
export async function recordDevelopmentApiRegistration(
  client: pg.Client,
  options: DevelopmentApiRegistration,
): Promise<void> {
  if (!ownsProcedureUpgrade(client, options))
    throw new Error("Development API registration requires the activation transaction owner");
  if (await assertDevelopmentApiRegistration(client, options)) return;
  const metadata = quoteIdentifier(options.metadataNamespace);
  const requiredApi =
    options.requiredApi === undefined ? undefined : validateGenerationRequiredApi(options.requiredApi);
  for (const namespace of [...options.namespaces].sort((left, right) => left.localeCompare(right))) {
    await client.query(
      `INSERT INTO ${metadata}.development_runtime_api(namespace,deployment,version,required_api,runtime_role) VALUES($1,$2,$3,$4::jsonb,$5)`,
      [
        namespace,
        options.deployment,
        options.version,
        requiredApi === undefined ? null : JSON.stringify(requiredApi),
        requiredApi === undefined ? null : options.runtimeRole,
      ],
    );
    await client.query(`INSERT INTO ${metadata}.runtime_scopes(deployment,version,namespace) VALUES($1,$2,$3)`, [
      options.deployment,
      options.version,
      namespace,
    ]);
  }
}
