import { randomUUID } from "node:crypto";
import pg from "pg";

export const pgtapDescriptor = {
  name: "pgtap",
  version: "1.3.3",
  schema: "tap",
  apiSupport: { status: "verified", digest: "523551d08abe2fbfe43134af4271d798a324146a4a9765a20fc28cd2399f3344" },
} as const;

/** Each check owns a new database on an explicitly supplied loopback-only pgTAP image. */
export async function withPgtapDatabase<Result>(work: (url: string) => Promise<Result>): Promise<Result> {
  const base = process.env.PGTAP_DATABASE_URL;
  if (!base) throw new Error("PGTAP_DATABASE_URL must select the owned local pgTAP PostgreSQL 18 fixture");
  const url = new URL(base);
  if (url.hostname !== "127.0.0.1") throw new Error("pgTAP family proof requires its owned loopback fixture");
  const admin = new pg.Client({ connectionString: base });
  const database = `pgtap_${randomUUID().replaceAll("-", "")}`;
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE "${database}"`);
    url.pathname = `/${database}`;
    return await work(url.href);
  } finally {
    try {
      await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
    } finally {
      await admin.end();
    }
  }
}

export const pgtapInstall = `
CREATE SCHEMA tap;
CREATE EXTENSION pgtap VERSION '1.3.3' SCHEMA tap;
SET search_path = tap, public, pg_catalog;
CREATE TABLE public.parent(id integer PRIMARY KEY);
CREATE TABLE public.fixture(id integer PRIMARY KEY REFERENCES public.parent(id), value text DEFAULT 'x');
CREATE FUNCTION public.fixture_fn(integer) RETURNS integer LANGUAGE SQL IMMUTABLE AS 'SELECT $1';
`;
