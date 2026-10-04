import * as v from "valibot";
import { createAddressStandardizer_3_6_4 } from "../../../core/extensions/adapters/address-standardizer";
import {
  addressStandardizerSourceWitness,
  type AddressStandardizerSources,
} from "../../../core/extensions/adapters/address-standardizer-codecs";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { ExtensionOperationError, withExtensionOperation } from "../operations";

/** Native load_lex/load_gaz require these columns plus an id sort key. */
export const addressStandardizerLexColumns = ["seq", "word", "stdword", "token"] as const;
/** Native load_rules requires this column plus an id sort key. */
export const addressStandardizerRulesColumns = ["rule"] as const;

export interface AddressStandardizerSourceInspection {
  readonly relation: string;
  readonly kind: "lex" | "gaz" | "rules";
  readonly columns: readonly string[];
}

export class AddressStandardizerOperationError extends ExtensionOperationError {
  constructor(failure: ExtensionOperationError) {
    super(failure.cause, failure.completion, failure.cleanupFailures);
    this.name = "AddressStandardizerOperationError";
  }
}

/**
 * Operator inspection of lex/gaz/rules column contracts. Does not load US data or parse addresses.
 * Native SPI still enforces the same columns when standardize_address runs.
 */
export async function inspectAddressStandardizerSources(
  directOperatorUrl: string,
  descriptor: ExtensionDescriptor<"address_standardizer", { version: "3.6.4"; schema: string }>,
  sources: AddressStandardizerSources,
  signal?: AbortSignal,
): Promise<{
  readonly completion: "committed";
  readonly value: readonly AddressStandardizerSourceInspection[];
}> {
  createAddressStandardizer_3_6_4(descriptor);
  const witness = addressStandardizerSourceWitness(sources);
  try {
    return await withExtensionOperation(
      directOperatorUrl,
      (context) => context,
      async (context) => {
        const required = [
          { kind: "lex" as const, name: witness.lex, columns: addressStandardizerLexColumns },
          { kind: "gaz" as const, name: witness.gaz, columns: addressStandardizerLexColumns },
          { kind: "rules" as const, name: witness.rules, columns: addressStandardizerRulesColumns },
        ];
        const value: AddressStandardizerSourceInspection[] = [];
        for (const source of required) {
          const rows = await context.client.query<{ column_name: string }>(
            `SELECT a.attname AS column_name
             FROM pg_catalog.pg_class c
             JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
             JOIN pg_catalog.pg_attribute a ON a.attrelid = c.oid
             WHERE c.oid = to_regclass($1) AND a.attnum > 0 AND NOT a.attisdropped
             ORDER BY a.attnum`,
            [source.name],
          );
          const columns = rows.rows.map((row) => v.parse(v.string(), row.column_name));
          for (const column of source.columns)
            if (!columns.includes(column))
              throw new Error(`address_standardizer ${source.kind} source ${source.name} is missing column ${column}`);
          if (!columns.includes("id"))
            throw new Error(`address_standardizer ${source.kind} source ${source.name} is missing sort column id`);
          value.push({ relation: source.name, kind: source.kind, columns });
        }
        return Object.freeze(value);
      },
      signal,
    );
  } catch (cause) {
    if (cause instanceof ExtensionOperationError) throw new AddressStandardizerOperationError(cause);
    throw cause;
  }
}
