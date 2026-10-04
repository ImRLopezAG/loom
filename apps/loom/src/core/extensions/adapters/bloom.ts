import * as v from "valibot";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import type { ExtensionIndexContract } from "../fields";

const digest = "e35e04e263d75f19673d2b1282a75b7975b74f201c7cd5dc8040188f54b06cc3";
type Descriptor = ExtensionDescriptor<"bloom", { readonly version: "1.0"; readonly schema: string }>;
// Native reloption bounds: length 1..4096 bits, col1..col32 1..4095 bits each.
const parameters = v.strictObject({
  length: v.optional(v.pipe(v.number(), v.safeInteger(), v.minValue(1), v.maxValue(4096))),
  bits: v.optional(
    v.pipe(
      v.array(v.pipe(v.number(), v.safeInteger(), v.minValue(1), v.maxValue(4095))),
      v.minLength(1),
      v.maxLength(32),
    ),
  ),
});
export type BloomParameters = v.InferInput<typeof parameters>;

/** Exact bloom 1.0 index API: an equality-only signature access method for int4 and text columns. */
export function createBloom_1_0<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "bloom" ||
    descriptor.version !== "1.0" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("bloom 1.0 requires its exact verified contract");
  function index(opclass: "int4_ops" | "text_ops", type: "int4" | "text"): ExtensionIndexContract {
    return Object.freeze({
      name: "bloom",
      version: "1.0",
      schema: descriptor.schema,
      digest,
      member: `opclass:$extension:bloom.${opclass}/bloom`,
      method: "bloom",
      opclass,
      type,
      default: true,
      input: Object.freeze({ schema: "pg_catalog", type, dimensions: 0 }),
    });
  }
  /** Index `with` storage parameters; `bits[n]` becomes `col<n+1>`, the signature bits set per value of that column. */
  function storage(options: BloomParameters): Readonly<Record<string, number>> {
    const checked = v.parse(parameters, options);
    return Object.freeze({
      ...(checked.length !== undefined && { length: checked.length }),
      ...Object.fromEntries((checked.bits ?? []).map((bits, position) => [`col${position + 1}`, bits])),
    });
  }
  const accessMethod = Object.freeze({
    member: "access method:bloom",
    name: "bloom",
    handler: "routine:$extension:bloom.blhandler(pg_catalog.internal)",
    strategies: Object.freeze(["="] as const),
    unique: false,
    lossy: true,
  } as const);
  return bindExtension(descriptor, {
    accessMethod,
    storage,
    indexes: Object.freeze({ int4: () => index("int4_ops", "int4"), text: () => index("text_ops", "text") }),
  });
}
