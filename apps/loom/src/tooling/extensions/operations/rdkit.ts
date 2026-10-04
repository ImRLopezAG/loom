import pg from "pg";
import * as v from "valibot";
import { createRdkit_4_8_0 } from "../../../core/extensions/adapters/rdkit";
import { createRdkitCodec, type RdkitValue } from "../../../core/extensions/adapters/rdkit-codecs";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { acquireExtensionLock } from "../../migrations/connection";
import { withExtensionOperation } from "../operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "../verify";
import source from "../manifests/rdkit.json";

export interface RdkitSession {
  /**
   * Native has_reaction_substructmatch. PostgreSQL reads the named relation through dynamic SQL and issues
   * session-level SET enable_seqscan/indexscan/bitmapscan, so it runs only on this dedicated operator backend,
   * which is closed after the operation. Its unqualified operators resolve through a transaction-local
   * search_path naming the cartridge schema.
   */
  readonly hasReactionSubstructMatch: (
    query: string,
    relation: string,
    column: string,
  ) => Promise<readonly RdkitValue<"reaction">[]>;
}

/** Operator-only rdkit 4.8.0 members. They read caller-chosen relations, so they are never RPC query helpers. */
export async function withRdkit<Result>(
  directOperatorUrl: string,
  descriptor: ExtensionDescriptor<"rdkit", { version: "4.8.0"; schema: string }>,
  callback: (session: RdkitSession) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{ readonly completion: "committed"; readonly value: Result }> {
  createRdkit_4_8_0(descriptor);
  const requirement = validateExtensionApiRequirement({
    schema: descriptor.schema,
    manifest: v.parse(extensionManifestValidator, source),
  });
  const schema = pg.escapeIdentifier(descriptor.schema);
  const reaction = createRdkitCodec(descriptor.schema, "reaction");
  return withExtensionOperation(
    directOperatorUrl,
    async (context) => {
      await acquireExtensionLock(context.client, signal);
      await verifyExtensionApiContracts(context.client, [requirement]);
      return Object.freeze({
        hasReactionSubstructMatch: (query: string, relation: string, column: string) =>
          context.run(async () => {
            // The PL/pgSQL body resolves ?> and @> unqualified; expose only the cartridge schema for this transaction.
            await context.client.query(`SET LOCAL search_path TO ${schema}, pg_catalog`);
            const result = await context.client.query<{ value: string }>(
              `SELECT r::pg_catalog.text AS value FROM ${schema}."has_reaction_substructmatch"($1::pg_catalog.bpchar,$2::pg_catalog.regclass,$3::pg_catalog.text) AS r`,
              [v.parse(v.string(), query), v.parse(v.string(), relation), v.parse(v.string(), column)],
            );
            return result.rows.map((row) => reaction.decode(row.value));
          }),
      } satisfies RdkitSession);
    },
    callback,
    signal,
  );
}
