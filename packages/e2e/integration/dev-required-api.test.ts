import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { setTimeout } from "node:timers/promises";
import { generateRelease, prepareProject } from "loom/tooling";
import { developmentOrmTable, readDevelopmentHistory } from "../../../apps/loom/src/tooling/dev/history";
import { bootstrapSession } from "../../../apps/loom/src/tooling/migrations/bootstrap";
import { withMigrationConnection, quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";
import { applyMigrationsOnConnection } from "../../../apps/loom/src/tooling/migrations/runner";
import { readMigrations, validateMigration, writeMigration } from "../../../apps/loom/src/tooling/migrations/history";
import { planMigration } from "../../../apps/loom/src/tooling/migrations/planner";
import { loadProject } from "../../../apps/loom/src/tooling/project/load";
import { requiredApiHash } from "../../../apps/loom/src/tooling/migrations/required-api";
import { buildGenerationRequiredApi } from "../../../apps/loom/src/tooling/codegen/required-api";
import { recordRuntimeCompatibility } from "../../../apps/loom/src/tooling/migrations/runtime-compatibility";
import { verifyRequiredApiOnTarget } from "../../../apps/loom/src/tooling/migrations/required-api-verification";
import { withDevRequiredApiFixture, typedDevExtensions } from "../fixtures/dev-required-api";
import type { DevRequiredApiFixture } from "../fixtures/dev-required-api";

const native = test.skipIf(!process.env.LOOM_TEST_DATABASE_URL);
const timeout = 180_000;

native(
  "fresh development records accurate scoped API pins, permits runtime calls, and repeats without work",
  async () => {
    await withDevRequiredApiFixture(
      async (fixture) => {
        expect(await readDevelopmentHistory(fixture.client, "loom_meta", "app", fixture.target)).toEqual([]);
        const first = await fixture.sync();
        expect(first.applied).toBe(true);
        expect(first.extensions?.operations.map((operation) => operation.kind)).toEqual(["install", "install"]);
        const application = (await fixture.history())[0]!.artifact;
        expect(application.format).toBe(3);
        assert(application.format === 3);
        expect(application.requiredApi?.apis.map(({ manifest }) => manifest.contract.extension)).toEqual([
          "citext",
          "pg_trgm",
        ]);
        const components = (
          await fixture.client.query<{ namespace: string }>("SELECT namespace FROM loom_meta.component_namespaces")
        ).rows;
        expect(components).toHaveLength(1);
        const child = (await fixture.history(components[0]!.namespace))[0]!.artifact;
        assert(child.format === 3);
        expect(child.extensions.operations).toEqual([]);
        expect(child.requiredApi?.apis.map(({ manifest }) => manifest.contract.extension)).toEqual(["pg_trgm"]);
        const before = await fixture.snapshot();
        expect((await fixture.sync()).applied).toBe(false);
        expect(await fixture.snapshot()).toEqual(before);
        await fixture.client.query(`GRANT ${quoteIdentifier(fixture.runtimeRole)} TO CURRENT_USER`);
        await fixture.client.query(`SET ROLE ${quoteIdentifier(fixture.runtimeRole)}`);
        try {
          expect(
            (await fixture.client.query("SELECT search_extensions.similarity('same','same') AS score")).rows,
          ).toEqual([{ score: 1 }]);
          await assert.rejects(fixture.client.query("CREATE EXTENSION hstore"), /permission/i);
        } finally {
          await fixture.client.query("RESET ROLE");
        }
      },
      { extensions: typedDevExtensions, component: true },
    );
  },
  timeout,
);

for (const damage of ["usage", "member", "current-role"] as const) {
  native(
    `saved development API ${damage} failure precedes bootstrap, grant repair, ownership and DDL`,
    async () => {
      await withDevRequiredApiFixture(async (fixture) => {
        await fixture.sync();
        await fixture.setSavedPins(true);
        const role = damage === "current-role" ? fixture.otherRole : fixture.runtimeRole;
        if (damage === "current-role") {
          await bootstrapSession(fixture.client, "loom_meta", role);
          await fixture.client.query(`REVOKE USAGE ON SCHEMA search_extensions FROM PUBLIC,${quoteIdentifier(role)}`);
          const original = (await fixture.history())[0]!.artifact;
          assert(original.format === 3 && original.requiredApi);
          await verifyRequiredApiOnTarget(fixture.client, original.requiredApi, fixture.runtimeRole);
        } else if (damage === "usage") {
          await fixture.client.query(`REVOKE USAGE ON SCHEMA search_extensions FROM PUBLIC,${quoteIdentifier(role)}`);
        } else {
          await fixture.client.query(
            "CREATE FUNCTION search_extensions.extra_member(value text) RETURNS text LANGUAGE SQL IMMUTABLE STRICT AS 'SELECT value'; ALTER EXTENSION pg_trgm ADD FUNCTION search_extensions.extra_member(text)",
          );
        }
        // This metadata grant would be repaired by bootstrap, independently of the extension usage grant.
        await fixture.client.query(`GRANT SELECT,DELETE ON loom_meta.jobs TO ${quoteIdentifier(role)}`);
        await fixture.schema(", description:s.text()");
        const before = await fixture.snapshot();
        await assert.rejects(
          fixture.sync(role),
          damage === "member" ? /contract|member|extra|digest/i : new RegExp(`Required runtime role .*denied: ${role}`),
        );
        expect(await fixture.snapshot()).toEqual(before);
        expect(
          (
            await fixture.client.query("SELECT has_table_privilege($1::name,'loom_meta.jobs','SELECT') AS allowed", [
              role,
            ])
          ).rows,
        ).toEqual([{ allowed: true }]);
        expect(
          (
            await fixture.client.query("SELECT has_table_privilege($1::name,'loom_meta.jobs','DELETE') AS allowed", [
              role,
            ])
          ).rows,
        ).toEqual([{ allowed: true }]);
      });
    },
    timeout,
  );
}

native(
  "candidate API checks all scopes before earlier DDL, including later-component native member contract drift",
  async () => {
    await withDevRequiredApiFixture(
      async (fixture) => {
        await fixture.sync();
        await fixture.setSavedPins(false);
        const scopes = (
          await fixture.client.query<{ mount_path: string; namespace: string }>(
            "SELECT mount_path,namespace FROM loom_meta.component_namespaces ORDER BY namespace",
          )
        ).rows;
        const earlier = scopes.find((scope) => scope.mount_path === "empty")!;
        const later = scopes.find((scope) => scope.mount_path === "search")!;
        assert(earlier.namespace < later.namespace && later.namespace < fixture.namespace);
        await fixture.client.query(
          `INSERT INTO ${quoteIdentifier(earlier.namespace)}.items(title) VALUES('preserved'); CREATE SCHEMA fixture_probe; CREATE SEQUENCE fixture_probe.earlier_ddl`,
        );
        await fixture.client.query(
          "CREATE FUNCTION search_extensions.candidate_extra_member(value text) RETURNS text LANGUAGE SQL IMMUTABLE STRICT AS 'SELECT value'; ALTER EXTENSION pg_trgm ADD FUNCTION search_extensions.candidate_extra_member(text)",
        );
        expect(
          (
            await fixture.client.query(
              `SELECT EXISTS (
                 SELECT 1 FROM pg_catalog.pg_depend d
                 JOIN pg_catalog.pg_extension e ON e.oid=d.refobjid
                 WHERE d.classid='pg_catalog.pg_proc'::regclass
                   AND d.refclassid='pg_catalog.pg_extension'::regclass
                   AND d.objid='search_extensions.candidate_extra_member(text)'::regprocedure
                   AND d.deptype='e' AND e.extname='pg_trgm'
               ) AS member`,
            )
          ).rows,
        ).toEqual([{ member: true }]);
        expect(
          (
            await fixture.client.query(
              `SELECT e.extversion AS version,n.nspname AS schema
               FROM pg_catalog.pg_extension e
               JOIN pg_catalog.pg_namespace n ON n.oid=e.extnamespace
               WHERE e.extname='pg_trgm'`,
            )
          ).rows,
        ).toEqual([{ version: "1.6", schema: "search_extensions" }]);
        // Sequence advancement survives rollback, so this proves earlier SQL never ran.
        // Fixture-only native effect injection, not a public raw-default API: the actual Field constructor
        // preserves instanceof/package identity without a cast or a fabricated structural declaration.
        await writeFile(
          join(fixture.root, "loom/components/empty/schema.ts"),
          'import {defineSchema} from "loom/server"; import {sql} from "drizzle-orm"; import {bigint} from "drizzle-orm/pg-core"; export default defineSchema((s)=>({items:{title:s.text(),probe:Reflect.construct(s.bigint().constructor,[(name:string)=>bigint(name,{mode:"bigint"}).default(sql`nextval(\'fixture_probe.earlier_ddl\')`),{...s.bigint().metadata,defaultValue:"fixture_probe.earlier_ddl"}])}}));',
        );
        const before = await fixture.snapshot();
        const sequence = (await fixture.client.query("SELECT last_value,is_called FROM fixture_probe.earlier_ddl"))
          .rows;
        await assert.rejects(fixture.sync(), /Extension SQL contract mismatch: pg_trgm/);
        expect(await fixture.snapshot()).toEqual(before);
        expect((await fixture.client.query("SELECT last_value,is_called FROM fixture_probe.earlier_ddl")).rows).toEqual(
          sequence,
        );
        expect(
          (await fixture.client.query(`SELECT title FROM ${quoteIdentifier(earlier.namespace)}.items`)).rows,
        ).toEqual([{ title: "preserved" }]);
      },
      { extensions: typedDevExtensions, component: true, namespace: "z_app", emptyComponent: true },
    );
  },
  timeout,
);

native(
  "optional API evidence change alone persists format-3 history and the next identical candidate is a no-op",
  async () => {
    await withDevRequiredApiFixture(async (fixture) => {
      const first = await fixture.sync();
      await fixture.setSavedPins(false);
      const legacy = (await fixture.history())[0]!;
      assert(legacy.artifact.format === 3);
      expect(requiredApiHash(legacy.artifact.requiredApi)).toBeUndefined();
      const candidate = await prepareProject(fixture.root);
      expect(candidate.version).toBe(first.sourceVersion);
      const second = await fixture.sync();
      expect(second.applied).toBe(true);
      const history = await fixture.history();
      expect(history).toHaveLength(2);
      const head = history[1]!.artifact;
      assert(head.format === 3);
      expect(head.statements).toEqual([]);
      expect(head.extensions.operations).toEqual([]);
      expect(requiredApiHash(head.requiredApi)).toBeDefined();
      expect(history[1]!.source_version).toBe(legacy.source_version);
      expect((await fixture.sync()).applied).toBe(false);
      expect(await fixture.history()).toEqual(history);
    });
  },
  360_000,
);

for (const denied of [true, false]) {
  native(
    `development uses the applied release pin before a pending local artifact and ${denied ? "refuses denied privilege" : "upgrades an authentic v27 prefix"}`,
    async () => {
      await withDevRequiredApiFixture(async (fixture) => {
        await generateRelease(fixture.root, "initial");
        const artifacts = await readMigrations(fixture.root, "loom/_generated/migrations");
        const initial = artifacts[0]!.plan;
        assert(initial.format === 3 && initial.requiredApi);
        await withMigrationConnection(fixture.url, (client) =>
          applyMigrationsOnConnection(client, {
            root: fixture.root,
            namespace: "app",
            metadataNamespace: "loom_meta",
            migrations: "loom/_generated/migrations",
            runtimeRole: fixture.runtimeRole,
          }),
        );
        // A later valid installation-only artifact is pending; selecting it would erase the applied pin.
        const project = await loadProject(fixture.root);
        const pending = await planMigration(initial.snapshot, project.schema, [], initial.hash, {
          scope: "application",
          extensions: { ...initial.extensions, before: initial.extensions.after, operations: [], automatic: true },
        });
        await validateMigration(pending);
        await writeMigration(fixture.root, "loom/_generated/migrations", "pending", pending);
        await fixture.client.query(
          "ALTER TABLE loom_meta.runtime_compatibility DROP CONSTRAINT runtime_compatibility_required_api_check, DROP COLUMN required_api, DROP COLUMN runtime_role; DELETE FROM loom_meta.framework_migrations WHERE version=28",
        );
        if (denied) {
          await fixture.client.query(
            `REVOKE USAGE ON SCHEMA search_extensions FROM PUBLIC,${quoteIdentifier(fixture.runtimeRole)}`,
          );
          await fixture.client.query(
            `GRANT SELECT,DELETE ON loom_meta.jobs TO ${quoteIdentifier(fixture.runtimeRole)}`,
          );
          const before = await fixture.snapshot();
          await assert.rejects(fixture.sync(), /Required runtime role USAGE denied/);
          expect(await fixture.snapshot()).toEqual(before);
          expect(
            (
              await fixture.client.query(
                "SELECT column_name FROM information_schema.columns WHERE table_schema='loom_meta' AND table_name='runtime_compatibility' AND column_name='required_api'",
              )
            ).rows,
          ).toEqual([]);
        } else {
          await fixture.sync();
          expect(
            (await fixture.client.query("SELECT max(version) AS version FROM loom_meta.framework_migrations")).rows,
          ).toEqual([{ version: 28 }]);
          expect(
            (await fixture.client.query("SELECT hash FROM loom_meta.migration_history WHERE namespace='app'")).rows,
          ).toEqual([{ hash: initial.hash }]);
          assert((await fixture.history())[0]!.artifact.format === 3);
        }
      });
    },
    timeout,
  );
}

native(
  "absence-safe development history preserves orphan ORM rejection instead of repairing metadata",
  async () => {
    await withDevRequiredApiFixture(async (fixture) => {
      await fixture.sync();
      await fixture.client.query("DROP TABLE loom_meta.development_history");
      await assert.rejects(fixture.history(), /Development ORM history is inconsistent/);
      await assert.rejects(fixture.sync(), /Development ORM history is inconsistent/);
      expect(
        (await fixture.client.query("SELECT to_regclass('loom_meta.development_history') AS relation")).rows,
      ).toEqual([{ relation: null }]);
    });
  },
  timeout,
);

for (const damage of ["ordinal", "target", "hash", "orm", "framework"] as const) {
  native(
    `development ${damage} corruption remains a refusal with no repair or new DDL`,
    async () => {
      await withDevRequiredApiFixture(async (fixture) => {
        await fixture.sync();
        if (damage === "ordinal") await fixture.client.query("UPDATE loom_meta.development_history SET ordinal=2");
        if (damage === "target")
          await fixture.client.query("UPDATE loom_meta.development_history SET branch_id='br-other'");
        if (damage === "hash")
          await fixture.client.query("UPDATE loom_meta.development_history SET artifact_hash=repeat('f',64)");
        if (damage === "orm") {
          await fixture.client.query(
            `UPDATE loom_meta.${quoteIdentifier(developmentOrmTable("app"))} SET hash=repeat('f',64)`,
          );
        }
        if (damage === "framework")
          await fixture.client.query("UPDATE loom_meta.framework_migrations SET hash=repeat('f',64) WHERE version=28");
        await fixture.schema(", description:s.text()");
        const before = await fixture.snapshot();
        await assert.rejects(fixture.sync(), /history|target|framework|hash|inconsistent/i);
        expect(await fixture.snapshot()).toEqual(before);
      });
    },
    timeout,
  );
}

async function registerComponentRetention(fixture: DevRequiredApiFixture) {
  const { client, otherRole } = fixture;
  await bootstrapSession(client, "loom_meta", otherRole);
  await client.query(
    "CREATE SCHEMA retained_extensions; CREATE EXTENSION pg_trgm SCHEMA retained_extensions VERSION '1.6'",
  );
  await client.query(`GRANT USAGE ON SCHEMA retained_extensions TO ${quoteIdentifier(otherRole)}`);
  const requiredApi = buildGenerationRequiredApi([
    {
      mountPath: "retained",
      namespace: "component_retained",
      extensions: { pg_trgm: { version: "1.6", schema: "retained_extensions" } },
    },
  ]);
  assert(requiredApi);
  await verifyRequiredApiOnTarget(client, requiredApi.scopes[0]!.requiredApi, otherRole);
  const artifact = (await fixture.history())[0]!.artifact;
  for (const namespace of ["app", "component_retained"])
    await recordRuntimeCompatibility(client, {
      namespace,
      metadataNamespace: "loom_meta",
      deployment: "retained",
      version: "a".repeat(64),
      sourceSchema: artifact.after,
      inspection: {
        head: artifact.after,
        minimumOrdinal: 0,
        maximumOrdinal: 0,
        schemas: [artifact.after],
        migrationHashes: [],
      },
      requiredApi,
      runtimeRole: otherRole,
    });
  await client.query(
    "INSERT INTO loom_meta.deployment_activations(deployment,version,project_id,branch_id,endpoint_host,database_name,token_hash,state) VALUES('retained',repeat('a',64),'fixture','fixture','localhost',current_database(),repeat('c',64),'active')",
  );
}

native(
  "extension-free development protects original component-only retention under its distinct saved role before bootstrap",
  async () => {
    await withDevRequiredApiFixture(
      async (fixture) => {
        await fixture.sync();
        await registerComponentRetention(fixture);
        await fixture.client.query(
          `REVOKE USAGE ON SCHEMA retained_extensions FROM PUBLIC,${quoteIdentifier(fixture.otherRole)}`,
        );
        await fixture.client.query(`GRANT SELECT,DELETE ON loom_meta.jobs TO ${quoteIdentifier(fixture.runtimeRole)}`);
        await fixture.schema(", description:s.text()");
        const before = await fixture.snapshot();
        await assert.rejects(fixture.sync(), new RegExp(`Required runtime role USAGE denied: ${fixture.otherRole}`));
        expect(await fixture.snapshot()).toEqual(before);
      },
      { extensions: {} },
    );
  },
  timeout,
);

native(
  "development no-op return repeats the original retained API check after preflight",
  async () => {
    await withDevRequiredApiFixture(
      async (fixture) => {
        await fixture.sync();
        await registerComponentRetention(fixture);
        const before = await fixture.snapshot();
        await fixture.client.query("BEGIN");
        await fixture.client.query("SELECT pg_advisory_xact_lock(hashtextextended('loom:bootstrap',0))");
        const rejected = assert.rejects(
          fixture.sync(),
          new RegExp(`Required runtime role USAGE denied: ${fixture.otherRole}`),
        );
        let changed = false;
        try {
          // Reaching bootstrap proves the initial original-snapshot native check already passed.
          const deadline = Date.now() + 90_000;
          for (;;) {
            await fixture.client.query("SELECT pg_stat_clear_snapshot()");
            const waiting = await fixture.client.query(
              "SELECT 1 FROM pg_stat_activity WHERE pid<>pg_backend_pid() AND application_name='loom-migrations' AND wait_event_type='Lock' AND query LIKE '%loom:bootstrap%'",
            );
            if (waiting.rowCount) break;
            if (Date.now() >= deadline) throw new Error("Development did not reach the held bootstrap lock");
            await setTimeout(100);
          }
          await fixture.client.query(
            `REVOKE USAGE ON SCHEMA retained_extensions FROM ${quoteIdentifier(fixture.otherRole)}`,
          );
          await fixture.client.query("COMMIT");
          changed = true;
        } finally {
          if (!changed) await fixture.client.query("ROLLBACK");
          await rejected;
        }
        // The external revocation stays in effect; unchanged development SQL/history remains untouched.
        expect(await fixture.snapshot()).toEqual(before);
        expect(
          (
            await fixture.client.query(
              "SELECT has_schema_privilege($1::name,'retained_extensions','USAGE') AS allowed",
              [fixture.otherRole],
            )
          ).rows,
        ).toEqual([{ allowed: false }]);
      },
      { extensions: {} },
    );
  },
  timeout,
);

for (const mutation of ["privilege", "identity", "dependency"] as const) {
  native(
    `development transaction rolls back ${mutation} mutation against the same original retained snapshot`,
    async () => {
      await withDevRequiredApiFixture(
        async (fixture) => {
          await fixture.sync();
          await registerComponentRetention(fixture);
          await fixture.client.query("INSERT INTO app.tasks(title) VALUES('preserved'); CREATE SCHEMA fixture_probe");
          const effect =
            mutation === "privilege"
              ? `REVOKE USAGE ON SCHEMA retained_extensions FROM ${quoteIdentifier(fixture.otherRole)}`
              : mutation === "identity"
                ? "DELETE FROM loom_meta.runtime_compatibility WHERE deployment='retained'"
                : `DELETE FROM loom_meta.deployment_activations WHERE deployment='retained'; REVOKE USAGE ON SCHEMA retained_extensions FROM ${quoteIdentifier(fixture.otherRole)}`;
          await fixture.client.query(
            `CREATE FUNCTION fixture_probe.mutate_retention() RETURNS text LANGUAGE plpgsql VOLATILE AS $fixture$ BEGIN ${effect}; RETURN 'candidate'; END; $fixture$`,
          );
          // Fixture-only Field construction injects the native effect inside the real development transaction.
          await fixture.schema(
            ', proof:Reflect.construct(s.text().constructor,[(name:string)=>text(name).default(sql`fixture_probe.mutate_retention()`),{...s.text().metadata,defaultValue:"fixture_probe.mutate_retention()"}])',
          );
          const before = await fixture.snapshot();
          await assert.rejects(
            fixture.sync(),
            /retained.*(evidence|identity).*changed|Required runtime role USAGE denied/i,
          );
          expect(await fixture.snapshot()).toEqual(before);
          expect((await fixture.client.query("SELECT title FROM app.tasks")).rows).toEqual([{ title: "preserved" }]);
        },
        { extensions: {} },
      );
    },
    timeout,
  );
}
