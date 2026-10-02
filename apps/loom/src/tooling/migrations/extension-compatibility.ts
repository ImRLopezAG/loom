import type pg from "pg";
import { assertExtensionLock, quoteIdentifier } from "./connection";
import { ExtensionError } from "./extensions";
import type { MigrationArtifact } from "./history";
import type { SchemaMetadata } from "../../core/schema/compile";
import type { ExtensionDescriptor } from "../../core/extensions/bindings";
import * as v from "valibot";
import { canonical } from "../../core/validation/canonical";
import { json } from "../../core/validation/encoding";
import type { ExtensionFieldMetadata } from "../../core/extensions/values";
import type { IndexDeclaration } from "../../core/schema/table";

function semantic(value: ExtensionFieldMetadata | IndexDeclaration | undefined): string {
  return canonical(v.parse(json, JSON.parse(JSON.stringify(value ?? null))));
}

/** Schema-owned members must match the independently configured, verified binding. */
export function assertSchemaExtensionCompatibility(
  metadata: SchemaMetadata,
  bindings: Readonly<Record<string, ExtensionDescriptor | undefined>> | undefined,
): void {
  for (const required of metadata.extensionRequirements ?? []) {
    const selected = bindings?.[required.name];
    const path = `${required.name}:${required.member}`;
    if (!selected) throw new Error(`Missing configured extension for schema member ${path}`);
    if (selected.version !== required.version)
      throw new Error(
        `Extension schema version mismatch for ${path}: requires ${required.version}, configured ${selected.version}`,
      );
    if (selected.schema !== required.schema)
      throw new Error(
        `Extension schema namespace mismatch for ${path}: requires ${required.schema}, configured ${selected.schema}`,
      );
    if (selected.apiSupport.status !== "verified" || selected.apiSupport.digest !== required.digest)
      throw new Error(`Extension schema registry contract mismatch for ${path}`);
  }
}
export interface ExtensionSchemaCompatibilityIssue {
  readonly entity: string;
  readonly compatible: false;
  readonly reason: "Extension field layout or codec changed" | "Extension index contract changed";
}
/** Physical SQL comparison cannot detect a changed decoder or semantic parameter. */
export function compareExtensionSchemaCompatibility(
  before: SchemaMetadata,
  after: SchemaMetadata,
): readonly ExtensionSchemaCompatibilityIssue[] {
  const issues: ExtensionSchemaCompatibilityIssue[] = [];
  for (const oldTable of before.entities) {
    const table = after.entities.find((table) => table.name === oldTable.name);
    if (!table) continue;
    for (const oldField of oldTable.fields) {
      const field = table.fields.find((field) => field.name === oldField.name);
      if (!field || (!oldField.extension && !field.extension)) continue;
      if (semantic(oldField.extension) !== semantic(field.extension))
        issues.push({
          entity: `${table.name}.${field.name}`,
          compatible: false,
          reason: "Extension field layout or codec changed",
        });
    }
    const remaining = [...(table.options.indexes ?? [])];
    for (const [position, oldIndex] of (oldTable.options.indexes ?? []).entries()) {
      if (!oldIndex.extension) continue;
      const match = remaining.findIndex((index) => semantic(oldIndex) === semantic(index));
      if (match !== -1) remaining.splice(match, 1);
      else
        issues.push({
          entity: `${table.name}.index[${position}]`,
          compatible: false,
          reason: "Extension index contract changed",
        });
    }
  }
  return Object.freeze(issues.map((issue) => Object.freeze(issue)));
}

/** Structural schema ranges do not establish behavior across extension version or placement changes. */
export async function assertRetainedExtensionCompatibility(
  client: pg.Client,
  metadataNamespace: string,
  pending: readonly MigrationArtifact[],
): Promise<void> {
  const changing = pending.filter(
    ({ plan }) =>
      plan.format === 3 && plan.extensions.operations.some((entry) => entry.kind === "update" || entry.kind === "move"),
  );
  if (!changing.length) return;
  assertExtensionLock(client);
  const metadata = quoteIdentifier(metadataNamespace);
  const retained = await client.query<{ deployment: string; version: string | null }>(
    `SELECT DISTINCT deployment,version FROM (
      SELECT deployment,version FROM ${metadata}.deployment_activations WHERE state='active'
      UNION ALL SELECT deployment,COALESCE(claim_version,call->>'version') FROM ${metadata}.jobs WHERE state IN ('pending','running')
      UNION ALL SELECT deployment,version FROM ${metadata}.client_sessions WHERE expires_at>clock_timestamp()
    ) dependencies ORDER BY deployment,version`,
  );
  if (retained.rowCount)
    throw new ExtensionError(
      "RETAINED_COMPATIBILITY",
      `Retire retained runtimes and drain their jobs and client sessions before changing shared extensions; schema ranges do not prove extension compatibility. Changing artifacts: ${changing.map(({ plan }) => plan.hash).join(", ")}. Retained releases: ${retained.rows.map((entry) => `${entry.deployment}:${entry.version ?? "unknown"}`).join(", ")}`,
    );
}
