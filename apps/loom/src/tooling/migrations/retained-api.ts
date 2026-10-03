import type pg from "pg";
import * as v from "valibot";
import { generationRequiredApiHash, validateGenerationRequiredApi } from "../codegen/required-api";
import type { GenerationRequiredApi } from "../codegen/required-api";
import { assertExtensionLock, databaseIdentifier, quoteIdentifier } from "./connection";
import type { FrameworkReadiness } from "./framework-history";
import { validateRequiredApiForTarget, verifyRequiredApiOnTarget } from "./required-api-verification";

export const RETAINED_API_FRAMEWORK_VERSION = 28;

interface RetainedRow {
  namespace: string;
  deployment: string;
  version: string;
  required_api: unknown;
  api_absent: boolean;
  runtime_role: string | null;
}
interface RetainedProof {
  readonly deployment: string;
  readonly version: string;
  readonly namespaces: readonly string[];
  readonly requiredApi: GenerationRequiredApi;
  readonly runtimeRole: string;
}
export interface RetainedApiSnapshot {
  readonly metadataNamespace: string;
  readonly proofs: readonly RetainedProof[];
}

/** Feature columns are readable only through an authenticated framework prefix containing their migration. */
export function canReadRetainedApi(framework: FrameworkReadiness): boolean {
  return (
    (framework.state === "current" || framework.state === "upgrade-required") &&
    framework.appliedVersion >= RETAINED_API_FRAMEWORK_VERSION
  );
}

function proofKey(proof: { readonly deployment: string; readonly version: string }): string {
  return JSON.stringify([proof.deployment, proof.version]);
}

/** Normalize every selected row and scoped contract before any caller performs native catalogue verification. */
function validatedProofs(rows: readonly RetainedRow[]): RetainedProof[] {
  const groups = new Map<
    string,
    {
      deployment: string;
      version: string;
      namespaces: string[];
      requiredApi: GenerationRequiredApi | undefined;
      runtimeRole: string | undefined;
    }
  >();
  for (const row of rows) {
    if (row.api_absent !== (row.runtime_role === null))
      throw new Error("Retained required API evidence and runtime role are incomplete");
    const requiredApi = row.api_absent ? undefined : validateGenerationRequiredApi(row.required_api);
    const runtimeRole = row.runtime_role === null ? undefined : v.parse(databaseIdentifier, row.runtime_role);
    if (requiredApi) for (const scope of requiredApi.scopes) validateRequiredApiForTarget(scope.requiredApi);
    const key = proofKey(row);
    const group = groups.get(key);
    if (group) {
      if (
        generationRequiredApiHash(group.requiredApi) !== generationRequiredApiHash(requiredApi) ||
        group.runtimeRole !== runtimeRole
      )
        throw new Error("Conflicting original retained required API evidence or runtime role across scopes");
      group.namespaces.push(row.namespace);
    } else {
      groups.set(key, {
        deployment: row.deployment,
        version: row.version,
        namespaces: [row.namespace],
        requiredApi,
        runtimeRole,
      });
    }
  }
  return [...groups.values()].flatMap((group) => {
    // Legacy SQL NULL pairs have no original API proof to fabricate or verify.
    if (!group.requiredApi || !group.runtimeRole) return [];
    return [{ ...group, requiredApi: group.requiredApi, runtimeRole: group.runtimeRole }];
  });
}

/** Retention is database-wide: an extension-free incoming namespace does not erase another scope's original pins. */
export async function readRetainedApiSnapshot(
  client: pg.Client,
  metadataNamespace: string,
  framework: FrameworkReadiness,
): Promise<RetainedApiSnapshot | undefined> {
  assertExtensionLock(client);
  if (framework.state === "diverged") throw new Error("Retained API evidence requires authenticated framework history");
  if (!canReadRetainedApi(framework)) return undefined;
  const metadata = quoteIdentifier(metadataNamespace);
  const observed = await client.query<RetainedRow>(
    `WITH dependencies AS (
      SELECT deployment,version FROM ${metadata}.deployment_activations WHERE state='active'
      UNION SELECT deployment,COALESCE(claim_version,call->>'version') FROM ${metadata}.jobs WHERE state IN ('pending','running')
      UNION SELECT deployment,version FROM ${metadata}.client_sessions WHERE expires_at>clock_timestamp()
    )
    SELECT c.namespace,c.deployment,c.version,c.required_api,c.required_api IS NULL AS api_absent,c.runtime_role
      FROM ${metadata}.runtime_compatibility c JOIN dependencies d ON d.deployment=c.deployment AND d.version=c.version
      ORDER BY c.deployment,c.version,c.namespace`,
  );
  return { metadataNamespace, proofs: validatedProofs(observed.rows) };
}

/** Protect the same persisted identities and native contracts, even if artifact SQL deletes their dependencies. */
export async function verifyRetainedApiSnapshot(
  client: pg.Client,
  snapshot: RetainedApiSnapshot | undefined,
): Promise<void> {
  assertExtensionLock(client);
  if (!snapshot?.proofs.length) return;
  const metadata = quoteIdentifier(snapshot.metadataNamespace);
  const observed = await client.query<RetainedRow>(
    `SELECT c.namespace,c.deployment,c.version,c.required_api,c.required_api IS NULL AS api_absent,c.runtime_role
      FROM ${metadata}.runtime_compatibility c JOIN jsonb_to_recordset($1::jsonb) AS original(deployment text,version text)
        ON original.deployment=c.deployment AND original.version=c.version
      ORDER BY c.deployment,c.version,c.namespace`,
    [JSON.stringify(snapshot.proofs.map(({ deployment, version }) => ({ deployment, version })))],
  );
  const current = new Map(validatedProofs(observed.rows).map((proof) => [proofKey(proof), proof]));
  for (const original of snapshot.proofs) {
    const proof = current.get(proofKey(original));
    if (
      !proof ||
      original.runtimeRole !== proof.runtimeRole ||
      generationRequiredApiHash(original.requiredApi) !== generationRequiredApiHash(proof.requiredApi) ||
      original.namespaces.some((namespace) => !proof.namespaces.includes(namespace))
    )
      throw new Error("Original retained required API evidence or persisted scope identity changed");
  }
  // Every original proof and every current saved scope was validated before the first native capture.
  for (const proof of snapshot.proofs)
    for (const scope of proof.requiredApi.scopes)
      await verifyRequiredApiOnTarget(client, scope.requiredApi, proof.runtimeRole);
}
