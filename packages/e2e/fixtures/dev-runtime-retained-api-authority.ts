import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";
import * as v from "valibot";
import { generateRelease, prepareProject } from "kello/tooling";
import { encodeRpcJobCall } from "kello/server";
import { withDevelopmentConnection } from "../../../apps/loom/src/tooling/dev/connection";
import { startDevelopmentRuntime } from "../../../apps/loom/src/tooling/dev/runtime";
import { activateGrant, prepareGrant } from "../../../apps/loom/src/tooling/deploy/neon/activation";
import { inspectReleaseSchema } from "../../../apps/loom/src/tooling/deploy/compatibility";
import { inspectReleaseRequiredApi } from "../../../apps/loom/src/tooling/deploy/neon/required-api-release";
import { createSnapshot, snapshotHash } from "../../../apps/loom/src/tooling/migrations/adapter";
import { frameworkMigrations } from "../../../apps/loom/src/tooling/migrations/bootstrap";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";
import { classifyFrameworkHistory } from "../../../apps/loom/src/tooling/migrations/framework-history";
import { readRetainedApiSnapshot } from "../../../apps/loom/src/tooling/migrations/retained-api";
import { recordRuntimeCompatibility } from "../../../apps/loom/src/tooling/migrations/runtime-compatibility";
import { verifyRequiredApiOnTarget } from "../../../apps/loom/src/tooling/migrations/required-api-verification";
import { applyMigrations } from "../../../apps/loom/src/tooling/migrations/runner";
import { loadProject } from "../../../apps/loom/src/tooling/project/load";
import { withDevRequiredApiFixture } from "./dev-required-api";
import { withDevRuntimeRetainedApiFixture } from "./dev-runtime-retained-api";

type DevelopmentBase = Parameters<Parameters<typeof withDevRequiredApiFixture>[0]>[0];
type RetainedBase = Parameters<Parameters<typeof withDevRuntimeRetainedApiFixture>[0]>[0];
type NativeQueryResult = pg.Submittable | Promise<pg.QueryResult | pg.QueryArrayResult<unknown[]>> | void;

export async function ownedDevelopment<T>(base: DevelopmentBase, operation: (client: pg.Client) => Promise<T>) {
  const project = await loadProject(base.root);
  return withDevelopmentConnection(
    { ...base.options, config: project.config },
    (client) => operation(client),
    base.provider,
  );
}

/** Derive readiness only from the actual native ledger and immutable framework SQL hashes. */
export async function nativeFramework(client: pg.Client) {
  const relations = (
    await client.query<{ metadata: boolean; framework: boolean; migrations: boolean }>(
      `SELECT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='loom_meta') AS metadata,
       to_regclass('loom_meta.framework_migrations') IS NOT NULL AS framework,
       to_regclass('loom_meta.migration_history') IS NOT NULL AS migrations`,
    )
  ).rows[0]!;
  const applied = (
    await client.query<{ version: number; hash: string }>(
      "SELECT version,hash FROM loom_meta.framework_migrations ORDER BY version",
    )
  ).rows;
  const framework = classifyFrameworkHistory({
    metadataExists: relations.metadata,
    frameworkHistoryExists: relations.framework,
    migrationHistoryExists: relations.migrations,
    applied,
    expected: frameworkMigrations("loom_meta"),
  });
  assert.notEqual(framework.state, "diverged", "Fixture requires an authentic framework prefix");
  return framework;
}

export async function captureRetained(client: pg.Client) {
  const snapshot = await readRetainedApiSnapshot(client, "loom_meta", await nativeFramework(client));
  assert(snapshot, "Native prefix must support saved original API evidence");
  return snapshot;
}

/** Remove the actual appended relation as well as its ledger suffix; never rewrite versions 1–28. */
export async function genuineVersion28(client: pg.Client) {
  const original = (
    await client.query<{ version: number; hash: string }>(
      "SELECT version,hash FROM loom_meta.framework_migrations WHERE version<=28 ORDER BY version",
    )
  ).rows;
  assert.deepEqual(
    original,
    frameworkMigrations("loom_meta")
      .slice(0, 28)
      .map(({ version, hash }) => ({ version, hash })),
  );
  await client.query("BEGIN");
  try {
    await client.query("DROP TABLE IF EXISTS loom_meta.development_runtime_api");
    await client.query("DELETE FROM loom_meta.framework_migrations WHERE version>28");
    await client.query("COMMIT");
  } catch (cause) {
    await client.query("ROLLBACK");
    throw cause;
  }
  assert.deepEqual(
    (await client.query("SELECT version,hash FROM loom_meta.framework_migrations ORDER BY version")).rows,
    original,
  );
  assert.deepEqual((await client.query("SELECT to_regclass('loom_meta.development_runtime_api') AS relation")).rows, [
    { relation: null },
  ]);
  return original;
}

/** Record and forward real pg queries. This observer never supplies catalogue or service results. */
export async function observeNativeQueries<T>(operation: () => Promise<T>) {
  const original = pg.Client.prototype.query;
  const statements: string[] = [];
  pg.Client.prototype.query = new Proxy(original, {
    apply(target, receiver, args) {
      const query = v.safeParse(
        v.union([
          v.string(),
          v.pipe(
            v.object({ text: v.string() }),
            v.transform(({ text }) => text),
          ),
        ]),
        args[0],
      );
      if (query.success) statements.push(query.output);
      // SAFETY: The proxy forwards the original receiver and every argument unchanged. Widening
      // the overloaded signature here only permits forwarding; it does not invent query results.
      const forward = target as (this: pg.Client, ...parameters: unknown[]) => NativeQueryResult;
      return forward.apply(receiver, args);
    },
  });
  try {
    return { result: await operation(), statements };
  } finally {
    pg.Client.prototype.query = original;
  }
}

export async function retainOnly(base: RetainedBase, dependency: "pending" | "running" | "session") {
  await base.client.query(
    "UPDATE loom_meta.deployment_activations SET state='quarantined' WHERE deployment=$1 AND version=$2",
    [base.options.deployment, base.candidate.version],
  );
  if (dependency === "session") {
    await base.client.query(
      `INSERT INTO loom_meta.client_sessions(namespace,deployment,version,ticket_hash,expires_at)
       VALUES($1,$2,$3,repeat('6',64),clock_timestamp()+interval '1 hour')`,
      [base.namespace, base.options.deployment, base.candidate.version],
    );
    return;
  }
  const originalVersion = dependency === "running" ? "8".repeat(64) : base.candidate.version;
  await base.client.query(
    `INSERT INTO loom_meta.jobs(id,deployment,deduplication_key,fingerprint,call,identity,due_at,max_attempts,
      retry_delay_seconds,state,claim_version,lease_version,lease_owner,lease_expires_at)
     VALUES(uuidv7(),$1,$2,repeat('6',64),$3::jsonb,'null',clock_timestamp(),1,0,$4,$5,$5,$6,$7)`,
    [
      base.options.deployment,
      `authority-${dependency}`,
      JSON.stringify(encodeRpcJobCall(originalVersion, ["authority", "retain"], { amount: 2 })),
      dependency,
      dependency === "running" ? base.candidate.version : null,
      dependency === "running" ? "retained-authority-worker" : null,
      dependency === "running" ? new Date(Date.now() + 3_600_000) : null,
    ],
  );
}

/** The existing owned grant writer does not infer or save API proof; the legacy test invokes it on genuine v28. */
export async function activateLegacyWithoutApi(
  base: DevelopmentBase & {
    candidate: { version: string };
    options: DevelopmentBase["options"] & { deployment: string; activationToken: string };
  },
) {
  const project = await loadProject(base.root);
  await withDevelopmentConnection(
    { ...base.options, config: project.config },
    async (client, target, database) => {
      const binding = {
        metadataNamespace: project.config.database.metadataNamespace,
        deployment: base.options.deployment,
        version: base.candidate.version,
        projectId: target.projectId,
        branchId: target.branchId,
        branchName: target.branchName,
        endpointHost: database.endpointHost,
        databaseName: database.databaseName,
      };
      const tokenHash = createHash("sha256").update(base.options.activationToken).digest("hex");
      await prepareGrant(client, binding, tokenHash);
      await activateGrant(client, binding, tokenHash);
    },
    base.provider,
  );
}

/** One real source generation participates in both authority paths. Its release has actual ordinal-1 history. */
export async function withDualAuthorityFixture(
  operation: (fixture: Awaited<ReturnType<typeof createDualAuthorityFixture>>) => Promise<void>,
) {
  await withDevRequiredApiFixture(async (base) => {
    const runtimes: Awaited<ReturnType<typeof startDevelopmentRuntime>>["runtime"][] = [];
    try {
      await operation(await createDualAuthorityFixture(base, runtimes));
    } finally {
      await Promise.all(runtimes.map((runtime) => runtime.stop()));
    }
  });
}

async function createDualAuthorityFixture(
  base: DevelopmentBase,
  runtimes: Awaited<ReturnType<typeof startDevelopmentRuntime>>["runtime"][],
) {
  await writeFile(
    join(base.root, "kello/auth.config.ts"),
    'import {defineRpcAuth} from "kello/server"; export default defineRpcAuth({allowAnonymous:true,authorize:()=>{}});',
  );
  const artifact = await generateRelease(base.root, "authority_baseline");
  const project = await loadProject(base.root);
  await prepareProject(base.root);
  await applyMigrations({
    connectionString: base.url,
    root: base.root,
    namespace: base.namespace,
    metadataNamespace: "loom_meta",
    runtimeRole: base.runtimeRole,
    migrations: project.config.database.migrations,
    expectedHashes: [artifact.plan.hash],
    reviewedHashes: [artifact.plan.hash],
  });
  const sync = await base.sync();
  const candidate = await prepareProject(base.root);
  assert.equal(candidate.version, sync.sourceVersion);
  assert.equal((await loadProject(base.root)).version, candidate.version);
  assert.deepEqual(
    (
      await base.client.query("SELECT ordinal,hash FROM loom_meta.migration_history WHERE namespace=$1", [
        base.namespace,
      ])
    ).rows,
    [{ ordinal: 1, hash: artifact.plan.hash }],
  );
  await base.client.query(`ALTER ROLE ${quoteIdentifier(base.runtimeRole)} LOGIN PASSWORD 'runtime-test-only'`);
  const runtimeAddress = new URL(base.url);
  runtimeAddress.username = base.runtimeRole;
  runtimeAddress.password = "runtime-test-only";
  const calls = { runtimeUri: 0, releaseCallback: 0 };
  const provider = {
    ...base.provider,
    getConnectionUri: async (...args: Parameters<typeof base.provider.getConnectionUri>) => {
      if (args[1].roleName !== base.runtimeRole) return base.provider.getConnectionUri(...args);
      calls.runtimeUri++;
      return { uri: runtimeAddress.href };
    },
  };
  const options = {
    ...base.options,
    sourceVersion: candidate.version,
    deployment: "authority-fixture",
    activationToken: "e".repeat(64),
  };
  async function start() {
    const started = await startDevelopmentRuntime(options, provider);
    runtimes.push(started.runtime);
    await started.runtime.stop();
  }
  async function release(activate = false) {
    const source = await loadProject(base.root);
    assert.equal(source.version, candidate.version);
    const sourceSchema = snapshotHash(await createSnapshot(source.schema));
    const inspection = await inspectReleaseSchema(base.root, {
      namespace: base.namespace,
      migrations: source.config.database.migrations,
      migrationHashes: [artifact.plan.hash],
      schema: {
        minimum: artifact.plan.after,
        maximum: artifact.plan.after,
        target: artifact.plan.after,
      },
    });
    assert.equal(inspection.minimumOrdinal, 1);
    assert.equal(inspection.maximumOrdinal, 1);
    assert(inspection.schemas.includes(sourceSchema));
    const requiredApi = await inspectReleaseRequiredApi(source);
    assert(requiredApi);
    await ownedDevelopment(base, async (client) => {
      assert.equal(
        (
          await client.query(
            "SELECT nspowner=(SELECT oid FROM pg_roles WHERE rolname=current_user) AS owned FROM pg_namespace WHERE nspname='loom_meta'",
          )
        ).rows[0]?.owned,
        true,
      );
      await nativeFramework(client);
      for (const scope of requiredApi.scopes)
        await verifyRequiredApiOnTarget(client, scope.requiredApi, base.runtimeRole);
      await recordRuntimeCompatibility(client, {
        namespace: base.namespace,
        metadataNamespace: "loom_meta",
        deployment: options.deployment,
        version: candidate.version,
        sourceSchema,
        inspection,
        requiredApi,
        runtimeRole: base.runtimeRole,
      });
    });
    calls.releaseCallback++;
    if (activate) await activateLegacyWithoutApi({ ...base, candidate, options });
  }
  async function proofState() {
    return {
      development: (
        await base.client.query("SELECT * FROM loom_meta.development_runtime_api ORDER BY namespace,deployment,version")
      ).rows,
      release: (
        await base.client.query("SELECT * FROM loom_meta.runtime_compatibility ORDER BY namespace,deployment,version")
      ).rows,
      scopes: (await base.client.query("SELECT * FROM loom_meta.runtime_scopes ORDER BY namespace,deployment,version"))
        .rows,
      history: (await base.client.query("SELECT * FROM loom_meta.migration_history ORDER BY namespace,ordinal")).rows,
    };
  }
  return { ...base, candidate, options, calls, start, release, proofState };
}
