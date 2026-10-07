import assert from "node:assert/strict";
import { test } from "bun:test";
import { mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout } from "node:timers/promises";
import { createDiagnosticsMetrics } from "../../../apps/loom/src/tooling/diagnostics/metrics";
import { createOtlpExporter, serializeMetrics } from "../../../apps/loom/src/tooling/diagnostics/otlp";

import { RPCLink } from "@orpc/client/fetch";
import { createProjectProcedures } from "../../../apps/loom/src/core/server/rpc/procedure";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { createRpcHttpApp } from "../../../apps/loom/src/core/adapters/neon/rpc-http";
import { startDiagnostics } from "../../../apps/loom/src/tooling/diagnostics/session";

const collectorImage = "otel/opentelemetry-collector@sha256:0beba82d63792511591522a8d582904b9a8ae81710357bfcab731607b8b0ffe2";

async function docker(args: string[]) {
  const process = Bun.spawn(["docker", ...args], { stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, exit] = await Promise.all([
    new Response(process.stdout).text(), new Response(process.stderr).text(), process.exited,
  ]);
  assert.equal(exit, 0, `Disposable collector command failed: ${stderr}`);
  return stdout + stderr;
}

async function until(description: string, check: () => Promise<boolean>) {
  const deadline = performance.now() + 10000;
  while (!(await check())) {
    assert.ok(performance.now() < deadline, `Timed out waiting for ${description}`);
    await setTimeout(25);
  }
}

// This acceptance owns a unique disposable collector; unavailable Docker is a failure, never a skip.
test("pinned collector decodes private cumulative RPC metrics and histogram buckets", async () => {
  const root = await mkdtemp(join(tmpdir(), "kello-001-otlp-"));
  const name = `kello-001-otlp-${crypto.randomUUID()}`;
  let created = false;
  let exporter: Awaited<ReturnType<typeof createOtlpExporter>> | undefined;
  try {
    const config = join(root, "collector.yaml");
    await writeFile(config, `receivers:
  otlp:
    protocols:
      http:
        endpoint: 0.0.0.0:4318
exporters:
  debug:
    verbosity: detailed
service:
  pipelines:
    metrics:
      receivers: [otlp]
      exporters: [debug]
`);
    await docker(["run", "--detach", "--name", name, "--publish", "127.0.0.1::4318",
      "--volume", `${config}:/etc/otelcol/config.yaml:ro`, collectorImage, "--config=/etc/otelcol/config.yaml"]);
    created = true;
    assert.match(await docker(["exec", name, "/otelcol", "--version"]), /otelcol version 0\.156\.0/);
    const port = (await docker(["port", name, "4318/tcp"])).trim();
    assert.match(port, /^127\.0\.0\.1:\d+$/);
    await until("collector receiver", async () => (await docker(["logs", name])).includes("Everything is ready"));

    const metrics = createDiagnosticsMetrics();
    for (const durationMs of [0.5, 7, 70000])
      assert.equal(metrics.observe({ type: "rpc.procedure", mode: "finite", status: "success", durationMs }), true);
    const first = metrics.snapshot();
    const resource = first.resourceMetrics[0]!;
    assert.deepEqual(resource.resource.attributes.map(({ key }) => key).sort(), [
      "deployment.environment.name", "service.instance.id", "service.name", "service.version",
    ]);
    const instruments = resource.scopeMetrics.flatMap(scope => scope.metrics);
    const counter = instruments.find(metric => metric.name === "kello.rpc.procedure.count")!;
    const histogram = instruments.find(metric => metric.name === "kello.rpc.procedure.duration")!;
    const point = histogram.histogram!.dataPoints.find(point => point.count === 3)!;
    assert.ok(point);
    assert.equal(point.sum, 70007.5);
    assert.deepEqual(point.bucketCounts, [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
    assert.deepEqual(point.explicitBounds, [1, 5, 10, 25, 50, 100, 250, 500, 1000, 5000, 30000, 60000]);
    assert.equal(counter.sum!.aggregationTemporality, 2);
    assert.equal(histogram.histogram!.aggregationTemporality, 2);
    assert.match(JSON.stringify(point.startTimeUnixNano), /^"\d{19}"$/);
    assert.match(JSON.stringify(point.timeUnixNano), /^"\d{19}"$/);
    const bytes = await serializeMetrics(first);
    assert.ok(bytes.byteLength <= 128 * 1024);
    assert.deepEqual(JSON.parse(new TextDecoder().decode(bytes)), first);

    const failures: string[] = [];
    exporter = createOtlpExporter({
      endpoint: `http://${port}/v1/metrics`, snapshot: () => metrics.snapshot(),
      onFailure: code => { failures.push(code); },
    });
    await exporter.flush();
    await until("first decoded cumulative histogram", async () => (await docker(["logs", name])).includes("Sum: 70007.500000"));
    assert.equal(metrics.observe({ type: "rpc.procedure", mode: "finite", status: "success", durationMs: 2 }), true);
    await exporter.flush();
    await until("second decoded cumulative histogram", async () => (await docker(["logs", name])).includes("Sum: 70009.500000"));
    const logs = await docker(["logs", name]);
    assert.deepEqual(failures, []);
    assert.match(logs, /service\.name: Str\(kello-dev\)/);
    assert.match(logs, /deployment\.environment\.name: Str\(development\)/);
    assert.match(logs, /Name: kello\.rpc\.procedure\.count/);
    assert.match(logs, /AggregationTemporality: Cumulative/);
    assert.match(logs, /Value: 3(?:\.0+)?\n/);
    assert.match(logs, /Value: 4(?:\.0+)?\n/);
    assert.match(logs, /Count: 3\nSum: 70007\.500000/);
    assert.match(logs, /Count: 4\nSum: 70009\.500000/);
    assert.match(logs, /Buckets #12, Count: 1/);
    const starts = [...logs.matchAll(/^StartTimestamp: (.+)$/gm)].map(match => match[1]);
    assert.ok(starts.length >= 4);
    assert.equal(new Set(starts).size, 1, "Cumulative exports retain one session start timestamp");
  } finally {
    try { await exporter?.stop(); }
    finally {
      try { if (created) await docker(["rm", "--force", name]); }
      finally { await rm(root, { recursive: true, force: true }); }
    }
  }
}, 60000);

// All internal helpers and native RPC composition use source imports in this spike.
test("an unavailable collector does not delay native RPC and exporter stop stays bounded", async () => {
  const entered = Promise.withResolvers<void>();
  const release = Promise.withResolvers<void>();
  let inFlight = 0;
  let maximumInFlight = 0;
  const collector = Bun.serve({ hostname: "127.0.0.1", port: 0, async fetch(request) {
    inFlight++;
    maximumInFlight = Math.max(maximumInFlight, inFlight);
    entered.resolve();
    const cancelled = Promise.withResolvers<void>();
    const abort = () => cancelled.resolve();
    request.signal.addEventListener("abort", abort, { once: true });
    try { await Promise.race([release.promise, cancelled.promise]); return Response.json({}); }
    finally { request.signal.removeEventListener("abort", abort); inFlight--; }
  } });
  const version = "e".repeat(64);
  const { procedure } = createProjectProcedures(defineSchema(() => ({})));
  let calls = 0;
  const app = createRpcHttpApp({
    router: { ping: procedure.handler(() => ++calls) }, version, origins: [], allowAnonymous: true,
    verify: async () => { throw new Error("unused verifier"); },
  });
  const server = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: request => app.fetch(request) });
  const metrics = createDiagnosticsMetrics();
  const failures: string[] = [];
  let observations = 0;
  const diagnostics = await startDiagnostics({ output: { format: "jsonl", write(chunk) {
    const record = JSON.parse(chunk);
    if (record.source === "runtime" && record.event.type === "rpc.procedure") {
      assert.equal(metrics.observe(record.event), true);
      observations++;
    }
  } } });
  const exporter = createOtlpExporter({
    endpoint: new URL("/v1/metrics", collector.url).href,
    snapshot: () => metrics.snapshot(), onFailure: code => { failures.push(code); },
  });
  try {
    const link = new RPCLink({ origin: server.url.origin, url: "/api/kello/rpc",
      headers: { "x-loom-protocol": "loom-orpc-2", "x-loom-version": version },
    });
    assert.equal(await link.call(["ping"], undefined, { context: {} }), 1);
    await until("first RPC observation", async () => observations === 1);
    const pending = exporter.flush();
    await entered.promise;
    // The transport is awaiting collector I/O while a second real HTTP RPC completes.
    assert.equal(await link.call(["ping"], undefined, { context: {} }), 2);
    await until("second RPC observation", async () => observations === 2);
    const started = performance.now();
    await exporter.stop();
    assert.ok(performance.now() - started <= 2000, "Exporter stop must share the two-second deadline");
    await pending;
    assert.equal(maximumInFlight, 1);
    assert.ok(failures.includes("timeout"));
    assert.equal(calls, 2);
    assert.equal(diagnostics.snapshot().outputFailures, 0);
  } finally {
    release.resolve();
    try { await exporter.stop(); }
    finally {
      try { await diagnostics.stop(); }
      finally { await server.stop(true); await collector.stop(true); }
    }
  }
}, 10000);

test("the private Effect JSON bridge loads under native Bun and Node 24", async () => {
  const root = await mkdtemp(join(tmpdir(), "kello-001-otlp-native-"));
  try {
    await symlink(fileURLToPath(new URL("../node_modules", import.meta.url)), join(root, "node_modules"), "dir");
    const entry = join(root, "native.ts");
    const metricsPath = fileURLToPath(new URL("../../../apps/loom/src/tooling/diagnostics/metrics.ts", import.meta.url));
    const otlpPath = fileURLToPath(new URL("../../../apps/loom/src/tooling/diagnostics/otlp.ts", import.meta.url));
    await writeFile(entry, `
      import assert from "node:assert/strict";
      import { createDiagnosticsMetrics } from ${JSON.stringify(metricsPath)};
      import { serializeMetrics } from ${JSON.stringify(otlpPath)};
      if (!process.versions.bun) assert.equal(Number(process.versions.node.split(".")[0]), 24);
      const metrics = createDiagnosticsMetrics();
      assert.equal(metrics.observe({type:"rpc.procedure",mode:"finite",status:"success",durationMs:7}), true);
      const bytes = await serializeMetrics(metrics.snapshot());
      const text = new TextDecoder().decode(bytes);
      assert.ok(!text.includes("ambient-canary"));
      const data = JSON.parse(text);
      assert.equal(data.resourceMetrics[0].resource.attributes.length, 4);
      assert.equal(data.resourceMetrics[0].scopeMetrics[0].metrics.length, 2);
      process.stdout.write(JSON.stringify({runtime:process.versions.bun ? "bun" : "node24",bytes:bytes.byteLength}));
    `);
    const built = await Bun.build({ entrypoints: [entry], outdir: root, target: "node", format: "esm", packages: "external" });
    assert.equal(built.success, true, built.logs.map(String).join("\n"));
    assert.equal(built.outputs.length, 1);
    for (const executable of [process.execPath, "node"]) {
      const child = Bun.spawn([executable, built.outputs[0]!.path], {
        cwd: root, stdout: "pipe", stderr: "pipe", env: { ...process.env,
          OTEL_RESOURCE_ATTRIBUTES: "secret=ambient-canary",
          OTEL_EXPORTER_OTLP_HEADERS: "authorization=ambient-canary",
          OTEL_EXPORTER_OTLP_ENDPOINT: "https://ambient-canary.invalid/metrics",
        },
      });
      const deadline = globalThis.setTimeout(() => child.kill("SIGKILL"), 10000);
      try {
        const [stdout, stderr, exit] = await Promise.all([
          new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
        ]);
        assert.equal(exit, 0, stderr);
        assert.equal(stderr, "");
        const result = JSON.parse(stdout);
        assert.equal(result.runtime, executable === "node" ? "node24" : "bun");
        assert.ok(result.bytes > 0 && result.bytes <= 128 * 1024);
      } finally {
        clearTimeout(deadline);
        child.kill("SIGKILL");
        await child.exited;
      }
    }
  } finally { await rm(root, { recursive: true, force: true }); }
}, 30000);
