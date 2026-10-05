import * as v from "valibot";
import { createPgPrewarm_1_2 } from "../../../core/extensions/adapters/pg_prewarm";
import { qualifiedRelationName, type RelationName } from "../../../core/extensions/adapters/pgstattuple-codecs";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { integerCodec } from "../../../core/extensions/codecs";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { acquireExtensionLock } from "../../migrations/connection";
import { ExtensionOperationError, withExtensionOperation } from "../operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "../verify";
import source from "../manifests/pg_prewarm.json";

const identifier = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => !value.includes("\0")),
);
const block = v.nullable(v.pipe(v.bigint(), v.minValue(0n), v.maxValue(9223372036854775807n)));
export const prewarmRequestValidator = v.strictObject({
  relation: v.strictObject({ schema: identifier, name: identifier }),
  mode: v.optional(v.picklist(["prefetch", "read", "buffer"])),
  fork: v.optional(v.picklist(["main", "fsm", "vm", "init"])),
  firstBlock: v.optional(block),
  lastBlock: v.optional(block),
});
export interface PrewarmRequest {
  readonly relation: RelationName;
  readonly mode?: "prefetch" | "read" | "buffer";
  readonly fork?: "main" | "fsm" | "vm" | "init";
  readonly firstBlock?: bigint | null;
  readonly lastBlock?: bigint | null;
}
export interface PrewarmEffect {
  readonly operation: "prewarm" | "start-worker" | "dump";
  readonly state: "acknowledged" | "unknown";
  readonly rollback: "not-transactional";
}
export class PrewarmOperationError extends ExtensionOperationError {
  constructor(
    failure: ExtensionOperationError,
    readonly effects: readonly PrewarmEffect[],
  ) {
    super(failure.cause, failure.completion, failure.cleanupFailures);
    this.name = "PrewarmOperationError";
  }
}
export interface PrewarmSession {
  readonly prewarm: (
    request: PrewarmRequest,
  ) => Promise<{ readonly blocks: bigint; readonly cacheResidency: "not-guaranteed" }>;
  readonly startWorker: () => Promise<{ readonly state: "started"; readonly rollback: "not-transactional" }>;
  readonly dump: () => Promise<{ readonly records: bigint; readonly rollback: "not-transactional" }>;
}
/** A COMMIT/ROLLBACK describes only the owned SQL transaction. Cache, worker and dump effects persist independently. */
export async function withPgPrewarm<Result>(
  directOperatorUrl: string,
  descriptor: ExtensionDescriptor<"pg_prewarm", { version: "1.2"; schema: string }>,
  callback: (session: PrewarmSession) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{ readonly completion: "committed"; readonly value: Result; readonly effects: readonly PrewarmEffect[] }> {
  createPgPrewarm_1_2(descriptor);
  const requirement = validateExtensionApiRequirement({
    schema: descriptor.schema,
    manifest: v.parse(extensionManifestValidator, source),
  });
  const effects: PrewarmEffect[] = [];
  const schema = `"${v.parse(identifier, descriptor.schema).replaceAll('"', '""')}"`;
  try {
    const result = await withExtensionOperation(
      directOperatorUrl,
      async (context) => {
        await acquireExtensionLock(context.client, signal);
        await verifyExtensionApiContracts(context.client, [requirement]);
        async function effect<Value>(operation: PrewarmEffect["operation"], work: () => Promise<Value>) {
          const index = effects.push({ operation, state: "unknown", rollback: "not-transactional" }) - 1;
          const value = await work();
          effects[index] = { operation, state: "acknowledged", rollback: "not-transactional" };
          return value;
        }
        return Object.freeze({
          prewarm: (request: PrewarmRequest) =>
            context.run(async () => {
              const checked = v.parse(prewarmRequestValidator, request);
              return effect("prewarm", async () => {
                const result = await context.client.query(
                  `SELECT ${schema}."pg_prewarm"($1::pg_catalog.regclass,$2::pg_catalog.text,$3::pg_catalog.text,$4::pg_catalog.int8,$5::pg_catalog.int8)::pg_catalog.text AS blocks`,
                  [
                    qualifiedRelationName(checked.relation),
                    checked.mode ?? "buffer",
                    checked.fork ?? "main",
                    checked.firstBlock?.toString() ?? null,
                    checked.lastBlock?.toString() ?? null,
                  ],
                );
                const [row] = v.parse(v.tuple([v.strictObject({ blocks: v.string() })]), result.rows);
                return { blocks: integerCodec.decode(row.blocks), cacheResidency: "not-guaranteed" } as const;
              });
            }),
          startWorker: () =>
            context.run(() =>
              effect("start-worker", async () => {
                await context.client.query(`SELECT ${schema}."autoprewarm_start_worker"()`);
                return { state: "started", rollback: "not-transactional" } as const;
              }),
            ),
          dump: () =>
            context.run(() =>
              effect("dump", async () => {
                const result = await context.client.query(
                  `SELECT ${schema}."autoprewarm_dump_now"()::pg_catalog.text AS records`,
                );
                const [row] = v.parse(v.tuple([v.strictObject({ records: v.string() })]), result.rows);
                return { records: integerCodec.decode(row.records), rollback: "not-transactional" } as const;
              }),
            ),
        });
      },
      callback,
      signal,
    );
    return { ...result, effects: Object.freeze(effects.map((effect) => Object.freeze(effect))) };
  } catch (cause) {
    if (cause instanceof ExtensionOperationError)
      throw new PrewarmOperationError(cause, Object.freeze(effects.map((effect) => Object.freeze(effect))));
    throw cause;
  }
}
