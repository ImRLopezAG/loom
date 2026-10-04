import { expect } from "vite-plus/test";
import { sql, type SQL } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createNeonUtils_1_1 } from "../../../apps/loom/src/core/extensions/adapters/neon_utils";
import { int4Codec } from "../../../apps/loom/src/core/extensions/native-codecs";
import {
  checkCompiledExtensionQuery,
  extensionExpressionContract,
  extensionSqlDialect,
} from "../../../apps/loom/src/core/extensions/sql";
import { evaluateSnapshot } from "../../../apps/loom/src/core/server/rpc/snapshot";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import * as v from "valibot";
import { neonUtilsAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/neon_utils";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/neon_utils.json";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { neonUtilsMember, neonUtilsUnitProofCase } from "../../e2e/fixtures/neon_utils-proof-cases";

extensionProofUnitTest(neonUtilsUnitProofCase, async () => {
  const descriptor = {
    name: "neon_utils",
    version: "1.1",
    schema: 'cpu"stats',
    apiSupport: { status: "verified", digest: manifest.digest },
  } as const;
  const api = createNeonUtils_1_1(descriptor);
  expect(validateExtensionManifest(v.parse(extensionManifestValidator, manifest)).digest).toBe(
    descriptor.apiSupport.digest,
  );
  expect(neonUtilsAnnotations.map(({ id, disposition }) => [id, disposition])).toEqual([[neonUtilsMember, "query"]]);
  expect(manifest.contract.members.map(({ id }) => id)).toEqual([neonUtilsMember]);
  expect(Object.isFrozen(api)).toBe(true);
  expect(Object.keys(api.sql.functions)).toEqual(["num_cpus"]);
  expect(api.sql.operators).toEqual({});
  expect(api).not.toHaveProperty("fields");
  expect(api).not.toHaveProperty("session");
  expect(api.numCpus).toBe(api.sql.functions.num_cpus);
  const dialect = extensionSqlDialect(nodePgCodecs);
  const expression = api.numCpus();
  const query = dialect.sqlToQuery(sql`select ${expression} as cpus`);
  expect(query.sql).toBe('select "cpu""stats"."num_cpus"() as cpus');
  expect(query.params).toEqual([]);
  expect(extensionExpressionContract(expression)).toEqual({
    member: neonUtilsMember,
    codec: "pg:int4:1",
    dependencies: [],
    observability: "external",
  });
  await expect(
    evaluateSnapshot(async () => {
      checkCompiledExtensionQuery(query);
      return [];
    }),
  ).rejects.toThrow("Automatic live query cannot observe external extension dependency");
  for (const [wire, expected] of [
    [8, 8],
    ["8", 8],
    ["-2147483648", -2147483648],
    ["2147483647", 2147483647],
  ] as const)
    expect(int4Codec.decode(wire)).toBe(expected);
  for (const invalid of [null, "2147483648", "-2147483649", 1.5, "1.5", true])
    expect(() => int4Codec.decode(invalid)).toThrow();
  for (const invalid of [
    { ...descriptor, name: "neon" },
    { ...descriptor, version: "1.0" },
    { ...descriptor, apiSupport: { status: "unverified" } },
    { ...descriptor, apiSupport: { status: "verified", digest: "wrong" } },
  ]) {
    // SAFETY: malformed JavaScript inputs deliberately bypass static descriptor admission.
    expect(() => createNeonUtils_1_1(invalid as never)).toThrow("requires its exact verified contract");
  }
  // SAFETY: the captured routine accepts no arguments, including NULL.
  expect(() => (api.numCpus as (argument: null) => SQL<number>)(null)).toThrow("argument count");
});
