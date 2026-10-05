import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "bun:test";
import { createSnapshot, snapshotHash } from "../../../apps/loom/src/tooling/migrations/adapter";
import { frameworkMigrations } from "../../../apps/loom/src/tooling/migrations/bootstrap";
import { quoteIdentifier, withMigrationConnection } from "../../../apps/loom/src/tooling/migrations/connection";
import { applyMigrations } from "../../../apps/loom/src/tooling/migrations/runner";
import { recordRuntimeCompatibility } from "../../../apps/loom/src/tooling/migrations/runtime-compatibility";
import { projectMigrationScopes } from "../../../apps/loom/src/tooling/migrations/component-scopes";
import { loadProject } from "../../../apps/loom/src/tooling/project/load";
import { inspectReleaseSchema } from "../../../apps/loom/src/tooling/deploy/compatibility";
import { declareProjectCompatibility } from "../../../apps/loom/src/tooling/deploy/neon/declare-compatibility";
import { withNeonReleaseDatabase } from "../../../apps/loom/src/tooling/deploy/neon/release-database";
import { planProjectRelease } from "../../../apps/loom/src/tooling/deploy/neon/plan-release";
import { readNeonReleaseReceipt } from "../../../apps/loom/src/tooling/deploy/neon/release-receipt";
import { historySnapshot, withFrameworkPrefixFixture } from "../fixtures/framework-prefix-readiness";
import {
  completeProviderJournal,
  makeVersion27,
  retainedReleaseSnapshot,
  selectHostAndComponentApis,
  withRetainedReleaseFixture,
  writeReleaseDeclaration,
} from "../fixtures/retained-api-release";
import type { RetainedReleaseFixture } from "../fixtures/retained-api-release";

const usageDenial = /runtime.*USAGE|USAGE.*runtime/i;
const receiptPath = (root: string, key: string) => join(root, ".loom/releases", key, "release.json");

async function denyRetainedUsage(fixture: RetainedReleaseFixture) {
  await fixture.admin.query(
    `REVOKE USAGE ON SCHEMA ${quoteIdentifier(fixture.extensionSchema)} FROM ${quoteIdentifier(fixture.retainedRole)}`,
  );
  const privilege = await fixture.admin.query(
    "SELECT has_schema_privilege($1::name,$3,'USAGE') AS candidate,has_schema_privilege($2::name,$3,'USAGE') AS retained",
    [fixture.runtimeRole, fixture.retainedRole, fixture.extensionSchema],
  );
  assert.deepEqual(privilege.rows, [{ candidate: true, retained: false }]);
}

async function restoreRetainedUsage(fixture: RetainedReleaseFixture) {
  await fixture.admin.query(
    `GRANT USAGE ON SCHEMA ${quoteIdentifier(fixture.extensionSchema)} TO ${quoteIdentifier(fixture.retainedRole)}`,
  );
}

async function addNativeMember(fixture: RetainedReleaseFixture) {
  const schema = quoteIdentifier(fixture.extensionSchema);
  await fixture.admin.query(
    `CREATE FUNCTION ${schema}.retained_release_probe(value text) RETURNS text LANGUAGE SQL IMMUTABLE STRICT AS 'SELECT value'; ALTER EXTENSION pg_trgm ADD FUNCTION ${schema}.retained_release_probe(text)`,
  );
}

async function removeNativeMember(fixture: RetainedReleaseFixture) {
  const schema = quoteIdentifier(fixture.extensionSchema);
  await fixture.admin.query(
    `ALTER EXTENSION pg_trgm DROP FUNCTION ${schema}.retained_release_probe(text); DROP FUNCTION ${schema}.retained_release_probe(text)`,
  );
}

test("source release persists original full host/component generation proof and actual runtime role", async () => {
  await withFrameworkPrefixFixture(async (base) => {
    const fixture = await selectHostAndComponentApis(base);
    await withNeonReleaseDatabase(
      fixture.root,
      fixture.options,
      async ({ journal }) => {
        const meta = quoteIdentifier(fixture.metadataNamespace);
        const proof = await fixture.admin.query(
          `SELECT namespace,required_api,runtime_role FROM ${meta}.runtime_compatibility WHERE deployment=$1 AND version=$2 ORDER BY namespace`,
          [fixture.options.deployment, fixture.options.version],
        );
        assert.deepEqual(
          proof.rows,
          [fixture.namespace, ...fixture.options.componentScopes.map(({ namespace }) => namespace)]
            .sort()
            .map((namespace) => ({
              namespace,
              required_api: fixture.requiredApi,
              runtime_role: fixture.runtimeRole,
            })),
        );
        assert.deepEqual(journal.read().identity.requiredApi, fixture.requiredApi);
        assert.equal(journal.read().format, 3);
        assert.deepEqual(
          (
            await fixture.admin.query(`SELECT migration_hashes FROM ${meta}.runtime_compatibility WHERE namespace=$1`, [
              fixture.namespace,
            ])
          ).rows,
          [{ migration_hashes: fixture.options.migrationHashes }],
        );
      },
      fixture.provider,
    );
    assert.equal(fixture.providerMutations(), 0);
  });
}, 180_000);

test("source extension-free release preserves genuine NULL evidence through compatibility declaration", async () => {
  await withFrameworkPrefixFixture(async (fixture) => {
    await withNeonReleaseDatabase(
      fixture.root,
      fixture.options,
      async ({ activation, journal }) => {
        await activation.activate();
        await completeProviderJournal(journal);
      },
      fixture.provider,
    );
    const before = await historySnapshot(fixture);
    assert.deepEqual(
      before.compatibility.map(({ required_api, runtime_role }) => ({
        required_api,
        runtime_role,
      })),
      [{ required_api: null, runtime_role: null }],
    );
    const receipt = await readFile(receiptPath(fixture.root, fixture.options.releaseKey), "utf8");
    await writeReleaseDeclaration(fixture);
    await declareProjectCompatibility(fixture.root, "release.json", fixture.provider);
    assert.deepEqual(await historySnapshot(fixture), before);
    assert.equal(await readFile(receiptPath(fixture.root, fixture.options.releaseKey), "utf8"), receipt);
    assert.equal(fixture.providerMutations(), 0);
  });
}, 120_000);

for (const original of ["pinned", "legacy"] as const) {
  test(`source compatibility declaration preserves independently registered original ${original} host/component evidence`, async () => {
    await withFrameworkPrefixFixture(async (base) => {
      const fixture = await selectHostAndComponentApis(base);
      const project = await loadProject(fixture.root);
      const originalEvidence =
        original === "pinned" ? { requiredApi: fixture.requiredApi, runtimeRole: fixture.runtimeRole } : undefined;
      // Establish the saved original generation through the existing owner authority,
      // independently of the release registration behavior tested above.
      for (const scope of projectMigrationScopes(project)) {
        await applyMigrations({
          connectionString: fixture.url,
          root: fixture.root,
          migrations: scope.migrations,
          namespace: scope.namespace,
          metadataNamespace: fixture.metadataNamespace,
          runtimeRole: fixture.runtimeRole,
        });
        const declared =
          scope.mountPath === ""
            ? fixture.options
            : fixture.options.componentScopes.find(({ mountPath }) => mountPath === scope.mountPath);
        assert(declared);
        const inspection = await inspectReleaseSchema(fixture.root, {
          namespace: scope.namespace,
          migrations: scope.migrations,
          schema: declared.schema,
          migrationHashes: declared.migrationHashes,
        });
        const sourceSchema = snapshotHash(await createSnapshot(scope.schema));
        await withMigrationConnection(fixture.url, (client) =>
          recordRuntimeCompatibility(client, {
            namespace: scope.namespace,
            metadataNamespace: fixture.metadataNamespace,
            deployment: fixture.options.deployment,
            version: fixture.options.version,
            sourceSchema,
            inspection,
            ...originalEvidence,
          }),
        );
      }
      const address = new URL(fixture.url);
      await fixture.admin.query(
        `INSERT INTO ${quoteIdentifier(fixture.metadataNamespace)}.deployment_activations(deployment,version,project_id,branch_id,endpoint_host,database_name,token_hash,state)
       VALUES($1,$2,'project','br-preview',$3,current_database(),$4,'active')`,
        [
          fixture.options.deployment,
          fixture.options.version,
          address.hostname,
          createHash("sha256").update(fixture.options.activationToken).digest("hex"),
        ],
      );
      await writeReleaseDeclaration(fixture);
      const before = await historySnapshot(fixture);
      await declareProjectCompatibility(fixture.root, "release.json", fixture.provider);
      assert.deepEqual(await historySnapshot(fixture), before);
      assert.deepEqual(
        before.compatibility.map(({ required_api, runtime_role }) => ({
          required_api,
          runtime_role,
        })),
        [1, 2].map(() =>
          original === "pinned"
            ? {
                required_api: fixture.requiredApi,
                runtime_role: fixture.runtimeRole,
              }
            : { required_api: null, runtime_role: null },
        ),
      );
      if (original === "pinned") {
        const declaration = await readFile(join(fixture.root, "release.json"), "utf8");
        await writeFile(
          join(fixture.root, "release.json"),
          JSON.stringify({
            ...JSON.parse(declaration),
            runtimeRole: "different_runtime",
          }),
        );
        await assert.rejects(
          declareProjectCompatibility(fixture.root, "release.json", fixture.provider),
          /required API|runtime role|evidence/i,
        );
        assert.deepEqual(await historySnapshot(fixture), before);
      }
      assert.equal(fixture.providerMutations(), 0);
    });
  }, 120_000);
}

for (const dependency of ["active", "pending", "session"] as const) {
  test(`source extension-free release checks retained component ${dependency} proof before metadata healing or stage advancement`, async () => {
    await withRetainedReleaseFixture(async (fixture) => {
      await denyRetainedUsage(fixture);
      await fixture.admin.query(
        `REVOKE SELECT ON ${quoteIdentifier(fixture.metadataNamespace)}.jobs FROM ${quoteIdentifier(fixture.runtimeRole)}`,
      );
      const before = await retainedReleaseSnapshot(fixture);
      let callbacks = 0;
      const options = {
        ...fixture.options,
        quarantine: dependency === "active" ? ("preserve" as const) : ("clone" as const),
      };
      await assert.rejects(
        withNeonReleaseDatabase(
          fixture.root,
          options,
          async () => {
            callbacks++;
          },
          fixture.provider,
        ),
        usageDenial,
      );
      assert.equal(callbacks, 0);
      assert.deepEqual(await retainedReleaseSnapshot(fixture), before);
      const receipt = await readNeonReleaseReceipt(fixture.root, fixture.options.releaseKey);
      assert.deepEqual(receipt?.completed ?? [], []);
      assert.equal(fixture.providerMutations(), 0);
    }, dependency);
  }, 120_000);
}

test("source extension-free release refuses same-placement retained native member drift before callback and stages", async () => {
  await withRetainedReleaseFixture(async (fixture) => {
    await addNativeMember(fixture);
    try {
      const before = await retainedReleaseSnapshot(fixture);
      let callbacks = 0;
      await assert.rejects(
        withNeonReleaseDatabase(
          fixture.root,
          fixture.options,
          async () => {
            callbacks++;
          },
          fixture.provider,
        ),
        /SQL contract mismatch/,
      );
      assert.equal(callbacks, 0);
      assert.deepEqual(await retainedReleaseSnapshot(fixture), before);
      assert.deepEqual((await readNeonReleaseReceipt(fixture.root, fixture.options.releaseKey))?.completed ?? [], []);
      assert.equal(fixture.providerMutations(), 0);
    } finally {
      await removeNativeMember(fixture);
    }
  });
}, 120_000);

for (const method of ["prepare", "activate", "assertActive"] as const) {
  test(`source wrapped ${method} freshly checks saved retained role and preserves activation and receipt stages`, async () => {
    await withRetainedReleaseFixture(async (fixture) => {
      await withNeonReleaseDatabase(
        fixture.root,
        fixture.options,
        async ({ activation, journal }) => {
          if (method === "assertActive") await activation.activate();
          await denyRetainedUsage(fixture);
          const before = await retainedReleaseSnapshot(fixture);
          const receipt = await readFile(receiptPath(fixture.root, fixture.options.releaseKey), "utf8");
          const stages = journal.read().completed;
          try {
            await assert.rejects(activation[method](), usageDenial);
            assert.deepEqual(await retainedReleaseSnapshot(fixture), before);
            assert.deepEqual(journal.read().completed, stages);
            assert.equal(await readFile(receiptPath(fixture.root, fixture.options.releaseKey), "utf8"), receipt);
          } finally {
            await restoreRetainedUsage(fixture);
          }
          await activation[method]();
        },
        fixture.provider,
      );
      assert.equal(fixture.providerMutations(), 0);
    });
  }, 120_000);
}

for (const removal of ["dependency", "evidence"] as const) {
  for (const method of ["prepare", "activate", "assertActive"] as const) {
    test(`source wrapped ${method} protects original retained snapshot after callback removes ${removal}`, async () => {
      await withRetainedReleaseFixture(async (fixture) => {
        await withNeonReleaseDatabase(
          fixture.root,
          fixture.options,
          async ({ activation, journal }) => {
            if (method === "assertActive") await activation.activate();
            const meta = quoteIdentifier(fixture.metadataNamespace);
            if (removal === "dependency") {
              const deleted = await fixture.admin.query(
                `DELETE FROM ${meta}.client_sessions WHERE deployment='retained'`,
              );
              assert.equal(deleted.rowCount, 1);
              await denyRetainedUsage(fixture);
            } else {
              const deleted = await fixture.admin.query(
                `DELETE FROM ${meta}.runtime_compatibility WHERE namespace=$1 AND deployment='retained'`,
                [fixture.componentNamespace],
              );
              assert.equal(deleted.rowCount, 1);
              const scope = await fixture.admin.query(
                `DELETE FROM ${meta}.runtime_scopes WHERE namespace=$1 AND deployment='retained'`,
                [fixture.componentNamespace],
              );
              assert.equal(scope.rowCount, 1);
            }
            const before = await retainedReleaseSnapshot(fixture);
            const receipt = await readFile(receiptPath(fixture.root, fixture.options.releaseKey), "utf8");
            const stages = journal.read().completed;
            await assert.rejects(
              activation[method](),
              removal === "dependency"
                ? usageDenial
                : /Original retained required API evidence|persisted scope identity changed/i,
            );
            assert.deepEqual(await retainedReleaseSnapshot(fixture), before);
            assert.deepEqual(journal.read().completed, stages);
            assert.equal(await readFile(receiptPath(fixture.root, fixture.options.releaseKey), "utf8"), receipt);
          },
          fixture.provider,
        );
        assert.equal(fixture.providerMutations(), 0);
      });
    }, 120_000);
  }
}

test("source completed exact receipt resume cannot acknowledge away retained component role or native drift", async () => {
  await withRetainedReleaseFixture(async (fixture) => {
    await withNeonReleaseDatabase(
      fixture.root,
      fixture.options,
      async ({ activation, journal }) => {
        await activation.activate();
        await completeProviderJournal(journal);
      },
      fixture.provider,
    );
    const receipt = await readFile(receiptPath(fixture.root, fixture.options.releaseKey), "utf8");
    for (const drift of ["role", "member"] as const) {
      if (drift === "role") await denyRetainedUsage(fixture);
      else await addNativeMember(fixture);
      const before = await retainedReleaseSnapshot(fixture);
      let callbacks = 0;
      try {
        await assert.rejects(
          withNeonReleaseDatabase(
            fixture.root,
            fixture.options,
            async () => {
              callbacks++;
            },
            fixture.provider,
          ),
          drift === "role" ? usageDenial : /SQL contract mismatch/,
        );
        assert.equal(callbacks, 0);
        assert.deepEqual(await retainedReleaseSnapshot(fixture), before);
        assert.equal(await readFile(receiptPath(fixture.root, fixture.options.releaseKey), "utf8"), receipt);
      } finally {
        if (drift === "role") await restoreRetainedUsage(fixture);
        else await removeNativeMember(fixture);
      }
    }
    await withNeonReleaseDatabase(
      fixture.root,
      fixture.options,
      async ({ activation }) => activation.assertActive(),
      fixture.provider,
    );
    assert.equal(await readFile(receiptPath(fixture.root, fixture.options.releaseKey), "utf8"), receipt);
    assert.equal(fixture.providerMutations(), 0);
  });
}, 120_000);

test("source release accepts inherited retained privileges and drained no-op proof without fabricating candidate pins", async () => {
  await withRetainedReleaseFixture(async (fixture) => {
    await fixture.admin.query(
      `GRANT ${quoteIdentifier(fixture.runtimeRole)} TO ${quoteIdentifier(fixture.retainedRole)} WITH INHERIT TRUE`,
    );
    await fixture.admin.query(
      `REVOKE USAGE ON SCHEMA ${quoteIdentifier(fixture.extensionSchema)} FROM ${quoteIdentifier(fixture.retainedRole)}`,
    );
    assert.equal(
      (
        await fixture.admin.query("SELECT has_schema_privilege($1::name,$2,'USAGE') AS allowed", [
          fixture.retainedRole,
          fixture.extensionSchema,
        ])
      ).rows[0].allowed,
      true,
    );
    await withNeonReleaseDatabase(
      fixture.root,
      fixture.options,
      async ({ activation, journal }) => {
        await activation.activate();
        await completeProviderJournal(journal);
      },
      fixture.provider,
    );
    await fixture.admin.query(
      `REVOKE ${quoteIdentifier(fixture.runtimeRole)} FROM ${quoteIdentifier(fixture.retainedRole)}`,
    );
    await fixture.admin.query(
      `UPDATE ${quoteIdentifier(fixture.metadataNamespace)}.client_sessions SET expires_at=clock_timestamp()-interval '1 second' WHERE deployment='retained'`,
    );
    const before = await retainedReleaseSnapshot(fixture);
    assert.equal(before.privileges[0].retained, false);
    const receipt = await readFile(receiptPath(fixture.root, fixture.options.releaseKey), "utf8");
    await withNeonReleaseDatabase(
      fixture.root,
      fixture.options,
      async ({ activation }) => activation.assertActive(),
      fixture.provider,
    );
    assert.deepEqual(await retainedReleaseSnapshot(fixture), before);
    assert.equal(await readFile(receiptPath(fixture.root, fixture.options.releaseKey), "utf8"), receipt);
    assert.deepEqual(
      before.compatibility
        .filter(({ deployment }) => deployment === fixture.options.deployment)
        .map(({ required_api, runtime_role }) => ({
          required_api,
          runtime_role,
        })),
      [{ required_api: null, runtime_role: null }],
    );
    assert.equal(fixture.providerMutations(), 0);
  });
}, 120_000);

for (const drift of ["role", "member"] as const) {
  test(`source readonly current28 planner reports dedicated retained ${drift} blocker for extension-free candidate`, async () => {
    await withRetainedReleaseFixture(async (fixture) => {
      await writeReleaseDeclaration(fixture, "clone");
      if (drift === "role") await denyRetainedUsage(fixture);
      else await addNativeMember(fixture);
      try {
        const before = await retainedReleaseSnapshot(fixture);
        const plan = await planProjectRelease(fixture.root, "release.json", fixture.planner);
        const codes: readonly string[] = plan.blockers.map(({ code }) => code);
        assert(codes.includes("RETAINED_API_UNVERIFIED"));
        assert(!codes.includes("REQUIRED_API_UNVERIFIED"));
        assert(!codes.includes("RETAINED_API_INSPECTION_DEFERRED"));
        assert.equal(plan.migrations.framework.state, "current");
        assert.deepEqual(await retainedReleaseSnapshot(fixture), before);
        await assert.rejects(readFile(receiptPath(fixture.root, fixture.options.releaseKey)), { code: "ENOENT" });
        assert.equal(fixture.providerMutations(), 0);
      } finally {
        if (drift === "role") await restoreRetainedUsage(fixture);
        else await removeNativeMember(fixture);
      }
    });
  }, 120_000);
}

test("source readonly genuine27 plan defers absent API columns while preserving receipt and original metadata observations", async () => {
  await withFrameworkPrefixFixture(async (fixture) => {
    await withNeonReleaseDatabase(
      fixture.root,
      fixture.options,
      async ({ activation, journal }) => {
        await activation.activate();
        await completeProviderJournal(journal);
      },
      fixture.provider,
    );
    await writeReleaseDeclaration(fixture);
    const meta = quoteIdentifier(fixture.metadataNamespace);
    await fixture.admin.query(`UPDATE ${meta}.release_ingress SET state='retired'`);
    await fixture.admin.query(
      `INSERT INTO ${meta}.deployment_activations(deployment,version,project_id,branch_id,endpoint_host,database_name,token_hash,state)
       SELECT deployment,repeat('f',64),project_id,branch_id,endpoint_host,database_name,token_hash,state FROM ${meta}.deployment_activations WHERE version=$1`,
      [fixture.options.version],
    );
    await fixture.admin.query(
      `INSERT INTO ${meta}.function_ownership(project_id,branch_id,slug,deployment,version,role) VALUES('project','br-preview','oldworker',$1,repeat('f',64),'worker')`,
      [fixture.options.deployment],
    );
    await makeVersion27(fixture);
    const before = await historySnapshot(fixture);
    assert.equal(before.framework.length, 27);
    assert(!Object.hasOwn(before.compatibility[0], "required_api"));
    const receipt = await readFile(receiptPath(fixture.root, fixture.options.releaseKey), "utf8");
    const plan = await planProjectRelease(fixture.root, "release.json", fixture.planner);
    const codes: readonly string[] = plan.blockers.map(({ code }) => code);
    assert(codes.includes("RETAINED_API_INSPECTION_DEFERRED"));
    assert.equal(codes.filter((code) => code === "FRAMEWORK_UPGRADE_REQUIRED").length, 1);
    assert(codes.includes("RELEASE_SUPERSEDED"));
    assert(!codes.includes("RETAINED_API_UNVERIFIED"));
    assert(!codes.includes("DATABASE_INCONSISTENT"));
    assert.equal(plan.metadata, "bootstrap-existing");
    assert.deepEqual(plan.ingressHandoff.retainedWorkers, ["oldworker"]);
    assert.deepEqual(plan.migrations.framework, {
      state: "upgrade-required",
      appliedVersion: 27,
      pending: frameworkMigrations(fixture.metadataNamespace)
        .slice(27)
        .map(({ version, hash }) => ({ version, hash })),
    });
    assert.deepEqual(await historySnapshot(fixture), before);
    assert.equal(await readFile(receiptPath(fixture.root, fixture.options.releaseKey), "utf8"), receipt);
    assert.equal(fixture.providerMutations(), 0);
  });
}, 120_000);

test("source completed genuine27 resume installs28 without quarantine replay, receipt rewrite or legacy backfill", async () => {
  await withFrameworkPrefixFixture(async (fixture) => {
    await withNeonReleaseDatabase(
      fixture.root,
      fixture.options,
      async ({ activation, journal }) => {
        await activation.activate();
        await completeProviderJournal(journal);
      },
      fixture.provider,
    );
    await fixture.admin.query(`INSERT INTO ${quoteIdentifier(fixture.namespace)}.tasks(title) VALUES ('preserved')`);
    await fixture.admin.query(
      `INSERT INTO ${quoteIdentifier(fixture.metadataNamespace)}.jobs(id,deployment,deduplication_key,fingerprint,call,identity,due_at,max_attempts,retry_delay_seconds)
       VALUES(uuidv7(),'preview','keep',repeat('a',64),'{}','{}',clock_timestamp(),1,0)`,
    );
    const original = await historySnapshot(fixture);
    const receipt = await readFile(receiptPath(fixture.root, fixture.options.releaseKey), "utf8");
    await makeVersion27(fixture);
    let callbacks = 0;
    await withNeonReleaseDatabase(
      fixture.root,
      fixture.options,
      async ({ activation }) => {
        callbacks++;
        await activation.assertActive();
      },
      fixture.provider,
    );
    assert.equal(callbacks, 1);
    assert.deepEqual(await historySnapshot(fixture), original);
    assert.equal(await readFile(receiptPath(fixture.root, fixture.options.releaseKey), "utf8"), receipt);
    assert.equal(fixture.providerMutations(), 0);
  });
}, 120_000);
