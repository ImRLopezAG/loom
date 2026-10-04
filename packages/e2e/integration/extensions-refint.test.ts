import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { appendFileSync } from "node:fs";
import { expect } from "bun:test";
import pg from "pg";
import { integer, pgSchema, text } from "drizzle-orm/pg-core";
import { createRefint_1_0 } from "../../../apps/loom/src/core/extensions/adapters/refint";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { refintDatabaseCase, refintProofFamily } from "../fixtures/refint-proof-cases";

const schema = 'trig"ext';
const extension = createRefint_1_0({
  name: "refint",
  version: "1.0",
  schema,
  apiSupport: { status: "verified", digest: refintProofFamily.manifestDigest },
});
const app = pgSchema('app"s');
const parent = app.table("Parent's", { key: integer('Key"Id'), scope: text(), extra: text() });
const a = app.table("Child A", { key: integer("Foreign'Id"), scope: text() });
const b = app.table("Child B", { key: integer("Foreign'Id"), scope: text() });
const p = `"app""s"."Parent's"`;
const ar = `"app""s"."Child A"`;
const br = `"app""s"."Child B"`;

extensionProofTest(refintDatabaseCase, async () => {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    const role = `loom_ext_ref_${crypto.randomUUID().replaceAll("-", "")}`;
    let roleAttempted = false;
    await client.connect();
    try {
      await client.query(`create schema "trig""ext"; create extension refint with schema "trig""ext" version '1.0';
        create schema "app""s"; create table ${p} ("Key""Id" int not null, scope text not null, extra text, primary key ("Key""Id",scope));
        create table ${ar} ("Foreign'Id" int, scope text); create table ${br} ("Foreign'Id" int, scope text)`);
      await observeExtensionProofDatabase(url, refintDatabaseCase.id, "refint");
      const roleOutput = process.env.LOOM_EXTENSION_PROOF_ROLE_OUTPUT;
      if (roleOutput) {
        assert(process.env.LOOM_EXTENSION_PROOF_RUN_ID);
        appendFileSync(
          roleOutput,
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
        grant insert on ${ar} to "${role}"`);
      await extensionProofWitness({ ...refintDatabaseCase.claims[0]!, schema }, async () => {
        for (const table of [a, b])
          await client.query(
            extension.checkPrimaryKey({
              name: "ref",
              table,
              columns: [table.key, table.scope],
              references: { table: parent, columns: [parent.key, parent.scope] },
            }).create,
          );
        await client.query(
          `insert into ${p} values (1,'x',null); insert into ${ar} values (1,'x'),(null,'missing'),(99,null)`,
        );
        await assert.rejects(client.query(`insert into ${ar} values (99,'missing')`), /non-existent key/);
        await assert.rejects(client.query(`update ${ar} set "Foreign'Id"=99 where "Foreign'Id"=1`), /non-existent key/);
        expect((await client.query(`select count(*)::int n from ${ar}`)).rows).toEqual([{ n: 3 }]);
        await client.query(`begin; set local role "${role}"`);
        await assert.rejects(client.query(`insert into ${ar} values (1,'x')`), /permission denied/);
        await client.query("rollback");
        await assert.rejects(client.query(`select "trig""ext".check_primary_key()`));
      });
      await extensionProofWitness({ ...refintDatabaseCase.claims[1]!, schema }, async () => {
        for (const action of ["restrict", "cascade", "setnull"] as const) {
          await client.query(`truncate ${p}, ${ar}, ${br}; insert into ${p} values (1,'x',null);
            insert into ${ar} values (1,'x'); insert into ${br} values (1,'x')`);
          const trigger = extension.checkForeignKey({
            name: "action",
            table: parent,
            columns: [parent.key, parent.scope],
            action,
            references: [
              { table: a, columns: [a.key, a.scope] },
              { table: b, columns: [b.key, b.scope] },
            ],
          });
          await client.query(trigger.create);
          await client.query(`update ${p} set extra='unchanged key'`);
          if (action === "restrict") {
            await assert.rejects(client.query(`update ${p} set "Key""Id"=2`), /referenced/);
            await assert.rejects(client.query(`delete from ${p}`), /referenced/);
            await client.query(`grant delete on ${p} to "${role}"; begin; set local role "${role}"`);
            await assert.rejects(client.query(`delete from ${p}`), /permission denied/);
            await client.query("rollback");
          } else {
            await client.query("begin");
            await client.query(`update ${p} set "Key""Id"=2, scope='y'`);
            for (const table of [ar, br])
              expect((await client.query(`select "Foreign'Id" as key, scope from ${table}`)).rows).toEqual(
                action === "cascade" ? [{ key: 2, scope: "y" }] : [{ key: null, scope: null }],
              );
            await client.query("rollback");
            for (const table of [ar, br])
              expect((await client.query(`select "Foreign'Id" as key, scope from ${table}`)).rows).toEqual([
                { key: 1, scope: "x" },
              ]);
            await client.query(`delete from ${p}`);
            for (const table of [ar, br])
              expect((await client.query(`select "Foreign'Id" as key, scope from ${table}`)).rows).toEqual(
                action === "cascade" ? [] : [{ key: null, scope: null }],
              );
          }
          await client.query(trigger.drop);
        }
        // Restrict on nullable OLD keys skips action without deleting the child.
        await client.query(`create table nullable_parent (key int); create table nullable_child (key int);
          insert into nullable_parent values (null); insert into nullable_child values (null);
          create trigger n after delete on nullable_parent for each row execute function "trig""ext".check_foreign_key('1','restrict','key','public.nullable_child','key');
          delete from nullable_parent`);
        expect((await client.query(`select count(*)::int n from nullable_child`)).rows).toEqual([{ n: 1 }]);
        await assert.rejects(client.query(`select "trig""ext".check_foreign_key()`));
      });
      await client.query(`create table bad_event (key int); create trigger n before insert on bad_event
        for each row execute function "trig""ext".check_primary_key('key','public.nullable_parent','key')`);
      await assert.rejects(client.query("insert into bad_event values (1)"), /AFTER trigger/);
      await client.query(`drop trigger n on bad_event; create trigger n after insert on bad_event
        for each row execute function "trig""ext".check_foreign_key('1','restrict','key','public.nullable_child','key')`);
      await assert.rejects(client.query("insert into bad_event values (1)"), /INSERT events/);
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
  });
});
