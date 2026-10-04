import type { SQL } from "drizzle-orm";
import type { ExtensionIndexContract } from "../../../apps/loom/src/core/extensions/fields";
import {
  createLakebaseVector_1_1_1,
  rabitqNativeText,
  type RabitqNativeText,
} from "../../../apps/loom/src/core/extensions/adapters/lakebase-vector";
import { defineSchema, defineTable } from "../../../apps/loom/src/core/server/index";
import { createExtensionBindings } from "../../../apps/loom/src/core/extensions/bindings";

const companion = {
  name: "vector",
  version: "0.8.6",
  schema: 'Vec"日本',
  apiSupport: { status: "verified", digest: "4e6679e9277c11a3f26d1a920de5f4c1b5401f418c647402a9e611df4a6fb1e4" },
} as const;
const api = createLakebaseVector_1_1_1(
  {
    name: "lakebase_vector",
    version: "1.1.1",
    schema: 'Lake"日本',
    apiSupport: { status: "verified", digest: "bfa194865eaeda1069f2743247af32e0609848bdee87f1565e17cefc231fec20" },
  },
  companion,
);
const companionSchema: 'Vec"日本' = api.companion.schema;
const companionVersion: "0.8.6" = api.companion.version;
const companionDigest: "4e6679e9277c11a3f26d1a920de5f4c1b5401f418c647402a9e611df4a6fb1e4" =
  api.companion.apiSupport.digest;
void companionSchema;
void companionVersion;
void companionDigest;
const generatedDescriptors = createExtensionBindings(
  {
    lakebase_vector: { version: "1.1.1", schema: 'Lake"日本' },
    vector: { version: "0.8.6", schema: 'Vec"日本' },
  },
  { lakebase_vector: api.apiSupport, vector: companion.apiSupport },
);
const generatedApi = createLakebaseVector_1_1_1(generatedDescriptors.lakebase_vector, generatedDescriptors.vector);
const generatedCompanionDigest: typeof companion.apiSupport.digest = generatedApi.companion.apiSupport.digest;
void generatedCompanionDigest;
const schema: 'Lake"日本' = api.schema;
const version: "1.1.1" = api.version;
const token: RabitqNativeText = rabitqNativeText("[native]");
const ann: ExtensionIndexContract = api.indexes.ann.vector.l2();
const legacy: ExtensionIndexContract = api.indexes.annv0.rabitq8.cosine();
const storage: Readonly<{ build_mode?: "standard" | "quality" | "fast"; lists?: string }> = api.storage({
  buildMode: "quality",
  lists: "1000",
});
// @ts-expect-error A companion must be explicitly selected; no schema default or co-location inference.
createLakebaseVector_1_1_1(api);
// @ts-expect-error Only the captured companion version is supported.
createLakebaseVector_1_1_1(api, { ...companion, version: "0.8.5" });
// @ts-expect-error The descriptor must select the vector companion, not another extension.
createLakebaseVector_1_1_1(api, { ...companion, name: "cube" });
const latest: "_2" = api.indexFormat.latest;
const rebuild: false = api.indexFormat.rebuild.transactional;
const vector = [3, 1, 2];
const within: SQL<boolean | null> = api.withinCosine(vector, api.sphere.vector(vector, 0.5));
const quantized: SQL<RabitqNativeText | null> = api.quantize.rabitq4.fromVector(vector);
const distance: SQL<number | { readonly nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.sql.overloads[
  "operator:$extension:lakebase_vector.<->($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.rabitq4)"
](token, token);
const support: SQL<string | null> =
  api.sql.overloads["routine:$extension:lakebase_vector._lakebase_ann_support_vector_l2_ops()"]();
// @ts-expect-error Native support metadata routines take no application arguments.
api.sql.overloads["routine:$extension:lakebase_vector._lakebase_ann_support_vector_l2_ops()"]("extra");
void schema;
void version;
void ann;
void legacy;
void storage;
void latest;
void rebuild;
void within;
void quantized;
void distance;
void support;
defineSchema(
  () => ({
    items: defineTable(
      { code: api.field.rabitq4() },
      {
        indexes: [{ fields: ["code"], extension: api.indexes.ann.rabitq4.l2(), with: api.storage({ lists: "auto" }) }],
      },
    ),
  }),
  { namespace: "app" },
);
createLakebaseVector_1_1_1(
  {
    name: "lakebase_vector",
    // @ts-expect-error Only the captured 1.1.1 contract is admitted.
    version: "1.1.0",
    schema: "extensions",
    apiSupport: { status: "verified", digest: "bfa194865eaeda1069f2743247af32e0609848bdee87f1565e17cefc231fec20" },
  },
  companion,
);
// @ts-expect-error JavaScript arrays are not a rabitq quantization algorithm.
api.codecs.rabitq4.encode([1, 2, 3]);
// @ts-expect-error Sparsevec is a pgvector type, not a lakebase_vector index class.
void api.indexes.ann.sparsevec;
// @ts-expect-error Unknown build modes are rejected.
api.storage({ buildMode: "slow" });
