import * as v from "valibot";

const dictionaryBrand: unique symbol = Symbol("loom:unaccent:dictionary");
const dictionaryReferences = new WeakSet<object>();

/** A portable dictionary identity; PostgreSQL resolves it on the invocation connection. */
export interface DictionaryReference {
  readonly schema: string;
  readonly name: string;
  readonly [dictionaryBrand]: true;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { ignoreBOM: true });
const identifier = v.pipe(
  v.string(),
  v.check((value) => {
    const bytes = encoder.encode(value);
    return value.length > 0 && !value.includes("\u0000") && bytes.length <= 63 && decoder.decode(bytes) === value;
  }, "Expected a lossless PostgreSQL identifier of 1–63 UTF-8 bytes"),
);
const qualifiedName = v.strictObject({ schema: identifier, name: identifier });
export const dictionaryReferenceValidator = v.custom<DictionaryReference>(
  (value) => value instanceof Object && dictionaryReferences.has(value),
  "Expected a factory-created qualified dictionary reference",
);

/** Names are independently quoted and bound as data, never interpreted as raw SQL or fixture OIDs. */
export function dictionaryReference(reference: {
  readonly schema: string;
  readonly name: string;
}): DictionaryReference {
  const names = v.parse(qualifiedName, reference);
  const result = Object.freeze({ ...names, [dictionaryBrand]: true as const });
  dictionaryReferences.add(result);
  return result;
}
