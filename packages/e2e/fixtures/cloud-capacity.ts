import assert from "node:assert/strict";
import { setTimeout } from "node:timers/promises";
import { chromium } from "playwright";
import type pg from "pg";
import { createClient, LoomClientError } from "@loom/core/client";

/** Bounded workload on the already-authorized disposable example deployment. */
export async function verifyCloudCapacity(options: {
  frontendUrl: string;
  apiUrl: string;
  version: string;
  projectId: string;
  token: string;
  database: pg.Client;
  runtimeRole: string;
}) {
  const browser = await chromium.launch({ headless: true });
  const client = createClient({
    url: options.apiUrl,
    maxAttempts: 1,
    getAuth: async () => ({ token: options.token, identityKey: "alice" }),
  });
  try {
    for (const concurrency of [1, 4, 8]) {
      const pages = await Promise.all(Array.from({ length: concurrency }, () => browser.newPage()));
      const errors: string[] = [];
      try {
        await Promise.all(
          pages.map(async (page) => {
            page.on("pageerror", () => errors.push("browser-error"));
            await page.goto(options.frontendUrl);
            await page.getByRole("button", { name: "Continue as Alice" }).click();
            await page.getByRole("button", { name: "Neon acceptance", exact: true }).click();
            await page.getByRole("checkbox", { name: "Run on real Neon" }).waitFor();
          }),
        );
        const durations: number[] = [];
        const rejected: { title: string; code: string }[] = [];
        let peakConnections = 0;
        let peakActive = 0;
        let peakLockWaiters = 0;
        let samples = 0;
        let finished = false;
        const started = performance.now();
        const sampling = (async () => {
          while (!finished) {
            const result = await options.database.query<{ total: number; active: number; waiting: number }>(
              "SELECT count(*)::integer AS total, count(*) FILTER (WHERE state='active')::integer AS active, count(*) FILTER (WHERE wait_event_type='Lock')::integer AS waiting FROM pg_stat_activity WHERE usename=$1",
              [options.runtimeRole],
            );
            peakConnections = Math.max(peakConnections, result.rows[0]?.total ?? 0);
            peakActive = Math.max(peakActive, result.rows[0]?.active ?? 0);
            peakLockWaiters = Math.max(peakLockWaiters, result.rows[0]?.waiting ?? 0);
            samples++;
            await setTimeout(100);
          }
        })();
        const writing = (async () => {
          for (let batch = 0; batch < 3; batch++) {
            const writes = await Promise.allSettled(
              Array.from({ length: concurrency }, async (_, writer) => {
                const title = `capacity-${concurrency}-${batch}-${writer}`;
                const before = performance.now();
                try {
                  await client.call(
                    { name: "tasks:create", kind: "mutation", visibility: "public", version: options.version },
                    { projectId: options.projectId, title },
                  );
                } catch (error) {
                  // Capacity includes refused writes. Transport/protocol failures still fail the test.
                  if (
                    !(error instanceof LoomClientError) ||
                    !["TRANSACTION_CONFLICT", "RATE_LIMITED"].includes(error.code)
                  )
                    throw error;
                  rejected.push({ title, code: error.code });
                  return;
                }
                durations.push(performance.now() - before);
                await Promise.all(
                  pages.map(async (page, reader) => {
                    try {
                      await page.getByRole("checkbox", { name: title, exact: true }).waitFor();
                    } catch (error) {
                      console.info(
                        "loom.cloud-capacity.failure",
                        JSON.stringify({ concurrency, batch, writer, reader, stage: "convergence" }),
                      );
                      throw error;
                    }
                  }),
                );
              }),
            );
            assert(
              writes.every((result) => result.status === "fulfilled"),
              "Cloud capacity write or convergence failed",
            );
          }
        })().finally(() => {
          finished = true;
        });
        const results = await Promise.allSettled([writing, sampling]);
        assert(
          results.every((result) => result.status === "fulfilled"),
          "Cloud capacity workload failed",
        );
        assert.deepEqual(errors, []);
        assert.equal(durations.length + rejected.length, concurrency * 3);
        assert(durations.length > 0, "Cloud workload made no successful progress");
        if (concurrency === 1) assert.equal(rejected.length, 0, "Sequential baseline must succeed");
        const rows = await options.database.query<{ title: string }>(
          "SELECT title FROM app.tasks WHERE project_id=$1 AND title LIKE $2",
          [options.projectId, `capacity-${concurrency}-%`],
        );
        assert.equal(rows.rows.length, durations.length, "Successful writes must match persisted rows");
        assert(
          rows.rows.every((row) => !rejected.some((entry) => entry.title === row.title)),
          "Rejected writes must roll back",
        );
        durations.sort((a, b) => a - b);
        console.info(
          "loom.cloud-capacity",
          JSON.stringify({
            writers: concurrency,
            browserPages: concurrency,
            batches: 3,
            writes: durations.length,
            attemptedWrites: concurrency * 3,
            rejectedWrites: rejected.length,
            transactionConflicts: rejected.filter((entry) => entry.code === "TRANSACTION_CONFLICT").length,
            rateLimited: rejected.filter((entry) => entry.code === "RATE_LIMITED").length,
            elapsedThroughConvergenceMs: performance.now() - started,
            writeP50Ms: durations[Math.ceil(durations.length * 0.5) - 1],
            writeP95Ms: durations[Math.ceil(durations.length * 0.95) - 1],
            writeMaxMs: durations.at(-1),
            peakConnections,
            peakActive,
            peakLockWaiters,
            samples,
            clientMaxAttempts: 1,
            runtime: "Neon Node 24",
            region: "aws-us-east-1",
          }),
        );
      } finally {
        await Promise.all(pages.map((page) => page.close()));
      }
    }
  } finally {
    await browser.close();
  }
}
