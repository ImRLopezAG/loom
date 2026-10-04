import { expectTypeOf } from "vite-plus/test";
import { createPostgresFdw_1_2 } from "../../../apps/loom/src/core/extensions/adapters/postgres_fdw";
import type { PostgresFdwConnection } from "../../../apps/loom/src/core/extensions/adapters/postgres_fdw-codecs";
import {
  withPostgresFdw,
  type PostgresFdwSession,
} from "../../../apps/loom/src/tooling/extensions/operations/postgres_fdw";
import source from "../../../apps/loom/src/tooling/extensions/manifests/postgres_fdw.json";

function postgresFdwTypeContract(): void {
  const descriptor = {
    name: "postgres_fdw",
    version: "1.2",
    schema: "extensions",
    apiSupport: { status: "verified", digest: source.digest },
  } as const;
  const binding = createPostgresFdw_1_2(descriptor);
  binding.sql.functions.postgres_fdw_get_connections();
  binding.sql.functions.postgres_fdw_get_connections(true);
  // @ts-expect-error check_conn is boolean, not a server name.
  binding.sql.functions.postgres_fdw_get_connections("loopback");
  // @ts-expect-error Disconnect is explicit session tooling, not application SQL.
  binding.sql.functions.postgres_fdw_disconnect("loopback");
  // @ts-expect-error Handler is an internal FDW callback.
  binding.sql.functions.postgres_fdw_handler();
  expectTypeOf(binding.foreignDataWrapper.name).toEqualTypeOf<"postgres_fdw">();
  expectTypeOf(binding.disconnect.authority).toEqualTypeOf<"session">();
  expectTypeOf<PostgresFdwConnection["closed"]>().toEqualTypeOf<boolean | null>();
  expectTypeOf<PostgresFdwConnection["remote_backend_pid"]>().toEqualTypeOf<number>();
  void withPostgresFdw("postgresql://operator/fixture", descriptor, async (session) => {
    expectTypeOf(session).toEqualTypeOf<PostgresFdwSession>();
    const rows = await session.connections();
    expectTypeOf(rows).toEqualTypeOf<readonly PostgresFdwConnection[]>();
    const disconnected = await session.disconnect({ serverName: "loopback" });
    expectTypeOf(disconnected.disconnected).toEqualTypeOf<boolean>();
    expectTypeOf(disconnected.rollback).toEqualTypeOf<"not-transactional">();
    // @ts-expect-error No raw operator client crosses into callback.
    session.client;
    return rows;
  });
}
void postgresFdwTypeContract;
