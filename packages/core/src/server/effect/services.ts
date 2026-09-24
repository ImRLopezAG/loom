import { Context } from "effect";
import type { AnyRelations } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { DatabaseSchema } from "../database/connection";
import type { FunctionScheduler } from "../jobs/scheduler";
import type { createStorageIntents } from "../storage/intents";

export class Scheduler extends Context.Service<Scheduler, FunctionScheduler>()("loom/Scheduler") {}
export class Storage extends Context.Service<Storage, ReturnType<typeof createStorageIntents>>()("loom/Storage") {}

/** Schema-bound keys are created once by generated server bindings. Database is
 * provided with the invocation's guarded transaction, never the shared raw pool. */
export function createProjectServices<
  Schema extends DatabaseSchema & { readonly validators: object },
  Relations extends AnyRelations,
>() {
  const Database = Context.Service<NodePgDatabase<Relations>>("loom/Database");
  const Tables = Context.Service<Schema["tables"]>("loom/Tables");
  const Validators = Context.Service<Schema["validators"]>("loom/Validators");
  return Object.freeze({ Database, Tables, Validators });
}
