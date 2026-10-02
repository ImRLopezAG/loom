import { Context } from "effect";
import type { AnyRelations } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { DatabaseSchema } from "../database/connection";
import type { SearchValidators } from "../../search/contract";
import type { SearchContext } from "../../search/executor";
import type { InvocationStorage } from "../storage/invocation";

import type { RpcScheduler } from "../jobs/rpc-scheduler";

export class RpcSchedulerService extends Context.Service<RpcSchedulerService, RpcScheduler>()("loom/RpcScheduler") {}

export class Storage extends Context.Service<Storage, InvocationStorage>()("loom/Storage") {}

/** Keep service identity distinct from its value: an empty table map must not
 * accidentally satisfy every other Effect service requirement. */
export interface ProjectService<Key extends string, Value> {
  readonly key: Key;
  readonly value: Value;
}
export type ExtensionService = Context.Key<ProjectService<"loom/Extensions", object | undefined>, object | undefined>;

interface ExtensionServiceOwner {
  readonly tables: object;
}
const extensionServiceKeys = new WeakMap<ExtensionServiceOwner, string>();
let extensionServiceSequence = 0;
function extensionServiceKey(scope: ExtensionServiceOwner | undefined): string {
  if (!scope) return "loom/Extensions";
  let key = extensionServiceKeys.get(scope);
  if (!key) {
    key = `loom/Extensions/${++extensionServiceSequence}`;
    extensionServiceKeys.set(scope, key);
  }
  return key;
}

/** Schema-bound keys are created once by generated server bindings. Database is
 * provided with the invocation's guarded transaction, never the shared raw pool. */
export function createProjectServices<
  Schema extends DatabaseSchema & { readonly validators: object },
  Relations extends AnyRelations,
  ExtensionsValue extends object | undefined = undefined,
>(...owner: [ExtensionsValue] extends [undefined] ? [scope?: Schema] : [scope: Schema]) {
  const scope = owner[0];
  const Database = Context.Service<
    ProjectService<"loom/Database", NodePgDatabase<Relations>>,
    NodePgDatabase<Relations>
  >("loom/Database");
  const Tables = Context.Service<ProjectService<"loom/Tables", Schema["tables"]>, Schema["tables"]>("loom/Tables");
  const Validators = Context.Service<
    ProjectService<"loom/Validators", SearchValidators<Schema, Relations>>,
    SearchValidators<Schema, Relations>
  >("loom/Validators");
  const Search = Context.Service<ProjectService<"loom/Search", SearchContext<Relations>>, SearchContext<Relations>>(
    "loom/Search",
  );
  const Extensions = Context.Service<ProjectService<"loom/Extensions", ExtensionsValue>, ExtensionsValue>(
    extensionServiceKey(scope),
  );
  return Object.freeze({ Database, Tables, Validators, Search, Extensions });
}
