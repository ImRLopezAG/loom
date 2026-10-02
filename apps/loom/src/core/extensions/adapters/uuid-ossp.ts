import { is, sql, SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { nullableCodec, textCodec } from "../codecs";
import { uuidCodec } from "../native-uuid-codec";
import { createSqlFunction } from "../sql";

export { uuidCodec } from "../native-uuid-codec";

type UuidInput =
  | string
  | null
  | SQL<string | null>
  | SQL.Aliased<string | null>
  | AnyPgColumn<{ dataType: "string uuid"; data: string }>;
type NameInput =
  | string
  | null
  | SQL<string | null>
  | SQL.Aliased<string | null>
  | AnyPgColumn<{ dataType: "string"; data: string }>;
function input(value: UuidInput | NameInput) {
  if (!is(value, SQL.Aliased)) return value;
  // Drizzle hides this selection-proxy flag from declarations; only selected aliases are references.
  return "isSelectionField" in value && value.isSelectionField === true ? sql<string | null>`${value}` : value.sql;
}

/** Namespaced UUID expressions; random/time-based forms reject automatic live subscriptions. */
export function createUuidOssp_1_1<
  const Descriptor extends ExtensionDescriptor<"uuid-ossp", { version: "1.1"; schema: string }>,
>(descriptor: Descriptor) {
  const base = { schema: descriptor.schema, dependencies: [], authority: "query" } as const;
  const constant = (name: "uuid_nil" | "uuid_ns_dns" | "uuid_ns_url" | "uuid_ns_oid" | "uuid_ns_x500") =>
    createSqlFunction({
      ...base,
      name,
      member: `routine:$extension:uuid-ossp.${name}()`,
      arguments: [] as const,
      result: uuidCodec,
      observability: "tables",
    });
  const generated = (name: "uuid_generate_v1" | "uuid_generate_v1mc" | "uuid_generate_v4") =>
    createSqlFunction({
      ...base,
      name,
      member: `routine:$extension:uuid-ossp.${name}()`,
      arguments: [] as const,
      result: uuidCodec,
      observability: "external",
    });
  const named = (name: "uuid_generate_v3" | "uuid_generate_v5") => {
    const call = createSqlFunction({
      ...base,
      name,
      member: `routine:$extension:uuid-ossp.${name}(pg_catalog.uuid,pg_catalog.text)`,
      arguments: [nullableCodec(uuidCodec), nullableCodec(textCodec)] as const,
      result: nullableCodec(uuidCodec),
      observability: "tables",
    });
    return (namespace: UuidInput, value: NameInput) => call(input(namespace), input(value));
  };
  const nil = constant("uuid_nil");
  const namespaceDns = constant("uuid_ns_dns");
  const namespaceUrl = constant("uuid_ns_url");
  const namespaceOid = constant("uuid_ns_oid");
  const namespaceX500 = constant("uuid_ns_x500");
  /** Version 1 may expose generating machine identity and time; it is not an authentication token. */
  const v1 = generated("uuid_generate_v1");
  /** Version 1 with a random multicast node address. */
  const v1mc = generated("uuid_generate_v1mc");
  /** Deterministic MD5 namespace/name identity; not encryption or authentication. */
  const v3 = named("uuid_generate_v3");
  const v4 = generated("uuid_generate_v4");
  /** Deterministic SHA-1 namespace/name identity; not encryption or authentication. */
  const v5 = named("uuid_generate_v5");
  const functions = Object.freeze({
    uuid_nil: nil,
    uuid_ns_dns: namespaceDns,
    uuid_ns_url: namespaceUrl,
    uuid_ns_oid: namespaceOid,
    uuid_ns_x500: namespaceX500,
    uuid_generate_v1: v1,
    uuid_generate_v1mc: v1mc,
    uuid_generate_v3: v3,
    uuid_generate_v4: v4,
    uuid_generate_v5: v5,
  });
  return bindExtension(descriptor, {
    nil,
    namespaceDns,
    namespaceUrl,
    namespaceOid,
    namespaceX500,
    v1,
    v1mc,
    v3,
    v4,
    v5,
    sql: Object.freeze({ functions, operators: Object.freeze({}) }),
  });
}
