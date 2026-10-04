import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "bun:test";
import { generateRelease, prepareProject } from "kello/tooling";
import { encodeRpcJobCall } from "kello/server";
import { startDevelopmentRuntime } from "../../../apps/loom/src/tooling/dev/runtime";
import { bootstrapSession } from "../../../apps/loom/src/tooling/migrations/bootstrap";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";
import { verifyRetainedApiSnapshot } from "../../../apps/loom/src/tooling/migrations/retained-api";
import {
  assertRuntimeCompatibility,
  RuntimeCompatibilityError,
} from "../../../apps/loom/src/tooling/migrations/runtime-compatibility";
import { withDevRuntimeRetainedApiFixture } from "../fixtures/dev-runtime-retained-api";
import {
  activateLegacyWithoutApi,
  captureRetained,
  genuineVersion28,
  observeNativeQueries,
  ownedDevelopment,
  retainOnly,
  withDualAuthorityFixture,
} from "../fixtures/dev-runtime-retained-api-authority";

const native = test.skipIf(!process.env.LOOM_TEST_DATABASE_URL);
const timeout = 360_000;
const nativeProofRelation = /\bdevelopment_runtime_api\b/i;

native(
  "A to B never-attempted native pending job transfer rolls back with failed proof activation and succeeds atomically on retry",
  async () => {
    await withDevRuntimeRetainedApiFixture(async (fixture) => {
      await mkdir(join(fixture.root, "kello/contracts/internal"), { recursive: true });
      await mkdir(join(fixture.root, "kello/internal"), { recursive: true });
      await writeFile(
        join(fixture.root, "kello/contracts/internal/authority.ts"),
        'import {defineContract,oc} from "kello/contract"; import * as v from "valibot"; export default defineContract({retain:oc.input(v.strictObject({amount:v.number()})).output(v.number())});',
      );
      await writeFile(
        join(fixture.root, "kello/internal/authority.ts"),
        'import {os} from "../_generated/rpc"; export default os.internal.authority.router({retain:os.internal.authority.retain.handler(({input})=>input.amount)});',
      );
      await fixture.sync();
      const a = await prepareProject(fixture.root);
      const startedA = await startDevelopmentRuntime(
        { ...fixture.options, sourceVersion: a.version },
        fixture.provider,
      );
      await startedA.runtime.stop();
      const originalProof = (await fixture.registrations()).filter((row) => row.version === a.version);
      expect(originalProof).toHaveLength(1);
      const call = encodeRpcJobCall(a.version, ["authority", "retain"], { amount: 2 });
      const id = crypto.randomUUID();
      await fixture.client.query(
        `INSERT INTO loom_meta.jobs(id,deployment,deduplication_key,fingerprint,call,identity,due_at,max_attempts,retry_delay_seconds)
         VALUES($1::uuid,$2,'transfer-authority',repeat('6',64),$3::jsonb,'null',clock_timestamp(),1,0)`,
        [id, fixture.options.deployment, JSON.stringify(call)],
      );
      await writeFile(
        join(fixture.root, "kello/upgrade.ts"),
        `import * as v from "valibot"; import {defineJobMigration} from "kello/server"; import router from "./internal/authority";
         export default [defineJobMigration({from:{protocol:"loom-orpc-2",version:${JSON.stringify(a.version)},path:["authority","retain"]},
         input:v.strictObject({amount:v.number()}),to:router.retain,transform:(input)=>({amount:input.amount})})];`,
      );
      await fixture.sync();
      const b = await prepareProject(fixture.root);
      expect(b.version).not.toBe(a.version);
      const beforeJob = (
        await fixture.client.query(
          "SELECT call,claim_version,state,attempts,fencing_token::text FROM loom_meta.jobs WHERE id=$1",
          [id],
        )
      ).rows;
      expect(beforeJob).toEqual([{ call, claim_version: null, state: "pending", attempts: 0, fencing_token: "0" }]);
      await fixture.client.query(`CREATE SCHEMA fixture_probe;
        CREATE SEQUENCE fixture_probe.saw_transferred_registration;
        CREATE TABLE fixture_probe.activation_fault(enabled boolean NOT NULL);
        INSERT INTO fixture_probe.activation_fault VALUES(true);
        CREATE FUNCTION fixture_probe.observe_transferred_registration() RETURNS trigger LANGUAGE plpgsql AS $fixture$
        BEGIN
          IF NEW.state='active' AND OLD.state<>'active' AND EXISTS (
            SELECT 1 FROM loom_meta.jobs j WHERE j.deployment=NEW.deployment AND j.claim_version=NEW.version
              AND j.call->>'version'<>NEW.version AND j.state='pending' AND j.attempts=0
          ) THEN
            IF NOT EXISTS (SELECT 1 FROM loom_meta.development_runtime_api p
              WHERE p.deployment=NEW.deployment AND p.version=NEW.version) THEN
              RAISE EXCEPTION 'Transferred pending work activated without original development API proof';
            END IF;
            PERFORM nextval('fixture_probe.saw_transferred_registration');
            IF (SELECT enabled FROM fixture_probe.activation_fault) THEN
              RAISE EXCEPTION 'Authority transfer activation fault';
            END IF;
          END IF;
          RETURN NEW;
        END;
        $fixture$;
        CREATE TRIGGER observe_transferred_registration BEFORE UPDATE ON loom_meta.deployment_activations
          FOR EACH ROW EXECUTE FUNCTION fixture_probe.observe_transferred_registration()`);
      await assert.rejects(
        startDevelopmentRuntime({ ...fixture.options, sourceVersion: b.version }, fixture.provider),
        /Deployment database activation failed/,
      );
      expect(
        (await fixture.client.query("SELECT is_called FROM fixture_probe.saw_transferred_registration")).rows,
      ).toEqual([{ is_called: true }]);
      expect(
        (
          await fixture.client.query(
            "SELECT call,claim_version,state,attempts,fencing_token::text FROM loom_meta.jobs WHERE id=$1",
            [id],
          )
        ).rows,
      ).toEqual(beforeJob);
      expect(await fixture.registrations()).toEqual(originalProof);
      expect((await fixture.scopes()).filter((scope) => scope.version === b.version)).toEqual([]);
      expect(
        (
          await fixture.client.query("SELECT 1 FROM loom_meta.procedure_releases WHERE deployment=$1 AND version=$2", [
            fixture.options.deployment,
            b.version,
          ])
        ).rows,
      ).toEqual([]);
      expect((await fixture.snapshot()).activations.find((grant) => grant.version === a.version)?.state).toBe("active");
      expect((await fixture.snapshot()).activations.find((grant) => grant.version === b.version)?.state).toBe(
        "quarantined",
      );
      await fixture.noRuntimeSessions();
      await fixture.client.query("UPDATE fixture_probe.activation_fault SET enabled=false");
      const startedB = await startDevelopmentRuntime(
        { ...fixture.options, sourceVersion: b.version },
        fixture.provider,
      );
      await startedB.runtime.stop();
      expect(
        (await fixture.client.query("SELECT is_called FROM fixture_probe.saw_transferred_registration")).rows,
      ).toEqual([{ is_called: true }]);
      expect(
        (
          await fixture.client.query(
            "SELECT call,claim_version,state,attempts,fencing_token::text FROM loom_meta.jobs WHERE id=$1",
            [id],
          )
        ).rows,
      ).toEqual([{ call, claim_version: b.version, state: "pending", attempts: 0, fencing_token: "1" }]);
      const proofs = await fixture.registrations();
      expect(proofs.filter((row) => row.version === a.version)).toEqual(originalProof);
      expect(proofs.filter((row) => row.version === b.version)).toEqual([
        {
          namespace: fixture.namespace,
          deployment: fixture.options.deployment,
          version: b.version,
          required_api: JSON.parse(
            await readFile(join(fixture.root, ".loom/generations", b.version, "required-api.json"), "utf8"),
          ),
          api_absent: false,
          runtime_role: fixture.runtimeRole,
        },
      ]);
      expect((await fixture.snapshot()).compatibility).toEqual([]);
      expect((await fixture.snapshot()).activations.map((grant) => grant.state)).toEqual(["active", "active"]);
      await fixture.noRuntimeSessions();
    });
  },
  timeout,
);

native(
  "an API-only development proof and its persisted component scope cannot establish structural release compatibility",
  async () => {
    await withDevRuntimeRetainedApiFixture(
      async (fixture) => {
        await fixture.attempt();
        const before = await fixture.registrationState();
        const component = fixture.namespaces.find((namespace) => namespace !== fixture.namespace)!;
        expect(before.scopes.some((scope) => scope.namespace === component)).toBe(true);
        const reviewed = await generateRelease(fixture.root, "structural_authority");
        const artifact = reviewed.scopes.find((scope) => scope.namespace === component)!.artifact.plan;
        expect(artifact.hash).toMatch(/^[a-f0-9]{64}$/);
        await assert.rejects(
          ownedDevelopment(fixture, (client) =>
            assertRuntimeCompatibility(
              client,
              { namespace: component, metadataNamespace: "loom_meta" },
              [artifact.hash],
              0,
            ),
          ),
          RuntimeCompatibilityError,
        );
        expect(await fixture.registrationState()).toEqual(before);
        expect((await fixture.snapshot()).release).toEqual([]);
        expect((await fixture.snapshot()).compatibility).toEqual([]);
        await fixture.noRuntimeSessions();
      },
      { component: true },
    );
  },
  timeout,
);

for (const dependency of ["pending", "running", "session"] as const) {
  native(
    `original development API survives ${dependency}-only retention and excludes completed or expired dependencies`,
    async () => {
      await withDevRuntimeRetainedApiFixture(
        async (fixture) => {
          await fixture.attempt();
          const registrations = await fixture.registrationState();
          await retainOnly(fixture, dependency);
          const snapshot = await ownedDevelopment(fixture, async (client) => {
            const snapshot = await captureRetained(client);
            expect(snapshot.proofs).toHaveLength(1);
            const original = snapshot.proofs[0]!;
            expect(original.deployment).toBe(fixture.options.deployment);
            expect(original.version).toBe(fixture.candidate.version);
            expect(original.runtimeRole).toBe(fixture.runtimeRole);
            assert.deepEqual(original.requiredApi, registrations.registrations[0]!.required_api);
            expect(original.namespaces).toEqual(fixture.namespaces);
            await verifyRetainedApiSnapshot(client, snapshot);
            return snapshot;
          });
          expect((await fixture.snapshot()).activations.every((grant) => grant.state !== "active")).toBe(true);
          if (dependency === "running") {
            expect(
              (await fixture.client.query("SELECT call->>'version' AS original,claim_version FROM loom_meta.jobs"))
                .rows,
            ).toEqual([{ original: "8".repeat(64), claim_version: fixture.candidate.version }]);
          }
          // The incoming project deliberately detaches both components; original full scopes remain persisted.
          await writeFile(
            join(fixture.root, "kello/app.config.ts"),
            'import {defineApplication} from "kello/server"; export default defineApplication({rpc:({os})=>({os})});',
          );
          await fixture.selectExtensionFreeIncomingSource();
          await fixture.client.query(
            `REVOKE USAGE ON SCHEMA search_extensions FROM PUBLIC,${quoteIdentifier(fixture.runtimeRole)}`,
          );
          const before = await fixture.snapshot();
          const uriCalls = fixture.calls.runtimeUri;
          await assert.rejects(
            fixture.sync(fixture.otherRole),
            new RegExp(`Required runtime role USAGE denied: ${fixture.runtimeRole}`),
          );
          expect(fixture.calls.runtimeUri).toBe(uriCalls);
          expect(await fixture.snapshot()).toEqual(before);
          expect(await fixture.registrationState()).toEqual(registrations);
          // A selected original remains guarded even after its dependency ceases to retain it.
          if (dependency === "session")
            await fixture.client.query(
              "UPDATE loom_meta.client_sessions SET expires_at=clock_timestamp()-interval '1 second'",
            );
          else
            await fixture.client.query(
              "UPDATE loom_meta.jobs SET state='succeeded',lease_owner=NULL,lease_expires_at=NULL WHERE state IN ('pending','running')",
            );
          await ownedDevelopment(fixture, async (client) => {
            const empty = await captureRetained(client);
            expect(empty.proofs).toEqual([]);
            await verifyRetainedApiSnapshot(client, empty);
            await assert.rejects(
              verifyRetainedApiSnapshot(client, snapshot),
              new RegExp(`Required runtime role USAGE denied: ${fixture.runtimeRole}`),
            );
          });
          await fixture.noRuntimeSessions();
        },
        { component: true, emptyComponent: true },
      );
    },
    timeout,
  );
}

for (const relation of ["development_runtime_api", "runtime_scopes"] as const) {
  native(
    `original development snapshot rejects deleted ${relation} after its selecting job is deleted`,
    async () => {
      await withDevRuntimeRetainedApiFixture(
        async (fixture) => {
          await fixture.attempt();
          await retainOnly(fixture, "pending");
          await ownedDevelopment(fixture, async (client) => {
            const original = await captureRetained(client);
            expect(original.proofs).toHaveLength(1);
            expect(original.proofs[0]!.requiredApi).toEqual(JSON.parse(await fixture.generationBytes()));
            await client.query("DELETE FROM loom_meta.jobs");
            expect((await captureRetained(client)).proofs).toEqual([]);
            // Dependency deletion alone cannot refresh or discard the original snapshot.
            await verifyRetainedApiSnapshot(client, original);
            const removed = fixture.namespaces.find((namespace) => namespace !== fixture.namespace)!;
            await client.query(`DELETE FROM loom_meta.${relation} WHERE namespace=$1`, [removed]);
            const changed = await fixture.registrationState();
            expect((await captureRetained(client)).proofs).toEqual([]);
            await assert.rejects(
              verifyRetainedApiSnapshot(client, original),
              /original.*(evidence|scope)|incomplete.*(scope|identity)/i,
            );
            expect(await fixture.registrationState()).toEqual(changed);
          });
          await fixture.noRuntimeSessions();
        },
        { component: true, emptyComponent: true },
      );
    },
    timeout,
  );
}

native(
  "public development owner refuses an authentic release identity with identical source API",
  async () => {
    await withDualAuthorityFixture(async (fixture) => {
      await fixture.release(true);
      const before = await fixture.proofState();
      expect(before.development).toEqual([]);
      expect(before.release).toHaveLength(1);
      expect(before.release[0]!.minimum_ordinal).toBe(1);
      expect(before.release[0]!.maximum_ordinal).toBe(1);
      expect(before.release[0]!.required_api).not.toBeNull();
      expect(before.release[0]!.version).toBe(fixture.candidate.version);
      await assert.rejects(fixture.start(), /development.*conflicts.*release.*authority/i);
      expect(fixture.calls.runtimeUri).toBe(0);
      expect(await fixture.proofState()).toEqual(before);
    });
  },
  timeout,
);

native(
  "authenticated release writer refuses an original development identity without widening real release history",
  async () => {
    await withDualAuthorityFixture(async (fixture) => {
      await fixture.start();
      const before = await fixture.proofState();
      expect(before.development).toHaveLength(1);
      expect(before.release).toEqual([]);
      await assert.rejects(fixture.release(), /release.*conflicts.*development.*authority/i);
      expect(fixture.calls.releaseCallback).toBe(0);
      expect(await fixture.proofState()).toEqual(before);
    });
  },
  timeout,
);

native(
  "deleting a dependency then replacing development authority with identical authentic release API cannot satisfy its original snapshot",
  async () => {
    await withDualAuthorityFixture(async (fixture) => {
      await fixture.start();
      const originalState = await fixture.proofState();
      const original = await ownedDevelopment(fixture, captureRetained);
      expect(original.proofs).toHaveLength(1);
      expect(original.proofs[0]!.requiredApi).toEqual(originalState.development[0]!.required_api);
      await fixture.client.query("DELETE FROM loom_meta.deployment_activations WHERE deployment=$1 AND version=$2", [
        fixture.options.deployment,
        fixture.candidate.version,
      ]);
      expect((await ownedDevelopment(fixture, captureRetained)).proofs).toEqual([]);
      await ownedDevelopment(fixture, (client) => verifyRetainedApiSnapshot(client, original));
      await fixture.client.query("DELETE FROM loom_meta.development_runtime_api WHERE deployment=$1 AND version=$2", [
        fixture.options.deployment,
        fixture.candidate.version,
      ]);
      // The release owner authenticates the same source, genuine committed artifacts and applied ordinal 1.
      await fixture.release();
      const replacement = await fixture.proofState();
      expect(replacement.development).toEqual([]);
      expect(replacement.release).toHaveLength(1);
      expect(replacement.release[0]!.required_api).toEqual(originalState.development[0]!.required_api);
      expect(replacement.release[0]!.runtime_role).toBe(originalState.development[0]!.runtime_role);
      expect(replacement.history).toEqual(originalState.history);
      expect(replacement.scopes).toEqual(originalState.scopes);
      expect((await ownedDevelopment(fixture, captureRetained)).proofs).toEqual([]);
      await assert.rejects(
        ownedDevelopment(fixture, (client) => verifyRetainedApiSnapshot(client, original)),
        /original.*(evidence|scope).*changed/i,
      );
      expect(await fixture.proofState()).toEqual(replacement);
    });
  },
  timeout,
);

native(
  "an authentic v28 original release snapshot remains release-only after the legitimate v29 upgrade",
  async () => {
    await withDualAuthorityFixture(async (fixture) => {
      await fixture.release(true);
      const saved = (await fixture.proofState()).release;
      const prefix = await genuineVersion28(fixture.client);
      const captured = await observeNativeQueries(() => ownedDevelopment(fixture, captureRetained));
      expect(captured.result.proofs).toHaveLength(1);
      expect(captured.result.proofs[0]!.requiredApi).toEqual(saved[0]!.required_api);
      expect(captured.statements.filter((sql) => nativeProofRelation.test(sql))).toEqual([]);
      await ownedDevelopment(fixture, (client) => bootstrapSession(client, "loom_meta", fixture.runtimeRole));
      expect(
        (await fixture.client.query("SELECT max(version) AS version FROM loom_meta.framework_migrations")).rows,
      ).toEqual([{ version: 29 }]);
      expect(
        (
          await fixture.client.query(
            "SELECT version,hash FROM loom_meta.framework_migrations WHERE version<=28 ORDER BY version",
          )
        ).rows,
      ).toEqual(prefix);
      expect((await fixture.proofState()).development).toEqual([]);
      const checked = await observeNativeQueries(() =>
        ownedDevelopment(fixture, (client) => verifyRetainedApiSnapshot(client, captured.result)),
      );
      expect(checked.statements.filter((sql) => nativeProofRelation.test(sql))).toEqual([]);
      expect((await fixture.proofState()).release).toEqual(saved);
      // The same original v28 snapshot still rejects deletion after the upgrade.
      await fixture.client.query("DELETE FROM loom_meta.deployment_activations");
      await fixture.client.query("DELETE FROM loom_meta.runtime_compatibility");
      await assert.rejects(
        ownedDevelopment(fixture, (client) => verifyRetainedApiSnapshot(client, captured.result)),
        /original.*evidence.*changed/i,
      );
    });
  },
  timeout,
);

native(
  "forged appended v29 hash fails direct startup before querying its physically absent feature relation or runtime URI",
  async () => {
    await withDevRuntimeRetainedApiFixture(async (fixture) => {
      const prefix = await genuineVersion28(fixture.client);
      // Tamper only the appended row; every native version-1–28 hash remains authentic.
      await fixture.client.query("INSERT INTO loom_meta.framework_migrations(version,hash) VALUES(29,repeat('f',64))");
      const before = await fixture.snapshot();
      const observed = await observeNativeQueries(async () => {
        await assert.rejects(fixture.attempt(), /framework.*(current|synchroniz|history)|synchronization.*required/i);
      });
      expect(observed.statements.filter((sql) => nativeProofRelation.test(sql))).toEqual([]);
      expect(fixture.calls.runtimeUri).toBe(0);
      expect(await fixture.snapshot()).toEqual(before);
      expect(
        (
          await fixture.client.query(
            "SELECT version,hash FROM loom_meta.framework_migrations WHERE version<=28 ORDER BY version",
          )
        ).rows,
      ).toEqual(prefix);
      await fixture.noRuntimeSessions();
    });
  },
  timeout,
);

native(
  "genuine v28 direct startup requires authorized synchronization before saving a new original development API",
  async () => {
    await withDevRuntimeRetainedApiFixture(async (fixture) => {
      const prefix = await genuineVersion28(fixture.client);
      const before = await fixture.snapshot();
      const sourceApi = JSON.parse(await fixture.generationBytes());
      const observed = await observeNativeQueries(async () => {
        await assert.rejects(fixture.attempt(), /framework.*(current|synchroniz)|synchronization.*required/i);
      });
      expect(observed.statements.filter((sql) => nativeProofRelation.test(sql))).toEqual([]);
      expect(fixture.calls.runtimeUri).toBe(0);
      expect(await fixture.snapshot()).toEqual(before);
      await fixture.sync();
      expect(await fixture.registrationState()).toEqual({ registrations: [], scopes: [] });
      expect((await fixture.snapshot()).development).toEqual(before.development);
      expect(
        (
          await fixture.client.query(
            "SELECT version,hash FROM loom_meta.framework_migrations WHERE version<=28 ORDER BY version",
          )
        ).rows,
      ).toEqual(prefix);
      await fixture.attempt();
      expect(await fixture.registrations()).toEqual([
        {
          namespace: fixture.namespace,
          deployment: fixture.options.deployment,
          version: fixture.candidate.version,
          required_api: sourceApi,
          api_absent: false,
          runtime_role: fixture.runtimeRole,
        },
      ]);
      expect((await fixture.snapshot()).release).toEqual([]);
      expect((await fixture.snapshot()).compatibility).toEqual([]);
      await fixture.noRuntimeSessions();
    });
  },
  timeout,
);

native(
  "genuine v28 sync upgrades storage but refuses to backfill an already active legacy identity with today's selected pins",
  async () => {
    await withDevRuntimeRetainedApiFixture(async (fixture) => {
      const prefix = await genuineVersion28(fixture.client);
      await activateLegacyWithoutApi(fixture);
      const legacySnapshot = await ownedDevelopment(fixture, captureRetained);
      expect(legacySnapshot.frameworkVersion).toBe(28);
      expect(legacySnapshot.proofs).toEqual([]);
      const before = await fixture.snapshot();
      expect(before.activations).toHaveLength(1);
      expect(before.activations[0]!.state).toBe("active");
      await assert.rejects(fixture.attempt(), /framework.*(current|synchroniz)|synchronization.*required/i);
      expect(fixture.calls.runtimeUri).toBe(0);
      await fixture.sync();
      expect((await fixture.snapshot()).development).toEqual(before.development);
      expect((await fixture.snapshot()).activations).toEqual(before.activations);
      expect((await fixture.snapshot()).jobs).toEqual(before.jobs);
      expect((await fixture.snapshot()).sessions).toEqual(before.sessions);
      expect(await fixture.registrationState()).toEqual({ registrations: [], scopes: [] });
      expect(
        (
          await fixture.client.query(
            "SELECT version,hash FROM loom_meta.framework_migrations WHERE version<=28 ORDER BY version",
          )
        ).rows,
      ).toEqual(prefix);
      await assert.rejects(
        fixture.attempt(),
        /original.*evidence.*missing|legacy.*(identity|register)|original.*proof.*missing/i,
      );
      expect(fixture.calls.runtimeUri).toBe(0);
      expect(await fixture.registrationState()).toEqual({ registrations: [], scopes: [] });
      expect((await fixture.snapshot()).activations).toEqual(before.activations);
      // Database-wide v29 capture must refuse missing authority, even for a genuine
      // retained v28 identity: no per-identity provenance permits reconstructing it.
      await assert.rejects(ownedDevelopment(fixture, captureRetained), /original.*retained.*evidence.*missing/i);
      expect(await fixture.registrationState()).toEqual({ registrations: [], scopes: [] });
      await fixture.selectExtensionFreeIncomingSource();
      const upgraded = await fixture.snapshot();
      const uriCalls = fixture.calls.runtimeUri;
      await assert.rejects(fixture.sync(fixture.otherRole), /original.*retained.*evidence.*missing/i);
      expect(fixture.calls.runtimeUri).toBe(uriCalls);
      expect(await fixture.snapshot()).toEqual(upgraded);
      expect(await fixture.registrationState()).toEqual({ registrations: [], scopes: [] });
      await fixture.noRuntimeSessions();
    });
  },
  timeout,
);

native(
  "runtime preflight requires whole-table SELECT on runtime-readable activation metadata",
  async () => {
    await withDevRuntimeRetainedApiFixture(async (fixture) => {
      await fixture.attempt();
      const original = await fixture.registrationState();
      await fixture.client.query(
        `REVOKE SELECT ON loom_meta.deployment_activations FROM ${quoteIdentifier(fixture.runtimeRole)}`,
      );
      await fixture.client.query(
        `GRANT SELECT (deployment) ON loom_meta.deployment_activations TO ${quoteIdentifier(fixture.runtimeRole)}`,
      );
      expect(
        (
          await fixture.client.query(
            `SELECT has_table_privilege($1::name,'loom_meta.deployment_activations','SELECT') AS table_select,
          has_any_column_privilege($1::name,'loom_meta.deployment_activations','SELECT') AS column_select`,
            [fixture.runtimeRole],
          )
        ).rows,
      ).toEqual([{ table_select: false, column_select: true }]);
      await assert.rejects(fixture.attempt(), /Runtime database preflight failed/);
      expect(await fixture.registrationState()).toEqual(original);
      await fixture.noRuntimeSessions();
    });
  },
  timeout,
);

for (const permission of ["column-select", "column-update", "public-inherited-select"] as const) {
  native(
    `runtime preflight refuses ${permission} authority on original development proof storage`,
    async () => {
      await withDevRuntimeRetainedApiFixture(async (fixture) => {
        await fixture.attempt();
        const original = await fixture.registrationState();
        if (permission === "public-inherited-select")
          await fixture.client.query("GRANT SELECT ON loom_meta.development_runtime_api TO PUBLIC");
        else
          await fixture.client.query(
            `GRANT ${permission === "column-select" ? "SELECT" : "UPDATE"} (required_api)
             ON loom_meta.development_runtime_api TO ${quoteIdentifier(fixture.runtimeRole)}`,
          );
        const privileges = (
          await fixture.client.query(
            `SELECT has_table_privilege($1::name,'loom_meta.development_runtime_api','SELECT') AS table_select,
              has_any_column_privilege($1::name,'loom_meta.development_runtime_api','SELECT') AS column_select,
              has_table_privilege($1::name,'loom_meta.development_runtime_api','UPDATE') AS table_update,
              has_column_privilege($1::name,'loom_meta.development_runtime_api','required_api','UPDATE') AS column_update`,
            [fixture.runtimeRole],
          )
        ).rows[0]!;
        if (permission === "column-select")
          expect(privileges).toEqual({
            table_select: false,
            column_select: true,
            table_update: false,
            column_update: false,
          });
        else if (permission === "column-update")
          expect(privileges).toEqual({
            table_select: false,
            column_select: false,
            table_update: false,
            column_update: true,
          });
        else expect(privileges.table_select).toBe(true);
        const uriCalls = fixture.calls.runtimeUri;
        await assert.rejects(fixture.attempt(), /Runtime database preflight failed/);
        expect(fixture.calls.runtimeUri).toBe(uriCalls + 1);
        expect(await fixture.registrationState()).toEqual(original);
        await fixture.noRuntimeSessions();
      });
    },
    timeout,
  );
}

native(
  "authenticated v29 retention cannot omit a generation whose entire original development proof was deleted",
  async () => {
    await withDevRuntimeRetainedApiFixture(async (fixture) => {
      await fixture.attempt();
      await retainOnly(fixture, "pending");
      const original = await fixture.registrationState();
      expect(original.registrations).toHaveLength(1);
      expect(original.scopes.length).toBeGreaterThan(0);
      const removed = await fixture.client.query(
        "DELETE FROM loom_meta.development_runtime_api WHERE deployment=$1 AND version=$2 RETURNING namespace",
        [fixture.options.deployment, fixture.candidate.version],
      );
      expect(removed.rowCount).toBe(1);
      const missing = await fixture.registrationState();
      expect(missing.registrations).toEqual([]);
      expect(missing.scopes).toEqual(original.scopes);
      expect((await fixture.client.query("SELECT state FROM loom_meta.jobs")).rows).toEqual([{ state: "pending" }]);
      await assert.rejects(
        ownedDevelopment(fixture, captureRetained),
        /original.*retained.*(missing|incomplete)|original.*development.*(missing|incomplete)/i,
      );
      await fixture.selectExtensionFreeIncomingSource();
      const before = await fixture.snapshot();
      const uriCalls = fixture.calls.runtimeUri;
      await assert.rejects(
        fixture.sync(fixture.otherRole),
        /original.*retained.*(missing|incomplete)|original.*development.*(missing|incomplete)/i,
      );
      expect(fixture.calls.runtimeUri).toBe(uriCalls);
      expect(await fixture.snapshot()).toEqual(before);
      expect(await fixture.registrationState()).toEqual(missing);
      await fixture.noRuntimeSessions();
    });
  },
  timeout,
);
