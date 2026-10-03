import type { SQL } from "drizzle-orm";
import { pgTable, uuid, text, integer, boolean } from "drizzle-orm/pg-core";
import { createUuidOssp_1_1 } from "../../../apps/loom/src/core/extensions/adapters/uuid-ossp";
const table = pgTable("uuid_names", {
  namespace: uuid(),
  requiredNamespace: uuid().notNull(),
  name: text(),
  number: integer(),
  enabled: boolean(),
});
const extension = createUuidOssp_1_1({
  name: "uuid-ossp",
  version: "1.1",
  schema: "custom",
  apiSupport: { status: "verified" },
});
const version: "1.1" = extension.version;
const schema: "custom" = extension.schema;
const name: "uuid-ossp" = extension.name;
const nil: SQL<string> = extension.nil();
const generated: SQL<string> = extension.v1();
const random: SQL<string> = extension.v4();
const multicast: SQL<string> = extension.v1mc();
const named: SQL<string | null> = extension.v3(table.namespace, table.name);
const requiredNamed: SQL<string | null> = extension.v5(table.requiredNamespace, "value");
extension.v3(extension.namespaceDns(), "value");
extension.v3(extension.namespaceDns().as("namespace"), "value");
extension.v5(extension.nil(), table.name);
extension.v5(null, null);
extension.sql.functions.uuid_generate_v3("00000000-0000-0000-0000-000000000000", "value");
// @ts-expect-error UUID arguments reject numeric literals.
extension.v3(123, "value");
// @ts-expect-error UUID namespaces reject numeric columns.
extension.v3(table.number, "value");
// @ts-expect-error UUID namespace must be a UUID column, not a text column with the same JS data type.
extension.v3(table.name, "value");
// @ts-expect-error Name text rejects UUID storage without an explicit conversion.
extension.v5(table.namespace, table.namespace);
// @ts-expect-error Name text rejects boolean columns.
extension.v5(table.namespace, table.enabled);
// @ts-expect-error Name text rejects numeric literals.
extension.v5(table.namespace, 123);
// @ts-expect-error The captured namespace/name overload requires both arguments.
extension.v3(extension.namespaceDns());
// @ts-expect-error Zero argument generators do not accept a seed.
extension.v4("seed");
// @ts-expect-error Checked decoders determine the result type, not caller generics.
extension.v4<number>();
// @ts-expect-error Positional undefined is not SQL NULL.
extension.v5(undefined, "value");
createUuidOssp_1_1({
  name: "uuid-ossp",
  // @ts-expect-error Exact captured version only.
  version: "1.0",
  schema: "custom",
  apiSupport: { status: "verified" },
});
createUuidOssp_1_1({
  // @ts-expect-error The dashed extension identity is preserved.
  name: "uuid_ossp",
  version: "1.1",
  schema: "custom",
  apiSupport: { status: "verified" },
});
void [version, schema, name, nil, generated, random, multicast, named, requiredNamed];

const dns: SQL<string> = extension.namespaceDns();
const url: SQL<string> = extension.namespaceUrl();
const oid: SQL<string> = extension.namespaceOid();
const x500: SQL<string> = extension.namespaceX500();
const canonicalNamed: SQL<string | null> = extension.sql.functions.uuid_generate_v5(dns, "name");
// @ts-expect-error Strict SQL functions return NULL when either argument is NULL.
const _nonNullableV3: SQL<string> = extension.v3(table.namespace, table.name);
// @ts-expect-error Strict SQL functions return NULL when either argument is NULL.
const _nonNullableV5: SQL<string> = extension.v5(table.namespace, table.name);
// @ts-expect-error Canonical names use the same checked namespace contract.
extension.sql.functions.uuid_generate_v3(table.name, "value");
// @ts-expect-error Canonical names reject non-text inputs.
extension.sql.functions.uuid_generate_v5(table.namespace, 123);
// @ts-expect-error Named routines expose no caller-selected result generic.
extension.sql.functions.uuid_generate_v3<number>(dns, "value");
void [dns, url, oid, x500, canonicalNamed];
