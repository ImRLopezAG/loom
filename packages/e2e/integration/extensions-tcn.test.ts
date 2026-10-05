import assert from "node:assert/strict";
import { expect } from "bun:test";
import pg from "pg";
import { integer, pgSchema, primaryKey, text } from "drizzle-orm/pg-core";
import { createTcn_1_0 } from "../../../apps/loom/src/core/extensions/adapters/tcn";
import { withTcnNotifications } from "../../../apps/loom/src/tooling/extensions/tcn";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { tcnDatabaseCase, tcnProofFamily } from "../fixtures/tcn-proof-cases";

const schema = 'trig"ext';
const channel = 'Change"feed';
const extension = createTcn_1_0({
  name: "tcn",
  version: "1.0",
  schema,
  apiSupport: { status: "verified", digest: tcnProofFamily.manifestDigest },
});
const posts = pgSchema('app"s').table('Po"sts', { id: integer().notNull(), key: text('Ke"y').notNull() }, (table) => [
  primaryKey({ columns: [table.id, table.key] }),
]);
const table = `"app""s"."Po""sts"`;
const trigger = extension.trigger({ name: "notify", table: posts, channel });

extensionProofTest(tcnDatabaseCase, async () => {
  await withExtensionDatabase(async (url) =>
    extensionProofWitness({ ...tcnDatabaseCase.claims[0]!, schema }, async () => {
      const writer = new pg.Client({ connectionString: url });
      await writer.connect();
      try {
        await writer.query(`create schema "trig""ext"; create extension tcn with schema "trig""ext" version '1.0';
          create schema "app""s"; create table ${table} (id int not null, "Ke""y" text not null, primary key (id,"Ke""y"))`);
        await observeExtensionProofDatabase(url, tcnDatabaseCase.id, "tcn");
        await writer.query(trigger.create);
        expect(
          (
            await writer.query(
              `select tgtype from pg_trigger where tgrelid='"app""s"."Po""sts"'::regclass and not tgisinternal`,
            )
          ).rows,
        ).toEqual([{ tgtype: 29 }]);
        const key = "O'Reilly,λ\\key";
        const result = await withTcnNotifications(
          url,
          { channel, signal: AbortSignal.timeout(10000) },
          async (session) => {
            expect(session.automaticLive).toBe(false);
            let delivered = false;
            const inserted = session.next().then((notification) => {
              delivered = true;
              return notification;
            });
            await writer.query("begin");
            await writer.query(`insert into ${table} values (1,$1)`, [key]);
            // The listener is already registered; no event may be observed before the writer commits.
            await new Promise((resolve) => setTimeout(resolve, 25));
            expect(delivered).toBe(false);
            await writer.query("commit");
            const first = await inserted;
            expect(first).toMatchObject({
              table: 'Po"sts',
              operation: "insert",
              keys: [
                { column: "id", value: "1" },
                { column: 'Ke"y', value: key },
              ],
            });
            await writer.query(`update ${table} set id=2, "Ke""y"='new'`);
            const updated = await session.next();
            expect(updated).toMatchObject({ operation: "update", keys: first.keys });
            await writer.query("begin");
            await writer.query(`insert into ${table} values (99,'rollback')`);
            await writer.query("rollback");
            await writer.query(`delete from ${table}`);
            const deleted = await session.next();
            // Seeing DELETE next proves that the intervening rolled-back INSERT did not deliver.
            expect(deleted).toMatchObject({
              operation: "delete",
              keys: [
                { column: "id", value: "2" },
                { column: 'Ke"y', value: "new" },
              ],
            });
            return [first.operation, updated.operation, deleted.operation];
          },
        );
        expect(result).toEqual({ completion: "closed", value: ["insert", "update", "delete"] });
        const controller = new AbortController();
        await assert.rejects(
          withTcnNotifications(url, { channel, signal: controller.signal }, async (session) => {
            const pending = session.next();
            controller.abort(new Error("cancel idle native listener"));
            return await pending;
          }),
          /TCN notification session failed/,
        );
        const active = await writer.query(`select count(*)::int n from pg_stat_activity
          where datname=current_database() and application_name='loom-migrations'`);
        expect(active.rows).toEqual([{ n: 0 }]);
        // Default channel is tcn and the native callback requires an actual primary key.
        await writer.query(
          `create table defaults (id int primary key); create trigger n after insert on defaults for each row execute function "trig""ext".triggered_change_notification()`,
        );
        const defaults = await withTcnNotifications(url, { signal: AbortSignal.timeout(10000) }, async (session) => {
          await writer.query("insert into defaults values (1)");
          return await session.next();
        });
        expect(defaults.value.channel).toBe("tcn");
        await writer.query(
          `create table no_pk (id int); create trigger n after insert on no_pk for each row execute function "trig""ext".triggered_change_notification()`,
        );
        await assert.rejects(writer.query(`insert into no_pk values (1)`), /primary key/);
        await assert.rejects(writer.query(`select "trig""ext".triggered_change_notification()`));
        await writer.query(
          `create table wrong_event (id int primary key); create trigger n before insert on wrong_event for each row execute function "trig""ext".triggered_change_notification()`,
        );
        await assert.rejects(writer.query(`insert into wrong_event values (1)`), /after the change/);
        await writer.query(trigger.drop);
      } finally {
        try {
          await writer.query("rollback");
        } finally {
          await writer.end();
        }
      }
    }),
  );
});
