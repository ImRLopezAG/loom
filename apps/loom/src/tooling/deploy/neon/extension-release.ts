import type pg from "pg";
import * as v from "valibot";
import type { KelloExtensions } from "../../config/extensions";
import type { MigrationArtifact } from "../../migrations/history";
import {
  canonicalExtensionState,
  extensionOperationValidator,
  extensionStateValidator,
  inspectExtensions,
  verifyExtensions,
} from "../../migrations/extensions";

const hash = v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/));
export const releaseExtensionsValidator = v.strictObject({
  required: v.array(extensionStateValidator),
  installed: v.array(extensionStateValidator),
  changes: v.array(v.strictObject({ artifactHash: hash, operations: v.array(extensionOperationValidator) })),
});
export type ReleaseExtensions = v.InferOutput<typeof releaseExtensionsValidator>;

/** Require configuration to be represented by the committed chain before starting any release stages. */
export function inspectReleaseExtensions(
  intent: KelloExtensions | undefined,
  artifacts: readonly MigrationArtifact[],
): ReleaseExtensions | undefined {
  const head = artifacts.at(-1)?.plan;
  if (head?.format !== 3) {
    if (intent) throw new Error("Generate an extension migration before releasing configured capabilities");
    return undefined;
  }
  if (head.extensionScope !== "application")
    throw new Error("Release extension authority requires application history");
  const required = canonicalExtensionState(head.extensions.requirements);
  const declaration = Object.fromEntries(
    required.map((entry) => [entry.name, { version: entry.version, schema: entry.schema }]),
  );
  if (JSON.stringify(declaration) !== JSON.stringify(intent ?? {}))
    throw new Error("Release extension configuration differs from committed requirements");
  return {
    required,
    installed: canonicalExtensionState(head.extensions.after),
    changes: artifacts.flatMap(({ plan }) =>
      plan.format === 3 && plan.extensions.operations.length
        ? [{ artifactHash: plan.hash, operations: plan.extensions.operations }]
        : [],
    ),
  };
}

/** A saved release acknowledgement never substitutes for this live capability observation. */
export async function verifyReleaseExtensions(
  client: pg.Client,
  extensions: ReleaseExtensions | undefined,
): Promise<void> {
  if (extensions) verifyExtensions(await inspectExtensions(client), extensions.installed);
}
