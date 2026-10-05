import * as v from "valibot";
import { defineRelations } from "drizzle-orm";
import type { BuildQueryResult } from "drizzle-orm";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { createNativeExtensionField } from "../../../apps/loom/src/core/extensions/fields";
import { int4ArrayCodec, int4Codec } from "../../../apps/loom/src/core/extensions/native-codecs";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import capture from "../../../apps/loom/src/tooling/extensions/manifests/intarray.json";
import { createSearchValidators } from "../../../apps/loom/src/core/search/contract";

const manifest = v.parse(extensionManifestValidator, capture);
const numbers = createNativeExtensionField({
  extension: {
    name: "intarray",
    version: manifest.contract.version,
    schema: "custom",
    apiSupport: { status: "verified", digest: manifest.digest },
  },
  manifest,
  member: "opclass:$extension:intarray.gin__int_ops/gin",
  input: { namespace: "pg_catalog", name: "_int4" },
  codec: int4ArrayCodec,
  value: { kind: "array", items: { kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 } },
  search: { filter: false, comparison: false, order: false, text: false },
});
numbers.default([1, 2]);
// @ts-expect-error intarray is a null-free int4 array.
numbers.default([1, null]);
// @ts-expect-error int8 bigint values cannot masquerade as int4 elements.
numbers.default([1n]);
// @ts-expect-error Native input remains an array, not a PostgreSQL array-text string.
numbers.default("{1,2}");
int4Codec.encode(1);
// @ts-expect-error int4's exact primitive codec accepts a number, not bigint.
int4Codec.encode(1n);
const schema = defineSchema(() => ({ documents: { required: numbers.notNull().default([]), optional: numbers } }));
const graph = defineRelations(schema.tables);
const search = createSearchValidators(schema, graph);
// @ts-expect-error An array's native SQL identity does not grant unreviewed public filters.
search.documents.search({ columns: ["required"], filter: ["required"], scope: "public" });
// @ts-expect-error Array storage does not grant scalar ordering.
search.documents.search({ columns: ["required"], order: ["required"], scope: "public" });
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Assert<T extends true> = T;
export type NativeInt4Values = [
  Assert<Equal<BuildQueryResult<typeof graph, typeof graph.documents, true>["required"], number[]>>,
  Assert<Equal<BuildQueryResult<typeof graph, typeof graph.documents, true>["optional"], number[] | null>>,
];
