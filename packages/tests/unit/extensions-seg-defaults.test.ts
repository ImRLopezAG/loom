import { expect } from "vite-plus/test";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { segDefaultPrecisionUnitProofCase, segDefaultIdentityUnitProofCase } from "../../e2e/fixtures/seg-proof-cases";
import { createSeg_1_4, createSegCodec } from "../../../apps/loom/src/core/extensions/adapters/seg";
import { createExtensionField, type ExtensionValueSchema } from "../../../apps/loom/src/core/extensions/fields";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { createSnapshot, migrationStatements, snapshotHash } from "../../../apps/loom/src/tooling/migrations/adapter";
const namespace = 'Seg"日本';
const api = createSeg_1_4({
  name: "seg",
  version: "1.4",
  schema: namespace,
  apiSupport: { status: "verified", digest: "bba7c8f626ee6352397bd765ae103231780c7aa366ff9819bcf948ed22bd5fff" },
});
const valueSchema: ExtensionValueSchema = {
  kind: "object",
  properties: {
    kind: { kind: "string", enum: ["point"] },
    value: { kind: "object", properties: { value: { kind: "string" }, certainty: { kind: "string", enum: [""] } } },
  },
};
const column = (snapshot: Awaited<ReturnType<typeof createSnapshot>>) => {
  const found = snapshot.ddl.find((entry) => entry.entityType === "columns" && entry.name === "value");
  if (found?.entityType !== "columns") throw new Error("Missing Seg test value column");
  return found;
};
extensionProofUnitTest(segDefaultPrecisionUnitProofCase, async () => {
  const snapshot = (token: string) =>
    createSnapshot(
      defineSchema(() => ({ entries: { value: api.field().default(api.point(api.boundary(token))) } }), {
        namespace: "app",
      }),
    );
  const precise = await snapshot("7.00"),
    blurred = await snapshot("7.0");
  expect(column(precise).default).toBe("'7.00'");
  expect(column(blurred).default).toBe("'7.0'");
  expect(snapshotHash(precise)).not.toBe(snapshotHash(blurred));
  expect(await migrationStatements(precise, blurred)).not.toEqual([]);
});
extensionProofUnitTest(segDefaultIdentityUnitProofCase, async () => {
  for (const selected of [
    { name: "not_seg", version: "1.4" },
    { name: "seg", version: "1.3" },
  ]) {
    const field = createExtensionField({
      extension: { ...selected, schema: namespace, apiSupport: { status: "verified", digest: "fixture-digest" } },
      member: "type:$extension:seg.seg",
      type: "seg",
      codec: createSegCodec(namespace),
      value: valueSchema,
      search: { filter: false, comparison: false, order: false, text: false },
    });
    const snapshot = await createSnapshot(
      defineSchema(() => ({ entries: { value: field.default(api.point(api.boundary("7.00"))) } }), {
        namespace: "app",
      }),
    );
    expect(column(snapshot).default).toBe(`'7.00'::"Seg""日本"."seg"`);
  }
});
