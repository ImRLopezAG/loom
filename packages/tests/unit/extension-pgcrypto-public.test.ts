import { expect, test } from "vite-plus/test";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/pgcrypto.json";
import { extensionBindingsSource, resolveSelectedExtension } from "../../../apps/loom/src/tooling/codegen/extensions";
import { buildRequiredApi } from "../../../apps/loom/src/tooling/migrations/required-api";
import { validateRequiredApiForTarget } from "../../../apps/loom/src/tooling/migrations/required-api-verification";

const digest = "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8";

test("public Pgcrypto selects only the exact reviewed 1.4 contract in a quoted namespace", () => {
  const source = extensionBindingsSource({ pgcrypto: { version: "1.4", schema: 'crypto"public' } });
  expect(source).toContain('import { createPgcrypto_1_4 } from "loom/extensions/pgcrypto";');
  expect(source).toContain('"pgcrypto": createPgcrypto_1_4(descriptors["pgcrypto"])');
  expect(source).toContain(JSON.stringify({ version: "1.4", schema: 'crypto"public' }));
  expect(resolveSelectedExtension("pgcrypto", { version: "1.4", schema: "extensions" }).support).toEqual({
    status: "verified",
    digest,
  });
  for (const forbidden of ["pg-trgm", "pg-tiktoken", "../schema", "./server", "loom.config", "annotations/"])
    expect(source).not.toContain(forbidden);
});

test("empty Pgcrypto selections and unsupported versions preserve descriptor fallback", () => {
  for (const selection of [undefined, {}, { pgcrypto: undefined }])
    expect(extensionBindingsSource(selection)).toBe(
      "export const selection = undefined;\nexport const extensions = undefined;\n",
    );
  for (const version of ["1.3", "future"]) {
    const source = extensionBindingsSource({ pgcrypto: { version, schema: "extensions" } });
    expect(source).toContain('"pgcrypto": descriptors["pgcrypto"]');
    expect(source).toContain('"status":"unverified"');
    expect(source).not.toContain('from "loom/extensions/');
  }
  expect(extensionBindingsSource({ pg_trgm: { version: "1.6", schema: "extensions" } })).not.toContain("pgcrypto");
});

test("reviewed Pgcrypto annotations cover every one of the 37 public routines without invented surfaces", async () => {
  const { pgcryptoAnnotations } = await import("../../../apps/loom/src/tooling/extensions/annotations/pgcrypto");
  expect(manifest.digest).toBe(digest);
  expect(manifest.contract.members).toHaveLength(37);
  expect(manifest.contract.members.every((member) => member.kind === "routine")).toBe(true);
  const ids = pgcryptoAnnotations.map((annotation) => annotation.id);
  expect(new Set(ids).size).toBe(37);
  expect([...ids].sort()).toEqual(manifest.contract.members.map((member) => member.id).sort());
  for (const annotation of pgcryptoAnnotations) {
    expect(annotation.disposition).toBe("query");
    expect(annotation.reason.trim().length).toBeGreaterThan(0);
    expect(annotation.evidence.some((source) => source.startsWith("https://"))).toBe(true);
    expect(annotation.semantics.providerAcceptance).toBe("pending");
    expect(annotation.semantics.publicExportAcceptance).toBe("pending");
    expect(annotation.semantics.limitation).toContain("process-FIPS=true");
  }
});

test("selected public Pgcrypto persists its complete required API and reviewed privilege roster", () => {
  const api = buildRequiredApi({ pgcrypto: { version: "1.4", schema: 'crypto"public' } });
  expect(api?.apis).toHaveLength(1);
  expect(api?.apis[0]?.manifest.digest).toBe(digest);
  expect(api?.apis[0]?.schema).toBe('crypto"public');
  expect(api?.apis[0]?.manifest.contract.members).toHaveLength(37);
  expect(validateRequiredApiForTarget(JSON.parse(JSON.stringify(api)))).toEqual(api);
  expect(buildRequiredApi({ pgcrypto: { version: "1.3", schema: "extensions" } })).toBeUndefined();
  expect(buildRequiredApi(undefined)).toBeUndefined();
});
