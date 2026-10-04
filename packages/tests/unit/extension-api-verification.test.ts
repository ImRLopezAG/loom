import { expect, test } from "vite-plus/test";
import * as v from "valibot";
import pgTrgm from "../../../apps/loom/src/tooling/extensions/manifests/pg_trgm.json";
import unaccent from "../../../apps/loom/src/tooling/extensions/manifests/unaccent.json";
import dictInt from "../../../apps/loom/src/tooling/extensions/manifests/dict_int.json";
import dictIntTextSearch from "../../../apps/loom/src/tooling/extensions/text-search-contracts/dict_int.json";
import textSearch from "../../../docs/architecture/evidence/typed-extension-proof/2026-10-02-unaccent-text-search-capture.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { createExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { extensionTextSearchCaptureValidator } from "../../../apps/loom/src/tooling/extensions/text-search-capture";
import {
  validateExtensionApiRequirement,
  verifyExtensionApiContracts,
} from "../../../apps/loom/src/tooling/extensions/verify";

const manifest = v.parse(extensionManifestValidator, pgTrgm);
const unaccentManifest = v.parse(extensionManifestValidator, unaccent);
const graph = v.parse(extensionTextSearchCaptureValidator, textSearch);

test("dict_int requirements pin their native callback graph and reject missing, foreign and corrupt graphs", () => {
  const manifest = v.parse(extensionManifestValidator, dictInt);
  const textSearch = v.parse(extensionTextSearchCaptureValidator, dictIntTextSearch);
  expect(() => validateExtensionApiRequirement({ schema: "extensions", manifest })).toThrow("text-search");
  expect(validateExtensionApiRequirement({ schema: 'Dict "整数"', manifest, textSearch })).toMatchObject({
    manifest: { digest: manifest.digest },
    textSearch: { digest: "30d18d75bba47e968e7cb932340285fbb370bc1abd75caf9145dc17936d1a6b8" },
  });
  expect(() => validateExtensionApiRequirement({ schema: "extensions", manifest, textSearch: graph })).toThrow();
  expect(() =>
    validateExtensionApiRequirement({
      schema: "extensions",
      manifest,
      textSearch: { ...textSearch, digest: "0".repeat(64) },
    }),
  ).toThrow("digest");
});

test("pinned SQL requirements preserve portable manifests and require the exact Unaccent graph", () => {
  expect(validateExtensionApiRequirement({ schema: 'custom"schema', manifest })).toEqual({
    schema: 'custom"schema',
    manifest,
  });
  expect(() => validateExtensionApiRequirement({ schema: "extensions", manifest: unaccentManifest })).toThrow(
    "text-search",
  );
  expect(
    validateExtensionApiRequirement({ schema: "extensions", manifest: unaccentManifest, textSearch: graph }),
  ).toMatchObject({
    schema: "extensions",
    textSearch: { digest: graph.digest },
  });
  expect(() => validateExtensionApiRequirement({ schema: "extensions", manifest, textSearch: graph })).toThrow(
    "text-search",
  );
});

test("corrupt or ambiguous requirements fail before touching the caller's database", async () => {
  const client = {
    query: async () => {
      throw new Error("Database must not be queried");
    },
  };
  const valid = { schema: "extensions", manifest };
  await expect(verifyExtensionApiContracts(client, [valid, valid])).rejects.toThrow("Duplicate");
  await expect(
    verifyExtensionApiContracts(client, [
      valid,
      { schema: "extensions", manifest: { ...manifest, digest: "0".repeat(64) } },
    ]),
  ).rejects.toThrow("digest");
  expect(() => validateExtensionApiRequirement({ ...valid, schema: "" })).toThrow();
  expect(() => validateExtensionApiRequirement({ ...valid, schema: "a\u0000b" })).toThrow();
  const unexpected = { ...valid, textSearch: undefined, unexpected: true };
  expect(() => validateExtensionApiRequirement(unexpected)).toThrow();
  await expect(verifyExtensionApiContracts(client, [])).resolves.toBeUndefined();
});

test("text-search requirements cannot carry corrupt or foreign contract fingerprints", () => {
  expect(() =>
    validateExtensionApiRequirement({
      schema: "extensions",
      manifest: unaccentManifest,
      textSearch: { ...graph, digest: "0".repeat(64) },
    }),
  ).toThrow("digest");
  expect(() =>
    validateExtensionApiRequirement({
      schema: "extensions",
      manifest: unaccentManifest,
      textSearch: { ...graph, contract: { ...graph.contract, provider: "foreign" } },
    }),
  ).toThrow("profile mismatch");
});

test("fixed-schema conflicts and incomplete later graphs fail before database I/O", async () => {
  const client = {
    query: async () => {
      throw new Error("Database must not be queried");
    },
  };
  const fixed = createExtensionManifest(
    {
      ...manifest.contract,
      installation: { relocatable: false, fixedSchema: "fixed_namespace" },
    },
    manifest.provenance,
  );
  await expect(verifyExtensionApiContracts(client, [{ schema: "wrong_namespace", manifest: fixed }])).rejects.toThrow(
    "fixed schema",
  );
  await expect(
    verifyExtensionApiContracts(client, [
      { schema: "extensions", manifest },
      { schema: "extensions", manifest: unaccentManifest },
    ]),
  ).rejects.toThrow("text-search");
});
