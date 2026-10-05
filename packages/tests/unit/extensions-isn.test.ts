import { expect } from "vite-plus/test";
import assert from "node:assert/strict";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createIsn_1_3 } from "../../../apps/loom/src/core/extensions/adapters/isn";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/isn.json";
import { isnAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/isn";
import { withIsnSession } from "../../../apps/loom/src/tooling/extensions/operations/isn";
import { extensionProofUnitTest as extensionProofTest } from "../../e2e/fixtures/extension-proof-unit";
import { isnMemberProofs, isnUnitProofCases } from "../../e2e/fixtures/isn-proof-cases";
import { registerIsnSemanticProof } from "../../e2e/fixtures/isn-semantic-proof";
import { isnNativeCases, isnCastCases, isnDescriptor as descriptor } from "../../e2e/fixtures/isn-api";

extensionProofTest(isnUnitProofCases[0]!, () => {
  const api = createIsn_1_3(descriptor);
  const isbn = api.isbn.value("0-12-345678-9!");
  expect(api.isbn.codec.decode("0-12-345678-9!")).toEqual(isbn);
  expect(api.isbn.codec.encode(api.isbn.value("978012345678?"))).toBe("978012345678?");
  expect(api.isbn.codec.decode("979-123456789-6")).toEqual(api.isbn.value("979-123456789-6"));
  // Native ISN input validates and corrects checksums; the output codec preserves native text.
  expect(api.isbn.codec.decode("0-12-345678-0")).toEqual(api.isbn.value("0-12-345678-0"));
  expect(() => api.isbn.codec.decode("978012345678?")).toThrow();
  // @ts-expect-error Also exercise the runtime discriminant guard for an incompatible typed value.
  expect(() => api.isbn.codec.encode(api.ismn.value("M-1234-5678-5"))).toThrow();
  const array = { dimensions: [{ lowerBound: -2, length: 2 }], values: [isbn, null] };
  expect(api.isbn.arrayCodec.decode(api.isbn.arrayCodec.encode(array))).toEqual(array);
  expect(api.isbn.arrayCodec.decode("{}")).toEqual({ dimensions: [], values: [] });
  for (const [kind, text] of [
    ["ean13", "978-0-12-345678-6"],
    ["isbn", "1-234-56789-X"],
    ["isbn13", "979-123456789-6"],
    ["ismn", "M-1234-5678-5"],
    ["ismn13", "979-0-1234-5678-5"],
    ["issn", "1234-5679"],
    ["issn13", "977-1234-567-89-8"],
    ["upc", "12345678901-2"],
  ] as const)
    expect(api[kind].codec.decode(text)).toEqual(api[kind].value(text));
  const rankSix = {
    dimensions: Array.from({ length: 6 }, () => ({ lowerBound: 1, length: 1 })),
    values: [[[[[[isbn]]]]]],
  };
  expect(api.isbn.arrayCodec.decode(api.isbn.arrayCodec.encode(rankSix))).toEqual(rankSix);
  expect(() =>
    api.isbn.arrayCodec.encode({
      dimensions: Array.from({ length: 7 }, () => ({ lowerBound: 1, length: 1 })),
      values: [[[[[[[isbn]]]]]]],
    }),
  ).toThrow();
  expect(() =>
    api.isbn.arrayCodec.encode({ dimensions: [{ lowerBound: 1, length: 1 }], values: [isbn, null] }),
  ).toThrow();
});

extensionProofTest(isnUnitProofCases[1]!, () => {
  const api = createIsn_1_3(descriptor);
  expect(manifest.digest).toBe(descriptor.apiSupport.digest);
  const ordinary = manifest.contract.members.filter(
    (m) =>
      m.kind === "operator" ||
      (m.kind === "routine" &&
        m.name !== "isn_weak" &&
        m.returns?.name !== "cstring" &&
        !m.arguments?.some((a) => a.type.name === "cstring")),
  );
  expect(Object.keys(api.sql.overloads).sort()).toEqual(ordinary.map((m) => m.id).sort());
  expect(Object.keys(api.sql.casts).sort()).toEqual(
    manifest.contract.members
      .filter((m) => m.kind === "cast")
      .map((m) => m.id)
      .sort(),
  );
  expect(ordinary).toHaveLength(395);
  expect(Object.keys(api.sql.casts)).toHaveLength(20);
  expect(isnMemberProofs.map((row) => row.id).sort()).toEqual(manifest.contract.members.map((row) => row.id).sort());
  expect(isnAnnotations).toHaveLength(671);
  expect(isnAnnotations.map((row) => [row.id, row.disposition]).sort((a, b) => a[0]!.localeCompare(b[0]!))).toEqual(
    isnMemberProofs.map((row) => [row.id, row.disposition]).sort((a, b) => a[0]!.localeCompare(b[0]!)),
  );
  expect(
    isnAnnotations.every(
      (row) => row.semantics.providerAcceptance === "pending" && row.semantics.publicExportAcceptance === "pending",
    ),
  ).toBe(true);
  expect(isnMemberProofs.filter((row) => row.disposition === "internal")).toHaveLength(222);
  expect(isnMemberProofs.every((row) => row.cases.length === 1 || row.transfers.length === 1)).toBe(true);
  const candidate = registerIsnSemanticProof({
    baseline: [],
    declarations: [{ extension: "isn", state: "pending", prerequisite: "Awaiting canonical parent gates" }],
    manifests: [],
    cases: [],
    receipts: [],
    currentSources: [],
    artifact: null,
  });
  expect(candidate.receipts).toEqual([]);
  const declaration = candidate.declarations[0]!;
  assert.equal(declaration.state, "candidate");
  if (declaration.state === "candidate") {
    expect(declaration.members).toHaveLength(671);
    expect(declaration.members.filter((member) => member.transfers.length === 1)).toHaveLength(222);
    expect(Object.values(declaration.gates).every((gate) => gate.proofs.length === 0)).toBe(true);
  }
  for (const entry of [...isnNativeCases(api), ...isnCastCases(api)]) {
    expect(extensionExpressionContract(entry.expression)?.member).toBe(entry.member);
    expect(extensionExpressionContract(entry.nullExpression)?.member).toBe(entry.member);
    expect(extensionSqlDialect(nodePgCodecs).sqlToQuery(entry.expression).sql).toContain('"Isn""日本"');
    expect(
      extensionSqlDialect(nodePgCodecs)
        .sqlToQuery(entry.nullExpression)
        .params.every((value) => value === null),
    ).toBe(true);
  }
  const expression = api.sql.functions.isneq.isbn_isbn13(
    api.isbn.value("0-12-345678-9"),
    api.isbn13.value("9780123456786"),
  );
  expect(extensionExpressionContract(expression)?.member).toBe(
    "routine:$extension:isn.isneq($extension:isn.isbn,$extension:isn.isbn13)",
  );
  const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(expression);
  expect(query.sql).toContain('"Isn""日本"."isneq"');
  expect(query.params).toEqual(["0-12-345678-9", "9780123456786"]);
  const cast = api.sql.casts["cast:$extension:isn.isbn->$extension:isn.ean13"](api.isbn.value("0-12-345678-9"));
  expect(extensionSqlDialect(nodePgCodecs).sqlToQuery(cast).sql).toContain('"Isn""日本"."ean13"');
  expect(extensionExpressionContract(cast)?.member).toBe("cast:$extension:isn.isbn->$extension:isn.ean13");
  const composed = api.isbn.equal(sql`NULL`, api.isbn.value("0-12-345678-9"));
  expect(extensionExpressionContract(composed)?.observability).toBe("tables");
  expect(Object.hasOwn(api.sql.functions, "isn_weak")).toBe(false);
});

extensionProofTest(isnUnitProofCases[2]!, () => {
  const api = createIsn_1_3(descriptor);
  for (const kind of ["ean13", "isbn", "isbn13", "ismn", "ismn13", "issn", "issn13", "upc"] as const) {
    const type = api[kind];
    expect(type.field().metadata.extension).toMatchObject({
      type: kind,
      schema: descriptor.schema,
      member: `type:$extension:isn.${kind}`,
    });
    expect(type.arrayField().metadata.extension).toMatchObject({
      type: kind,
      array: true,
      member: `type:$extension:isn._${kind}`,
    });
    for (const method of ["btree", "hash"] as const)
      expect(type.indexes[method]()).toMatchObject({
        method,
        opclass: `${kind}_ops`,
        type: kind,
        member: `opclass:$extension:isn.${kind}_ops/${method}`,
      });
  }
  expect(() => createIsn_1_3({ ...descriptor, apiSupport: { status: "verified", digest: "wrong" } })).toThrow();
});

extensionProofTest(isnUnitProofCases[3]!, async () => {
  await assert.rejects(
    withIsnSession(
      "postgres://localhost/unused",
      { ...descriptor, apiSupport: { status: "unverified" } },
      async () => null,
    ),
    /exact verified contract/,
  );
  await assert.rejects(
    withIsnSession("postgres://ep-unused-pooler.neon.tech/unused", descriptor, async () => null),
    /direct credentials/,
  );
});
