import { expect } from "vite-plus/test";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import {
  ADDRESS_STANDARDIZER_DIGEST,
  addressStandardizerMembers,
  addressStandardizerUnitProofCases,
} from "../../e2e/fixtures/address-standardizer-proof-cases";
import { addressStandardizerFrozenConsumerFixture } from "../../e2e/fixtures/address-standardizer-consumer-proof-cases";
import {
  createAddressStandardizer_3_6_4,
  type AddressStandardizerStdaddr,
} from "../../../apps/loom/src/core/extensions/adapters/address-standardizer";
import {
  addressStandardizerTableNameOk,
  encodeAddressStandardizerSource,
} from "../../../apps/loom/src/core/extensions/adapters/address-standardizer-codecs";
import { addressStandardizerAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/address-standardizer";
import {
  addressStandardizerLexColumns,
  addressStandardizerRulesColumns,
} from "../../../apps/loom/src/tooling/extensions/operations/address-standardizer";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/address_standardizer.json";
import {
  checkCompiledExtensionQuery,
  extensionExpressionContract,
  extensionSqlDialect,
} from "../../../apps/loom/src/core/extensions/sql";

const descriptor = {
  name: "address_standardizer",
  version: "3.6.4",
  schema: 'Addr"日本',
  apiSupport: { status: "verified", digest: ADDRESS_STANDARDIZER_DIGEST },
} as const;

const emptyStdaddr: AddressStandardizerStdaddr = {
  building: null,
  house_num: null,
  predir: null,
  qual: null,
  pretype: null,
  name: null,
  suftype: null,
  sufdir: null,
  ruralroute: null,
  extra: null,
  city: null,
  state: null,
  country: null,
  postcode: null,
  box: null,
  unit: null,
};

extensionProofUnitTest(addressStandardizerUnitProofCases[0]!, () => {
  const api = createAddressStandardizer_3_6_4(descriptor);
  const ids = manifest.contract.members.map((row) => row.id).sort();
  expect(manifest.digest).toBe(ADDRESS_STANDARDIZER_DIGEST);
  expect(manifest.contract.version).toBe("3.6.4");
  expect(manifest.contract.members).toHaveLength(7);
  expect([...addressStandardizerMembers].sort()).toEqual(ids);
  expect(addressStandardizerAnnotations.map((row) => row.id).sort()).toEqual(ids);
  expect(new Set(addressStandardizerAnnotations.map((row) => row.id)).size).toBe(7);
  expect(Object.keys(api.sql.overloads).sort()).toEqual(
    manifest.contract.members
      .filter((row) => row.kind === "routine")
      .map((row) => row.id)
      .sort(),
  );
  expect(Object.keys(api.sql.types).sort()).toEqual(
    manifest.contract.members
      .filter((row) => row.kind !== "routine")
      .map((row) => row.id)
      .sort(),
  );
  expect(addressStandardizerFrozenConsumerFixture.factory).toBe("createAddressStandardizer_3_6_4");
  expect(addressStandardizerFrozenConsumerFixture.digest).toBe(ADDRESS_STANDARDIZER_DIGEST);
  expect(addressStandardizerFrozenConsumerFixture.packedTarballGate).toBe("family-no-install-node24-frozen-wave35");
  expect(addressStandardizerFrozenConsumerFixture.generationGate).toBe(
    "public-kello-tooling-first-load-disk-types-rpc-effect",
  );
  expect(addressStandardizerLexColumns).toEqual(["seq", "word", "stdword", "token"]);
  expect(addressStandardizerRulesColumns).toEqual(["rule"]);
  for (const wrong of [
    { ...descriptor, apiSupport: { status: "verified" as const, digest: "wrong" } },
    { ...descriptor, apiSupport: { status: "unverified" as const } },
    { ...descriptor, version: "3.6.3" },
  ])
    expect(() => createAddressStandardizer_3_6_4(wrong as never)).toThrow(/exact verified contract/);
  for (const row of addressStandardizerAnnotations) {
    expect(row.semantics.providerAcceptance).toBe("pending");
    expect(row.semantics.publicExportAcceptance).toBe("pending");
    expect(row.semantics.nativeAcceptance).toBe("owned-local-pg18");
  }
});

extensionProofUnitTest(addressStandardizerUnitProofCases[1]!, () => {
  const api = createAddressStandardizer_3_6_4(descriptor);
  expect(api.codec.decode(api.codec.encode(emptyStdaddr))).toEqual(emptyStdaddr);
  const unicode: AddressStandardizerStdaddr = {
    ...emptyStdaddr,
    house_num: "123",
    name: 'Main "通り"',
    city: "東京",
    extra: "a\\b",
    unit: "",
  };
  const encoded = api.codec.encode(unicode);
  expect(encoded).toContain("東京");
  expect(api.codec.decode(encoded)).toEqual(unicode);
  expect(api.codec.decode("(,,,,,,,,,,,,,,,)")).toEqual(emptyStdaddr);
  expect(() => api.codec.decode("(1,2)")).toThrow();
  expect(() => api.codec.decode("not-a-record")).toThrow();
  const array = {
    dimensions: [
      { lowerBound: -2, length: 2 },
      { lowerBound: 3, length: 2 },
    ],
    values: [
      [unicode, null],
      [emptyStdaddr, unicode],
    ],
  };
  expect(api.arrayCodec.decode(api.arrayCodec.encode(array))).toEqual(array);
  expect(api.arrayCodec.decode("{}")).toEqual({ dimensions: [], values: [] });
  expect(api.field().metadata.extension).toMatchObject({
    type: "stdaddr",
    member: "type:$extension:address_standardizer.stdaddr",
    schema: descriptor.schema,
  });
  expect(api.arrayField().metadata.extension).toMatchObject({
    type: "stdaddr",
    array: true,
    member: "type:$extension:address_standardizer._stdaddr",
  });
  expect(api.parseCodec.decode(api.parseCodec.encode({
    num: "123",
    street: "Main",
    street2: null,
    address1: "123 Main",
    city: null,
    state: "MA",
    zip: "02139",
    zipplus: null,
    country: "US",
  }))).toEqual({
    num: "123",
    street: "Main",
    street2: null,
    address1: "123 Main",
    city: null,
    state: "MA",
    zip: "02139",
    zipplus: null,
    country: "US",
  });
  expect(api).not.toHaveProperty("normalizeAddress");
  expect(api).not.toHaveProperty("parseAddressLocally");
});

extensionProofUnitTest(addressStandardizerUnitProofCases[2]!, () => {
  const api = createAddressStandardizer_3_6_4(descriptor);
  const dialect = extensionSqlDialect(nodePgCodecs);
  expect(addressStandardizerTableNameOk('us_lex')).toBe(true);
  expect(addressStandardizerTableNameOk('"Lex"."us_lex"')).toBe(true);
  expect(addressStandardizerTableNameOk("us lex")).toBe(false);
  expect(addressStandardizerTableNameOk("us-lex")).toBe(false);
  expect(addressStandardizerTableNameOk("東京")).toBe(false);
  expect(addressStandardizerTableNameOk("us;lex")).toBe(false);
  expect(encodeAddressStandardizerSource({ schema: "lex_schema", name: "us_lex" })).toBe(
    '"lex_schema"."us_lex"',
  );
  expect(encodeAddressStandardizerSource({ name: "us_lex" })).toBe('"us_lex"');
  expect(encodeAddressStandardizerSource({ schema: 'Lex"', name: "us_lex" })).toBe('"Lex"""."us_lex"');
  expect(() => encodeAddressStandardizerSource({ name: "us lex" })).toThrow(/tableNameOk/);
  expect(() => encodeAddressStandardizerSource({ name: "東京" })).toThrow(/tableNameOk/);

  const qualified = {
    lex: { schema: "lex_schema", name: "us_lex" },
    gaz: { schema: "lex_schema", name: "us_gaz" },
    rules: { schema: "lex_schema", name: "us_rules" },
  } as const;
  const four = api.standardizeAddress(qualified, "123 Main St");
  expect(extensionExpressionContract(four)?.member).toBe(
    "routine:$extension:address_standardizer.standardize_address(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
  );
  expect(extensionExpressionContract(four)?.observability).toBe("tables");
  expect(extensionExpressionContract(four)?.dependencies).toEqual([
    "lex_schema.us_lex",
    "lex_schema.us_gaz",
    "lex_schema.us_rules",
  ]);
  const fourQuery = dialect.sqlToQuery(four);
  expect(fourQuery.sql).toContain('"Addr""日本"."standardize_address"');
  expect(fourQuery.params).toEqual(['"lex_schema"."us_lex"', '"lex_schema"."us_gaz"', '"lex_schema"."us_rules"', "123 Main St"]);

  const five = api.standardizeAddress(qualified, "123 Main St", "Boston, MA 02139");
  expect(extensionExpressionContract(five)?.member).toBe(
    "routine:$extension:address_standardizer.standardize_address(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
  );
  expect(extensionExpressionContract(five)?.dependencies).toEqual([
    "lex_schema.us_lex",
    "lex_schema.us_gaz",
    "lex_schema.us_rules",
  ]);
  expect(dialect.sqlToQuery(five).params).toEqual([
    '"lex_schema"."us_lex"',
    '"lex_schema"."us_gaz"',
    '"lex_schema"."us_rules"',
    "123 Main St",
    "Boston, MA 02139",
  ]);

  const searchPath = {
    lex: { name: "us_lex" },
    gaz: { name: "us_gaz" },
    rules: { name: "us_rules" },
  } as const;
  const search = api.standardizeAddress(searchPath, "123 Main St");
  expect(extensionExpressionContract(search)?.observability).toBe("session");
  expect(extensionExpressionContract(search)?.dependencies).toEqual([]);
  expect(dialect.sqlToQuery(search).params).toEqual(['"us_lex"', '"us_gaz"', '"us_rules"', "123 Main St"]);

  const debug = api.debugStandardizeAddress(qualified, "123 Main St");
  expect(extensionExpressionContract(debug)?.member).toBe(
    "routine:$extension:address_standardizer.debug_standardize_address(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
  );
  expect(dialect.sqlToQuery(debug).params).toEqual([
    '"lex_schema"."us_lex"',
    '"lex_schema"."us_gaz"',
    '"lex_schema"."us_rules"',
    "123 Main St",
  ]);

  const parsed = api.parseAddress("123 Main St, Boston, MA 02139");
  expect(extensionExpressionContract(parsed)?.member).toBe(
    "routine:$extension:address_standardizer.parse_address(pg_catalog.text)",
  );
  expect(extensionExpressionContract(parsed)?.observability).toBe("tables");
  expect(extensionExpressionContract(parsed)?.dependencies).toEqual([]);

  const raw = api.sql.functions.standardize_address("us_lex", "us_gaz", "us_rules", "123 Main St");
  expect(extensionExpressionContract(raw)?.observability).toBe("session");
  expect(extensionExpressionContract(raw)?.dependencies).toEqual([]);
  const compiled = dialect.sqlToQuery(raw);
  expect(checkCompiledExtensionQuery(compiled)[0]?.member).toBe(
    "routine:$extension:address_standardizer.standardize_address(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
  );
});
