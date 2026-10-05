import assert from "node:assert/strict";
import pg from "pg";
import source from "../../../apps/loom/src/tooling/extensions/manifests/plpgsql_check.json";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";

/** plpgsql_check 2.8 natively rejects `"$'\` in its non-relocatable installation schema. */
export const plpgsqlCheckSchema = "check plpgsql";
export const plpgsqlCheckDescriptor = {
  name: "plpgsql_check",
  version: "2.8",
  schema: plpgsqlCheckSchema,
  apiSupport: { status: "verified", digest: source.digest },
} as const;
export const plpgsqlCheckInstall = `CREATE SCHEMA "check plpgsql"; CREATE EXTENSION plpgsql_check WITH SCHEMA "check plpgsql" VERSION '2.8';
CREATE TABLE public.check_items(a int, b text);
CREATE FUNCTION public.check_broken(x int) RETURNS int LANGUAGE plpgsql AS $$ DECLARE r record; unused int; BEGIN SELECT * INTO r FROM public.check_items WHERE a = x; IF x > 0 THEN RETURN r.c; END IF; RETURN 1; END $$;
CREATE FUNCTION public.check_trigger() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.b := NEW.zz; RETURN NEW; END $$;
CREATE FUNCTION public.check_pragma() RETURNS int LANGUAGE plpgsql AS $$ DECLARE r record; BEGIN PERFORM "check plpgsql".plpgsql_check_pragma('disable:check'); RETURN r.missing; END $$;
CREATE FUNCTION public.check_profiled(x int) RETURNS int LANGUAGE plpgsql AS $$ BEGIN IF x > 0 THEN RETURN 2; END IF; RETURN 1; END $$;
CREATE FUNCTION public.check_sql() RETURNS int LANGUAGE sql AS 'SELECT 1'`;

/**
 * Shared profiling needs plpgsql_check in shared_preload_libraries, which a database cannot configure. This test-only
 * helper allocates one UUID database on the host-supplied preloaded PostgreSQL 18 server and always drops it.
 */
export async function withPreloadedPlpgsqlCheckDatabase(operation: (url: string) => Promise<void>): Promise<void> {
  const connectionString = process.env.LOOM_PLPGSQL_CHECK_PRELOADED_DATABASE_URL;
  if (!connectionString)
    throw new Error(
      "Shared plpgsql_check profiling acceptance requires a PostgreSQL 18 server preloading plpgsql_check; missing is failed, never skipped",
    );
  const admin = new pg.Client({ connectionString });
  const name = `loom_ext_${crypto.randomUUID().replaceAll("-", "")}`;
  const url = new URL(connectionString);
  url.pathname = `/${name}`;
  await admin.connect();
  try {
    const preload = await admin.query<{ value: string }>("SELECT current_setting('shared_preload_libraries') AS value");
    assert(
      preload.rows[0]!.value.split(",").some((entry) => entry.trim() === "plpgsql_check"),
      "Preloaded fixture does not preload plpgsql_check",
    );
    await admin.query(`CREATE DATABASE ${quoteIdentifier(name)}`);
    try {
      await operation(url.href);
    } finally {
      await admin.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(name)} WITH (FORCE)`);
    }
  } finally {
    await admin.end();
  }
}
