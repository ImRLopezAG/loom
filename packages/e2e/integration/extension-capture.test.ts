import { expect, test } from "bun:test";
import pg from "pg";
import * as v from "valibot";
import { withExtensionDatabase } from "../fixtures/extension-database";
import {
  captureExtensionContract,
  restrictedExtensionCapture,
} from "../../../apps/loom/src/tooling/extensions/capture";
import { extensionContractValidator, type ExtensionManifest } from "../../../apps/loom/src/core/extensions/contracts";
import { createExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";

test("restricted fixtures remain explicitly unverified", () => {
  expect(restrictedExtensionCapture("pg_repack", "neon", "paid plan and support enablement")).toEqual({
    status: "restricted",
    name: "pg_repack",
    provider: "neon",
    prerequisite: "paid plan and support enablement",
    verified: false,
  });
  expect(() => restrictedExtensionCapture("pg_repack", "neon", "")).toThrow("prerequisite");
});

test.skipIf(!process.env.LOOM_TEST_DATABASE_URL)(
  "capture preserves overloads, defaults, variadic/OUT/SRF shapes, ownership and stable symbolic digests",
  async () => {
    const manifests: ExtensionManifest[] = [];
    for (let database = 0; database < 2; database++) {
      await withExtensionDatabase(async (url) => {
        const client = new pg.Client({ connectionString: url });
        await client.connect();
        try {
          if (database) await client.query("CREATE TYPE public.oid_noise AS ENUM ('noise')");
          await client.query(`CREATE SCHEMA captured_extensions;
          CREATE EXTENSION pg_trgm SCHEMA captured_extensions VERSION '1.6';
          CREATE EXTENSION hstore SCHEMA captured_extensions VERSION '1.8';
          CREATE OPERATOR captured_extensions.~#~ (FUNCTION=pg_catalog.int4eq,LEFTARG=integer,RIGHTARG=integer,COMMUTATOR=OPERATOR(captured_extensions.#~#));
          ALTER EXTENSION pg_trgm ADD OPERATOR captured_extensions.~#~(integer,integer);
          ALTER EXTENSION pg_trgm ADD OPERATOR captured_extensions.#~#(integer,integer);
          CREATE SCHEMA fixed_namespace;
          CREATE FUNCTION fixed_namespace.capture_fixed(value captured_extensions.hstore) RETURNS captured_extensions.hstore LANGUAGE SQL IMMUTABLE AS 'SELECT value';
          ALTER EXTENSION pg_trgm ADD FUNCTION fixed_namespace.capture_fixed(captured_extensions.hstore);
          CREATE FUNCTION captured_extensions.capture_default(value integer DEFAULT 7) RETURNS integer LANGUAGE SQL IMMUTABLE AS 'SELECT value';
          CREATE FUNCTION captured_extensions.capture_default(value text) RETURNS text LANGUAGE SQL IMMUTABLE AS 'SELECT value';
          CREATE FUNCTION captured_extensions.capture_variadic(VARIADIC items integer[]) RETURNS integer LANGUAGE SQL IMMUTABLE AS 'SELECT cardinality(items)';
          CREATE FUNCTION captured_extensions.capture_out(value integer, OUT doubled integer, OUT original integer) RETURNS record LANGUAGE SQL IMMUTABLE AS 'SELECT value*2,value';
          CREATE FUNCTION captured_extensions.capture_rows(value integer) RETURNS TABLE(item integer, label text) LANGUAGE SQL IMMUTABLE AS 'SELECT value,value::text';
          ALTER EXTENSION pg_trgm ADD FUNCTION captured_extensions.capture_default(integer);
          ALTER EXTENSION pg_trgm ADD FUNCTION captured_extensions.capture_default(text);
          ALTER EXTENSION pg_trgm ADD FUNCTION captured_extensions.capture_variadic(integer[]);
          ALTER EXTENSION pg_trgm ADD FUNCTION captured_extensions.capture_out(integer);
          ALTER EXTENSION pg_trgm ADD FUNCTION captured_extensions.capture_rows(integer);
          CREATE TABLE captured_extensions.owned_data(id integer PRIMARY KEY, title text);
          ALTER EXTENSION pg_trgm ADD TABLE captured_extensions.owned_data;
          CREATE TABLE public.application_data(value captured_extensions.hstore);`);
          const manifest = await captureExtensionContract(client, {
            name: "pg_trgm",
            provider: "local-postgresql",
            fixture: `disposable-local-${database}`,
          });
          manifests.push(manifest);
          const reversedMembers = manifest.contract.members.map((member) => {
            const reordered = Object.fromEntries(Object.entries(member).reverse());
            if (member.kind === "routine")
              reordered.arguments = member.arguments.map((argument) =>
                Object.fromEntries(Object.entries(argument).reverse()),
              );
            return reordered;
          });
          const reversed = {
            ...Object.fromEntries(Object.entries(manifest.contract).reverse()),
            members: reversedMembers,
          };
          expect(
            createExtensionManifest(v.parse(extensionContractValidator, reversed), manifest.provenance).digest,
          ).toBe(manifest.digest);
          const members = manifest.contract.members;
          const routines = members.filter((member) => member.kind === "routine");
          expect(members.find((member) => member.kind === "operator" && member.name === "#~#")).toMatchObject({
            defined: false,
            returns: null,
            procedure: null,
          });
          expect(routines.filter((member) => member.name === "capture_default")).toHaveLength(2);
          expect(routines.find((member) => member.name === "capture_fixed")).toMatchObject({
            namespace: "fixed_namespace",
            arguments: [{ type: { namespace: "$extension:hstore", name: "hstore" } }],
          });
          expect(
            routines.find((member) => member.name === "capture_default" && member.arguments[0]?.type.name === "int4")
              ?.arguments[0]?.hasDefault,
          ).toBe(true);
          expect(routines.find((member) => member.name === "capture_variadic")?.arguments[0]?.mode).toBe("variadic");
          expect(
            routines.find((member) => member.name === "capture_out")?.arguments.map((argument) => argument.mode),
          ).toEqual(["in", "out", "out"]);
          expect(routines.find((member) => member.name === "capture_rows")).toMatchObject({
            returnsSet: true,
            arguments: [{ mode: "in" }, { mode: "table" }, { mode: "table" }],
          });
          expect(members.find((member) => member.kind === "relation" && member.name === "owned_data")?.ownership).toBe(
            "direct",
          );
          expect(
            members.find((member) => member.kind === "relation" && member.name === "owned_data_pkey")?.ownership,
          ).toBe("subordinate");
          expect(members.some((member) => member.name === "application_data" || member.name === "hstore")).toBe(false);
          expect(JSON.stringify(manifest.contract)).not.toContain('"oid":');
          expect(JSON.stringify(manifest.contract)).not.toContain("captured_extensions.");
        } finally {
          await client.end();
        }
      });
    }
    expect(manifests[0]?.digest).toBe(manifests[1]?.digest);
  },
);
