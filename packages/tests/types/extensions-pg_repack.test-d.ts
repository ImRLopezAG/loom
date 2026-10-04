import type { SQL } from "drizzle-orm";
import { expectTypeOf } from "vite-plus/test";
import {
  createPgRepack_1_5_2,
  type PgRepackPrimaryKey,
  type PgRepackTable,
} from "../../../apps/loom/src/core/extensions/adapters/pg_repack";
import type { RepackSession, RepackEffect } from "../../../apps/loom/src/tooling/extensions/operations/pg_repack";
import { withPgRepack } from "../../../apps/loom/src/tooling/extensions/operations/pg_repack";
import { pgRepackDescriptor } from "../../e2e/fixtures/pg_repack";

const api = createPgRepack_1_5_2(pgRepackDescriptor);
expectTypeOf(api.version).toEqualTypeOf<"1.5.2">();
expectTypeOf(api.schema).toEqualTypeOf<"extensions">();
expectTypeOf(api.libraryVersion()).toExtend<SQL<string>>();
expectTypeOf(api.sqlVersion()).toExtend<SQL<string>>();
expectTypeOf(api.oid2text(1)).toExtend<SQL<string>>();
expectTypeOf(api.getEnableTrigger(1)).toExtend<SQL<string>>();
expectTypeOf(api.primaryKeysCodec.decode("(,)")).toEqualTypeOf<PgRepackPrimaryKey>();
expectTypeOf(api.tablesCodec.decode("(,,,,,,,,,,,,,,,,,,,,,,,)")).toEqualTypeOf<PgRepackTable>();
expectTypeOf(api.primaryKeys("k").columns.indrelid).toEqualTypeOf<SQL<number | null>>();
expectTypeOf(api.tables("t").columns.relname).toEqualTypeOf<SQL<string | null>>();
expectTypeOf<RepackSession["repack"]>().returns.toEqualTypeOf<
  Promise<{ readonly state: "acknowledged"; readonly rollback: "not-transactional"; readonly identity: "pg_repack 1.5.2" }>
>();
expectTypeOf<RepackSession>().not.toHaveProperty("client");
expectTypeOf<RepackSession>().not.toHaveProperty("createTable");
expectTypeOf<RepackEffect["rollback"]>().toEqualTypeOf<"not-transactional">();
function compileOnly() {
  // @ts-expect-error Wrong SQL input type.
  api.oid2text("1");
  // @ts-expect-error Client internals are not callable application SQL.
  api.createTable(1, "pg_default");
  // @ts-expect-error Stateful members are absent from canonical query functions.
  void api.sql.functions.create_table;
  // @ts-expect-error Exact version only.
  createPgRepack_1_5_2({ ...pgRepackDescriptor, version: "1.5.1" });
  void withPgRepack("postgresql://operator@localhost/fixture", pgRepackDescriptor, async (session) => {
    expectTypeOf(
      await session.repack({ relation: { schema: "owned", name: "items" }, binary: "/usr/bin/pg_repack" }),
    ).toExtend<{ readonly state: "acknowledged"; readonly rollback: "not-transactional" }>();
    // @ts-expect-error Binary is required for the aligned client.
    await session.repack({ relation: { schema: "owned", name: "items" } });
    // @ts-expect-error No raw operator client crosses into callback.
    session.client;
  });
}
void compileOnly;
