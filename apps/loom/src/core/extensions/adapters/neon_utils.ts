import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { int4Codec } from "../native-codecs";
import { createSqlFunction } from "../sql";

/** CPU observation runs in the caller's transaction. It reads external host state, never table revisions. */
export function createNeonUtils_1_1<
  const Descriptor extends ExtensionDescriptor<"neon_utils", { version: "1.1"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "neon_utils" ||
    descriptor.version !== "1.1" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== "4ceac79f87c6c16fa8dea371b441d6a150f9d25db3244b9bac4cce0275f74cec"
  )
    throw new Error("neon_utils 1.1 requires its exact verified contract");
  const numCpus = createSqlFunction({
    schema: descriptor.schema,
    name: "num_cpus",
    member: "routine:$extension:neon_utils.num_cpus()",
    arguments: [] as const,
    result: int4Codec,
    dependencies: [],
    observability: "external",
    authority: "query",
  });
  return bindExtension(descriptor, {
    numCpus,
    sql: Object.freeze({ functions: Object.freeze({ num_cpus: numCpus }), operators: Object.freeze({}) }),
  });
}
