import assert from "node:assert/strict";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { loDatabaseProofCase } from "../fixtures/lo-proof-cases";
import { expect } from "bun:test";
import pg from "pg";
import { pgSchema } from "drizzle-orm/pg-core";
import { createLo_1_2 } from "../../../apps/loom/src/core/extensions/adapters/lo";
import { withLargeObjects, type LargeObjectSession } from "../../../apps/loom/src/tooling/extensions/operations/lo";
import { ExtensionOperationError } from "../../../apps/loom/src/tooling/extensions/operations";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { loDescriptor, loInstall, loSchema } from "../fixtures/lo";

extensionProofTest(
  loDatabaseProofCase,
  async () => {
    await withExtensionDatabase(async (url) => {
      const oracle = new pg.Client({ connectionString: url });
      await oracle.connect();
      try {
        await oracle.query(loInstall);
        await observeExtensionProofDatabase(url, loDatabaseProofCase.id, "lo");
        const prove = (member: string, assertion: () => void | Promise<void>) => {
          const claim = loDatabaseProofCase.claims.find((claim) => claim.member === member);
          assert(claim);
          return extensionProofWitness({ ...claim, schema: loSchema }, assertion);
        };
        const lo = createLo_1_2(loDescriptor);
        const table = pgSchema('app"lo').table("files", { object: lo.field().build("object") });
        const trigger = lo.trigger({ name: "manage_object", table, column: table.object });
        await oracle.query(`CREATE SCHEMA "app""lo"; CREATE TABLE "app""lo".files (object "lo ""objects""".lo)`);
        await oracle.query(trigger.create);
        const catalog = await oracle.query(
          "SELECT tgtype,tgnargs,encode(tgargs,'escape') AS args FROM pg_catalog.pg_trigger WHERE tgname='manage_object'",
        );
        // ROW(1)|BEFORE(2)|UPDATE(16)|DELETE(8), independently of declaration fields.
        expect(catalog.rows).toEqual([{ tgtype: 27, tgnargs: 1, args: "object\\000" }]);
        const domain = await oracle.query(
          `SELECT "lo ""objects""".lo_oid('4294967295'::"lo ""objects""".lo)::text AS oid, "lo ""objects""".lo_oid(NULL::"lo ""objects""".lo) AS absent, '[0:1][2:3]={{0,NULL},{42,4294967295}}'::"lo ""objects""".lo[]::text AS array`,
        );
        await prove("routine:$extension:lo.lo_oid($extension:lo.lo)", () => {
          expect(lo.codec.decode(domain.rows[0].oid)).toBe(4294967295);
          expect(domain.rows[0].absent).toBeNull();
        });
        await prove("type:$extension:lo.lo", async () => {
          const native = await oracle.query(
            `SELECT typtype,typbasetype::regtype::text AS base FROM pg_type WHERE oid='"lo ""objects""".lo'::regtype`,
          );
          expect(native.rows).toEqual([{ typtype: "d", base: "oid" }]);
          expect(lo.codec.decode(domain.rows[0].oid)).toBe(4294967295);
        });
        await prove("type:$extension:lo._lo", () => {
          expect(lo.arrayCodec.decode(domain.rows[0].array)).toEqual({
            dimensions: [
              { lowerBound: 0, length: 2 },
              { lowerBound: 2, length: 2 },
            ],
            values: [
              [0, null],
              [42, 4294967295],
            ],
          });
        });
        await prove("routine:$extension:lo.lo_manage()", async () => {
          expect(catalog.rows).toEqual([{ tgtype: 27, tgnargs: 1, args: "object\\000" }]);
          let escaped: LargeObjectSession | undefined;
          const created = await withLargeObjects(url, loDescriptor, async (session) => {
            escaped = session;
            const oid = await session.create({ hex: "00ff1122" });
            expect(await session.read(oid)).toEqual({ hex: "00ff1122" });
            await session.write(oid, 2n, { hex: "aabb" });
            expect(await session.read(oid, { offset: 1n, length: 2 })).toEqual({ hex: "ffaa" });
            return oid;
          });
          expect(created.completion).toBe("committed");
          expect(
            (await oracle.query("SELECT encode(pg_catalog.lo_get($1::oid),'hex') AS bytes", [created.value])).rows,
          ).toEqual([{ bytes: "00ffaabb" }]);
          await expect(escaped!.read(created.value)).rejects.toThrow(/inactive|owner/);
          await oracle.query(`INSERT INTO "app""lo".files VALUES ($1::oid)`, [created.value]);
          await oracle.query("BEGIN");
          await oracle.query(`UPDATE "app""lo".files SET object=NULL`);
          expect(
            (
              await oracle.query("SELECT EXISTS (SELECT 1 FROM pg_largeobject_metadata WHERE oid=$1::oid) AS exists", [
                created.value,
              ])
            ).rows[0].exists,
          ).toBe(false);
          await oracle.query("ROLLBACK");
          expect(
            (
              await oracle.query("SELECT EXISTS (SELECT 1 FROM pg_largeobject_metadata WHERE oid=$1::oid) AS exists", [
                created.value,
              ])
            ).rows[0].exists,
          ).toBe(true);
          await oracle.query(`DELETE FROM "app""lo".files`);
          expect(
            (
              await oracle.query("SELECT EXISTS (SELECT 1 FROM pg_largeobject_metadata WHERE oid=$1::oid) AS exists", [
                created.value,
              ])
            ).rows[0].exists,
          ).toBe(false);
          let rolled: number | undefined;
          await expect(
            withLargeObjects(url, loDescriptor, async (session) => {
              rolled = await session.create({ hex: "ff" });
              throw new Error("rollback bytes");
            }),
          ).rejects.toBeInstanceOf(ExtensionOperationError);
          expect(
            (
              await oracle.query("SELECT EXISTS (SELECT 1 FROM pg_largeobject_metadata WHERE oid=$1::oid) AS exists", [
                rolled,
              ])
            ).rows[0].exists,
          ).toBe(false);
          await withLargeObjects(url, loDescriptor, async (session) => {
            const oid = await session.create({ hex: "" });
            await session.unlink(oid);
          });
          await expect(oracle.query(`SELECT "lo ""objects""".lo_manage()`)).rejects.toThrow(/trigger/);
        });
      } finally {
        await oracle.end();
      }
    });
  },
  120000,
);
