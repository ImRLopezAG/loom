import { defineSchema, bindSchemaNamespace } from "kello/server";
import { createAutoinc_1_0 } from "kello/extensions/autoinc";
import { createModdatetime_1_0 } from "kello/extensions/moddatetime";
const auto = createAutoinc_1_0({
  name: "autoinc",
  version: "1.0",
  schema: "callbacks",
  apiSupport: { status: "verified", digest: "bcd5ce0898658378ee20de54d2ca173811612f5d2c41c14345ed3eb9473403ee" },
});
const touch = createModdatetime_1_0({
  name: "moddatetime",
  version: "1.0",
  schema: "callbacks",
  apiSupport: { status: "verified", digest: "bfaa16ea149d74d0f9e6c5a74144a0240ad18e0e02098a5f39f462c942ca68b6" },
});
const schema = defineSchema((f) => ({ tickets: { number: f.integer(), updated: f.timestamp(), label: f.text() } }), {
  namespace: "app",
  triggers: (tables) => [
    auto.trigger({
      name: "assign",
      table: tables.tickets,
      columns: [{ column: tables.tickets.number, sequence: { schema: "sequences", name: "ticket_seq" } }],
    }),
    touch.trigger({ name: "touch", table: tables.tickets, column: tables.tickets.updated }),
  ],
});
schema.tables.tickets.number.getSQLType() satisfies string;
bindSchemaNamespace(schema, "component_app");
defineSchema((f) => ({ tickets: { label: f.text() } }), {
  triggers: (tables) => [
    auto.trigger({
      name: "bad",
      table: tables.tickets,
      // @ts-expect-error A text column cannot be an autoinc target.
      columns: [{ column: tables.tickets.label, sequence: { name: "seq" } }],
    }),
  ],
});
defineSchema((f) => ({ tickets: { number: f.integer() } }), {
  triggers: (tables) => [
    auto.trigger({
      name: "missing",
      // @ts-expect-error Trigger callbacks see only tables declared by this schema.
      table: tables.other,
      columns: [{ column: tables.tickets.number, sequence: { name: "seq" } }],
    }),
  ],
});
