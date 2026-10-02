import { expect, test } from "vite-plus/test";
import * as v from "valibot";
import { extensionContractValidator } from "../../../apps/loom/src/core/extensions/contracts";
import {
  createExtensionManifest,
  validateExtensionManifest,
  resolveExtensionContract,
} from "../../../apps/loom/src/core/extensions/registry";
import { compareExtensionCatalogue } from "../../../apps/loom/src/tooling/extensions/catalogue";
import { validateExtensionCoverage } from "../../../apps/loom/src/tooling/extensions/coverage";

const contract = {
  extension: "pg_trgm",
  postgresMajor: 18,
  version: "1.6",
  provider: "neon",
  installation: { relocatable: true, fixedSchema: null },
  requires: [],
  members: [
    {
      kind: "other" as const,
      id: "other:example",
      name: "example",
      namespace: "$extension:pg_trgm",
      ownership: "direct" as const,
      objectType: "example",
      identity: "example",
      definition: null,
    },
  ],
};
const provenance = {
  capturedAt: "2026-10-02T00:00:00.000Z",
  fixture: "disposable-neon-branch",
  source: "pg_catalog" as const,
  serverVersion: "18.0",
  installationSchema: "extensions",
  verified: true as const,
};

test("manifest digests bind symbolic SQL facts, not fixture identities or capture timestamps", () => {
  const manifest = createExtensionManifest(contract, provenance);
  expect(
    createExtensionManifest(contract, {
      ...provenance,
      fixture: "another-disposable-branch",
      capturedAt: "2026-10-03T00:00:00.000Z",
    }).digest,
  ).toBe(manifest.digest);
  expect(createExtensionManifest({ ...contract, version: "1.5" }, provenance).digest).not.toBe(manifest.digest);
  expect(validateExtensionManifest(JSON.parse(JSON.stringify(manifest)))).toEqual(manifest);
  const reordered = {
    ...Object.fromEntries(Object.entries(contract).reverse()),
    members: contract.members.map((member) => Object.fromEntries(Object.entries(member).reverse())),
  };
  expect(createExtensionManifest(v.parse(extensionContractValidator, reordered), provenance).digest).toBe(
    manifest.digest,
  );
  expect(() => validateExtensionManifest({ ...manifest, digest: "0".repeat(64) })).toThrow("digest");
  const invalid = { ...manifest, unknown: true };
  expect(() => validateExtensionManifest(invalid)).toThrow();
});

test("registry selection is exact and an unknown version remains descriptor-only", () => {
  const manifest = createExtensionManifest(contract, provenance);
  expect(
    resolveExtensionContract([manifest], { name: "pg_trgm", postgresMajor: 18, version: "1.6", provider: "neon" }),
  ).toEqual({ status: "verified", manifest });
  expect(
    resolveExtensionContract([manifest], { name: "pg_trgm", postgresMajor: 18, version: "1.5", provider: "neon" }),
  ).toMatchObject({ status: "unverified", name: "pg_trgm", version: "1.5" });
  expect(() =>
    resolveExtensionContract([manifest, manifest], {
      name: "pg_trgm",
      postgresMajor: 18,
      version: "1.6",
      provider: "neon",
    }),
  ).toThrow("Duplicate");
});

test("catalogue comparison cannot silently expand or reduce the dated baseline", () => {
  const baseline = [
    { name: "pg_trgm", version: "1.6", disposition: "eligible" as const },
    { name: "plpgsql", version: null, disposition: "builtin" as const },
  ];
  expect(compareExtensionCatalogue(baseline, baseline).unchanged).toBe(true);
  expect(compareExtensionCatalogue(baseline, [{ ...baseline[0]!, version: "1.7" }])).toEqual({
    unchanged: false,
    added: [],
    removed: ["plpgsql"],
    changed: ["pg_trgm"],
  });
  expect(() => compareExtensionCatalogue(baseline, [baseline[0]!, baseline[0]!])).toThrow("Duplicate");
});

test("coverage requires one disposition per baseline and one annotation per captured member", () => {
  const manifest = createExtensionManifest(contract, provenance);
  const baseline = [{ name: "pg_trgm", version: "1.6", disposition: "eligible" as const }];
  const entry = {
    name: "pg_trgm",
    status: "verified" as const,
    digest: manifest.digest,
    members: [
      {
        id: "other:example",
        disposition: "internal" as const,
        reason: "Extension implementation member",
        evidence: ["fixture:example"],
      },
    ],
  };
  expect(validateExtensionCoverage(baseline, [entry], [manifest])).toEqual({ complete: true, blockers: [] });
  expect(() => validateExtensionCoverage(baseline, [entry, entry], [manifest])).toThrow("Duplicate");
  expect(() => validateExtensionCoverage(baseline, [], [manifest])).toThrow("Missing");
  expect(() => validateExtensionCoverage(baseline, [{ ...entry, members: [] }], [manifest])).toThrow("Missing member");
  expect(
    validateExtensionCoverage(
      baseline,
      [{ name: "pg_trgm", status: "restricted", prerequisite: "support enablement", members: [] }],
      [],
    ),
  ).toEqual({ complete: false, blockers: ["pg_trgm: support enablement"] });
  const mismatched = [{ ...baseline[0]!, version: "1.7" }];
  expect(() => validateExtensionCoverage(mismatched, [entry], [manifest])).toThrow("version");
  expect(
    validateExtensionCoverage(
      mismatched,
      [
        {
          ...entry,
          catalogueVersionMismatch: {
            capturedVersion: "1.6",
            reason: "Provider SQL control version differs",
            evidence: ["fixture:available-versions"],
          },
        },
      ],
      [manifest],
    ).complete,
  ).toBe(false);
});
