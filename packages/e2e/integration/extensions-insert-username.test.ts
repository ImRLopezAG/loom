import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { appendFileSync } from "node:fs";
import { expect } from "bun:test";
import pg from "pg";
import { integer, pgSchema, text } from "drizzle-orm/pg-core";
import { createInsertUsername_1_0 } from "../../../apps/loom/src/core/extensions/adapters/insert-username";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { insertUsernameDatabaseCase, insertUsernameProofFamily } from "../fixtures/insert-username-proof-cases";

const schema = 'trig"ext';
const extension = createInsertUsername_1_0({
  name: "insert_username",
  version: "1.0",
  schema,
  apiSupport: { status: "verified", digest: insertUsernameProofFamily.manifestDigest },
});
const posts = pgSchema('app"s').table("Posts", { id: integer(), author: text("Author'Name") });
const trigger = extension.trigger({ name: "Posts user", table: posts, column: posts.author });

extensionProofTest(insertUsernameDatabaseCase, async () => {
  await withExtensionDatabase(async (url) =>
    extensionProofWitness({ ...insertUsernameDatabaseCase.claims[0]!, schema }, async () => {
      const client = new pg.Client({ connectionString: url });
      const role = `loom_ext_user_${crypto.randomUUID().replaceAll("-", "")}`;
      let roleAttempted = false;
      await client.connect();
      try {
        await client.query(`create schema "trig""ext"; create extension insert_username with schema "trig""ext" version '1.0';
          create schema "app""s"; create table "app""s"."Posts" (id int, "Author'Name" text)`);
        await observeExtensionProofDatabase(url, insertUsernameDatabaseCase.id, "insert_username");
        await client.query(trigger.create);
        const current = (await client.query(`select current_user::text as name`)).rows[0].name;
        await client.query(`insert into "app""s"."Posts" values (1,null),(2,'forged')`);
        expect((await client.query(`select distinct "Author'Name" as name from "app""s"."Posts"`)).rows).toEqual([
          { name: current },
        ]);
        const catalog = (
          await client.query(`select t.tgtype, encode(t.tgargs,'escape') args from pg_trigger t
          where t.tgrelid='"app""s"."Posts"'::regclass and not t.tgisinternal`)
        ).rows;
        expect(catalog).toEqual([{ tgtype: 23, args: "Author'Name\\000" }]);
        const output = process.env.LOOM_EXTENSION_PROOF_ROLE_OUTPUT;
        if (output) {
          assert(process.env.LOOM_EXTENSION_PROOF_RUN_ID);
          appendFileSync(
            output,
            JSON.stringify({
              runId: process.env.LOOM_EXTENSION_PROOF_RUN_ID,
              name: role,
              sha256: createHash("sha256").update(role).digest("hex"),
            }) + "\n",
            { mode: 0o600 },
          );
        }
        roleAttempted = true;
        await client.query(`create role "${role}" nologin; grant "${role}" to current_user with set true;
          grant usage on schema "app""s", "trig""ext" to "${role}";
          grant select, insert, update on "app""s"."Posts" to "${role}"`);
        await client.query(
          `begin; set local role "${role}"; update "app""s"."Posts" set "Author'Name"='forged' where id=1`,
        );
        expect((await client.query(`select "Author'Name" as name from "app""s"."Posts" where id=1`)).rows).toEqual([
          { name: role },
        ]);
        await client.query("rollback");
        expect((await client.query(`select "Author'Name" as name from "app""s"."Posts" where id=1`)).rows).toEqual([
          { name: current },
        ]);
        await assert.rejects(client.query(`select "trig""ext".insert_username()`));
        for (const [event, level] of [
          ["after insert", "row"],
          ["before delete", "row"],
          ["before insert", "statement"],
        ] as const) {
          await client.query(`create table bad (name text); insert into bad values ('x');
            create trigger bad before update on bad for each row execute function "trig""ext".insert_username('name');
            drop trigger bad on bad;
            create trigger bad ${event} on bad for each ${level} execute function "trig""ext".insert_username('name')`);
          await assert.rejects(
            client.query(event.includes("delete") ? "delete from bad" : "insert into bad values ('x')"),
          );
          await client.query("drop table bad");
        }
        await client.query(
          `create table wrongtype (name varchar); create trigger bad before insert on wrongtype for each row execute function "trig""ext".insert_username('name')`,
        );
        await assert.rejects(client.query(`insert into wrongtype values ('x')`), /must be type TEXT/);
        await client.query(trigger.drop);
      } finally {
        try {
          await client.query("rollback");
          if (roleAttempted && (await client.query("select 1 from pg_roles where rolname=$1", [role])).rowCount)
            await client.query(
              `grant "${role}" to current_user with set true; drop owned by "${role}"; drop role "${role}"`,
            );
        } finally {
          await client.end();
        }
      }
    }),
  );
});
