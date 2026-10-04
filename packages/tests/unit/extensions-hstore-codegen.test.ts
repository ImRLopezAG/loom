import { expect, test } from "vite-plus/test";
import { extensionBindingsSource } from "../../../apps/loom/src/tooling/codegen/extensions";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/hstore.json";

test("hstore.codegenExactFactoryDigestAndRelocatedSchema", () => {
  const source = extensionBindingsSource({ hstore: { version: "1.8", schema: 'custom"hstore' } });
  expect(source).toContain('import { createHstore_1_8 } from "kello/extensions/hstore";');
  expect(source).toContain('"hstore": createHstore_1_8(descriptors["hstore"])');
  expect(source).toContain(`"status":"verified","digest":"${manifest.digest}"`);
  expect(source).toContain('"version":"1.8","schema":"custom\\"hstore"');
  for (const forbidden of ["vector", "pgcrypto", "kello.config", "../schema"]) expect(source).not.toContain(forbidden);
});

test("hstore.codegenFutureContractsRemainDescriptors", () => {
  const source = extensionBindingsSource({ hstore: { version: "future", schema: "extensions" } });
  expect(source).not.toContain('from "kello/extensions/');
  expect(source).not.toContain('"status":"verified"');
  expect(source).toContain('"hstore": descriptors["hstore"]');
});

test("hstore.codegenAbsentSelectionsHaveNoImports", () => {
  for (const selection of [undefined, {}, { hstore: undefined }])
    expect(extensionBindingsSource(selection)).toBe(
      "export const selection = undefined;\nexport const extensions = undefined;\n",
    );
});
