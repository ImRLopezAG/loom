import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";
import { developmentOrmTable } from "../../../apps/loom/src/tooling/dev/history";
import { migrationHash } from "../../../apps/loom/src/tooling/migrations/planner";
import { buildGenerationRequiredApi } from "../../../apps/loom/src/tooling/codegen/required-api";
import { withDevRuntimeRequiredApiFixture } from "../fixtures/dev-runtime-required-api";

const native = test.skipIf(!process.env.LOOM_TEST_DATABASE_URL);
const timeout = 360_000;

native(
  "direct runtime starts and stops a healthy selected generation without altering saved history",
  async () => {
    await withDevRuntimeRequiredApiFixture(async (fixture) => {
      const history = await fixture.history();
      const started = await fixture.start();
      expect(started.binding.version).toBe(fixture.candidate.version);
      expect(fixture.calls.runtimeUri).toBe(1);
      await started.runtime.stop();
      await fixture.noRuntimeSessions();
      expect(await fixture.history()).toEqual(history);
      await assert.rejects(fixture.start(AbortSignal.abort()), /abort/i);
    });
  },
  timeout,
);

for (const damage of ["missing", "changed", "unexpected"] as const) {
  native(
    `direct runtime rejects ${damage} generated API evidence before target access`,
    async () => {
      await withDevRuntimeRequiredApiFixture(
        async (fixture) => {
          const file = join(fixture.generationDirectory, "required-api.json");
          if (damage === "missing") await rm(file);
          else if (damage === "unexpected") {
            const evidence = buildGenerationRequiredApi([
              {
                mountPath: "",
                namespace: "app",
                extensions: { pg_trgm: { version: "1.6", schema: "search_extensions" } },
              },
            ]);
            await writeFile(file, JSON.stringify(evidence));
          } else {
            const evidence = JSON.parse(await fixture.generationBytes());
            evidence.scopes[0].namespace = "other_app";
            await writeFile(file, JSON.stringify(evidence));
          }
          const before = await fixture.snapshot();
          await assert.rejects(fixture.attempt(), /generation.*API|API.*generation/i);
          expect(fixture.calls).toEqual({ target: 0, runtimeUri: 0 });
          expect(await fixture.snapshot()).toEqual(before);
          await fixture.noRuntimeSessions();
        },
        damage === "unexpected" ? { extensions: {} } : {},
      );
    },
    timeout,
  );
}

native(
  "direct runtime binds a valid present saved pin to its exact synchronized source scope",
  async () => {
    await withDevRuntimeRequiredApiFixture(async (fixture) => {
      const original = (await fixture.history())[0]!.artifact;
      assert(original.format === 3 && original.requiredApi);
      const requiredApi = buildGenerationRequiredApi([
        { mountPath: "", namespace: "app", extensions: { citext: { version: "1.8", schema: "search_extensions" } } },
      ])!.scopes[0]!.requiredApi;
      const content = { ...original, requiredApi };
      const artifact = { ...content, hash: migrationHash(content) };
      await fixture.client.query("UPDATE loom_meta.development_history SET artifact=$1,artifact_hash=$2", [
        JSON.stringify(artifact),
        artifact.hash,
      ]);
      await fixture.client.query(`UPDATE loom_meta.${quoteIdentifier(developmentOrmTable("app"))} SET hash=$1`, [
        artifact.hash,
      ]);
      const before = await fixture.snapshot();
      await assert.rejects(fixture.attempt(), /saved.*API|API.*source/i);
      expect(fixture.calls.runtimeUri).toBe(0);
      expect(await fixture.snapshot()).toEqual(before);
    });
  },
  timeout,
);

for (const damage of ["member", "role", "legacy-member", "component-member"] as const) {
  native(
    `direct runtime refuses ${damage} native drift before runtime credentials`,
    async () => {
      await withDevRuntimeRequiredApiFixture(
        async (fixture) => {
          if (damage === "legacy-member") await fixture.setSavedPins(false);
          const extension = (
            await fixture.client.query("SELECT extname,extversion,extnamespace FROM pg_extension ORDER BY extname")
          ).rows;
          if (damage === "role") {
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
          } else {
            await fixture.client.query(
              "CREATE FUNCTION search_extensions.runtime_extra() RETURNS integer LANGUAGE sql IMMUTABLE AS 'SELECT 1'; ALTER EXTENSION pg_trgm ADD FUNCTION search_extensions.runtime_extra()",
            );
          }
          const before = await fixture.snapshot();
          await assert.rejects(
            fixture.attempt(),
            damage === "role" ? /Required runtime role USAGE denied/ : /Extension SQL contract mismatch: pg_trgm/,
          );
          expect(fixture.calls.runtimeUri).toBe(0);
          expect(await fixture.snapshot()).toEqual(before);
          expect(
            (await fixture.client.query("SELECT extname,extversion,extnamespace FROM pg_extension ORDER BY extname"))
              .rows,
          ).toEqual(extension);
          await fixture.noRuntimeSessions();
        },
        damage === "component-member" ? { component: true, emptyComponent: true } : {},
      );
    },
    timeout,
  );
}

native(
  "direct runtime preserves legacy absent pins without rewriting their artifact hashes",
  async () => {
    await withDevRuntimeRequiredApiFixture(async (fixture) => {
      await fixture.setSavedPins(false);
      const before = await fixture.history();
      await fixture.attempt();
      expect(await fixture.history()).toEqual(before);
      await fixture.noRuntimeSessions();
    });
  },
  timeout,
);

native(
  "extension-free runtime verifies original retained API under its persisted role",
  async () => {
    await withDevRuntimeRequiredApiFixture(
      async (fixture) => {
        await fixture.registerRetention();
        await fixture.client.query(
          `REVOKE USAGE ON SCHEMA retained_extensions FROM PUBLIC,${quoteIdentifier(fixture.otherRole)}`,
        );
        const before = await fixture.snapshot();
        await assert.rejects(fixture.attempt(), new RegExp(`Required runtime role USAGE denied: ${fixture.otherRole}`));
        expect(fixture.calls.runtimeUri).toBe(0);
        expect(await fixture.snapshot()).toEqual(before);
        await fixture.noRuntimeSessions();
      },
      { extensions: {} },
    );
  },
  timeout,
);

for (const damage of ["selected-permission", "retained-evidence", "generated-evidence", "saved-identity"] as const) {
  native(
    `runtime URI callback ${damage} change is rejected before preparing a grant`,
    async () => {
      await withDevRuntimeRequiredApiFixture(
        async (fixture) => {
          if (damage === "retained-evidence") await fixture.registerRetention();
          let afterExternalChange: Awaited<ReturnType<typeof fixture.snapshot>> | undefined;
          fixture.callbacks.runtimeUri = async () => {
            if (damage === "selected-permission")
              await fixture.client.query(
                `REVOKE USAGE ON SCHEMA search_extensions FROM ${quoteIdentifier(fixture.runtimeRole)}`,
              );
            if (damage === "retained-evidence")
              await fixture.client.query(
                "DELETE FROM loom_meta.deployment_activations WHERE deployment='retained'; DELETE FROM loom_meta.runtime_compatibility WHERE deployment='retained'",
              );
            if (damage === "generated-evidence") await rm(join(fixture.generationDirectory, "required-api.json"));
            if (damage === "saved-identity")
              await fixture.client.query("UPDATE loom_meta.development_history SET source_version=repeat('f',64)");
            afterExternalChange = await fixture.snapshot();
          };
          await assert.rejects(
            fixture.attempt(),
            /USAGE denied|retained.*(evidence|identity).*changed|generation.*API|API.*generation|synchronized|history.*changed/i,
          );
          expect(fixture.calls.runtimeUri).toBe(1);
          assert(afterExternalChange);
          expect(await fixture.snapshot()).toEqual(afterExternalChange);
          await fixture.noRuntimeSessions();
        },
        damage === "retained-evidence" ? { extensions: {} } : {},
      );
    },
    timeout,
  );
}

native(
  "native grant preparation damage refuses activation and rolls back procedure history",
  async () => {
    await withDevRuntimeRequiredApiFixture(async (fixture) => {
      await fixture.client.query(`CREATE SCHEMA fixture_probe;
      CREATE SEQUENCE fixture_probe.activation_attempt;
      CREATE FUNCTION fixture_probe.damage() RETURNS trigger LANGUAGE plpgsql AS $fixture$ BEGIN
        IF TG_OP='INSERT' AND NEW.deployment='runtime-api-fixture' THEN
          REVOKE USAGE ON SCHEMA search_extensions FROM ${quoteIdentifier(fixture.runtimeRole)};
        ELSIF TG_OP='UPDATE' AND NEW.state='active' THEN PERFORM nextval('fixture_probe.activation_attempt'); END IF;
        RETURN NEW;
      END; $fixture$;
      CREATE TRIGGER damage_runtime AFTER INSERT OR UPDATE ON loom_meta.deployment_activations FOR EACH ROW EXECUTE FUNCTION fixture_probe.damage()`);
      const before = await fixture.snapshot();
      const procedures = (
        await fixture.client.query("SELECT * FROM loom_meta.procedure_releases ORDER BY deployment,version")
      ).rows;
      await assert.rejects(fixture.attempt(), /Required runtime role USAGE denied/);
      const after = await fixture.snapshot();
      expect(after.activations).toHaveLength(1);
      expect(after.activations[0].state).toBe("quarantined");
      const { activations: _afterActivations, ...afterState } = after;
      const { activations: _beforeActivations, ...beforeState } = before;
      expect(afterState).toEqual(beforeState);
      expect(
        (await fixture.client.query("SELECT * FROM loom_meta.procedure_releases ORDER BY deployment,version")).rows,
      ).toEqual(procedures);
      expect((await fixture.client.query("SELECT is_called FROM fixture_probe.activation_attempt")).rows).toEqual([
        { is_called: false },
      ]);
      await fixture.noRuntimeSessions();
    });
  },
  timeout,
);

for (const damage of ["forged", "legacy"] as const) {
  native(
    `runtime ${damage} framework refuses startup without upgrading metadata`,
    async () => {
      await withDevRuntimeRequiredApiFixture(async (fixture) => {
        if (damage === "forged")
          await fixture.client.query("UPDATE loom_meta.framework_migrations SET hash=repeat('f',64) WHERE version=28");
        else
          await fixture.client.query(
            "ALTER TABLE loom_meta.runtime_compatibility DROP CONSTRAINT runtime_compatibility_required_api_check; ALTER TABLE loom_meta.runtime_compatibility DROP COLUMN required_api,DROP COLUMN runtime_role; DELETE FROM loom_meta.framework_migrations WHERE version=28",
          );
        const before = await fixture.snapshot();
        await assert.rejects(
          fixture.attempt(),
          damage === "forged" ? /framework.*(history|diverged)/i : /synchroniz|sync.*required/i,
        );
        expect(fixture.calls.runtimeUri).toBe(0);
        expect(await fixture.snapshot()).toEqual(before);
        if (damage === "legacy") {
          await fixture.sync();
          await fixture.attempt();
          await fixture.noRuntimeSessions();
          expect(
            (await fixture.client.query("SELECT max(version) AS version FROM loom_meta.framework_migrations")).rows,
          ).toEqual([{ version: 28 }]);
        }
      });
    },
    timeout,
  );
}
