import { expect } from "vite-plus/test";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { addressStandardizerDataUsUnitProofCases } from "../../e2e/fixtures/address-standardizer-data-us-proof-cases";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import {
  createAddressStandardizerDataUs_3_6_4,
  ADDRESS_STANDARDIZER_DATA_US_DIGEST,
} from "../../../apps/loom/src/core/extensions/adapters/address-standardizer-data-us";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { addressStandardizerDataUsAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/address-standardizer-data-us";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/address_standardizer_data_us.json";

const descriptor = {
  name: "address_standardizer_data_us",
  version: "3.6.4",
  schema: 'Data"US日本',
  apiSupport: { status: "verified", digest: "063cb37742a0baf3dd885cb96255db38daf06b13d3b75fd7232b81822a7f01d0" },
} as const;
extensionProofUnitTest(addressStandardizerDataUsUnitProofCases[0], () => {
  expect(ADDRESS_STANDARDIZER_DATA_US_DIGEST).toBe(manifest.digest);
  expect(addressStandardizerDataUsAnnotations.map((entry) => entry.id).sort()).toEqual(
    manifest.contract.members.map((entry) => entry.id).sort(),
  );
  expect(new Set(addressStandardizerDataUsAnnotations.map((entry) => entry.id)).size).toBe(60);
  expect(() =>
    createAddressStandardizerDataUs_3_6_4({ ...descriptor, apiSupport: { status: "verified", digest: "wrong" } }),
  ).toThrow();
  const api = createAddressStandardizerDataUs_3_6_4(descriptor);
  expect(api.sources).toEqual({
    lex: { schema: descriptor.schema, name: "us_lex" },
    gaz: { schema: descriptor.schema, name: "us_gaz" },
    rules: { schema: descriptor.schema, name: "us_rules" },
  });
  expect(api.declarations.installation).toEqual({
    extension: "address_standardizer_data_us",
    version: "3.6.4",
    schema: descriptor.schema,
    digest: manifest.digest,
  });
});
extensionProofUnitTest(addressStandardizerDataUsUnitProofCases[1], () => {
  const api = createAddressStandardizerDataUs_3_6_4(descriptor);
  const rows = api.tables.us_lex.rows('alias"');
  expect(extensionSqlDialect(nodePgCodecs).sqlToQuery(rows.from).sql).toBe('"Data""US日本"."us_lex" as "alias"""');
  expect(extensionExpressionContract(rows.columns.word)?.dependencies).toEqual([`${descriptor.schema}.us_lex`]);
  expect(extensionExpressionContract(api.sequences.us_lex_id_seq.rows("s").columns.last_value)?.observability).toBe(
    "external",
  );
  expect(api.tables.us_lex.codec.decode('(1,,"東京, \\"",,7,f)')).toEqual({
    id: 1,
    seq: null,
    word: '東京, "',
    stdword: null,
    token: 7,
    is_custom: false,
  });
  expect(api.tables.us_rules.codec.decode("(,,)")).toEqual({ id: null, rule: null, is_custom: null });
  const value = { id: 1, seq: null, word: "日本", stdword: "", token: null, is_custom: false };
  const array = { dimensions: [{ lowerBound: -2, length: 2 }], values: [value, null] };
  expect(api.tables.us_gaz.arrayCodec.decode(api.tables.us_gaz.arrayCodec.encode(array))).toEqual(array);
  expect(api.tables.us_rules.field()).toBeDefined();
  expect(api.tables.us_rules.arrayField()).toBeDefined();
});
