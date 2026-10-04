import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, test } from "bun:test";
import type pg from "pg";
import { planProjectRelease, withNeonReleaseDatabase } from "kello/tooling";
import { validateGenerationRequiredApi } from "../../../apps/loom/src/tooling/codegen/required-api";
import { readNeonReleaseReceipt } from "../../../apps/loom/src/tooling/deploy/neon/release-receipt";
import reviewedGraph from "../../../apps/loom/src/tooling/extensions/text-search-contracts/unaccent.json";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";
import { requiredApiHash } from "../../../apps/loom/src/tooling/migrations/required-api";
import {
  completeProviderJournal,
  retainedReleaseSnapshot,
  writeReleaseDeclaration,
} from "../fixtures/retained-api-release";
import type { RetainedReleaseFixture } from "../fixtures/retained-api-release";
import {
  discoverAlternateRules,
  driftDictionary,
  driftRules,
  lifecycle,
  observeGraph,
  readRetainedEvidence,
  registerUnaccentRetention,
  replaceRetainedEvidence,
  replaceSavedPin,
  restoreDictionary,
  restoreRules,
  restoreSavedPin,
  retainedUnaccentSchema,
  targetIsSuperuser,
  unaccentExtensions,
  unaccentGraphDigest,
  unaccentManifestDigest,
  unaccentSchema,
  withAlternateGraph,
  withAlternateGraphEvidence,
  withUnaccentDevRuntime,
  withUnaccentRetainedReleaseFixture,
  writeGenerationEvidence,
  type LifecycleEntry,
} from "../fixtures/unaccent-required-api-lifecycle";

// Every case imports the public `kello/tooling` (through the fixture), so a built `kello` package is required for the
// whole file, including the `source` entries. `source` and `public` differ only in which synchronizeDevelopment /
// startDevelopmentRuntime module instance runs; both are named in each test title.
const url = process.env.LOOM_TEST_DATABASE_URL;
const timeout = 360_000;
const entries: readonly LifecycleEntry[] = ["source", "public"];
const unreviewedPin = /reviewed matching pin/i;
const generationRefusal = /pinned text-search contract|generation.*API|API.*generation/i;
const receiptPath = (root: string, key: string) => join(root, ".loom/releases", key, "release.json");

// Positive target drift mutates an extension-owned dictionary and needs a superuser migration role. A target that
// cannot (a provider-owned extension) is reported by the observation test and leaves this obligation UNRESOLVED.
const superuser = url ? await targetIsSuperuser() : false;
// Digest-comparison drift additionally needs a genuinely installed alternative rules file that the target itself
// accepts as Unaccent rules. It is discovered natively; absence leaves digest comparison UNRESOLVED. A capture or digest
// regression after the target accepted a candidate fails the file; it is never converted into a skip.
const alternateRules = url && superuser ? await discoverAlternateRules() : undefined;
const native = test.skipIf(!url);
const positive = test.skipIf(!url || !superuser);
const alternate = test.skipIf(!url || !superuser || !alternateRules);
const observation = test.skipIf(!url || superuser);
if (url && !superuser)
  console.warn("UNRESOLVED POSITIVE UNACCENT GRAPH DRIFT: the target migration role is not a superuser");
else if (url && !alternateRules)
  console.warn(
    "UNRESOLVED UNACCENT DIGEST-COMPARISON DRIFT: no installed alternative rules file is accepted as Unaccent rules on this target",
  );

async function columnNames(client: pg.Client) {
  return (
    await client.query<{ column_name: string }>(
      "SELECT column_name FROM information_schema.columns WHERE table_schema='app' AND table_name='tasks' ORDER BY column_name",
    )
  ).rows.map((row) => row.column_name);
}

/** Two different things a native drift can prove; they are never interchangeable. */
interface DriftKind {
  readonly name: string;
  readonly apply: (client: pg.Client, schema: string) => Promise<void>;
  readonly restore: (client: pg.Client, schema: string) => Promise<void>;
  /** Native witness taken before any lifecycle entry runs. */
  readonly witness: (client: pg.Client) => Promise<void>;
  readonly refusal: RegExp;
  readonly run: typeof positive;
}
// STRUCTURAL: the dictionary now uses pg_catalog.simple, so the native graph capture itself refuses. This proves the
// structural capture path only; it never reaches a digest comparison.
const structural: DriftKind = {
  name: "structurally invalid dictionary (capture refuses)",
  apply: driftDictionary,
  restore: restoreDictionary,
  witness: async (client) => {
    await assert.rejects(observeGraph(client), /foreign|cross-schema/i);
  },
  refusal: /text-search catalogue reference/i,
  run: positive,
};
// DIGEST: same owner, template and callbacks, different installed RULES. Native capture SUCCEEDS and only the graph
// digest differs, so the lifecycle refusal can come only from comparing the live graph with the pin.
const digest: DriftKind = {
  name: "structurally valid alternate-rules graph (capture succeeds, digest differs)",
  apply: async (client, schema) => {
    assert(alternateRules);
    await driftRules(client, schema, alternateRules);
  },
  restore: restoreRules,
  witness: async (client) => {
    assert(alternateRules);
    const drifted = await observeGraph(client);
    expect(drifted.digest).not.toBe(unaccentGraphDigest);
    const [dictionary] = drifted.contract.dictionaries;
    expect(dictionary?.options).toBe(`rules = '${alternateRules}'`);
    expect(dictionary?.options).not.toBe(reviewedGraph.contract.dictionaries[0]!.options);
    expect(dictionary?.template).toBe(reviewedGraph.contract.dictionaries[0]!.template);
    expect(drifted.contract.templates).toEqual(reviewedGraph.contract.templates);
  },
  refusal: /text-search contract mismatch/i,
  run: alternate,
};
const driftKinds: readonly DriftKind[] = [structural, digest];

for (const entry of entries) {
  native(
    `${entry} entry persists the exact reviewed Unaccent graph in generation and history, then honours it at runtime start`,
    async () => {
      await withUnaccentDevRuntime(async (fixture) => {
        // Generation emitted the selected adapter binding for the actual configured placement.
        const bindings = await readFile(join(fixture.root, "kello/_generated/extensions.ts"), "utf8");
        expect(bindings).toContain('import { createUnaccent_1_1 } from "kello/extensions/unaccent";');
        expect(bindings).toContain(JSON.stringify(unaccentExtensions));
        // Generation persisted the supplemental graph beside the manifest pin, and it is the reviewed graph.
        const generation = JSON.parse(await fixture.generationBytes());
        expect(generation.scopes).toHaveLength(1);
        const scope = generation.scopes[0];
        expect([scope.mountPath, scope.namespace]).toEqual(["", "app"]);
        expect(scope.requiredApi.apis).toHaveLength(1);
        const [api] = scope.requiredApi.apis;
        expect(api.schema).toBe(unaccentSchema);
        expect(api.manifest.digest).toBe(unaccentManifestDigest);
        expect(api.textSearch.digest).toBe(unaccentGraphDigest);
        expect(api.textSearch.digest).toBe(reviewedGraph.digest);
        expect(api.textSearch.contract).toEqual(reviewedGraph.contract);
        // The initial history head was written by the fixture's own sync, not by this entry; the pin written by this
        // entry's pending sync is asserted separately below.
        const saved = (await fixture.history())[0]!.artifact;
        assert(saved.format === 3 && saved.requiredApi);
        expect(saved.requiredApi.apis[0]!.textSearch?.digest).toBe(unaccentGraphDigest);
        expect(requiredApiHash(saved.requiredApi)).toBe(requiredApiHash(scope.requiredApi));
        // Native observation of the target the pins describe (not an orchestration claim).
        expect(
          (
            await fixture.client.query(
              "SELECT e.extversion AS version,n.nspname AS schema FROM pg_catalog.pg_extension e JOIN pg_catalog.pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='unaccent'",
            )
          ).rows,
        ).toEqual([{ version: "1.1", schema: unaccentSchema }]);
        expect((await observeGraph(fixture.client)).digest).toBe(unaccentGraphDigest);

        const driver = lifecycle(fixture, entry);
        const history = await fixture.history();
        expect((await driver.sync()).applied).toBe(false);
        const binding = await driver.attempt();
        expect(binding.version).toBe(fixture.candidate.version);
        expect(fixture.calls.runtimeUri).toBe(1);
        await fixture.noRuntimeSessions();
        expect(await fixture.history()).toEqual(history);
        await fixture.client.query(`GRANT ${quoteIdentifier(fixture.runtimeRole)} TO CURRENT_USER`);
        await fixture.client.query(`SET ROLE ${quoteIdentifier(fixture.runtimeRole)}`);
        try {
          expect(
            (await fixture.client.query(`SELECT ${quoteIdentifier(unaccentSchema)}.unaccent('Hôtel') AS value`)).rows,
          ).toEqual([{ value: "Hotel" }]);
        } finally {
          await fixture.client.query("RESET ROLE");
        }
      });
    },
    timeout,
  );

  native(
    `${entry} entry applies a healthy pending change and persists a complete Unaccent graph pin in the new head and generation`,
    async () => {
      await withUnaccentDevRuntime(async (fixture) => {
        const driver = lifecycle(fixture, entry);
        const initial = (await fixture.history()).at(-1)!;
        const candidate = await fixture.schema(", description:s.text()");
        expect(candidate.version).not.toBe(fixture.candidate.version);
        const receipt = await driver.sync();
        expect(receipt.applied).toBe(true);
        // The latest head is the record THIS entry wrote, not the fixture's initial source-written history.
        const history = await fixture.history();
        expect(history).toHaveLength(2);
        const head = history.at(-1)!;
        expect(head.artifact_hash).not.toBe(initial.artifact_hash);
        expect(head.source_version).toBe(candidate.version);
        assert(head.artifact.format === 3 && head.artifact.requiredApi);
        const pin = head.artifact.requiredApi;
        expect(pin.apis).toHaveLength(1);
        const [api] = pin.apis;
        expect(api!.schema).toBe(unaccentSchema);
        expect(api!.manifest.digest).toBe(unaccentManifestDigest);
        expect(api!.textSearch?.digest).toBe(unaccentGraphDigest);
        expect(api!.textSearch?.contract).toEqual(reviewedGraph.contract);
        // The new generation persisted the same complete pin.
        const generation = JSON.parse(
          await readFile(join(fixture.root, ".loom/generations", candidate.version, "required-api.json"), "utf8"),
        );
        expect(requiredApiHash(pin)).toBe(requiredApiHash(generation.scopes[0].requiredApi));
        expect(generation.scopes[0].requiredApi.apis[0].textSearch.digest).toBe(unaccentGraphDigest);
        expect(await columnNames(fixture.client)).toContain("description");
        // The new generation starts through the same entry and leaves the history it wrote untouched.
        const binding = await driver.attempt(candidate.version);
        expect(binding.version).toBe(candidate.version);
        expect(fixture.calls.runtimeUri).toBe(1);
        await fixture.noRuntimeSessions();
        expect(await fixture.history()).toEqual(history);
      });
    },
    timeout,
  );

  for (const kind of driftKinds) {
    kind.run(
      `${entry} development refuses ${kind.name} before runtime credentials or DDL, then restoration resumes`,
      async () => {
        await withUnaccentDevRuntime(async (fixture) => {
          const driver = lifecycle(fixture, entry);
          expect((await observeGraph(fixture.client)).digest).toBe(unaccentGraphDigest);
          const original = await columnNames(fixture.client);
          await kind.apply(fixture.client, unaccentSchema);
          try {
            await kind.witness(fixture.client);
            const before = await fixture.snapshot();
            const history = await fixture.history();
            await assert.rejects(driver.attempt(), kind.refusal);
            expect(fixture.calls.runtimeUri).toBe(0);
            expect(await fixture.snapshot()).toEqual(before);
            await fixture.noRuntimeSessions();
            // Even a no-op candidate is refused: the saved head pin is checked before bootstrap.
            await assert.rejects(driver.sync(), kind.refusal);
            expect(await fixture.snapshot()).toEqual(before);
            // A real pending change is never applied while the graph disagrees.
            await fixture.schema(", description:s.text()");
            await assert.rejects(driver.sync(), kind.refusal);
            expect(await fixture.snapshot()).toEqual(before);
            expect(await fixture.history()).toEqual(history);
            expect(await columnNames(fixture.client)).toEqual(original);
          } finally {
            await kind.restore(fixture.client, unaccentSchema);
          }
          expect((await observeGraph(fixture.client)).digest).toBe(unaccentGraphDigest);
          // After restoration the same entry applies the pending change and writes its own complete pin.
          expect((await driver.sync()).applied).toBe(true);
          const history = await fixture.history();
          expect(history).toHaveLength(2);
          const head = history.at(-1)!.artifact;
          assert(head.format === 3 && head.requiredApi);
          expect(head.requiredApi.apis[0]!.textSearch?.digest).toBe(unaccentGraphDigest);
          expect(await columnNames(fixture.client)).toContain("description");
        });
      },
      timeout,
    );

    kind.run(
      `${entry} development with an extension-free incoming source refuses retained ${kind.name} before credentials or DDL`,
      async () => {
        await withUnaccentDevRuntime(
          async (fixture) => {
            const retained = await registerUnaccentRetention(fixture);
            const driver = lifecycle(fixture, entry);
            // The incoming project selects no extension and persisted no generation API evidence of its own.
            await assert.rejects(fixture.generationBytes(), { code: "ENOENT" });
            const saved = (await fixture.history())[0]!.artifact;
            expect(saved.format === 3 ? saved.requiredApi : undefined).toBeUndefined();
            // The original retained evidence, as persisted, carries the exact graph under its distinct role.
            const evidence = await readRetainedEvidence(fixture.client, "component_retained");
            assert(evidence.required_api);
            expect(evidence.runtime_role).toBe(retained.role);
            expect(evidence.required_api.scopes[0]!.requiredApi.apis[0]!.textSearch?.digest).toBe(unaccentGraphDigest);
            expect((await driver.sync()).applied).toBe(false);
            const original = await columnNames(fixture.client);

            await kind.apply(fixture.client, retainedUnaccentSchema);
            try {
              await kind.witness(fixture.client);
              const before = await fixture.snapshot();
              await assert.rejects(driver.attempt(), kind.refusal);
              expect(fixture.calls.runtimeUri).toBe(0);
              expect(await fixture.snapshot()).toEqual(before);
              await fixture.noRuntimeSessions();
              await fixture.schema(", description:s.text()");
              await assert.rejects(driver.sync(), kind.refusal);
              expect(await fixture.snapshot()).toEqual(before);
              expect(await columnNames(fixture.client)).toEqual(original);
            } finally {
              await kind.restore(fixture.client, retainedUnaccentSchema);
            }
            expect((await driver.sync()).applied).toBe(true);
            expect(await columnNames(fixture.client)).toContain("description");
          },
          { extensions: {} },
        );
      },
      timeout,
    );
  }
}

observation(
  "OBSERVATION, not acceptance: this target cannot alter the installed Unaccent dictionary, so positive graph drift is unresolved here",
  async () => {
    await withUnaccentDevRuntime(async (fixture) => {
      const target = quoteIdentifier(unaccentSchema);
      await fixture.client.query("BEGIN");
      try {
        await assert.rejects(
          fixture.client.query(`ALTER EXTENSION unaccent DROP TEXT SEARCH DICTIONARY ${target}.unaccent`),
          { code: "42501" },
        );
      } finally {
        await fixture.client.query("ROLLBACK");
      }
      expect((await observeGraph(fixture.client)).digest).toBe(unaccentGraphDigest);
    });
  },
  timeout,
);

for (const tamper of ["generation-missing-graph", "generation-alternate-graph", "saved-alternate-graph"] as const) {
  native(
    `${tamper} Unaccent pin is refused before target access through both entries, and restoration resumes`,
    async () => {
      await withUnaccentDevRuntime(async (fixture) => {
        const file = join(fixture.generationDirectory, "required-api.json");
        const bytes = await fixture.generationBytes();
        let restore: () => Promise<void>;
        let expected: RegExp;
        if (tamper === "saved-alternate-graph") {
          const original = await replaceSavedPin(fixture, withAlternateGraph);
          restore = () => restoreSavedPin(fixture, original);
          expected = unreviewedPin;
        } else {
          if (tamper === "generation-missing-graph") {
            const evidence = JSON.parse(bytes);
            delete evidence.scopes[0].requiredApi.apis[0].textSearch;
            await writeFile(file, JSON.stringify(evidence));
          } else {
            await writeGenerationEvidence(
              fixture,
              withAlternateGraphEvidence(validateGenerationRequiredApi(JSON.parse(bytes))),
            );
          }
          restore = () => writeFile(file, bytes);
          expected = generationRefusal;
        }
        const before = await fixture.snapshot();
        for (const entry of entries) {
          const driver = lifecycle(fixture, entry);
          await assert.rejects(driver.attempt(), expected);
          // Generation evidence is read before any target access; the saved pin only after the connection exists.
          if (tamper === "saved-alternate-graph") expect(fixture.calls.runtimeUri).toBe(0);
          else expect(fixture.calls).toEqual({ target: 0, runtimeUri: 0 });
          expect(await fixture.snapshot()).toEqual(before);
          await fixture.noRuntimeSessions();
        }
        // The saved pin is also a sync-time authority; generation evidence is not read by sync.
        if (tamper === "saved-alternate-graph")
          for (const entry of entries) {
            await assert.rejects(lifecycle(fixture, entry).sync(), expected);
            expect(await fixture.snapshot()).toEqual(before);
          }
        await restore();
        expect((await lifecycle(fixture, "source").sync()).applied).toBe(false);
        expect((await lifecycle(fixture, "source").attempt()).version).toBe(fixture.candidate.version);
        expect(fixture.calls.runtimeUri).toBe(1);
      });
    },
    timeout,
  );
}

native(
  "persisted retained Unaccent evidence with an unreviewed graph is refused before credentials or DDL, then restored",
  async () => {
    await withUnaccentDevRuntime(
      async (fixture) => {
        await registerUnaccentRetention(fixture);
        const persisted = await readRetainedEvidence(fixture.client, "component_retained");
        const original = validateGenerationRequiredApi(persisted.required_api);
        await replaceRetainedEvidence(fixture.client, "component_retained", withAlternateGraphEvidence(original));
        try {
          const before = await fixture.snapshot();
          for (const entry of entries) {
            await assert.rejects(lifecycle(fixture, entry).attempt(), unreviewedPin);
            expect(fixture.calls.runtimeUri).toBe(0);
            expect(await fixture.snapshot()).toEqual(before);
          }
          await fixture.schema(", description:s.text()");
          const columns = await columnNames(fixture.client);
          for (const entry of entries) {
            await assert.rejects(lifecycle(fixture, entry).sync(), unreviewedPin);
            expect(await fixture.snapshot()).toEqual(before);
            expect(await columnNames(fixture.client)).toEqual(columns);
          }
        } finally {
          await replaceRetainedEvidence(fixture.client, "component_retained", original);
        }
        expect((await lifecycle(fixture, "source").sync()).applied).toBe(true);
        expect(await columnNames(fixture.client)).toContain("description");
      },
      { extensions: {} },
    );
  },
  timeout,
);

native(
  "extension-free release retains Unaccent evidence with its exact graph and completes while the retained target is healthy",
  async () => {
    await withUnaccentRetainedReleaseFixture(async (fixture) => {
      const evidence = await readRetainedEvidence(fixture.admin, fixture.componentNamespace, fixture.metadataNamespace);
      assert(evidence.required_api);
      expect(evidence.runtime_role).toBe(fixture.retainedRole);
      expect(evidence.required_api.scopes.map(({ namespace }) => namespace)).toEqual([fixture.componentNamespace]);
      expect(evidence.required_api.scopes[0]!.requiredApi.apis[0]!.textSearch?.digest).toBe(unaccentGraphDigest);
      expect((await observeGraph(fixture.admin)).digest).toBe(unaccentGraphDigest);
      let callbacks = 0;
      await withNeonReleaseDatabase(
        fixture.root,
        fixture.options,
        async ({ activation, journal }) => {
          callbacks++;
          await activation.activate();
          await completeProviderJournal(journal);
        },
        fixture.provider,
      );
      expect(callbacks).toBe(1);
      expect(fixture.providerMutations()).toBe(0);
    });
  },
  timeout,
);

/** The public read-only planner on a healthy retained target: no retained blocker, nothing changed or written. */
async function expectHealthyPlanner(
  fixture: RetainedReleaseFixture,
  snapshot: Awaited<ReturnType<typeof retainedReleaseSnapshot>>,
) {
  const plan = await planProjectRelease(fixture.root, "release.json", fixture.planner);
  const codes: readonly string[] = plan.blockers.map(({ code }) => code);
  expect(codes).not.toContain("RETAINED_API_UNVERIFIED");
  expect(await retainedReleaseSnapshot(fixture)).toEqual(snapshot);
  await assert.rejects(readFile(receiptPath(fixture.root, fixture.options.releaseKey)), { code: "ENOENT" });
}

for (const kind of driftKinds) {
  kind.run(
    `extension-free release and read-only planner refuse retained ${kind.name} before callback and stages, with healthy planner controls`,
    async () => {
      await withUnaccentRetainedReleaseFixture(async (fixture) => {
        await writeReleaseDeclaration(fixture, "clone");
        // Healthy control BEFORE drift, through the same public planner.
        const healthy = await retainedReleaseSnapshot(fixture);
        await expectHealthyPlanner(fixture, healthy);
        await kind.apply(fixture.admin, fixture.extensionSchema);
        try {
          await kind.witness(fixture.admin);
          const before = await retainedReleaseSnapshot(fixture);
          const plan = await planProjectRelease(fixture.root, "release.json", fixture.planner);
          const codes: readonly string[] = plan.blockers.map(({ code }) => code);
          expect(codes).toContain("RETAINED_API_UNVERIFIED");
          expect(codes).not.toContain("REQUIRED_API_UNVERIFIED");
          expect(await retainedReleaseSnapshot(fixture)).toEqual(before);
          await assert.rejects(readFile(receiptPath(fixture.root, fixture.options.releaseKey)), { code: "ENOENT" });
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
            kind.refusal,
          );
          expect(callbacks).toBe(0);
          expect(await retainedReleaseSnapshot(fixture)).toEqual(before);
          expect((await readNeonReleaseReceipt(fixture.root, fixture.options.releaseKey))?.completed ?? []).toEqual([]);
          expect(fixture.providerMutations()).toBe(0);
        } finally {
          await kind.restore(fixture.admin, fixture.extensionSchema);
        }
        expect((await observeGraph(fixture.admin)).digest).toBe(unaccentGraphDigest);
        // Healthy control AFTER restoration, through the same public planner and against the pre-drift snapshot.
        const plan = await planProjectRelease(fixture.root, "release.json", fixture.planner);
        const codes: readonly string[] = plan.blockers.map(({ code }) => code);
        expect(codes).not.toContain("RETAINED_API_UNVERIFIED");
        expect(await retainedReleaseSnapshot(fixture)).toEqual(healthy);
        let callbacks = 0;
        await withNeonReleaseDatabase(
          fixture.root,
          fixture.options,
          async ({ activation, journal }) => {
            callbacks++;
            await activation.activate();
            await completeProviderJournal(journal);
          },
          fixture.provider,
        );
        expect(callbacks).toBe(1);
      });
    },
    timeout,
  );
}

native(
  "extension-free release refuses retained Unaccent evidence whose graph is not the reviewed pin, then restores",
  async () => {
    await withUnaccentRetainedReleaseFixture(async (fixture) => {
      const persisted = await readRetainedEvidence(
        fixture.admin,
        fixture.componentNamespace,
        fixture.metadataNamespace,
      );
      const original = validateGenerationRequiredApi(persisted.required_api);
      await replaceRetainedEvidence(
        fixture.admin,
        fixture.componentNamespace,
        withAlternateGraphEvidence(original),
        fixture.metadataNamespace,
      );
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
          unreviewedPin,
        );
        expect(callbacks).toBe(0);
        expect(await retainedReleaseSnapshot(fixture)).toEqual(before);
        expect((await readNeonReleaseReceipt(fixture.root, fixture.options.releaseKey))?.completed ?? []).toEqual([]);
        expect(fixture.providerMutations()).toBe(0);
      } finally {
        await replaceRetainedEvidence(fixture.admin, fixture.componentNamespace, original, fixture.metadataNamespace);
      }
      let callbacks = 0;
      await withNeonReleaseDatabase(
        fixture.root,
        fixture.options,
        async ({ activation, journal }) => {
          callbacks++;
          await activation.activate();
          await completeProviderJournal(journal);
        },
        fixture.provider,
      );
      expect(callbacks).toBe(1);
    });
  },
  timeout,
);
