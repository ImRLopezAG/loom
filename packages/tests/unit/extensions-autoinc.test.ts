import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { wave10CallbackUnitCases } from "../../e2e/fixtures/wave10-callback-unit-types-cases";
import { expect, test } from "vite-plus/test";
import { integer, pgSchema, pgTable, serial, text } from "drizzle-orm/pg-core";
import { createAutoinc_1_0 } from "kello/extensions/autoinc";
import { autoincAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/autoinc";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/autoinc.json";

const digest = "bcd5ce0898658378ee20de54d2ca173811612f5d2c41c14345ed3eb9473403ee";
const extension = createAutoinc_1_0({
  name: "autoinc",
  version: "1.0",
  schema: 'trig"ext',
  apiSupport: { status: "verified", digest },
});
const tickets = pgSchema('app"s').table("Tickets", { id: integer("Id"), alt: serial(), title: text() });

extensionProofUnitTest(
  wave10CallbackUnitCases.find((entry) => entry.id === "autoinc.unit-contracts")!,
  () => {
    expect(manifest.digest).toBe(digest);
    expect(() =>
      createAutoinc_1_0({
        name: "autoinc",
        version: "1.0",
        schema: "x",
        apiSupport: { status: "verified", digest: "0" },
      }),
    ).toThrow("autoinc 1.0 requires its exact verified contract");
    expect(() =>
      createAutoinc_1_0({ name: "autoinc", version: "1.0", schema: "x", apiSupport: { status: "unverified" } }),
    ).toThrow();
  },
);

test("autoinc trigger declaration quotes the relocated function, table, columns and sequences", () => {
  const trigger = extension.trigger({
    name: 'tickets"id',
    table: tickets,
    events: ["insert", "update"],
    columns: [
      { column: tickets.id, sequence: { schema: 'app"s', name: "Ticket'seq" } },
      { column: tickets.alt, sequence: { name: "alt_seq" } },
    ],
  });
  expect(trigger).toMatchObject({
    kind: "trigger",
    extension: { name: "autoinc", version: "1.0", digest },
    member: "routine:$extension:autoinc.autoinc()",
    timing: "before",
    level: "row",
    events: ["insert", "update"],
    table: { schema: 'app"s', name: "Tickets" },
    function: { schema: 'trig"ext', name: "autoinc" },
    arguments: ["Id", `"app""s"."Ticket'seq"`, "alt", '"alt_seq"'],
  });
  expect(trigger.create).toBe(
    `CREATE TRIGGER "tickets""id" BEFORE INSERT OR UPDATE ON "app""s"."Tickets" FOR EACH ROW EXECUTE FUNCTION "trig""ext"."autoinc"('Id', '"app""s"."Ticket''seq"', 'alt', '"alt_seq"')`,
  );
  expect(trigger.drop).toBe(`DROP TRIGGER "tickets""id" ON "app""s"."Tickets"`);
  expect(Object.isFrozen(trigger) && Object.isFrozen(trigger.arguments)).toBe(true);
  const plain = pgTable("plain", { id: integer() });
  const unqualified = extension.trigger({
    name: "t",
    table: plain,
    columns: [{ column: plain.id, sequence: { name: "s" } }],
  });
  expect(unqualified.create).toContain(`BEFORE INSERT ON "public"."plain"`);
});

test("autoinc rejects incompatible targets the C trigger would reject or misapply", () => {
  const other = pgTable("other", { id: integer() });
  const base = { name: "t", table: tickets } as const;
  // @ts-expect-error text is not int4
  expect(() => extension.trigger({ ...base, columns: [{ column: tickets.title, sequence: { name: "s" } }] })).toThrow(
    "autoinc target column must be int4",
  );
  expect(() => extension.trigger({ ...base, columns: [{ column: other.id, sequence: { name: "s" } }] })).toThrow(
    "autoinc target column must belong to the trigger table",
  );
  // @ts-expect-error Native validation must reject an empty column list.
  expect(() => extension.trigger({ ...base, columns: [] })).toThrow("autoinc requires at least one column");
  expect(() =>
    extension.trigger({
      ...base,
      columns: [
        { column: tickets.id, sequence: { name: "a" } },
        { column: tickets.id, sequence: { name: "b" } },
      ],
    }),
  ).toThrow("autoinc target columns must be distinct");
  expect(() =>
    // @ts-expect-error Native validation must reject an empty event list.
    extension.trigger({ ...base, events: [], columns: [{ column: tickets.id, sequence: { name: "s" } }] }),
  ).toThrow("autoinc trigger requires insert and/or update events");
  expect(() =>
    extension.trigger({ ...base, name: "x".repeat(64), columns: [{ column: tickets.id, sequence: { name: "s" } }] }),
  ).toThrow("Invalid PostgreSQL identifier");
  expect(() => extension.trigger({ ...base, columns: [{ column: tickets.id, sequence: { name: "a\0" } }] })).toThrow(
    "Invalid PostgreSQL identifier",
  );
});

test("autoinc exposes no callable scalar RPC helper and accounts for its single member", () => {
  expect(extension.sql.functions).toEqual({});
  expect(extension.function).toEqual({ member: "routine:$extension:autoinc.autoinc()", authority: "schema" });
  expect(Object.hasOwn(extension, "autoinc")).toBe(false);
  expect(autoincAnnotations.map((member) => member.id)).toEqual(manifest.contract.members.map((member) => member.id));
  expect(autoincAnnotations.every((member) => member.disposition === "schema")).toBe(true);
  expect(autoincAnnotations[0]?.semantics.providerAcceptance).toBe("pending");
});
