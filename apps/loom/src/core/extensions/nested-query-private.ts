import { AsyncLocalStorage } from "node:async_hooks";
import type { AnyRelations } from "drizzle-orm";
import type { InvocationIdentity } from "../server/auth/context";
import type { SearchRuntimeDescriptor } from "../search/metadata";
import type { StandardSchemaV1 } from "@standard-schema/spec";

interface ManagedSearchSource {
  readonly input: StandardSchemaV1;
  readonly output: StandardSchemaV1;
}
const sources = new WeakMap<ManagedSearchSource, SearchRuntimeDescriptor>();
export function registerNestedQuerySource(source: ManagedSearchSource, descriptor: SearchRuntimeDescriptor): void {
  sources.set(source, descriptor);
}
export function registeredNestedQuerySource(source: ManagedSearchSource): SearchRuntimeDescriptor {
  const descriptor = sources.get(source);
  if (!descriptor) throw new Error("Nested query requires a registered server search descriptor");
  return descriptor;
}
interface NestedInvocation {
  readonly graph: AnyRelations;
  readonly identity: InvocationIdentity | null;
  readonly assertCurrent: () => void;
  readonly fail: (cause: Error) => void;
  active: boolean;
}
const invocations = new AsyncLocalStorage<NestedInvocation>();
export async function withNestedQueryInvocation<Result>(
  owner: Omit<NestedInvocation, "active">,
  work: () => Result | PromiseLike<Result>,
): Promise<Result> {
  const invocation: NestedInvocation = { ...owner, active: true };
  return invocations.run(invocation, async () => {
    try {
      return await work();
    } finally {
      invocation.active = false;
    }
  });
}
export function captureNestedQueryInvocation(graph: AnyRelations) {
  const owner = invocations.getStore();
  if (!owner) throw new Error("Nested query requires an active server invocation");
  const check = () => {
    try {
      owner.assertCurrent();
      if (!owner.active || invocations.getStore() !== owner || owner.graph !== graph)
        throw new Error("Nested query belongs to a different invocation or graph");
    } catch (cause) {
      const error = cause instanceof Error ? cause : new Error("Nested query ownership failed");
      owner.fail(error);
      invocations.getStore()?.fail(error);
      throw error;
    }
  };
  check();
  return { identity: owner.identity, check };
}
