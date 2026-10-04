import { bindExtension, type ExtensionDescriptor } from "../bindings";

/** Static analysis, profiling and tracing run only through explicit operator tooling, never application SQL. */
export function createPlpgsqlCheck_2_8<
  const Descriptor extends ExtensionDescriptor<"plpgsql_check", { version: "2.8"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "plpgsql_check" ||
    descriptor.version !== "2.8" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== "ef00befd1f61c832689dc4d4b3ee3c21f03585eda686474bb5ec8efd8696e74a"
  )
    throw new Error("plpgsql_check 2.8 requires its exact verified contract");
  return bindExtension(descriptor, {
    sql: Object.freeze({ functions: Object.freeze({}), operators: Object.freeze({}) }),
  });
}
