import { expect, test } from "vite-plus/test";
import { extensionBindingsSource } from "../../../apps/loom/src/tooling/codegen/extensions";

test("selected pg_trgm emits its exact reviewed adapter and literal descriptor binding", () => {
  const source = extensionBindingsSource({ pg_trgm: { version: "1.6", schema: "custom_text" } });
  expect(source).toContain('import { createPgTrgm_1_6 } from "loom/extensions/pg-trgm";');
  expect(source).toContain('"pg_trgm": createPgTrgm_1_6(descriptors["pg_trgm"])');
  expect(source).toContain('"version":"1.6","schema":"custom_text"');
  expect(source).toContain(
    '"status":"verified","digest":"88e35b55b09e58d6a59847390006ca73483bdb4444346474beb644c63adcbe66"',
  );
  expect(source).toContain("export const extensions = Object.freeze({");
  for (const forbidden of ["vector", "fuzzystrmatch", "pg-tiktoken", "../schema", "./server", "loom.config"])
    expect(source).not.toContain(forbidden);
});

test("fuzzy and token selections emit only their exact reviewed static imports", () => {
  const source = extensionBindingsSource({
    fuzzystrmatch: { version: "1.2", schema: "phonetics" },
    pg_tiktoken: { version: "0.0.1", schema: "tokens" },
  });
  expect(source).toContain('import { createFuzzystrmatch_1_2 } from "loom/extensions/fuzzystrmatch";');
  expect(source).toContain('import { createPgTiktoken_0_0_1 } from "loom/extensions/pg-tiktoken";');
  expect(source).toContain('"fuzzystrmatch": createFuzzystrmatch_1_2(descriptors["fuzzystrmatch"])');
  expect(source).toContain('"pg_tiktoken": createPgTiktoken_0_0_1(descriptors["pg_tiktoken"])');
  expect(source).toContain('"digest":"0607e044d263e8999732df67f96cfb29479f6811db8b4df674acf3c9c9d16961"');
  expect(source).toContain('"digest":"c4a9c741b544948caca1dd481dad068b48dcd9fb6665edfbe5d02163418b6163"');
  expect(source).not.toContain("pg-trgm");
  expect(source).not.toContain("vector");
});

test("unknown versions and captured contracts without a reviewed adapter remain descriptors", () => {
  const source = extensionBindingsSource({
    pg_trgm: { version: "unknown", schema: "extensions" },
    fuzzystrmatch: { version: "1.1", schema: "extensions" },
    pg_tiktoken: { version: "0.0.2", schema: "extensions" },
    vector: { version: "0.8.2", schema: "vectors" },
  });
  expect(source).not.toContain('from "loom/extensions/');
  expect(source).not.toContain('"status":"verified"');
  for (const name of ["pg_trgm", "fuzzystrmatch", "pg_tiktoken", "vector"])
    expect(source).toContain(`${JSON.stringify(name)}: descriptors[${JSON.stringify(name)}]`);
});

test("absent, empty, and undefined-only selections add no runtime imports", () => {
  for (const selection of [undefined, {}, { pg_trgm: undefined }])
    expect(extensionBindingsSource(selection)).toBe(
      "export const selection = undefined;\nexport const extensions = undefined;\n",
    );
  const source = extensionBindingsSource({
    pg_trgm: undefined,
    fuzzystrmatch: { version: "1.2", schema: "extensions" },
  });
  expect(source).not.toContain("pg_trgm");
  expect(source).toContain('"fuzzystrmatch": createFuzzystrmatch_1_2(descriptors["fuzzystrmatch"])');
});

test("descriptor-only contracts still enforce captured fixed installation schemas", () => {
  expect(() => extensionBindingsSource({ pg_graphql: { version: "1.5.12", schema: "extensions" } })).toThrow(
    "requires fixed installation schema graphql",
  );
  const source = extensionBindingsSource({ pg_graphql: { version: "1.5.12", schema: "graphql" } });
  expect(source).toContain('"status":"unverified"');
  expect(source).not.toContain('from "loom/extensions/');
});

test("selected JSON Schema emits its accepted exact adapter without other families", () => {
  const source = extensionBindingsSource({ pg_jsonschema: { version: "0.3.4", schema: "json_validation" } });
  expect(source).toContain('import { createPgJsonschema_0_3_4 } from "loom/extensions/pg-jsonschema";');
  expect(source).toContain('"pg_jsonschema": createPgJsonschema_0_3_4(descriptors["pg_jsonschema"])');
  expect(source).toContain(
    '"status":"verified","digest":"7a61cf1dd9bcb37e3704e5cb9c5cc92258815f6dddf6a869bd9c6434a66da138"',
  );
  expect(source).not.toContain("pg-trgm");
  expect(extensionBindingsSource({ pg_jsonschema: { version: "future", schema: "json_validation" } })).not.toContain(
    'from "loom/extensions/',
  );
});

test("selected UUID-OSSP preserves its dashed key and exact reviewed version", () => {
  const source = extensionBindingsSource({ "uuid-ossp": { version: "1.1", schema: 'custom"uuid' } });
  expect(source).toContain('import { createUuidOssp_1_1 } from "loom/extensions/uuid-ossp";');
  expect(source).toContain('"uuid-ossp": createUuidOssp_1_1(descriptors["uuid-ossp"])');
  expect(source).toContain(
    '"status":"verified","digest":"6961935a6844d9e8007d1d391a2deb0dc766e070e15ad0d4687134b46c4b7796"',
  );
  expect(source).not.toContain("pg-trgm");
  const future = extensionBindingsSource({ "uuid-ossp": { version: "future", schema: "extensions" } });
  expect(future).not.toContain('from "loom/extensions/');
  expect(future).toContain('"uuid-ossp": descriptors["uuid-ossp"]');
});
