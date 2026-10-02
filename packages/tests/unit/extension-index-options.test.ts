import { expect, test } from "vite-plus/test";
import * as v from "valibot";
import { createExtensionIndex, extensionIndexOpclass } from "../../../apps/loom/src/core/extensions/fields";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import capture from "../../../apps/loom/src/tooling/extensions/manifests/pg_trgm.json";

const manifest = v.parse(extensionManifestValidator, capture);
const definition = {
  extension: {
    name: "pg_trgm",
    version: "1.6",
    schema: "custom",
    apiSupport: { status: "verified" as const, digest: manifest.digest },
  },
  manifest,
  member: "opclass:$extension:pg_trgm.gist_trgm_ops/gist",
  method: "gist",
  opclass: "gist_trgm_ops",
  type: "text",
};

test("operator class options are retained and rendered beside the qualified class", () => {
  const options = { siglen: 32 };
  const contract = createExtensionIndex({ ...definition, options });
  expect(contract.options).toEqual({ siglen: 32 });
  expect(extensionIndexOpclass(contract)).toBe('"custom"."gist_trgm_ops"("siglen"=32)');
  options.siglen = 64;
  expect(contract.options).toEqual({ siglen: 32 });
  expect(extensionIndexOpclass(createExtensionIndex(definition))).toBe('"custom"."gist_trgm_ops"');
});

test("operator class option literals cannot introduce SQL text", () => {
  expect(() => createExtensionIndex({ ...definition, options: { siglen: 1.5 } })).toThrow();
  expect(() => createExtensionIndex({ ...definition, options: { siglen: Infinity } })).toThrow();
  expect(() => createExtensionIndex({ ...definition, options: { "siglen);select": 32 } })).toThrow();
});
