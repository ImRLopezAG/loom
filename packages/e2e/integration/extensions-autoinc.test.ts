import { expect } from "bun:test";
import pg from "pg";
import { integer, pgSchema, text } from "drizzle-orm/pg-core";
import { createAutoinc_1_0 } from "kello/extensions/autoinc";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { wave10CallbackProofCase, wave10CallbackProofs } from "../fixtures/wave10-callback-proof-cases";

const extension = createAutoinc_1_0({
  name: "autoinc",
  version: "1.0",
  schema: 'trig"ext',
  apiSupport: { status: "verified", digest: "bcd5ce0898658378ee20de54d2ca173811612f5d2c41c14345ed3eb9473403ee" },
});
const tickets = pgSchema('app"s').table("Tickets", { id: integer("Id").notNull(), title: text() });
const trigger = extension.trigger({
  name: 'tickets"id',
  table: tickets,
  events: ["insert", "update"],
  columns: [{ column: tickets.id, sequence: { schema: 'app"s', name: "Ticket'seq" } }],
});

const proof = wave10CallbackProofCase("autoinc");
const witness = { ...proof.claims[0]!, schema: wave10CallbackProofs.autoinc.schema };
extensionProofTest(proof, async () => {
  await withExtensionDatabase(async (url) =>
    extensionProofWitness(witness, async () => {
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      try {
        await client.query(`create schema "trig""ext"; create extension autoinc with schema "trig""ext" version '1.0';
        create schema "app""s"; create sequence "app""s"."Ticket'seq";
        create table "app""s"."Tickets" ("Id" int4 not null, title text)`);
        await observeExtensionProofDatabase(url, proof.id, "autoinc");
        await client.query(trigger.create);
        // Independent catalog oracle for schema/migration contract metadata.
        const catalog = await client.query(
          `select t.tgname, t.tgtype, t.tgnargs, encode(t.tgargs,'escape') args, n.nspname fn_schema, p.proname
         from pg_trigger t join pg_proc p on p.oid=t.tgfoid join pg_namespace n on n.oid=p.pronamespace
         where t.tgrelid='"app""s"."Tickets"'::regclass and not t.tgisinternal`,
        );
        // tgtype bits: ROW(1)|BEFORE(2)|INSERT(4)|UPDATE(16) = 23.
        expect(catalog.rows).toEqual([
          {
            tgname: 'tickets"id',
            tgtype: 23,
            tgnargs: 2,
            args: `Id\\000"app""s"."Ticket'seq"\\000`,
            fn_schema: 'trig"ext',
            proname: "autoinc",
          },
        ]);
        await client.query(`insert into "app""s"."Tickets" values (null,'a'),(0,'b'),(42,'c')`);
        await client.query(`update "app""s"."Tickets" set "Id"=0 where title='c'`);
        await client.query("begin");
        await client.query(`insert into "app""s"."Tickets" values (null,'rolled')`);
        await client.query("rollback");
        const rows = await client.query(`select "Id" id, title from "app""s"."Tickets" order by title`);
        expect(rows.rows).toEqual([
          { id: 1, title: "a" },
          { id: 2, title: "b" },
          { id: 3, title: "c" },
        ]);
        // Sequences are non-transactional: the rolled-back insert consumed 4.
        expect((await client.query(`select last_value::int v from "app""s"."Ticket'seq"`)).rows).toEqual([{ v: 4 }]);
        await client.query(trigger.drop);
        await expect(client.query(`insert into "app""s"."Tickets" values (null,'x')`)).rejects.toThrow();
        await client.query(`create table wrong (v text); create sequence ws`);
        await client.query(
          `create trigger w before insert on wrong for each row execute function "trig""ext".autoinc('v','ws')`,
        );
        await expect(client.query(`insert into wrong values (null)`)).rejects.toThrow();
        await expect(client.query(`select "trig""ext".autoinc()`)).rejects.toThrow();
      } finally {
        await client.end();
      }
    }),
  );
});
