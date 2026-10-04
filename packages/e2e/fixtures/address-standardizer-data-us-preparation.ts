import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { bootstrapDatabase } from "kello/tooling";
import type { startDataUsOwnedPg } from "./address-standardizer-data-us-owned-pg.ts";

export interface DataUsPreparedRuntime {
  connectionString: string;
  metadataNamespace: string;
  runtimeRole: string;
}

/** Bun-only administrative preparation; the owned container bounds all DDL and cleanup. */
export async function prepareDataUsRuntime(
  connectionString: string,
  placement: string,
  journal: Awaited<ReturnType<typeof startDataUsOwnedPg>>["journal"],
): Promise<DataUsPreparedRuntime> {
  assert.equal(new URL(connectionString).hostname, "127.0.0.1");
  const runtimeRole = `dataus_${randomUUID().replaceAll("-", "")}`;
  const metadataNamespace = `loom_dataus_${randomUUID().replaceAll("-", "")}`;
  await journal("runtime-ddl-intent", { runtimeRole, metadataNamespace });
  await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
  const client = new pg.Client({ connectionString });
  try {
    await client.connect();
    const role = pg.escapeIdentifier(runtimeRole);
    const schema = pg.escapeIdentifier(placement);
    await client.query(`ALTER ROLE ${role} LOGIN; GRANT USAGE ON SCHEMA ${schema} TO ${role};
      GRANT SELECT ON ${schema}.us_lex, ${schema}.us_gaz, ${schema}.us_rules TO ${role}`);
  } finally {
    await client.end();
  }
  const runtimeUrl = new URL(connectionString);
  runtimeUrl.username = runtimeRole;
  runtimeUrl.password = "";
  await journal("runtime-prepared", { runtimeRole, metadataNamespace, administrativeRpcCredentials: false });
  return { connectionString: runtimeUrl.href, metadataNamespace, runtimeRole };
}
