import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

/** Supplied by a trusted verifier or worker, never derived from function arguments. */
export interface InvocationIdentity {
  readonly issuer: string;
  readonly subject: string;
  readonly tenantId?: string;
}
export interface InvocationContext {
  readonly identity: InvocationIdentity | null;
  readonly requestId: string;
  readonly signal: AbortSignal;
}

/** Local to the current transaction. Pool reuse must never inherit a previous request's identity. */
export async function bindDatabaseIdentity(db: NodePgDatabase, identity: InvocationIdentity | null): Promise<void> {
  await db.execute(sql`SELECT set_config('loom.identity', ${JSON.stringify(identity)}, true)`);
}
