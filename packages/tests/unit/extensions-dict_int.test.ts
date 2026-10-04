import { expect, test } from "vite-plus/test";
import { createDictInt_1_0, parseDictIntOptions, encodeDictIntOptions } from "kello/extensions/dict-int";
import {
  dictIntAnnotationContract,
  dictIntAnnotations,
} from "../../../apps/loom/src/tooling/extensions/annotations/dict_int";
import capture from "../../../apps/loom/src/tooling/extensions/manifests/dict_int.json";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { wave10CallbackUnitCases } from "../../e2e/fixtures/wave10-callback-unit-types-cases";

const digest = "1a745014cc5c4e94724c34d742b8fb154fe0852306dca4163cc307b8dca9e5da";
const descriptor = {
  name: "dict_int",
  version: "1.0",
  schema: 'dict"int',
  apiSupport: { status: "verified", digest },
} as const;

extensionProofUnitTest(
  wave10CallbackUnitCases.find((proof) => proof.families[0]!.extension === "dict_int")!,
  () => {
    expect(capture.digest).toBe(digest);
    expect(dictIntAnnotationContract.digest).toBe(digest);
    expect(dictIntAnnotationContract.providerAcceptance).toBe("pending");
    expect(dictIntAnnotationContract).not.toHaveProperty("textSearchDigest");
    expect(() =>
      createDictInt_1_0({ ...descriptor, apiSupport: { status: "verified", digest: "0".repeat(64) } }),
    ).toThrow("dict_int 1.0 requires its exact verified contract");
    expect(() => createDictInt_1_0({ ...descriptor, apiSupport: { status: "unverified" } })).toThrow();
  },
);

test("dict_int.identitiesQuoteConfiguredNamespaceWithoutCallbackSql", () => {
  const api = createDictInt_1_0(descriptor);
  expect(api.dictionary).toMatchObject({ schema: 'dict"int', name: "intdict" });
  expect(api.intdict).toBe(api.dictionary);
  expect(api.template).toEqual({
    schema: 'dict"int',
    name: "intdict_template",
    member: 'text search template:"$extension:dict_int".intdict_template',
    init: "routine:$extension:dict_int.dintdict_init(pg_catalog.internal)",
    lexize:
      "routine:$extension:dict_int.dintdict_lexize(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
  });
  expect(Object.isFrozen(api.template)).toBe(true);
  expect(api.sql.functions).toEqual({});
  expect(api.sql.overloads).toEqual({});
  expect(api.sql.functions).not.toHaveProperty("dintdict_init");
  expect(api.sql.functions).not.toHaveProperty("dintdict_lexize");
  expect(api.sql.functions).not.toHaveProperty("ts_lexize");
  expect(api).not.toHaveProperty("init");
  expect(api).not.toHaveProperty("lexize");
});

test("dict_int.optionsPreserveDocumentedDefaultsAndRejectUnknownKeys", () => {
  const api = createDictInt_1_0(descriptor);
  expect(api.options.parse(null)).toEqual({ maxlen: 6, rejectlong: false, absval: false });
  expect(api.options.parse("maxlen = '4', rejectlong = 'true'")).toEqual({
    maxlen: 4,
    rejectlong: true,
    absval: false,
  });
  expect(parseDictIntOptions("ABSVAL = false, MAXLEN = 8")).toEqual({
    maxlen: 8,
    rejectlong: false,
    absval: false,
  });
  expect(encodeDictIntOptions({ maxlen: 3, rejectlong: true, absval: true })).toBe(
    "maxlen = '3', rejectlong = 'true', absval = 'true'",
  );
  expect(encodeDictIntOptions({})).toBeNull();
  expect(() => api.options.parse("rules = 'unaccent'")).toThrow("Unknown dict_int option");
  expect(() => api.options.encode({ maxlen: 0 })).toThrow();
  expect(() => api.options.encode({ maxlen: 1.5 })).toThrow();
  expect(() =>
    // @ts-expect-error Unknown option keys are not portable configuration.
    api.options.encode({ extra: true }),
  ).toThrow();
});

test("dict_int.allFourMemberDispositions", () => {
  const ids = dictIntAnnotations.map((entry) => entry.id).sort();
  expect(ids).toEqual(capture.contract.members.map((member) => member.id).sort());
  expect(new Set(ids).size).toBe(4);
  for (const member of dictIntAnnotations) {
    expect(member.reason.length).toBeGreaterThan(20);
    expect(member.evidence.some((item) => item.includes("not yet executed") || item.includes("unit"))).toBe(true);
    if (member.disposition === "internal") {
      expect(member.parents).toEqual(['text search template:"$extension:dict_int".intdict_template']);
      expect(member.proofTransfer.relation.kind).toBe("text-search-callback");
    }
  }
});
