import { expect, test } from "vite-plus/test";
import { extensionBindingsSource, resolveSelectedExtension } from "../../../apps/loom/src/tooling/codegen/extensions";
import { buildRequiredApi, validateRequiredApi } from "../../../apps/loom/src/tooling/migrations/required-api";
import {
  validateRequiredApiForTarget,
  verifyRequiredApiOnTarget,
} from "../../../apps/loom/src/tooling/migrations/required-api-verification";
import {
  unaccentAnnotations,
  unaccentAnnotationContract,
} from "../../../apps/loom/src/tooling/extensions/annotations/unaccent";
import { createExtensionTextSearchCapture } from "../../../apps/loom/src/tooling/extensions/text-search-capture";
import type pg from "pg";
import textSearch from "../../../apps/loom/src/tooling/extensions/text-search-contracts/unaccent.json";

const digest = "f983b4bfaa4c974c4ae2eba548249eb86d31d86376d019898b070ff66f9832dd";

test("selected unaccent 1.1 resolves the exact reviewed runtime contract", () => {
  const resolution = resolveSelectedExtension("unaccent", { version: "1.1", schema: 'accent"schema' });
  expect(resolution.support).toEqual({ status: "verified", digest });
  expect(resolution.adapter).toMatchObject({
    name: "unaccent",
    version: "1.1",
    digest,
    factory: "createUnaccent_1_1",
    module: "kello/extensions/unaccent",
  });
  expect(resolution.manifest?.digest).toBe(digest);
  expect(resolution.textSearch?.digest).toBe("9bfba15f9043a004cea04315c1c52dec6ce8a19f4a5e828a369234ac1644ba2d");
});

test("selected unaccent emits its exact key, factory and qualified schema", () => {
  const selection = { unaccent: { version: "1.1", schema: 'accent"schema' } } as const;
  const source = extensionBindingsSource(selection);
  expect(source).toContain('import { createUnaccent_1_1 } from "kello/extensions/unaccent";');
  expect(source).toContain('"unaccent": createUnaccent_1_1(descriptors["unaccent"])');
  expect(source).toContain(`export const selection = ${JSON.stringify(selection)} as const;`);
  expect(source).toContain(`"unaccent":{"status":"verified","digest":"${digest}"}`);
  expect(source).toContain("export const extensions = Object.freeze({");
  for (const forbidden of [
    "kello/tooling",
    "withUnaccentDictionaries",
    "restoreUnaccentDictionary",
    "createDictionary",
  ])
    expect(source).not.toContain(forbidden);
});

test("selected unaccent persists its supplemental text-search pin with its SQL contract", () => {
  const required = buildRequiredApi({ unaccent: { version: "1.1", schema: 'accent"schema' } });
  expect(required?.apis).toHaveLength(1);
  expect(required?.apis[0]?.schema).toBe('accent"schema');
  expect(required?.apis[0]?.manifest.digest).toBe(digest);
  expect(required?.apis[0]?.textSearch).toEqual(textSearch);
  expect(validateRequiredApiForTarget(required)).toEqual(required);
});

test("Unaccent target pins reject missing, forged and self-consistent alternate graphs before native I/O", async () => {
  const required = buildRequiredApi({ unaccent: { version: "1.1", schema: 'accent"schema' } })!;
  const api = required.apis[0]!;
  const absent = { ...required, apis: [{ schema: api.schema, manifest: api.manifest }] };
  const forged = { ...required, apis: [{ ...api, textSearch: { ...api.textSearch!, digest: "0".repeat(64) } }] };
  const graph = createExtensionTextSearchCapture(
    api.manifest,
    {
      ...api.textSearch!.contract,
      dictionaries: api.textSearch!.contract.dictionaries.map((dictionary) => ({
        ...dictionary,
        options: "rules = 'alternate'",
      })),
    },
    api.textSearch!.provenance,
  );
  const alternate = { ...required, apis: [{ ...api, textSearch: graph }] };
  // Historical evidence remains self-consistent; current target acceptance requires the reviewed graph.
  expect(validateRequiredApi(alternate).apis[0]?.textSearch?.digest).toBe(graph.digest);
  let calls = 0;
  const client: Pick<pg.Client, "query"> = {
    query: () => {
      calls++;
      throw new Error("Invalid Unaccent evidence must not reach native I/O");
    },
  };
  for (const invalid of [absent, forged, alternate]) {
    expect(() => validateRequiredApiForTarget(invalid)).toThrow();
    await expect(verifyRequiredApiOnTarget(client, invalid, "runtime")).rejects.toThrow();
  }
  expect(calls).toBe(0);
});

test("Unaccent reviewed dispositions cover its exact six members with template-slot callback transfers", () => {
  const resolution = resolveSelectedExtension("unaccent", { version: "1.1", schema: "accents" });
  expect(unaccentAnnotationContract.digest).toBe(resolution.manifest?.digest);
  expect(unaccentAnnotationContract.textSearchDigest).toBe(resolution.textSearch?.digest);
  expect(unaccentAnnotations.map(({ id }) => id).sort()).toEqual(
    resolution.manifest?.contract.members.map(({ id }) => id).sort(),
  );
  expect(unaccentAnnotations.filter(({ disposition }) => disposition === "query")).toHaveLength(2);
  expect(unaccentAnnotations.filter(({ disposition }) => disposition === "tooling")).toHaveLength(2);
  const template = resolution.textSearch!.contract.templates[0]!;
  const callbacks = unaccentAnnotations.filter((annotation) => annotation.disposition === "internal");
  expect(callbacks).toHaveLength(2);
  for (const callback of callbacks) {
    if (callback.disposition !== "internal") throw new Error("Expected internal Unaccent callback");
    expect(callback.proofTransfer.from).toEqual([template.id]);
    expect(callback.proofTransfer.relation.kind).toBe("text-search-callback");
    expect(template[callback.proofTransfer.relation.slot]).toBe(callback.id);
  }
});

test("absent, empty and undefined-only unaccent selections stay undefined", () => {
  for (const selection of [undefined, {}, { unaccent: undefined }])
    expect(extensionBindingsSource(selection)).toBe(
      "export const selection = undefined;\nexport const extensions = undefined;\n",
    );
});

test("unknown unaccent versions retain unverified descriptors without the adapter", () => {
  const entry = { version: "future", schema: "accents" };
  const resolution = resolveSelectedExtension("unaccent", entry);
  expect(resolution.support.status).toBe("unverified");
  expect(resolution.adapter).toBeUndefined();
  const source = extensionBindingsSource({ unaccent: entry });
  expect(source).toContain('"unaccent": descriptors["unaccent"]');
  expect(source).toContain('"status":"unverified"');
  expect(source).not.toContain('from "kello/extensions/unaccent"');
  expect(source).not.toContain("createUnaccent_1_1");
});

test("undefined unaccent is omitted when another extension is selected", () => {
  const source = extensionBindingsSource({
    unaccent: undefined,
    pg_trgm: { version: "1.6", schema: "trigrams" },
  });
  expect(source).not.toContain("unaccent");
  expect(source).toContain('"pg_trgm": createPgTrgm_1_6(descriptors["pg_trgm"])');
});
