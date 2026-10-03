import type pg from "pg";
import * as v from "valibot";
import { generationRequiredApiHash, validateGenerationRequiredApi } from "../codegen/required-api";
import type { GenerationRequiredApi } from "../codegen/required-api";
import { assertExtensionLock, assertMigrationConnection, databaseIdentifier, quoteIdentifier } from "./connection";
import { frameworkMigrations } from "./bootstrap";
import { classifyFrameworkHistory } from "./framework-history";
import type { FrameworkReadiness } from "./framework-history";
import { validateRequiredApiForTarget, verifyRequiredApiOnTarget } from "./required-api-verification";

export const RETAINED_API_FRAMEWORK_VERSION = 28;
export const DEVELOPMENT_API_FRAMEWORK_VERSION = 29;
type AuthorityKind = "release" | "development";
interface StoredRequiredApiRow {
  required_api: unknown;
  api_absent: boolean;
  runtime_role: string | null;
}
interface RetainedRow extends StoredRequiredApiRow {
  namespace: string;
  deployment: string;
  version: string;
  authority_kind: AuthorityKind;
}
interface RetainedProof {
  readonly deployment: string;
  readonly version: string;
  readonly authorityKind: AuthorityKind;
  readonly namespaces: readonly string[];
  readonly runtimeNamespaces: readonly string[];
  readonly requiredApi: GenerationRequiredApi | undefined;
  readonly runtimeRole: string | undefined;
}
interface RetainedProofGroup extends Omit<RetainedProof, "namespaces" | "runtimeNamespaces"> {
  namespaces: string[];
}
interface RuntimeScopeRow {
  deployment: string;
  version: string;
  namespace: string;
}
export interface RetainedApiSnapshot {
  readonly metadataNamespace: string;
  readonly frameworkVersion: number;
  readonly proofs: readonly RetainedProof[];
}

/** Authenticate the ordered native ledger on this owned session, before querying feature relations. */
export async function readRetainedApiFramework(
  client: pg.Client,
  metadataNamespace: string,
): Promise<Exclude<FrameworkReadiness, { readonly state: "diverged" }>> {
  assertMigrationConnection(client);
  const metadata = quoteIdentifier(metadataNamespace);
  const relations = await client.query<{ metadata: boolean; framework: boolean; migrations: boolean }>(
    `SELECT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname=$1) AS metadata,
      to_regclass($2) IS NOT NULL AS framework,to_regclass($3) IS NOT NULL AS migrations`,
    [metadataNamespace, `${metadata}.framework_migrations`, `${metadata}.migration_history`],
  );
  const observed = relations.rows[0];
  const applied = observed?.framework
    ? (
        await client.query<{ version: number; hash: string }>(
          `SELECT version,hash FROM ${metadata}.framework_migrations ORDER BY version`,
        )
      ).rows
    : [];
  const framework = classifyFrameworkHistory({
    metadataExists: observed?.metadata === true,
    frameworkHistoryExists: observed?.framework === true,
    migrationHistoryExists: observed?.migrations === true,
    applied,
    expected: frameworkMigrations(metadataNamespace),
  });
  if (framework.state === "diverged") throw new Error("Retained API evidence requires authenticated framework history");
  return framework;
}

/** Feature columns are readable only through an authenticated framework prefix containing their migration. */
export function canReadRetainedApi(framework: FrameworkReadiness): boolean {
  return (
    (framework.state === "current" || framework.state === "upgrade-required") &&
    framework.appliedVersion >= RETAINED_API_FRAMEWORK_VERSION
  );
}
export function canReadDevelopmentApi(framework: FrameworkReadiness): boolean {
  return (
    (framework.state === "current" || framework.state === "upgrade-required") &&
    framework.appliedVersion >= DEVELOPMENT_API_FRAMEWORK_VERSION
  );
}
function proofKey(proof: { readonly deployment: string; readonly version: string }): string {
  return JSON.stringify([proof.deployment, proof.version]);
}
export function sameScopes(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((scope, index) => scope === right[index]);
}

/** Decode SQL absence and every original scoped pin before comparison or native observation. */
export function parseStoredRequiredApi(row: StoredRequiredApiRow, incompleteMessage: string) {
  if (row.api_absent !== (row.runtime_role === null)) throw new Error(incompleteMessage);
  const requiredApi = row.api_absent ? undefined : validateGenerationRequiredApi(row.required_api);
  const runtimeRole = row.runtime_role === null ? undefined : v.parse(databaseIdentifier, row.runtime_role);
  if (requiredApi) for (const scope of requiredApi.scopes) validateRequiredApiForTarget(scope.requiredApi);
  return { requiredApi, runtimeRole };
}

/** Normalize every selected full contract and persisted scope before the first native API observation. */
function validatedProofs(rows: readonly RetainedRow[], scopes: readonly RuntimeScopeRow[]): RetainedProof[] {
  const groups = new Map<string, RetainedProofGroup>();
  for (const row of rows) {
    const { requiredApi, runtimeRole } = parseStoredRequiredApi(
      row,
      "Retained required API evidence and runtime role are incomplete",
    );
    const namespace = v.parse(databaseIdentifier, row.namespace);
    const key = proofKey(row);
    const group = groups.get(key);
    if (group) {
      if (group.authorityKind !== row.authority_kind)
        throw new Error("Conflicting release and development API registration authority");
      if (
        generationRequiredApiHash(group.requiredApi) !== generationRequiredApiHash(requiredApi) ||
        group.runtimeRole !== runtimeRole
      )
        throw new Error("Conflicting original retained required API evidence or runtime role across scopes");
      if (group.namespaces.includes(namespace)) throw new Error("Duplicate retained API scope identity");
      group.namespaces.push(namespace);
    } else {
      groups.set(key, {
        deployment: row.deployment,
        version: row.version,
        authorityKind: row.authority_kind,
        namespaces: [namespace],
        requiredApi,
        runtimeRole,
      });
    }
  }
  const scopeGroups = new Map<string, string[]>();
  for (const scope of scopes) {
    const key = proofKey(scope);
    const namespaces = scopeGroups.get(key);
    if (namespaces) namespaces.push(scope.namespace);
    else scopeGroups.set(key, [scope.namespace]);
  }
  return [...groups.values()].flatMap((group) => {
    const namespaces = [...group.namespaces].sort((left, right) => left.localeCompare(right));
    const runtimeNamespaces = (scopeGroups.get(proofKey(group)) ?? [])
      .map((namespace) => v.parse(databaseIdentifier, namespace))
      .sort((left, right) => left.localeCompare(right));
    if (group.authorityKind === "development" && !sameScopes(namespaces, runtimeNamespaces))
      throw new Error("Original development API evidence has incomplete persisted scope identity");
    // Legacy release SQL NULL pairs cannot establish an original API contract.
    if (group.authorityKind === "release" && !group.requiredApi) return [];
    return [{ ...group, namespaces, runtimeNamespaces }];
  });
}

function proofRelations(metadata: string, development: boolean): string {
  const release = `SELECT namespace,deployment,version,required_api,required_api IS NULL AS api_absent,runtime_role,'release'::text AS authority_kind FROM ${metadata}.runtime_compatibility`;
  return development
    ? `${release} UNION ALL SELECT namespace,deployment,version,required_api,required_api IS NULL AS api_absent,runtime_role,'development'::text AS authority_kind FROM ${metadata}.development_runtime_api`
    : release;
}

/** Retention is database-wide; incoming scopes do not select or erase original generation pins. */
export async function readRetainedApiSnapshot(
  client: pg.Client,
  metadataNamespace: string,
  framework: FrameworkReadiness,
): Promise<RetainedApiSnapshot | undefined> {
  assertExtensionLock(client);
  if (framework.state === "diverged") throw new Error("Retained API evidence requires authenticated framework history");
  const authenticated = await readRetainedApiFramework(client, metadataNamespace);
  if (!canReadRetainedApi(authenticated)) return undefined;
  const metadata = quoteIdentifier(metadataNamespace);
  const observed = await client.query<RetainedRow & { proof_present: boolean }>(
    `WITH dependencies AS (
      SELECT deployment,version FROM ${metadata}.deployment_activations WHERE state='active'
      UNION SELECT deployment,COALESCE(claim_version,call->>'version') FROM ${metadata}.jobs WHERE state IN ('pending','running')
      UNION SELECT deployment,version FROM ${metadata}.client_sessions WHERE expires_at>clock_timestamp()
    ), proofs AS (${proofRelations(metadata, canReadDevelopmentApi(authenticated))})
    SELECT c.*,c.deployment IS NOT NULL AS proof_present FROM dependencies d LEFT JOIN proofs c
      ON d.deployment=c.deployment AND d.version=c.version ORDER BY d.deployment,d.version,c.namespace`,
  );
  if (canReadDevelopmentApi(authenticated) && observed.rows.some((row) => !row.proof_present))
    throw new Error("Original retained API evidence is missing for a live generation dependency");
  const proofRows = observed.rows.filter((row) => row.proof_present);
  const identities = new Map(
    proofRows.map((row) => [proofKey(row), { deployment: row.deployment, version: row.version }]),
  );
  const scopes = await client.query<RuntimeScopeRow>(
    `SELECT s.deployment,s.version,s.namespace FROM ${metadata}.runtime_scopes s JOIN jsonb_to_recordset($1::jsonb) AS original(deployment text,version text)
      ON original.deployment=s.deployment AND original.version=s.version ORDER BY s.deployment,s.version,s.namespace`,
    [JSON.stringify([...identities.values()])],
  );
  return {
    metadataNamespace,
    frameworkVersion: authenticated.appliedVersion,
    proofs: validatedProofs(proofRows, scopes.rows),
  };
}

/** Protect the original source relation and immutable full contract even after dependencies disappear. */
export async function verifyRetainedApiSnapshot(
  client: pg.Client,
  snapshot: RetainedApiSnapshot | undefined,
): Promise<void> {
  assertExtensionLock(client);
  if (!snapshot) return;
  const framework = await readRetainedApiFramework(client, snapshot.metadataNamespace);
  if (framework.state === "fresh" || framework.appliedVersion < snapshot.frameworkVersion)
    throw new Error("Original retained API framework authority changed");
  if (!snapshot.proofs.length) return;
  const metadata = quoteIdentifier(snapshot.metadataNamespace);
  // A genuine v28 snapshot continues to use its release-only authority after bootstrap upgrades the database.
  const identities = JSON.stringify(snapshot.proofs.map(({ deployment, version }) => ({ deployment, version })));
  const observed = await client.query<RetainedRow>(
    `WITH proofs AS (${proofRelations(metadata, snapshot.frameworkVersion >= DEVELOPMENT_API_FRAMEWORK_VERSION)})
      SELECT c.* FROM proofs c JOIN jsonb_to_recordset($1::jsonb) AS original(deployment text,version text)
      ON original.deployment=c.deployment AND original.version=c.version ORDER BY c.deployment,c.version,c.namespace`,
    [identities],
  );
  const scopes = await client.query<RuntimeScopeRow>(
    `SELECT s.deployment,s.version,s.namespace FROM ${metadata}.runtime_scopes s JOIN jsonb_to_recordset($1::jsonb) AS original(deployment text,version text)
      ON original.deployment=s.deployment AND original.version=s.version ORDER BY s.deployment,s.version,s.namespace`,
    [identities],
  );
  const current = new Map(validatedProofs(observed.rows, scopes.rows).map((proof) => [proofKey(proof), proof]));
  for (const original of snapshot.proofs) {
    const proof = current.get(proofKey(original));
    if (
      !proof ||
      original.authorityKind !== proof.authorityKind ||
      original.runtimeRole !== proof.runtimeRole ||
      generationRequiredApiHash(original.requiredApi) !== generationRequiredApiHash(proof.requiredApi) ||
      (original.authorityKind === "development"
        ? !sameScopes(original.namespaces, proof.namespaces) ||
          !sameScopes(original.runtimeNamespaces, proof.runtimeNamespaces)
        : original.namespaces.some((namespace) => !proof.namespaces.includes(namespace)))
    )
      throw new Error("Original retained required API evidence or persisted scope identity changed");
  }
  for (const proof of snapshot.proofs)
    if (proof.requiredApi && proof.runtimeRole)
      for (const scope of proof.requiredApi.scopes)
        await verifyRequiredApiOnTarget(client, scope.requiredApi, proof.runtimeRole);
}
