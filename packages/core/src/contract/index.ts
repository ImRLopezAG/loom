import { ProcedureContract } from "@orpc/contract";
import type { RouterContract } from "@orpc/contract";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import * as v from "valibot";

export { oc, eventIterator, defineMeta } from "@orpc/contract";
export type { RouterContractClient } from "@orpc/contract";

/** Augmented by the project's generated declarations, never by server imports
 * in browser code. A TypeScript project owns one Loom application. */
export interface ProjectRegistration extends Record<never, never> {}

export type ContractContext = ProjectRegistration extends { validators: infer Validators }
  ? { readonly validators: Validators }
  : {
      readonly validators: {
        readonly tables: Readonly<Record<never, never>>;
        readonly id: (table: never) => StandardSchemaV1<string>;
      };
    };

const definition = Symbol("loom.contract");
export interface ContractDefinition<Contract extends RouterContract> {
  readonly [definition]: true;
  readonly resolve: (context: ContractContext) => Contract;
}

function isContractFactory<Contract extends RouterContract>(
  value: Contract | ((context: ContractContext) => Contract),
): value is (context: ContractContext) => Contract {
  return v.is(v.function(), value);
}

/** Keeps native oRPC schemas, errors and metadata intact. Callback evaluation is
 * deferred until project schema bindings exist; no environment values are read. */
export function defineContract<const Contract extends RouterContract>(
  contract: Contract | ((context: ContractContext) => Contract),
): ContractDefinition<Contract> {
  if (!isContractFactory(contract)) assertContract(contract);
  return Object.freeze({
    [definition]: true as const,
    resolve(context: ContractContext) {
      const result = isContractFactory(contract) ? contract(context) : contract;
      assertContract(result);
      return result;
    },
  });
}

export function resolveContract<Contract extends RouterContract>(
  contract: ContractDefinition<Contract>,
  context: ContractContext,
): Contract {
  if (contract[definition] !== true) throw new Error("Expected defineContract's result");
  return contract.resolve(context);
}

function assertContract(contract: RouterContract, path: readonly string[] = [], ancestors = new Set<object>()) {
  const name = path.join(".") || "(root)";
  if (contract instanceof ProcedureContract) {
    if ("handler" in contract["~orpc"]) throw new Error(`Contract ${name} contains an implementation`);
    if (!contract["~orpc"].outputSchemas?.length) throw new Error(`Contract ${name} requires an output schema`);
    return;
  }
  if (!v.is(v.record(v.string(), v.unknown()), contract)) throw new Error(`Invalid contract at ${name}`);
  if (ancestors.has(contract)) throw new Error(`Cyclic contract at ${name}`);
  ancestors.add(contract);
  try {
    for (const [key, child] of Object.entries(contract)) assertContract(child, [...path, key], ancestors);
  } finally {
    ancestors.delete(contract);
  }
}
