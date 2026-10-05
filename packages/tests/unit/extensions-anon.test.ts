import { expect, test } from "vite-plus/test";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import * as v from "valibot";
import {
  ANON_DIGEST,
  ANON_FOREIGN_KEY_TRIGGER_IDS,
  createAnon_2_5_1,
  anonRoutineSpecs,
  anonArgument,
  anonResultCodec,
  anonParameter,
} from "../../../apps/loom/src/core/extensions/adapters/anon";
import { anonCodecs } from "../../../apps/loom/src/core/extensions/adapters/anon-codecs";
import { anonDefaultArgumentNames } from "../../../apps/loom/src/core/extensions/adapters/anon-specs";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { anonAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/anon";
import {
  anonColumnValidator,
  anonRuleValidator,
  withAnon,
} from "../../../apps/loom/src/tooling/extensions/operations/anon";
import source from "../../../apps/loom/src/tooling/extensions/manifests/anon.json";

const descriptor = {
  name: "anon",
  version: "2.5.1",
  schema: "extensions",
  apiSupport: { status: "verified", digest: source.digest },
} as const;
const members = source.contract.members.map((member) => member.id).sort();

test("anon binds only the exact 2.5.1 contract", () => {
  expect(source.contract.version).toBe("2.5.1");
  expect(source.digest).toBe(ANON_DIGEST);
  expect(ANON_DIGEST).toBe("93a826ea74c64096e00ad172603b6b4d5ada6a842d50caa3cb4cc76374029878");
  const binding = createAnon_2_5_1(descriptor);
  expect(Object.keys(binding.sql.operators)).toEqual([]);
  expect(Object.keys(binding.sql.overloads).length).toBeGreaterThan(0);
  expect(() => createAnon_2_5_1({ ...descriptor, apiSupport: { status: "unverified" } })).toThrow(
    /exact verified contract/,
  );
  expect(() => createAnon_2_5_1({ ...descriptor, apiSupport: { status: "verified", digest: "0".repeat(64) } })).toThrow(
    /exact verified contract/,
  );
  // @ts-expect-error Only the pinned version is accepted.
  expect(() => createAnon_2_5_1({ ...descriptor, version: "2.4.1" })).toThrow(/exact verified contract/);
});

test("every one of the 561 captured members has exactly one disposition", () => {
  expect(members).toHaveLength(561);
  expect(anonAnnotations.map((annotation) => annotation.id).sort()).toEqual(members);
  const foreignKeys = source.contract.members.filter((member) => member.id.includes("$fk-trigger:"));
  expect(foreignKeys.map((member) => member.id).sort()).toEqual([...ANON_FOREIGN_KEY_TRIGGER_IDS].sort());
  expect(members.some((id) => id.includes("RI_ConstraintTrigger_"))).toBe(false);
  for (const id of ANON_FOREIGN_KEY_TRIGGER_IDS) {
    const annotation = anonAnnotations.find((entry) => entry.id === id);
    expect(annotation, id).toMatchObject({
      disposition: "internal",
      reason: expect.stringContaining("identifier_fk_identifiers_category_fkey"),
    });
    expect(annotation?.reason).toMatch(/RI_FKey_(check_upd|noaction_upd|check_ins|noaction_del)/);
  }
  const counts: Record<string, number> = {};
  for (const annotation of anonAnnotations) counts[annotation.disposition] = (counts[annotation.disposition] ?? 0) + 1;
  expect((counts.query ?? 0) + (counts.tooling ?? 0) + (counts.schema ?? 0) + (counts.internal ?? 0)).toBe(561);
  expect(counts.query).toBeGreaterThan(0);
  expect(counts.tooling).toBeGreaterThan(0);
  for (const annotation of anonAnnotations)
    if (annotation.id.startsWith("routine:") && annotation.id !== "routine:anon.trg_mask_update()")
      expect(annotation.disposition).not.toBe("internal");
});

test("every captured public routine has an advertised query or operator surface", () => {
  const routines = source.contract.members.filter((member) => member.kind === "routine");
  expect(routines).toHaveLength(294);
  expect(routines.every((member) => member.publicExecute)).toBe(true);
  const neonProjection = "routine:anon.projection_to_oid(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4)";
  expect(routines.map((member) => member.id)).toContain(neonProjection);
  expect(routines.map((member) => member.id)).not.toContain(
    "routine:anon.projection_to_oid(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int8)",
  );
  for (const member of routines) {
    const annotation = anonAnnotations.find((entry) => entry.id === member.id);
    if (member.id === "routine:anon.trg_mask_update()") {
      expect(annotation).toMatchObject({
        disposition: "internal",
        semantics: { advertised: false, surface: "event trigger:anon_trg_mask_update" },
      });
      continue;
    }
    expect(annotation, member.id).toMatchObject({
      semantics: { advertised: true, surface: expect.stringMatching(/^(sql\.overloads|withAnon\.routines)\[/) },
    });
  }
});

test("query masking functions compose as application SQL; operator members stay out of RPC bindings", () => {
  const binding = createAnon_2_5_1(descriptor);
  const overloads = Object.keys(binding.sql.overloads).sort();
  expect(overloads).toContain("routine:anon.partial_email(pg_catalog.text)");
  expect(overloads).toContain("routine:anon.dummy_first_name()");
  expect(overloads).toContain("routine:anon.fake_email()");
  expect(overloads).toContain("routine:anon.pseudo_email(pg_catalog.anyelement,pg_catalog.text)");
  expect(overloads).toContain("routine:anon.random_int_between(pg_catalog.int4,pg_catalog.int4)");
  expect(overloads).toContain("routine:anon.projection_to_oid(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4)");
  expect(overloads).toContain("routine:anon.version()");
  expect(overloads.some((id) => id.includes("start_dynamic_masking"))).toBe(false);
  expect(overloads.some((id) => id.includes("start_replica_masking"))).toBe(false);
  expect(overloads.some((id) => id.includes("anonymize_table"))).toBe(false);
  expect(overloads.some((id) => id.includes("mask_role"))).toBe(false);
  expect(binding.sql.functions.partial_email).toBeTypeOf("function");
  expect("start_dynamic_masking" in binding.sql.functions).toBe(false);
});

test("typed query functions qualify placements and bind values", () => {
  const api = createAnon_2_5_1({ ...descriptor, schema: 'anon"native' });
  const expression = api.sql.functions.partial_email("daamien@gmail.com");
  const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(expression);
  expect(query.sql).toContain('"anon"."partial_email"');
  expect(query.params).toEqual(["daamien@gmail.com"]);
  expect(extensionExpressionContract(expression)).toMatchObject({
    member: "routine:anon.partial_email(pg_catalog.text)",
    observability: "external",
  });
  expect(Object.keys(anonRoutineSpecs)).toHaveLength(294);
  expect(Object.keys(api.sql.overloads)).toHaveLength(
    Object.values(anonRoutineSpecs).filter((spec) => spec.query).length,
  );
});

test("native result domains preserve nullable text, exact hashes, and view composites", () => {
  const codecs = anonCodecs("anon");
  expect(codecs.text.decode(null)).toBeNull();
  expect(codecs.int4.decode("42")).toBe(42);
  expect(codecs.pg_masking_rules.decode(null)).toBeNull();
  expect(() => codecs.oid.decode("4294967296")).toThrow();
});

test("explicit optional arguments retain the selected native codec", () => {
  const api = createAnon_2_5_1(descriptor);
  const expression = api.sql.overloads["routine:anon.generalize_int4range(pg_catalog.int4,pg_catalog.int4)"](42, 10);
  const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(expression);
  expect(query.params).toEqual([42, 10]);
  expect(query.sql).toContain('"pg_catalog"."int4"');
  expect(anonArgument(api.codecs, "?text", "policy").codec.sqlType?.name).toBe("text");
});

test("omitted optional positions use the captured native defaults", () => {
  for (const [member, names] of Object.entries(anonDefaultArgumentNames)) {
    const captured = source.contract.members.find((entry) => entry.id === member);
    expect(captured?.kind).toBe("routine");
    if (captured?.kind === "routine")
      expect(names).toEqual(
        captured.arguments
          ?.filter((argument) => ["in", "inout", "variadic"].includes(argument.mode))
          .map((argument) => argument.name),
      );
  }
  const api = createAnon_2_5_1(descriptor);
  const words = api.sql.overloads["routine:anon.lorem_ipsum(pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)"](
    undefined,
    2,
  );
  const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(words);
  expect(query.sql).toContain('"words" =>');
  expect(query.params).toEqual([2]);
  const generalized = api.sql.overloads["routine:anon.generalize_int4range(pg_catalog.int4,pg_catalog.int4)"](
    42,
    undefined,
  );
  expect(extensionSqlDialect(nodePgCodecs).sqlToQuery(generalized).params).toEqual([42]);
});

test("all captured composite and array codecs carry their own native identities", () => {
  const codecs = anonCodecs('anon"native');
  for (const member of source.contract.members.filter((entry) => entry.kind === "type")) {
    // SAFETY: the loop asserts every pinned manifest type has a corresponding codec rather than accepting a missing key.
    const codec = codecs[member.name as keyof typeof codecs];
    expect(codec, member.id).toBeDefined();
    const identity = { schema: 'anon"native', name: member.name.replace(/^_/, "") };
    expect(codec.sqlType, member.id).toEqual(member.name.startsWith("_") ? { ...identity, array: true } : identity);
  }
  expect(codecs.lorem_ipsum.decode('(7,"paragraph")')).toEqual({ oid: 7, paragraph: "paragraph" });
  expect(codecs.identifier.decode("(en,email,contact)")).toEqual({
    lang: "en",
    attname: "email",
    fk_identifiers_category: "contact",
  });
  expect(codecs._city.decode('[0:1]={"(1,Paris)",NULL}')).toEqual({
    dimensions: [{ lowerBound: 0, length: 2 }],
    values: [{ oid: 1, val: "Paris" }, null],
  });
});

test("polymorphic operator results use the concrete native parameter codec", () => {
  const codecs = anonCodecs("anon");
  const parameter = anonParameter(codecs.int4, 42);
  const resolved = anonResultCodec(
    codecs,
    anonRoutineSpecs["routine:anon.noise(pg_catalog.anyelement,pg_catalog.float8)"],
    [parameter, 0],
  );
  expect(resolved.codec.decode("42")).toBe(42);
  expect(resolved.arrayElement).toBe(false);
});

test("every composite and array is available as a qualified schema field", () => {
  const api = createAnon_2_5_1({ ...descriptor, schema: 'anon"native' });
  for (const member of source.contract.members.filter((entry) => entry.kind === "type")) {
    // SAFETY: all captured native types are field keys; a missing factory causes this exhaustive test to fail.
    const field = api.fields[member.name as keyof typeof api.fields]();
    expect(field.metadata.extension, member.id).toMatchObject({
      member: member.id,
      schema: 'anon"native',
      digest: ANON_DIGEST,
      type: member.name.replace(/^_/, ""),
      array: member.name.startsWith("_"),
      search: { filter: false, comparison: false, order: false, text: false },
      storage: { schema: "anon", type: member.name.replace(/^_/, ""), dimensions: member.name.startsWith("_") ? 1 : 0 },
    });
  }
});

test("withAnon validates descriptor and inputs before any connection", async () => {
  await expect(
    withAnon("postgres://127.0.0.1:1/none", { ...descriptor, apiSupport: { status: "unverified" } }, async () => 1),
  ).rejects.toThrow(/exact verified contract/);
  expect(() => v.parse(anonRuleValidator, { value: "NULL", function: "anon.fake_email()" })).toThrow();
  expect(() => v.parse(anonColumnValidator, { schema: "public", table: "t", column: "a\0" })).toThrow();
  expect(v.parse(anonRuleValidator, { function: "anon.partial_email(email)" })).toEqual({
    function: "anon.partial_email(email)",
  });
});
