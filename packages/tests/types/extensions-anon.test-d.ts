import { expectTypeOf } from "vite-plus/test";
import { pgTable, text } from "drizzle-orm/pg-core";
import { createAnon_2_5_1, anonParameter, type AnonOutput } from "../../../apps/loom/src/core/extensions/adapters/anon";
import {
  withAnon,
  type AnonMaskingRule,
  type AnonRule,
  type AnonSession,
} from "../../../apps/loom/src/tooling/extensions/operations/anon";
import source from "../../../apps/loom/src/tooling/extensions/manifests/anon.json";

// Compile-only contract; it performs no runtime operator work.
export function anonTypeContract(): void {
  const descriptor = {
    name: "anon",
    version: "2.5.1",
    schema: "extensions",
    apiSupport: { status: "verified", digest: source.digest },
  } as const;
  const binding = createAnon_2_5_1(descriptor);
  const email = binding.sql.functions.fake_email();
  const partial = binding.sql.overloads["routine:anon.partial_email(pg_catalog.text)"]("a@x.io");
  void [email, partial];
  binding.sql.overloads["routine:anon.generalize_int4range(pg_catalog.int4,pg_catalog.int4)"](42, 10);
  binding.sql.overloads["routine:anon.generalize_int4range(pg_catalog.int4,pg_catalog.int4)"](42);
  // @ts-expect-error Native int4 arguments cannot be text.
  binding.sql.overloads["routine:anon.generalize_int4range(pg_catalog.int4,pg_catalog.int4)"]("42", 10);
  binding.fields.city().default({ oid: 1, val: "Paris" });
  // @ts-expect-error A dictionary row keeps its native oid member.
  binding.fields.city().default({ val: "Paris" });
  binding.fields.lorem_ipsum().default({ oid: 1, paragraph: "text" });
  // @ts-expect-error Native lorem_ipsum has paragraph, never dictionary val.
  binding.fields.lorem_ipsum().default({ oid: 1, val: "text" });
  const number = anonParameter(binding.codecs.int4, 42);
  const contacts = pgTable("anon_contacts", { email: text() });
  const seed = anonParameter(binding.codecs.text, contacts.email);
  binding.sql.overloads["routine:anon.pseudo_email(pg_catalog.anyelement,pg_catalog.text)"](seed, "salt");
  function polymorphic(session: AnonSession) {
    // @ts-expect-error Native event trigger callbacks cannot be invoked by SELECT.
    void session.call("routine:anon.trg_mask_update()");
    // @ts-expect-error PostgreSQL invokes this callback through its existing event trigger.
    void session.routines["routine:anon.trg_mask_update()"];
    const result = session.routines["routine:anon.noise(pg_catalog.anyelement,pg_catalog.float8)"](number, 0);
    expectTypeOf(result).toEqualTypeOf<Promise<number | null>>();
    // @ts-expect-error Explicit operator calls encode values; column-bound parameters are query composition only.
    void session.routines["routine:anon.pseudo_email(pg_catalog.anyelement,pg_catalog.text)"](seed, "salt");
    const called = session.call(
      "routine:anon.ternary(pg_catalog.bool,pg_catalog.anyelement,pg_catalog.anyelement)",
      true,
      number,
      number,
    );
    expectTypeOf(called).toEqualTypeOf<Promise<number | null>>();
    const array = anonParameter(binding.codecs._city, {
      dimensions: [{ lowerBound: 0, length: 1 }],
      values: [{ oid: 1, val: "Paris" }],
    });
    const selected = session.routines["routine:anon.random_in(pg_catalog.anyarray)"](array);
    expectTypeOf(selected).toEqualTypeOf<Promise<AnonOutput<"city"> | null>>();
  }
  void polymorphic;
  // @ts-expect-error Operator dynamic masking never enters application SQL.
  void binding.sql.overloads["routine:anon.start_dynamic_masking(pg_catalog.bool)"];
  // @ts-expect-error Operator replica masking never enters application SQL.
  void binding.sql.functions.start_replica_masking;
  const value: AnonRule = { value: "NULL" };
  const fn: AnonRule = { function: "anon.partial_email(email)" };
  // @ts-expect-error A rule is a value or a function, never both.
  const both: AnonRule = { value: "NULL", function: "anon.fake_email()" };
  void [value, fn, both];
  expectTypeOf<AnonSession["rules"]>().returns.resolves.toEqualTypeOf<readonly AnonMaskingRule[]>();
  expectTypeOf<AnonSession["anonymizeTable"]>().returns.resolves.toEqualTypeOf<boolean | null>();
  expectTypeOf<AnonSession["startDynamicMasking"]>().returns.resolves.toEqualTypeOf<boolean | null>();
  expectTypeOf<AnonSession["startReplicaMasking"]>().returns.resolves.toEqualTypeOf<boolean | null>();
  expectTypeOf<AnonSession["routines"]["routine:anon.mask_role(pg_catalog.regrole)"]>().returns.resolves.toEqualTypeOf<
    boolean | null
  >();
  expectTypeOf(withAnon<number>).returns.resolves.toEqualTypeOf<{
    readonly completion: "committed";
    readonly value: number;
  }>();
}
