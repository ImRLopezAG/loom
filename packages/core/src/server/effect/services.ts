import { Context } from "effect";
import type { AnyRelations } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { DatabaseSchema } from "../database/connection";
import type { FunctionScheduler } from "../jobs/scheduler";
import type { createStorageIntents } from "../storage/intents";

export class Scheduler extends Context.Service<Scheduler, FunctionScheduler>()("loom/Scheduler") {}
export class Storage extends Context.Service<Storage, ReturnType<typeof createStorageIntents>>()("loom/Storage") {}

/** Keep service identity distinct from its value: an empty table map must not
 * accidentally satisfy every other Effect service requirement. */
export interface ProjectService<Key extends string, Value> {
  readonly key: Key;
  readonly value: Value;
}

/** Schema-bound keys are created once by generated server bindings. Database is
 * provided with the invocation's guarded transaction, never the shared raw pool. */
export function createProjectServices<
  Schema extends DatabaseSchema & { readonly validators: object },
  Relations extends AnyRelations,
>() {
  const Database = Context.Service<
    ProjectService<"loom/Database", NodePgDatabase<Relations>>,
    NodePgDatabase<Relations>
  >("loom/Database");
  const Tables = Context.Service<ProjectService<"loom/Tables", Schema["tables"]>, Schema["tables"]>("loom/Tables");
  const Validators = Context.Service<ProjectService<"loom/Validators", Schema["validators"]>, Schema["validators"]>(
    "loom/Validators",
  );
  return Object.freeze({ Database, Tables, Validators });
}
