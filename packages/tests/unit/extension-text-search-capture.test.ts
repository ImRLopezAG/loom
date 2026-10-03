import { expect, test } from "vite-plus/test";
import * as v from "valibot";
import unaccent from "../../../apps/loom/src/tooling/extensions/manifests/unaccent.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { createExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import {
  createExtensionTextSearchCapture,
  validateExtensionTextSearchCapture,
  extensionTextSearchContractValidator,
  extensionTextSearchCaptureValidator,
} from "../../../apps/loom/src/tooling/extensions/text-search-capture";

const source = v.parse(extensionManifestValidator, unaccent);
const dictionary = 'text search dictionary:"$extension:unaccent".unaccent';
const template = 'text search template:"$extension:unaccent".unaccent';
const init = "routine:$extension:unaccent.unaccent_init(pg_catalog.internal)";
const lexize =
  "routine:$extension:unaccent.unaccent_lexize(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)";
const contract = {
  extension: "unaccent" as const,
  postgresMajor: 18 as const,
  version: "1.1" as const,
  provider: "neon",
  manifestDigest: source.digest,
  dictionaries: [{ id: dictionary, template, options: "rules = 'unaccent'" }],
  templates: [{ id: template, init, lexize }],
};
const provenance = {
  capturedAt: "2026-10-02T00:00:00.000Z",
  fixture: "static-validation-fixture",
  source: "pg_catalog" as const,
  collector: "loom:text-search-capture:1" as const,
  serverVersion: "18.0",
  installationSchema: 'Search "One"',
  dictionaryOwners: [{ id: dictionary, owner: "fixture_owner" }],
};

test("the exact supplementary graph binds a validated historical manifest without changing it", () => {
  const before = JSON.stringify(source);
  const artifact = createExtensionTextSearchCapture(source, contract, provenance);
  expect(validateExtensionTextSearchCapture(artifact, source)).toEqual(artifact);
  expect(artifact.contract.dictionaries).toEqual([{ id: dictionary, template, options: "rules = 'unaccent'" }]);
  expect(artifact.contract.templates).toEqual([{ id: template, init, lexize }]);
  expect(JSON.stringify(source)).toBe(before);
  expect(JSON.stringify(artifact)).not.toContain('"oid":');
});

test("canonical relationship digest excludes observed schema, owner, server and fixture provenance", () => {
  const artifact = createExtensionTextSearchCapture(source, contract, provenance);
  const another = createExtensionTextSearchCapture(source, contract, {
    ...provenance,
    installationSchema: "different_namespace",
    capturedAt: "2026-10-03T00:00:00.000Z",
    fixture: "another-static-fixture",
    serverVersion: "18.1",
    dictionaryOwners: [{ id: dictionary, owner: "another_owner" }],
  });
  expect(another.digest).toBe(artifact.digest);
  expect(another.provenance.installationSchema).toBe("different_namespace");
  const reordered = Object.fromEntries(Object.entries(contract).reverse());
  expect(
    createExtensionTextSearchCapture(source, v.parse(extensionTextSearchContractValidator, reordered), provenance)
      .digest,
  ).toBe(artifact.digest);
  expect(
    createExtensionTextSearchCapture(
      source,
      {
        ...contract,
        dictionaries: [{ id: dictionary, template, options: "rules = 'different_rules'" }],
      },
      provenance,
    ).digest,
  ).not.toBe(artifact.digest);
});

test("missing, duplicate, dangling, foreign and unknown text-search members cannot validate", () => {
  for (const invalid of [
    { ...contract, templates: [] },
    { ...contract, dictionaries: [] },
    { ...contract, templates: [...contract.templates, ...contract.templates] },
    { ...contract, dictionaries: [...contract.dictionaries, ...contract.dictionaries] },
    { ...contract, dictionaries: [{ id: dictionary, template: "missing", options: null }] },
    {
      ...contract,
      templates: [{ id: template, init: "routine:$extension:other.unaccent_init(pg_catalog.internal)", lexize }],
    },
    { ...contract, templates: [{ id: template, init: "routine:foreign.unaccent_init(pg_catalog.internal)", lexize }] },
    {
      ...contract,
      templates: [{ id: template, init: "routine:$extension:unaccent.unknown(pg_catalog.internal)", lexize }],
    },
    { ...contract, dictionaries: [{ id: 'text search dictionary:"foreign".unaccent', template, options: null }] },
  ])
    expect(() => createExtensionTextSearchCapture(source, invalid, provenance)).toThrow();
});

test("callback slot registration requires the exact captured pointer routine, never a name alone", () => {
  for (const invalid of [
    { ...contract, templates: [{ id: template, init: lexize, lexize: init }] },
    { ...contract, templates: [{ id: template, init, lexize: init }] },
    {
      ...contract,
      templates: [{ id: template, init: "routine:$extension:unaccent.unaccent(pg_catalog.text)", lexize }],
    },
    { ...contract, templates: [{ id: template, init: null, lexize }] },
  ])
    expect(() => createExtensionTextSearchCapture(source, invalid, provenance)).toThrow();
  const changed = createExtensionManifest(
    {
      ...source.contract,
      members: source.contract.members.map((member) =>
        member.id === init && member.kind === "routine"
          ? { ...member, returns: { namespace: "pg_catalog", name: "text" } }
          : member,
      ),
    },
    source.provenance,
  );
  expect(() =>
    createExtensionTextSearchCapture(changed, { ...contract, manifestDigest: changed.digest }, provenance),
  ).toThrow();
});

test("strict parsing rejects artifact tampering and mismatched manifest/provider/version contracts", () => {
  const artifact = createExtensionTextSearchCapture(source, contract, provenance);
  expect(() => validateExtensionTextSearchCapture({ ...artifact, digest: "0".repeat(64) }, source)).toThrow("digest");
  const unexpectedKey = { ...artifact, unexpected: true };
  expect(() => validateExtensionTextSearchCapture(unexpectedKey, source)).toThrow();
  expect(() =>
    validateExtensionTextSearchCapture(
      v.parse(extensionTextSearchCaptureValidator, { ...artifact, format: 2 }),
      source,
    ),
  ).toThrow();
  expect(() =>
    validateExtensionTextSearchCapture(
      {
        ...artifact,
        contract: { ...artifact.contract, dictionaries: [{ id: dictionary, template, options: "rules = 'tampered'" }] },
      },
      source,
    ),
  ).toThrow("digest");
  for (const patch of [
    { provider: "local-postgresql" },
    { version: "1.2" },
    { postgresMajor: 17 },
    { extension: "other" },
    { manifestDigest: "0".repeat(64) },
  ])
    expect(() => createExtensionTextSearchCapture(source, { ...contract, ...patch }, provenance)).toThrow();
  expect(() => createExtensionTextSearchCapture({ ...source, digest: "0".repeat(64) }, contract, provenance)).toThrow(
    "digest",
  );
  const alteredSource = createExtensionManifest(
    { ...source.contract, provider: "local-postgresql" },
    source.provenance,
  );
  expect(() => validateExtensionTextSearchCapture(artifact, alteredSource)).toThrow();
  expect(() =>
    createExtensionTextSearchCapture(source, contract, {
      ...provenance,
      dictionaryOwners: [{ id: "foreign", owner: "fixture_owner" }],
    }),
  ).toThrow();
});
