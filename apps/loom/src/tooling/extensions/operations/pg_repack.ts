import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as v from "valibot";

const execFileAsync = promisify(execFile);
import { createPgRepack_1_5_2, pgRepackSqlSchema } from "../../../core/extensions/adapters/pg_repack";
import { type RelationName } from "../../../core/extensions/adapters/pgstattuple-codecs";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { acquireExtensionLock } from "../../migrations/connection";
import { ExtensionOperationError, withExtensionOperation } from "../operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "../verify";
import source from "../manifests/pg_repack.json";

const identifier = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => !value.includes("\0")),
);
export const pgRepackClientIdentity = "pg_repack 1.5.2";
export const repackRequestValidator = v.strictObject({
  relation: v.strictObject({ schema: identifier, name: identifier }),
  binary: v.pipe(
    v.string(),
    v.minLength(1),
    v.check((value) => !value.includes("\0")),
  ),
});
export interface RepackRequest {
  readonly relation: RelationName;
  readonly binary: string;
}
export interface RepackEffect {
  readonly operation: "repack";
  readonly state: "acknowledged" | "unknown";
  readonly rollback: "not-transactional";
  readonly identity: typeof pgRepackClientIdentity;
}
export class RepackOperationError extends ExtensionOperationError {
  constructor(
    failure: ExtensionOperationError,
    readonly effects: readonly RepackEffect[],
  ) {
    super(failure.cause, failure.completion, failure.cleanupFailures);
    this.name = "RepackOperationError";
  }
}
export interface RepackSession {
  readonly repack: (
    request: RepackRequest,
  ) => Promise<{ readonly state: "acknowledged"; readonly rollback: "not-transactional"; readonly identity: typeof pgRepackClientIdentity }>;
}

function clientVersionError(program: string, library: string) {
  return `program '${program}' does not match database library '${library}'`;
}
function extensionVersionError(required: string, found: string) {
  return `extension '${required}' required, found '${found}'; please drop and re-create the extension`;
}

async function runClient(binary: string, args: readonly string[], env: NodeJS.ProcessEnv, signal?: AbortSignal) {
  try {
    return await execFileAsync(binary, [...args], {
      env,
      signal,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    });
  } catch (cause) {
    if (cause && typeof cause === "object" && "stderr" in cause) {
      const stderr = String(cause.stderr ?? "").trim();
      const stdout = "stdout" in cause ? String(cause.stdout ?? "").trim() : "";
      throw new Error(stderr || stdout || (cause instanceof Error ? cause.message : "pg_repack client failed"));
    }
    throw cause;
  }
}

function clientConnection(directOperatorUrl: string, relation: RelationName) {
  const url = new URL(directOperatorUrl);
  const args = ["-k"];
  if (url.hostname) args.push("-h", url.hostname);
  if (url.port) args.push("-p", url.port);
  if (url.username) args.push("-U", decodeURIComponent(url.username));
  const database = url.pathname.replace(/^\//, "");
  if (database) args.push("-d", decodeURIComponent(database));
  args.push("-t", `${relation.schema}.${relation.name}`);
  const env = { ...process.env };
  if (url.password) env.PGPASSWORD = decodeURIComponent(url.password);
  const sslmode = url.searchParams.get("sslmode");
  if (sslmode) env.PGSSLMODE = sslmode;
  return { args, env };
}

function freezeEffects(effects: readonly RepackEffect[]) {
  return Object.freeze(effects.map((effect) => Object.freeze(effect)));
}

/**
 * The client binary is the maintenance protocol. SQL apply/swap helpers are not replayed in JavaScript.
 *
 * Native pg_repack waits for other xids before ACCESS EXCLUSIVE. withExtensionOperation holds BEGIN
 * for the whole callback, so the client cannot run inside that transaction. Verify/lock use the
 * existing operator boundary; session.repack() runs the aligned client after that xid commits.
 */
export async function withPgRepack<Result>(
  directOperatorUrl: string,
  descriptor: ExtensionDescriptor<"pg_repack", { version: "1.5.2"; schema: string }>,
  callback: (session: RepackSession) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{ readonly completion: "committed"; readonly value: Result; readonly effects: readonly RepackEffect[] }> {
  createPgRepack_1_5_2(descriptor);
  const requirement = validateExtensionApiRequirement({
    schema: descriptor.schema,
    manifest: v.parse(extensionManifestValidator, source),
  });
  const effects: RepackEffect[] = [];
  let library = "";
  let extension = "";
  try {
    await withExtensionOperation(
      directOperatorUrl,
      async (context) => {
        await acquireExtensionLock(context.client, signal);
        await verifyExtensionApiContracts(context.client, [requirement]);
        const versions = v.parse(
          v.tuple([v.strictObject({ version: v.string(), version_sql: v.string() })]),
          (
            await context.client.query(
              `SELECT ${pgRepackSqlSchema}.version() AS version, ${pgRepackSqlSchema}.version_sql() AS version_sql`,
            )
          ).rows,
        );
        library = versions[0].version;
        extension = versions[0].version_sql;
        return Object.freeze({});
      },
      async () => undefined,
      signal,
    );
  } catch (cause) {
    if (cause instanceof ExtensionOperationError)
      throw new RepackOperationError(cause, freezeEffects(effects));
    throw cause;
  }
  let active = true;
  const session: RepackSession = Object.freeze({
    repack: async (request: RepackRequest) => {
      if (!active) throw new Error("Extension operation is inactive or belongs to a different owner");
      signal?.throwIfAborted();
      const checked = v.parse(repackRequestValidator, request);
      const index =
        effects.push({
          operation: "repack",
          state: "unknown",
          rollback: "not-transactional",
          identity: pgRepackClientIdentity,
        }) - 1;
      const reported = await runClient(checked.binary, ["--version"], process.env, signal);
      const program = reported.stdout.trim().split("\n")[0] ?? "";
      if (program !== library) throw new Error(clientVersionError(program, library));
      if (program !== extension) throw new Error(extensionVersionError(program, extension));
      if (program !== pgRepackClientIdentity) throw new Error(clientVersionError(program, pgRepackClientIdentity));
      const connection = clientConnection(directOperatorUrl, checked.relation);
      await runClient(checked.binary, connection.args, connection.env, signal);
      effects[index] = {
        operation: "repack",
        state: "acknowledged",
        rollback: "not-transactional",
        identity: pgRepackClientIdentity,
      };
      return {
        state: "acknowledged",
        rollback: "not-transactional",
        identity: pgRepackClientIdentity,
      } as const;
    },
  });
  try {
    const value = await callback(session);
    return { completion: "committed", value, effects: freezeEffects(effects) };
  } catch (cause) {
    if (cause instanceof ExtensionOperationError)
      throw new RepackOperationError(cause, freezeEffects(effects));
    throw new RepackOperationError(
      new ExtensionOperationError(
        cause,
        effects.some((effect) => effect.state === "acknowledged") ? "unknown" : "not-started",
      ),
      freezeEffects(effects),
    );
  } finally {
    active = false;
  }
}
