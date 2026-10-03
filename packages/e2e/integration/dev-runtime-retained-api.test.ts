import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import * as v from "valibot";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";
import { componentNamespace } from "../../../apps/loom/src/tooling/project/component-namespace";
import { withDevRuntimeRetainedApiFixture } from "../fixtures/dev-runtime-retained-api";

const native = test.skipIf(!process.env.LOOM_TEST_DATABASE_URL);
const timeout = 360_000;

native(
  "development activation persists the full original generation API and complete participating scope set",
  async () => {
    await withDevRuntimeRetainedApiFixture(
      async (fixture) => {
        const originalHistory = (await fixture.snapshot()).development;
        const generated = JSON.parse(await fixture.generationBytes());
        expect(generated.scopes.map((scope: { namespace: string }) => scope.namespace).sort()).toEqual(
          [fixture.namespace, componentNamespace("search")].sort(),
        );
        await fixture.attempt();
        const rows = await fixture.registrations();
        expect(rows.map((row) => row.namespace)).toEqual(fixture.namespaces);
        expect(rows).toHaveLength(3);
        for (const row of rows) {
          expect(row.deployment).toBe(fixture.options.deployment);
          expect(row.version).toBe(fixture.candidate.version);
          expect(row.api_absent).toBe(false);
          expect(row.required_api).toEqual(generated);
          expect(row.runtime_role).toBe(fixture.runtimeRole);
          expect(JSON.stringify(row.required_api)).not.toContain(fixture.options.activationToken);
          expect(JSON.stringify(row.required_api)).not.toContain("runtime-test-only");
        }
        expect(await fixture.scopes()).toEqual(
          fixture.namespaces.map((namespace) => ({
            namespace,
            deployment: fixture.options.deployment,
            version: fixture.candidate.version,
          })),
        );
        expect((await fixture.snapshot()).compatibility).toEqual([]);
        expect((await fixture.snapshot()).development).toEqual(originalHistory);
        expect(
          (await fixture.client.query("SELECT max(version) AS version FROM loom_meta.framework_migrations")).rows,
        ).toEqual([{ version: 29 }]);
        await fixture.noRuntimeSessions();
      },
      { component: true, emptyComponent: true },
    );
  },
  timeout,
);

native(
  "extension-free development activation saves genuine SQL absence and preserves it on identical restart",
  async () => {
    await withDevRuntimeRetainedApiFixture(
      async (fixture) => {
        await fixture.attempt();
        const original = await fixture.registrationState();
        expect(original.registrations).toEqual([
          {
            namespace: fixture.namespace,
            deployment: fixture.options.deployment,
            version: fixture.candidate.version,
            required_api: null,
            api_absent: true,
            runtime_role: null,
          },
        ]);
        expect(original.scopes.map((scope) => scope.namespace)).toEqual(fixture.namespaces);
        await fixture.attempt();
        expect(await fixture.registrationState()).toEqual(original);
        expect((await fixture.snapshot()).compatibility).toEqual([]);
        await fixture.noRuntimeSessions();
      },
      { extensions: {} },
    );
  },
  timeout,
);

native(
  "identical development restart preserves the original proof without rewriting its rows",
  async () => {
    await withDevRuntimeRetainedApiFixture(async (fixture) => {
      await fixture.attempt();
      const original = await fixture.registrationState();
      await fixture.client.query(`CREATE SCHEMA fixture_probe;
        CREATE FUNCTION fixture_probe.no_proof_update() RETURNS trigger LANGUAGE plpgsql AS $fixture$
          BEGIN RAISE EXCEPTION 'Original development API rows must not be refreshed'; END;
        $fixture$;
        CREATE TRIGGER no_proof_update BEFORE UPDATE ON loom_meta.development_runtime_api
          FOR EACH ROW EXECUTE FUNCTION fixture_probe.no_proof_update()`);
      await fixture.attempt();
      expect(await fixture.registrationState()).toEqual(original);
      await fixture.noRuntimeSessions();
    });
  },
  timeout,
);

native(
  "same development identity refuses a different configured runtime role even when that role can use the native API",
  async () => {
    await withDevRuntimeRetainedApiFixture(async (fixture) => {
      await fixture.attempt();
      await fixture.prepareOtherRole();
      expect(
        (
          await fixture.client.query("SELECT has_schema_privilege($1::name,'search_extensions','USAGE') AS allowed", [
            fixture.otherRole,
          ])
        ).rows,
      ).toEqual([{ allowed: true }]);
      const original = await fixture.registrationState();
      const activations = (await fixture.snapshot()).activations;
      await assert.rejects(fixture.startAsOtherRole(), /original.*(role|API)|development.*(role|evidence).*changed/i);
      expect(await fixture.registrationState()).toEqual(original);
      expect((await fixture.snapshot()).activations).toEqual(activations);
      await fixture.noRuntimeSessions();
    });
  },
  timeout,
);

for (const relation of ["development_runtime_api", "runtime_scopes"] as const) {
  native(
    `development restart refuses a deleted original ${relation} scope instead of reconstructing it`,
    async () => {
      await withDevRuntimeRetainedApiFixture(
        async (fixture) => {
          await fixture.attempt();
          const component = fixture.namespaces.find((namespace) => namespace !== fixture.namespace)!;
          await fixture.client.query(`DELETE FROM loom_meta.${relation} WHERE namespace=$1`, [component]);
          const damaged = await fixture.registrationState();
          const activations = (await fixture.snapshot()).activations;
          await assert.rejects(
            fixture.attempt(),
            /original.*(scope|evidence)|development.*(scope|registration).*changed|incomplete.*scope/i,
          );
          expect(await fixture.registrationState()).toEqual(damaged);
          expect((await fixture.snapshot()).activations).toEqual(activations);
          await fixture.noRuntimeSessions();
        },
        { component: true, emptyComponent: true },
      );
    },
    timeout,
  );
}

for (const damage of ["malformed", "mixed-absence"] as const) {
  native(
    `development restart refuses ${damage} original generation proof before runtime credentials`,
    async () => {
      await withDevRuntimeRetainedApiFixture(
        async (fixture) => {
          await fixture.attempt();
          const component = fixture.namespaces.find((namespace) => namespace !== fixture.namespace)!;
          if (damage === "malformed")
            await fixture.client.query(
              "UPDATE loom_meta.development_runtime_api SET required_api='{}'::jsonb WHERE namespace=$1",
              [component],
            );
          else
            await fixture.client.query(
              "UPDATE loom_meta.development_runtime_api SET required_api=NULL,runtime_role=NULL WHERE namespace=$1",
              [component],
            );
          const damaged = await fixture.registrationState();
          const calls = fixture.calls.runtimeUri;
          await assert.rejects(
            fixture.attempt(),
            damage === "malformed" ? v.ValiError : /required.*API|generation.*API|original.*evidence|conflicting/i,
          );
          expect(fixture.calls.runtimeUri).toBe(calls);
          expect(await fixture.registrationState()).toEqual(damaged);
          await fixture.noRuntimeSessions();
        },
        { component: true, emptyComponent: true },
      );
    },
    timeout,
  );
}

native(
  "native activation failure rolls back development proof, runtime scopes and procedure declarations together",
  async () => {
    await withDevRuntimeRetainedApiFixture(async (fixture) => {
      await fixture.assertRegistrationTable();
      const original = await fixture.registrationState();
      const procedures = (
        await fixture.client.query("SELECT * FROM loom_meta.procedure_releases ORDER BY deployment,version")
      ).rows;
      await fixture.client.query(`CREATE SCHEMA fixture_probe;
        CREATE SEQUENCE fixture_probe.saw_registration;
        CREATE FUNCTION fixture_probe.reject_activation() RETURNS trigger LANGUAGE plpgsql AS $fixture$
        BEGIN
          IF NEW.state='active' AND OLD.state <> 'active' THEN
            IF NOT EXISTS (SELECT 1 FROM loom_meta.development_runtime_api p
              WHERE p.deployment=NEW.deployment AND p.version=NEW.version) THEN
              RAISE EXCEPTION 'Development activation ran without original registration';
            END IF;
            PERFORM nextval('fixture_probe.saw_registration');
            RAISE EXCEPTION 'Fixture rejected native activation after registration';
          END IF;
          RETURN NEW;
        END;
        $fixture$;
        CREATE TRIGGER reject_activation BEFORE UPDATE ON loom_meta.deployment_activations
          FOR EACH ROW EXECUTE FUNCTION fixture_probe.reject_activation()`);
      await assert.rejects(fixture.attempt(), /Deployment database activation failed/);
      expect((await fixture.client.query("SELECT is_called FROM fixture_probe.saw_registration")).rows).toEqual([
        { is_called: true },
      ]);
      expect(await fixture.registrationState()).toEqual(original);
      expect(
        (await fixture.client.query("SELECT * FROM loom_meta.procedure_releases ORDER BY deployment,version")).rows,
      ).toEqual(procedures);
      const activations = (await fixture.snapshot()).activations;
      expect(activations).toHaveLength(1);
      expect(activations[0].state).toBe("quarantined");
      await fixture.noRuntimeSessions();
    });
  },
  timeout,
);

for (const damage of ["native-member", "persisted-role"] as const) {
  native(
    `extension-free incoming synchronization preserves original development ${damage} protection before bootstrap`,
    async () => {
      await withDevRuntimeRetainedApiFixture(async (fixture) => {
        await fixture.attempt();
        await fixture.selectExtensionFreeIncomingSource();
        if (damage === "native-member")
          await fixture.client.query(
            "CREATE FUNCTION search_extensions.retained_dev_extra() RETURNS integer LANGUAGE sql IMMUTABLE AS 'SELECT 1'; ALTER EXTENSION pg_trgm ADD FUNCTION search_extensions.retained_dev_extra()",
          );
        else {
          await fixture.client.query(
            `REVOKE USAGE ON SCHEMA search_extensions FROM PUBLIC,${quoteIdentifier(fixture.runtimeRole)}`,
          );
          expect(
            (
              await fixture.client.query(
                "SELECT has_schema_privilege($1::name,'search_extensions','USAGE') AS allowed",
                [fixture.runtimeRole],
              )
            ).rows,
          ).toEqual([{ allowed: false }]);
        }
        const before = await fixture.snapshot();
        expect(
          (await fixture.client.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [fixture.otherRole])).rows,
        ).toEqual([]);
        await assert.rejects(
          fixture.sync(fixture.otherRole),
          damage === "native-member"
            ? /Extension SQL contract mismatch: pg_trgm/
            : new RegExp(`Required runtime role USAGE denied: ${fixture.runtimeRole}`),
        );
        expect(await fixture.snapshot()).toEqual(before);
        expect(
          (await fixture.client.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [fixture.otherRole])).rows,
        ).toEqual([]);
        await fixture.noRuntimeSessions();
      });
    },
    timeout,
  );
}

native(
  "restricted runtime cannot read or write original development API metadata and startup rejects a leaked table grant",
  async () => {
    await withDevRuntimeRetainedApiFixture(async (fixture) => {
      await fixture.attempt();
      expect(
        (
          await fixture.client.query(
            `SELECT has_table_privilege($1::name,'loom_meta.development_runtime_api',privilege) AS allowed
              FROM unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) AS privilege`,
            [fixture.runtimeRole],
          )
        ).rows,
      ).toEqual(Array.from({ length: 7 }, () => ({ allowed: false })));
      expect(
        (
          await fixture.client.query(
            "SELECT has_any_column_privilege($1::name,'loom_meta.development_runtime_api','SELECT') AS can_select,has_any_column_privilege($1::name,'loom_meta.development_runtime_api','UPDATE') AS can_update",
            [fixture.runtimeRole],
          )
        ).rows,
      ).toEqual([{ can_select: false, can_update: false }]);
      await fixture.client.query(
        `GRANT SELECT ON loom_meta.development_runtime_api TO ${quoteIdentifier(fixture.runtimeRole)}`,
      );
      const original = await fixture.registrationState();
      await assert.rejects(fixture.attempt(), /runtime.*(privilege|database|access)|metadata.*(privilege|read|grant)/i);
      expect(await fixture.registrationState()).toEqual(original);
      await fixture.noRuntimeSessions();
    });
  },
  timeout,
);
