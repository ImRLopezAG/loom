import { expect, test } from "vite-plus/test";
import { createCitext_1_8 } from "../../../apps/loom/src/core/extensions/adapters/citext";
import { citextAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/citext";

const api = createCitext_1_8({
  name: "citext",
  version: "1.8",
  schema: 'Case"日本',
  apiSupport: { status: "verified", digest: "bf50ef209f828f5cbd517fe1a5f0b1ede7f1bbeac379b75c0b2bc02bf0a8eee3" },
});
test("citext rejects UTF16 replacement and preserves database spelling", () => {
  for (const value of ["\ud800", "x\udfff", "a\0b"]) {
    expect(() => api.codec.encode(value)).toThrow();
    expect(() => api.codec.decode(value)).toThrow();
    expect(() => api.value(value)).toThrow();
    expect(() => api.fromText(value)).toThrow();
  }
  expect(() => api.hashExtended("A", 9223372036854775808n)).toThrow();
  expect(api.codec.decode("MiXeD 日本 😀")).toBe("MiXeD 日本 😀");
  expect(() => api.arrayCodec.encode({ dimensions: [{ lowerBound: 1, length: 1 }], values: ["\ud800"] })).toThrow();
});
test("citext acceptance is pending and indexes preserve native storage", () => {
  for (const row of citextAnnotations) {
    expect(row.semantics.providerAcceptance).toBe("pending");
    expect(row.semantics.publicExportAcceptance).toBe("pending");
  }
  for (const index of [api.indexes.btree(), api.indexes.hash(), api.indexes.pattern()])
    expect(index).toMatchObject({ input: { schema: api.schema, type: "citext", dimensions: 0 } });
});
