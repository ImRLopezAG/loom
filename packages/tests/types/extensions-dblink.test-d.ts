import { expectTypeOf } from "vite-plus/test";
import { createDblink_1_2 } from "../../../apps/loom/src/core/extensions/adapters/dblink";
import type { DblinkNotify, DblinkPkeyResult } from "../../../apps/loom/src/core/extensions/adapters/dblink-codecs";
import { int4Codec, textCodec } from "../../../apps/loom/src/core/extensions/adapters/dblink-codecs";
import { withDblink, type DblinkSession } from "../../../apps/loom/src/tooling/extensions/operations/dblink";
import source from "../../../apps/loom/src/tooling/extensions/manifests/dblink.json";

function dblinkTypeContract(): void {
  const descriptor = {
    name: "dblink",
    version: "1.2",
    schema: "extensions",
    apiSupport: { status: "verified", digest: source.digest },
  } as const;
  const binding = createDblink_1_2(descriptor);
  binding.sql.functions.dblink_get_connections();
  binding.sql.functions.dblink_current_query();
  binding.sql.functions.dblink_get_pkey("local_items");
  binding.sql.functions.dblink_build_sql_delete("local_items", "1", 1, {
    dimensions: [{ lowerBound: 1, length: 1 }],
    values: ["1"],
  });
  // @ts-expect-error Connect is explicit session tooling, not application SQL.
  binding.sql.functions.dblink_connect("named", "host=local");
  // @ts-expect-error Remote query is explicit session tooling, not application SQL.
  binding.sql.functions.dblink("SELECT 1");
  // @ts-expect-error Exec is explicit session tooling, not application SQL.
  binding.sql.functions.dblink_exec("INSERT 1");
  // @ts-expect-error Validator is an internal FDW callback.
  binding.sql.functions.dblink_fdw_validator([], 0);
  expectTypeOf(binding.foreignDataWrapper.name).toEqualTypeOf<"dblink_fdw">();
  expectTypeOf(binding.foreignDataWrapper.handler).toEqualTypeOf<null>();
  expectTypeOf(binding.connect.authority).toEqualTypeOf<"session">();
  expectTypeOf(binding.exec.authority).toEqualTypeOf<"session">();
  expectTypeOf(binding.query.authority).toEqualTypeOf<"session">();
  expectTypeOf<DblinkPkeyResult["position"]>().toEqualTypeOf<number | null>();
  expectTypeOf<DblinkPkeyResult["colname"]>().toEqualTypeOf<string | null>();
  expectTypeOf<DblinkNotify["be_pid"]>().toEqualTypeOf<number>();
  void withDblink("postgresql://operator/fixture", descriptor, async (session) => {
    expectTypeOf(session).toEqualTypeOf<DblinkSession>();
    const names = await session.connections();
    expectTypeOf(names).toEqualTypeOf<readonly string[] | null>();
    const rows = await session.query({
      connection: "named",
      sql: "SELECT id FROM items",
      fields: { id: int4Codec, label: textCodec },
    });
    expectTypeOf(rows[0]?.id).toEqualTypeOf<unknown>();
    const disconnected = await session.disconnect({ connection: "named" });
    expectTypeOf(disconnected.status).toEqualTypeOf<string>();
    expectTypeOf(disconnected.rollback).toEqualTypeOf<"not-transactional">();
    // @ts-expect-error No raw operator client crosses into callback.
    session.client;
    return names;
  });
  // @ts-expect-error Exact factory only accepts 1.2.
  createDblink_1_2({ ...descriptor, version: "1.1" });
}
void dblinkTypeContract;
