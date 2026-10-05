import { expect } from "bun:test";
import pg from "pg";
import { integer, pgSchema, timestamp } from "drizzle-orm/pg-core";
import { createModdatetime_1_0 } from "kello/extensions/moddatetime";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { wave10CallbackProofCase, wave10CallbackProofs } from "../fixtures/wave10-callback-proof-cases";

const extension = createModdatetime_1_0({
  name: "moddatetime",
  version: "1.0",
  schema: 'trig"ext',
  apiSupport: { status: "verified", digest: "bfaa16ea149d74d0f9e6c5a74144a0240ad18e0e02098a5f39f462c942ca68b6" },
});
const posts = pgSchema('app"s').table("Posts", {
  id: integer().notNull(),
  updated: timestamp("Updated'At", { withTimezone: true }),
});
const trigger = extension.trigger({ name: "Posts touch", table: posts, column: posts.updated });

const proof = wave10CallbackProofCase("moddatetime");
const witness = { ...proof.claims[0]!, schema: wave10CallbackProofs.moddatetime.schema };
extensionProofTest(proof, async () => {
  await withExtensionDatabase(async (url) =>
    extensionProofWitness(witness, async () => {
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      try {
        await client.query(`create schema "trig""ext"; create extension moddatetime with schema "trig""ext" version '1.0';
        create schema "app""s"; create table "app""s"."Posts" (id int4 not null, "Updated'At" timestamptz)`);
        await observeExtensionProofDatabase(url, proof.id, "moddatetime");
        await client.query(trigger.create);
        const catalog = await client.query(
          `select t.tgname, t.tgtype, encode(t.tgargs,'escape') args, n.nspname fn_schema
         from pg_trigger t join pg_proc p on p.oid=t.tgfoid join pg_namespace n on n.oid=p.pronamespace
         where t.tgrelid='"app""s"."Posts"'::regclass and not t.tgisinternal`,
        );
        // ROW(1)|BEFORE(2)|UPDATE(16) = 19.
        expect(catalog.rows).toEqual([
          { tgname: "Posts touch", tgtype: 19, args: `Updated'At\\000`, fn_schema: 'trig"ext' },
        ]);
        const old = "2000-01-01 00:00:00+00";
        await client.query(`set timezone='UTC'`);
        await client.query(`insert into "app""s"."Posts" values (1,$1),(2,null)`, [old]);
        // INSERT is not rewritten.
        expect((await client.query(`select id, "Updated'At"::text at from "app""s"."Posts" order by id`)).rows).toEqual(
          [
            { id: 1, at: old },
            { id: 2, at: null },
          ],
        );
        await client.query("begin");
        const start = (await client.query(`select now()::text n`)).rows[0].n;
        await client.query(`select pg_sleep(0.01)`);
        // Caller-supplied values are overwritten by transaction start.
        await client.query(`update "app""s"."Posts" set "Updated'At"=$1`, [old]);
        expect((await client.query(`select distinct "Updated'At"::text at from "app""s"."Posts"`)).rows).toEqual([
          { at: start },
        ]);
        await client.query("rollback");
        expect((await client.query(`select id, "Updated'At"::text at from "app""s"."Posts" order by id`)).rows).toEqual(
          [
            { id: 1, at: old },
            { id: 2, at: null },
          ],
        );
        await client.query(`create table bad (at timestamptz)`);
        await client.query(
          `create trigger b before insert on bad for each row execute function "trig""ext".moddatetime('at')`,
        );
        await expect(client.query(`insert into bad values (now())`)).rejects.toThrow();
        await client.query(`create table badtype (n int, at timestamptz)`);
        await client.query(`insert into badtype values (1, null)`);
        await client.query(
          `create trigger b before update on badtype for each row execute function "trig""ext".moddatetime('n')`,
        );
        await expect(client.query(`update badtype set n=2`)).rejects.toThrow();
        await expect(client.query(`select "trig""ext".moddatetime()`)).rejects.toThrow();
        await client.query(trigger.drop);
      } finally {
        await client.end();
      }
    }),
  );
});
