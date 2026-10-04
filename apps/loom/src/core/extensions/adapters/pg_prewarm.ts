import { bindExtension, type ExtensionDescriptor } from "../bindings";

/** Cache/worker/file mutations are available exclusively through explicit operator tooling. */
export function createPgPrewarm_1_2<
  const Descriptor extends ExtensionDescriptor<"pg_prewarm", { version: "1.2"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "pg_prewarm" ||
    descriptor.version !== "1.2" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== "58d63ed991a2a7dcbce44b574afc81295947387e81a64be88f635478e7bc6495"
  )
    throw new Error("pg_prewarm 1.2 requires its exact verified contract");
  return bindExtension(descriptor, {
    sql: Object.freeze({ functions: Object.freeze({}), operators: Object.freeze({}) }),
  });
}
