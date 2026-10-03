import { expect, test } from "vite-plus/test";
import * as v from "valibot";
import hstore from "../../../apps/loom/src/tooling/extensions/manifests/hstore.json";
import pgTrgm from "../../../apps/loom/src/tooling/extensions/manifests/pg_trgm.json";
import { extensionManifestValidator, type ExtensionMember } from "../../../apps/loom/src/core/extensions/contracts";
import { createExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import {
  createExtensionSubscriptCapture,
  extensionSubscriptCaptureValidator,
  extensionSubscriptContractValidator,
  validateExtensionSubscriptCapture,
} from "../../../apps/loom/src/tooling/extensions/subscript-capture";
import {
  validateExtensionApiRequirement,
  verifyExtensionApiContracts,
} from "../../../apps/loom/src/tooling/extensions/verify";

type RoutineMember = Extract<ExtensionMember, { kind: "routine" }>;
type TypeMember = Extract<ExtensionMember, { kind: "type" }>;
const source = v.parse(extensionManifestValidator, hstore);
const unrelated = v.parse(extensionManifestValidator, pgTrgm);
const hstoreId = "type:$extension:hstore.hstore";
const arrayId = "type:$extension:hstore._hstore";
const ghstoreId = "type:$extension:hstore.ghstore";
const ghstoreArrayId = "type:$extension:hstore._ghstore";
const extensionHandler = "routine:$extension:hstore.hstore_subscript_handler(pg_catalog.internal)";
const arrayHandler = "routine:pg_catalog.array_subscript_handler(pg_catalog.internal)";
const contract = {
  extension: "hstore" as const,
  postgresMajor: 18 as const,
  version: "1.8" as const,
  provider: "neon",
  manifestDigest: source.digest,
  types: [
    { id: ghstoreArrayId, handler: arrayHandler },
    { id: arrayId, handler: arrayHandler },
    { id: ghstoreId, handler: null },
    { id: hstoreId, handler: extensionHandler },
  ],
};
const provenance = {
  capturedAt: "2026-10-03T00:00:00.000Z",
  fixture: "static-validation-fixture",
  source: "pg_catalog" as const,
  collector: "loom:subscript-capture:1" as const,
  serverVersion: "18.0",
  installationSchema: 'Subscript "One"',
};

const internal = { namespace: "pg_catalog", name: "internal" };
test("the exact four-type relationship binds a validated historical manifest without changing it", () => {
  const before = JSON.stringify(source);
  const artifact = createExtensionSubscriptCapture(source, contract, provenance);
  expect(validateExtensionSubscriptCapture(artifact, source)).toEqual(artifact);
  expect(artifact.contract.types).toEqual([
    { id: ghstoreArrayId, handler: arrayHandler },
    { id: arrayId, handler: arrayHandler },
    { id: ghstoreId, handler: null },
    { id: hstoreId, handler: extensionHandler },
  ]);
  expect(artifact.contract.manifestDigest).toBe(hstore.digest);
  expect(JSON.stringify(source)).toBe(before);
  expect(JSON.stringify(artifact)).not.toContain('"oid":');
});

test("canonical digest sorts by exact member ID and excludes observed provenance", () => {
  const artifact = createExtensionSubscriptCapture(source, contract, provenance);
  const another = createExtensionSubscriptCapture(source, contract, {
    ...provenance,
    installationSchema: "different_namespace",
    capturedAt: "2026-10-04T00:00:00.000Z",
    fixture: "another-static-fixture",
    serverVersion: "18.1",
  });
  expect(another.digest).toBe(artifact.digest);
  expect(another.provenance.installationSchema).toBe("different_namespace");
  const reordered = v.parse(extensionSubscriptContractValidator, {
    ...Object.fromEntries(Object.entries(contract).reverse()),
    types: [...contract.types].reverse(),
  });
  expect(createExtensionSubscriptCapture(source, reordered, provenance).digest).toBe(artifact.digest);
  expect(JSON.stringify(createExtensionSubscriptCapture(source, reordered, provenance).contract.types)).toBe(
    JSON.stringify(artifact.contract.types),
  );
});

test("missing, duplicate, extra, foreign and non-type registrations cannot validate", () => {
  const [ghstoreArray, array, ghstore, scalar] = contract.types;
  if (!ghstoreArray || !array || !ghstore || !scalar) throw new Error("Missing static fixture types");
  for (const types of [
    [],
    [ghstoreArray, array, ghstore],
    [array, ghstore, scalar],
    [ghstoreArray, array, ghstore, scalar, scalar],
    [ghstoreArray, array, ghstore, scalar, { id: "type:$extension:hstore.other", handler: null }],
    [ghstoreArray, array, ghstore, { id: "type:$extension:hstore.hstore ", handler: extensionHandler }],
    [ghstoreArray, array, ghstore, { id: "type:foreign.hstore", handler: extensionHandler }],
    [ghstoreArray, array, ghstore, { id: extensionHandler, handler: extensionHandler }],
    [ghstoreArray, array, ghstore, { id: 'text search dictionary:"$extension:hstore".hstore', handler: null }],
    [ghstoreArray, array, { ...ghstore, id: scalar.id }, scalar],
  ])
    expect(() => createExtensionSubscriptCapture(source, { ...contract, types }, provenance)).toThrow();
});

test("every pointer must match the reviewed relationship, never a handler name alone", () => {
  const forgeries: [string, string | null][] = [
    // Scalar callback removed, replaced by native array/other handlers or a different extension's signature.
    [hstoreId, null],
    [hstoreId, arrayHandler],
    [hstoreId, "routine:pg_catalog.jsonb_subscript_handler(pg_catalog.internal)"],
    [hstoreId, "routine:$extension:other.hstore_subscript_handler(pg_catalog.internal)"],
    [hstoreId, "routine:foreign.hstore_subscript_handler(pg_catalog.internal)"],
    [hstoreId, "routine:$extension:hstore.hstore_subscript_handler(pg_catalog.text)"],
    [hstoreId, "routine:$extension:hstore.hstore_subscript_handler(pg_catalog.internal,pg_catalog.internal)"],
    [hstoreId, "routine:$extension:hstore.hstore_in(pg_catalog.cstring)"],
    // Array types must keep the native array callback; the extension callback is not a substitute.
    [arrayId, null],
    [arrayId, extensionHandler],
    [ghstoreArrayId, null],
    [ghstoreArrayId, extensionHandler],
    // ghstore explicitly has none: any observed pointer is drift.
    [ghstoreId, extensionHandler],
    [ghstoreId, arrayHandler],
  ];
  for (const [id, handler] of forgeries)
    expect(() =>
      createExtensionSubscriptCapture(
        source,
        { ...contract, types: contract.types.map((type) => (type.id === id ? { ...type, handler } : type)) },
        provenance,
      ),
    ).toThrow("subscripting handler relationship");
});

test("the source manifest must keep the exact captured types, array links and internal handler signature", () => {
  const changeRoutine = (
    id: string,
    patch: Partial<Pick<RoutineMember, "returns" | "returnsSet" | "variadic" | "arguments">>,
  ) =>
    createExtensionManifest(
      {
        ...source.contract,
        members: source.contract.members.map((member) =>
          member.id === id && member.kind === "routine" ? { ...member, ...patch } : member,
        ),
      },
      source.provenance,
    );
  const changeType = (id: string, patch: Partial<Pick<TypeMember, "ownership" | "array" | "element">>) =>
    createExtensionManifest(
      {
        ...source.contract,
        members: source.contract.members.map((member) =>
          member.id === id && member.kind === "type" ? { ...member, ...patch } : member,
        ),
      },
      source.provenance,
    );
  const without = (id: string) =>
    createExtensionManifest(
      { ...source.contract, members: source.contract.members.filter((member) => member.id !== id) },
      source.provenance,
    );
  const sources = [
    changeRoutine(extensionHandler, { returns: { namespace: "pg_catalog", name: "text" } }),
    changeRoutine(extensionHandler, { returnsSet: true }),
    changeRoutine(extensionHandler, { variadic: { namespace: "pg_catalog", name: "internal" } }),
    changeRoutine(extensionHandler, {
      arguments: [
        { name: null, type: internal, mode: "in", hasDefault: false },
        { name: null, type: internal, mode: "in", hasDefault: false },
      ],
    }),
    changeRoutine(extensionHandler, {
      arguments: [{ name: "out", type: internal, mode: "out", hasDefault: false }],
    }),
    changeType(hstoreId, { ownership: "subordinate" }),
    changeType(hstoreId, { array: null }),
    changeType(arrayId, { element: null }),
    changeType(ghstoreArrayId, { element: { namespace: "$extension:hstore", name: "hstore" } }),
    without(extensionHandler),
    without(ghstoreId),
    createExtensionManifest({ ...source.contract, version: "1.7" }, source.provenance),
    createExtensionManifest({ ...source.contract, extension: "other" }, source.provenance),
    unrelated,
  ];
  for (const changed of sources)
    expect(() =>
      createExtensionSubscriptCapture(changed, { ...contract, manifestDigest: changed.digest }, provenance),
    ).toThrow();
});

test("strict parsing rejects artifact tampering and mismatched manifest/provider/version contracts", () => {
  const artifact = createExtensionSubscriptCapture(source, contract, provenance);
  expect(() => validateExtensionSubscriptCapture({ ...artifact, digest: "0".repeat(64) }, source)).toThrow("digest");
  const unexpectedKey = { ...artifact, unexpected: true };
  expect(() => validateExtensionSubscriptCapture(unexpectedKey, source)).toThrow();
  expect(() => v.parse(extensionSubscriptCaptureValidator, { ...artifact, format: 2 })).toThrow();
  expect(() =>
    v.parse(extensionSubscriptCaptureValidator, {
      ...artifact,
      provenance: { ...artifact.provenance, collector: "loom:text-search-capture:1" },
    }),
  ).toThrow();
  expect(() =>
    validateExtensionSubscriptCapture(
      { ...artifact, contract: { ...artifact.contract, types: artifact.contract.types.slice(1) } },
      source,
    ),
  ).toThrow();
  for (const patch of [
    { provider: "local-postgresql" },
    { version: "1.7" },
    { postgresMajor: 17 },
    { extension: "other" },
    { manifestDigest: "0".repeat(64) },
  ])
    expect(() => createExtensionSubscriptCapture(source, { ...contract, ...patch }, provenance)).toThrow();
  expect(() => createExtensionSubscriptCapture({ ...source, digest: "0".repeat(64) }, contract, provenance)).toThrow(
    "digest",
  );
  const alteredSource = createExtensionManifest(
    { ...source.contract, provider: "local-postgresql" },
    source.provenance,
  );
  expect(() => validateExtensionSubscriptCapture(artifact, alteredSource)).toThrow();
});

test("requirements without subscripting evidence keep their historical meaning byte for byte", () => {
  const historical = { schema: "extensions", manifest: source };
  const normalized = validateExtensionApiRequirement(historical);
  expect(normalized).toEqual(historical);
  expect(Object.hasOwn(normalized, "subscripting")).toBe(false);
  expect(JSON.stringify(normalized)).toBe(JSON.stringify({ schema: "extensions", manifest: source }));
  expect(validateExtensionApiRequirement({ schema: "extensions", manifest: unrelated })).toEqual({
    schema: "extensions",
    manifest: unrelated,
  });
});

test("an explicit pin carries only a validated hstore subscripting relationship", () => {
  const artifact = createExtensionSubscriptCapture(source, contract, provenance);
  const pinned = validateExtensionApiRequirement({ schema: "extensions", manifest: source, subscripting: artifact });
  expect(pinned.subscripting?.digest).toBe(artifact.digest);
  expect(JSON.stringify({ ...pinned, subscripting: undefined })).toBe(
    JSON.stringify({ schema: "extensions", manifest: source }),
  );
  expect(() =>
    validateExtensionApiRequirement({
      schema: "extensions",
      manifest: source,
      subscripting: { ...artifact, digest: "0".repeat(64) },
    }),
  ).toThrow("digest");
  expect(() =>
    validateExtensionApiRequirement({
      schema: "extensions",
      manifest: source,
      subscripting: { ...artifact, contract: { ...artifact.contract, provider: "foreign" } },
    }),
  ).toThrow("profile mismatch");
  expect(() =>
    validateExtensionApiRequirement({ schema: "extensions", manifest: unrelated, subscripting: artifact }),
  ).toThrow("subscripting");
  const unexpectedKey = { ...artifact, unexpected: true };
  expect(() =>
    validateExtensionApiRequirement({ schema: "extensions", manifest: source, subscripting: unexpectedKey }),
  ).toThrow();
});

test("corrupt subscripting pins fail before touching the caller's database", async () => {
  const client = {
    query: async () => {
      throw new Error("Database must not be queried");
    },
  };
  const artifact = createExtensionSubscriptCapture(source, contract, provenance);
  const valid = { schema: "extensions", manifest: source, subscripting: artifact };
  await expect(verifyExtensionApiContracts(client, [valid, valid])).rejects.toThrow("Duplicate");
  await expect(
    verifyExtensionApiContracts(client, [
      { schema: "extensions", manifest: unrelated },
      { ...valid, subscripting: { ...artifact, digest: "0".repeat(64) } },
    ]),
  ).rejects.toThrow("digest");
});
