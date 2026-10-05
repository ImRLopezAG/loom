import { expect, test } from "vite-plus/test";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { pgHashidsUnitProofCase } from "../../e2e/fixtures/pg-hashids-proof-cases";
import { sql, type SQL } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { bigint, integer, pgTable, text } from "drizzle-orm/pg-core";
import { createPgHashids_1_2_1 } from "../../../apps/loom/src/core/extensions/adapters/pg-hashids";
import { extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { pgHashidsAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg-hashids";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/pg_hashids.json";

const digest = "56a138e83f06ff23344a428d6486237eb9c875db35df970ceb4bcb60240a4041";
const verified = {
  name: "pg_hashids",
  version: "1.2.1",
  schema: 'custom"hash',
  apiSupport: { status: "verified", digest },
} as const;
const extension = createPgHashids_1_2_1(verified);
const dialect = extensionSqlDialect(nodePgCodecs);
const ids = pgTable("ids", {
  id: bigint({ mode: "bigint" }).notNull(),
  optional: bigint({ mode: "bigint" }),
  number: bigint({ mode: "number" }).notNull(),
  small: integer().notNull(),
  hash: text().notNull(),
});
const alphabet = "0123456789abcdef";
const members = manifest.contract.members.map((member) => member.id).sort((a, b) => a.localeCompare(b));
const max = 9223372036854775807n;
const min = -9223372036854775808n;
const one = (values: readonly bigint[], lowerBound = 1) => ({
  dimensions: [{ lowerBound, length: values.length }],
  values,
});

extensionProofUnitTest(pgHashidsUnitProofCase, () => {
  expect(digest).toBe(manifest.digest);
  expect(manifest.contract.version).toBe("1.2.1");
  for (const descriptor of [
    { ...verified, name: "pg-hashids" },
    { ...verified, version: "1.2" },
    { ...verified, version: "1.3" },
    { ...verified, apiSupport: { status: "unverified" } },
    { ...verified, apiSupport: { status: "verified" } },
    { ...verified, apiSupport: { status: "verified", digest: "wrong" } },
  ])
    // SAFETY: Invalid JavaScript descriptors exercise admission beyond the factory static signature.
    expect(() => createPgHashids_1_2_1(descriptor as never)).toThrow(
      "pg_hashids 1.2.1 requires its exact verified contract",
    );
  expect(Object.isFrozen(extension)).toBe(true);
  expect(Object.keys(extension.sql.functions).sort()).toEqual([
    "hash_decode",
    "hash_encode",
    "id_decode",
    "id_decode_once",
    "id_encode",
  ]);
});

const settings = [[], ["salt"], ["salt", 8], ["salt", 8, alphabet]] as const;
const tails = [
  "",
  ",pg_catalog.text",
  ",pg_catalog.text,pg_catalog.int4",
  ",pg_catalog.text,pg_catalog.int4,pg_catalog.text",
];
function safetyCases(canonical: boolean) {
  const encode = canonical ? extension.sql.functions.id_encode : extension.encode;
  const encodeArray = canonical ? extension.sql.functions.id_encode : extension.encodeArray;
  const decode = canonical ? extension.sql.functions.id_decode : extension.decode;
  const once = canonical ? extension.sql.functions.id_decode_once : extension.decodeOnce;
  const legacyEncode = canonical ? extension.sql.functions.hash_encode : extension.hashEncode;
  const legacyDecode = canonical ? extension.sql.functions.hash_decode : extension.hashDecode;
  return [
    ...settings.map((args, index) => ({
      member: `routine:$extension:pg_hashids.id_encode(pg_catalog.int8${tails[index]})`,
      call: () => encode(1n, ...args),
    })),
    ...settings.map((args, index) => ({
      member: `routine:$extension:pg_hashids.id_encode(pg_catalog._int8${tails[index]})`,
      call: () => encodeArray(one([1n]), ...args),
    })),
    ...settings.map((args, index) => ({
      member: `routine:$extension:pg_hashids.id_decode(pg_catalog.text${tails[index]})`,
      call: () => decode(index === 3 ? "ab" : "jR", ...args),
    })),
    ...settings.map((args, index) => ({
      member: `routine:$extension:pg_hashids.id_decode_once(pg_catalog.text${tails[index]})`,
      call: () => once(index === 3 ? "ab" : "jR", ...args),
    })),
    ...([[], ["salt"], ["salt", 8]] as const).map((args, index) => ({
      member: `routine:$extension:pg_hashids.hash_encode(pg_catalog.int8${tails[index]})`,
      call: () => legacyEncode(1n, ...args),
    })),
    {
      member: "routine:$extension:pg_hashids.hash_decode(pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
      call: () => legacyDecode("jR", "salt", 8),
    },
  ];
}
function expectSafetyRejection(call: () => SQL, member: string) {
  let failure: unknown;
  // No expression may reach the driver; the counter models submission after expression construction.
  let nativeInvocations = 0;
  try {
    dialect.sqlToQuery(call());
    nativeInvocations += 1;
  } catch (cause) {
    failure = cause;
  }
  expect(nativeInvocations).toBe(0);
  expect(failure).toBeInstanceOf(Error);
  expect(failure).toMatchObject({
    name: "PgHashidsNativeSafetyError",
    code: "PG_HASHIDS_NATIVE_REPAIR_REQUIRED",
    disposition: "safety-rejected",
    member,
    version: "1.2.1",
    manifestDigest: digest,
  });
  const nativeSymbol = member.includes("hash_encode(")
    ? "id_encode"
    : member.includes("decode_once(") || member.includes("hash_decode(")
      ? "id_decode_once"
      : member.includes("id_decode(")
        ? "id_decode"
        : member.includes("pg_catalog._int8")
          ? "id_encode_array"
          : "id_encode";
  expect(failure).toMatchObject({ nativeSymbol });
  expect(failure).toHaveProperty("message", expect.stringContaining("verified native repair"));
}

test("all twenty friendly overloads reject before native SQL until exact binary repair is verified", () => {
  const cases = safetyCases(false);
  expect(cases.map(({ member }) => member).sort()).toEqual([...members].sort());
  for (const { member, call } of cases) expectSafetyRejection(call, member);
});

test("all twenty canonical overloads reject before native SQL and preserve alias identity", () => {
  const cases = safetyCases(true);
  expect(cases.map(({ member }) => member).sort()).toEqual([...members].sort());
  for (const { member, call } of cases) expectSafetyRejection(call, member);
  expect(extension.sql.functions.id_decode).toBe(extension.decode);
  expect(extension.sql.functions.id_decode_once).toBe(extension.decodeOnce);
  expect(extension.sql.functions.hash_encode).toBe(extension.hashEncode);
  expect(extension.sql.functions.hash_decode).toBe(extension.hashDecode);
});

test("descriptor properties cannot replace fail-closed friendly or canonical functions", () => {
  const forged = createPgHashids_1_2_1({
    ...verified,
    encode: () => sql`unsafe_native_encode(1)`,
    sql: { functions: { id_encode: () => sql`unsafe_native_encode(1)` } },
  });
  const member = "routine:$extension:pg_hashids.id_encode(pg_catalog.int8)";
  expectSafetyRejection(() => forged.encode(1n), member);
  expectSafetyRejection(() => forged.sql.functions.id_encode(1n), member);
});

test("SQL expressions, aliases and exact int8 columns cannot escape encoder safety rejection", () => {
  for (const input of [sql<bigint>`1::int8`, sql<bigint>`null::int8`.as("nullable_native_input"), ids.id]) {
    for (const encode of [extension.encode, extension.sql.functions.id_encode])
      expectSafetyRejection(() => encode(input), "routine:$extension:pg_hashids.id_encode(pg_catalog.int8)");
    for (const encode of [extension.hashEncode, extension.sql.functions.hash_encode])
      expectSafetyRejection(() => encode(input), "routine:$extension:pg_hashids.hash_encode(pg_catalog.int8)");
  }
});

test("tooling annotations distinguish safety rejection and native repair from acceptance for all twenty members", () => {
  expect(pgHashidsAnnotations.map(({ id }) => id).sort()).toEqual([...members].sort());
  for (const annotation of pgHashidsAnnotations) {
    expect(annotation.disposition).toBe("query");
    expect(annotation.semantics).toMatchObject({
      safetyDisposition: "safety-rejected",
      nativeRepairAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    });
    expect(annotation.reason).toContain("safety-rejected");
    expect(annotation.evidence.length).toBeGreaterThanOrEqual(4);
  }
  expect(pgHashidsAnnotations.filter(({ id }) => id.includes("encode(")).length).toBe(11);
  expect(pgHashidsAnnotations.filter(({ id }) => id.includes("decode(") || id.includes("decode_once(")).length).toBe(9);
});

test("inputs that make the non-STRICT C routines dereference invalid memory are rejected before SQL", () => {
  const rejected: (() => SQL)[] = [
    () => extension.encode(max + 1n),
    () => extension.encode(min - 1n),
    // SAFETY: JavaScript callers can bypass the static non-null int8 contract.
    () => extension.encode(null as never),
    // SAFETY: JavaScript callers can bypass the static non-null salt contract.
    () => extension.encode(1n, null as never),
    () => extension.encode(1n, "nul\0salt"),
    () => extension.encode(1n, "s", -1),
    () => extension.encode(1n, "s", 1.5),
    () => extension.encode(1n, "s", 2147483648),
    () => extension.encode(1n, "s", 2147483647),
    () => extension.encode(1n, "s", 2147483646),
    () => extension.encode(1n, "s", 0, "0123456789abcde"),
    () => extension.encode(1n, "s", 0, "0123456789abcdee"),
    () => extension.encode(1n, "s", 0, "0123456789abcde f"),
    () => extension.encode(1n, "s", 0, "0123456789abcde\tf"),
    () => extension.encode(1n, "s", 0, "0123456789abcdeé"),
    () => extension.encodeArray({ dimensions: [], values: [] }),
    () => extension.encodeArray({ dimensions: [{ lowerBound: 1, length: 2 }], values: [1n, null] }),
    () =>
      extension.encodeArray({
        dimensions: [
          { lowerBound: 1, length: 1 },
          { lowerBound: 1, length: 1 },
        ],
        values: [[1n]],
      }),
    () => extension.encodeArray(one([max + 1n])),
    () => extension.decode(""),
    () => extension.decode("jR!"),
    () => extension.decode("jR", "s", 0, alphabet),
    () => extension.decodeOnce("ïa"),
    () => extension.hashDecode("jR", "s", -1),
    () => extension.hashDecode("a b", "s", 0),
  ];
  for (const call of rejected) expect(call).toThrow();
  expect(() => extension.decode("0123456789abcdef", "s", 0, alphabet)).toThrow();
  expect(() => extension.encode(1n, "sälz", 2147483645, `${alphabet}${alphabet}`)).toThrow();
});

test("v1.2.1 hashids.c ASAN: trailing-guard and unpadded decode remain rejected pending native repair", () => {
  // Pinned standalone hashids.c under AddressSanitizer: every original-alphabet character
  // has numbers_count >= 1. '!' is HASHIDS_ERROR_INVALID_HASH / count 0, then decode writes
  // past calloc(0). Empty hash has count 1 then reads past the NUL. Those stay rejected.
  expect(() => extension.decode("!")).toThrow();
  expect(() => extension.decode("")).toThrow();
  // Prior native characterization: guard/separator-only hashes are in the alphabet. minLength 0 decodes
  // them to extra zeros. minLength > 0 with the first guard as the last character still
  // overflows in hashids_decode. No new ASAN/native execution occurs here; every affected symbol stays rejected.
  expect(() => extension.decode("a")).toThrow();
  expect(() => extension.decode("c")).toThrow();
  expect(() => extension.decode("a", "", 8)).toThrow();
  expect(() => extension.decode("ja", "", 8)).toThrow();
  expect(() => extension.decode("aj", "", 8)).toThrow();
  expect(() => extension.hashDecode("a", "", 8)).toThrow();
});

test("pg_hashids canonical functions enforce the same literal NULL, alphabet and int8 column admission", () => {
  for (const encode of [
    extension.encode,
    extension.hashEncode,
    extension.sql.functions.id_encode,
    extension.sql.functions.hash_encode,
  ]) {
    for (const value of [null, undefined, ids.optional, ids.number, ids.small, ids.hash]) {
      // SAFETY: JavaScript callers exercise the declared int8 contract without static checking.
      expect(() => encode(value as never)).toThrow();
    }
    for (const settings of [[null], ["", null], ["", -1], ["", 2147483646]]) {
      // SAFETY: Literal settings deliberately violate the captured overload contracts.
      expect(() => encode(1n, ...(settings as never))).toThrow();
    }
    expect(() => encode(ids.id)).toThrow();
  }
  for (const encode of [extension.encodeArray, extension.sql.functions.id_encode]) {
    // SAFETY: Literal NULL arrays must not reach PG_GETARG_ARRAYTYPE_P.
    expect(() => encode(null as never)).toThrow();
    // SAFETY: NULL text settings and failed alphabet initialization must not reach C.
    expect(() => encode(one([1n]), null as never)).toThrow();
    for (const invalid of [null, "0123456789abcde", "0123456789abcde f"]) {
      // SAFETY: JS input tests the alphabet admission shared by both public surfaces.
      expect(() => encode(one([1n]), "", 8, invalid as never)).toThrow();
    }
  }
  for (const decode of [
    extension.decode,
    extension.decodeOnce,
    extension.sql.functions.id_decode,
    extension.sql.functions.id_decode_once,
  ]) {
    for (const settings of [[], [null], ["", null], ["", 8, null], ["", 8, "0123456789abcde"]]) {
      // SAFETY: Literal NULL hashes/settings must not reach the non-STRICT native wrapper.
      expect(() => decode(null as never, ...(settings as never))).toThrow();
      if (settings.length) {
        // SAFETY: Deliberately invalid JavaScript settings exercise the pre-SQL rejection boundary.
        expect(() => decode("jR", ...(settings as never))).toThrow();
      }
    }
    expect(() => decode("!")).toThrow();
    expect(() => decode("jR", "", 8, alphabet)).toThrow();
  }
  for (const decode of [extension.hashDecode, extension.sql.functions.hash_decode]) {
    // SAFETY: All three required arguments are independently checked for JavaScript callers.
    expect(() => decode(null as never, "", 0)).toThrow();
    // SAFETY: Deliberately invalid JavaScript salt must be rejected before native SQL.
    expect(() => decode("jR", null as never, 0)).toThrow();
    // SAFETY: Deliberately invalid JavaScript minimum length must be rejected before native SQL.
    expect(() => decode("jR", "", null as never)).toThrow();
    expect(() => decode("!", "", 0)).toThrow();
  }
  // Alias identity makes canonical dispatch reuse the validated helper, including all settings.
  expect(extension.sql.functions.id_decode).toBe(extension.decode);
  expect(extension.sql.functions.id_decode_once).toBe(extension.decodeOnce);
  expect(extension.sql.functions.hash_encode).toBe(extension.hashEncode);
  expect(extension.sql.functions.hash_decode).toBe(extension.hashDecode);
});
