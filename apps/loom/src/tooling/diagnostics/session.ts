import { channel } from "node:diagnostics_channel";
import { createOutput, Ring } from "./output";
import { projectDeploymentMetric, projectRuntimeMetric } from "./project";
import type { DiagnosticsOptions, DiagnosticsRecord, DiagnosticsSession } from "./types";

const guard = Symbol.for("kello.diagnostics.session.v1");
const increment = (value: number, count = 1): number => value + Math.min(count, Number.MAX_SAFE_INTEGER - value);

export async function startDiagnostics(options: DiagnosticsOptions): Promise<DiagnosticsSession> {
  if (Object.getOwnPropertyDescriptor(globalThis, guard)?.value !== undefined)
    throw new Error("DIAGNOSTICS_ALREADY_ACTIVE");
  const token = {};
  Object.defineProperty(globalThis, guard, { value: token, configurable: true });
  function release() {
    if (Object.getOwnPropertyDescriptor(globalThis, guard)?.value === token) Reflect.deleteProperty(globalThis, guard);
  }
  const runtime = channel("kello.runtime.metric");
  const deployment = channel("kello.deployment.metric");
  const ingress = new Ring<DiagnosticsRecord>(1024);
  let state: "starting" | "running" | "stopping" | "stopped" = "starting";
  let accepted = 0;
  let invalid = 0;
  let ingressDrops = 0;
  let outputDrops = 0;
  let outputFailures = 0;
  let sequence = 0;
  let drainTimer: ReturnType<typeof setTimeout> | undefined;
  let lossTimer: ReturnType<typeof setInterval> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  let stopping: Promise<void> | undefined;
  let finishStop: (() => void) | undefined;
  let output: ReturnType<typeof createOutput> | undefined;
  const snapshot = () => ({
    accepted,
    invalid,
    dropped: increment(ingressDrops, outputDrops),
    outputFailures,
    exportFailures: 0,
  });
  function finish() {
    state = "stopped";
    if (drainTimer !== undefined) {
      clearTimeout(drainTimer);
      drainTimer = undefined;
    }
    if (deadline !== undefined) {
      clearTimeout(deadline);
      deadline = undefined;
    }
    ingressDrops = increment(ingressDrops, ingress.clear());
    release();
    finishStop?.();
    finishStop = undefined;
  }
  function scheduleDrain() {
    if (drainTimer === undefined) drainTimer = setTimeout(drain, 0);
  }
  function drain() {
    drainTimer = undefined;
    for (let count = 0; count < 64; count++) {
      const record = ingress.pop();
      if (!record) break;
      if (state === "running") output?.enqueue(record);
    }
    if (ingress.size) scheduleDrain();
    else if (state === "stopping") finish();
  }
  function observe(
    record:
      | Pick<Extract<DiagnosticsRecord, { source: "runtime" }>, "source" | "event">
      | Pick<Extract<DiagnosticsRecord, { source: "deployment" }>, "source" | "event">,
  ) {
    if (ingress.size === 1024 || sequence === Number.MAX_SAFE_INTEGER || accepted === Number.MAX_SAFE_INTEGER) {
      ingressDrops = increment(ingressDrops);
      return;
    }
    const fresh = {
      schemaVersion: 1 as const,
      scope: "local-process" as const,
      sequence: ++sequence,
      timestamp: new Date().toISOString(),
      ...record,
    };
    ingress.push(fresh);
    accepted = increment(accepted);
    scheduleDrain();
  }
  // SAFETY: channel inputs are untrusted; only the U1 descriptor projectors inspect them.
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- Owned channel decoding boundary.
  function onRuntime(input: unknown) {
    if (state !== "running") return;
    const event = projectRuntimeMetric(input);
    if (state !== "running") return;
    if (event) observe({ source: "runtime", event });
    else invalid = increment(invalid);
  }
  // SAFETY: channel inputs are untrusted; only the U1 descriptor projectors inspect them.
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- Owned channel decoding boundary.
  function onDeployment(input: unknown) {
    if (state !== "running") return;
    const event = projectDeploymentMetric(input);
    if (state !== "running") return;
    if (event) observe({ source: "deployment", event });
    else invalid = increment(invalid);
  }
  function unsubscribe() {
    runtime.unsubscribe(onRuntime);
    deployment.unsubscribe(onDeployment);
  }
  try {
    if (options.telemetry) throw new Error("DIAGNOSTICS_TELEMETRY_UNAVAILABLE");
    if (!options.output) throw new Error("DIAGNOSTICS_SINK_REQUIRED");
    const sink = options.output;
    // SAFETY: JavaScript callers can violate the declared writer type at this public boundary.
    // oxlint-disable-next-line anti-slop/no-runtime-typeof -- Validate the callable sink before subscribing.
    if ((sink.format !== "text" && sink.format !== "jsonl") || typeof sink.write !== "function")
      throw new Error("DIAGNOSTICS_INVALID_OUTPUT");
    // Copy the writer/format so retained option mutations cannot replace the sink.
    output = createOutput(
      { format: sink.format, write: sink.write },
      (count) => {
        outputDrops = increment(outputDrops, count);
      },
      () => {
        outputFailures = increment(outputFailures);
      },
    );
    runtime.subscribe(onRuntime);
    deployment.subscribe(onDeployment);
    state = "running";
    let lastLoss = "";
    lossTimer = setInterval(() => {
      const stats = snapshot();
      const loss = `${stats.invalid}:${stats.dropped}:${stats.outputFailures}`;
      if (state !== "running" || loss === lastLoss || !(stats.invalid || stats.dropped || stats.outputFailures)) return;
      lastLoss = loss;
      if (ingress.size === 1024 || sequence === Number.MAX_SAFE_INTEGER) {
        ingressDrops = increment(ingressDrops);
        return;
      }
      ingress.push({
        schemaVersion: 1,
        scope: "local-process",
        sequence: ++sequence,
        timestamp: new Date().toISOString(),
        source: "diagnostics",
        event: { type: "diagnostics.loss", ...stats },
      });
      scheduleDrain();
    }, 1000);
    return {
      snapshot,
      stop() {
        if (stopping) return stopping;
        state = "stopping";
        stopping = new Promise<void>((resolve) => {
          finishStop = resolve;
        });
        unsubscribe();
        if (lossTimer !== undefined) {
          clearInterval(lossTimer);
          lossTimer = undefined;
        }
        output?.stop();
        if (ingress.size) {
          deadline = setTimeout(finish, 2000);
          scheduleDrain();
        } else finish();
        return stopping;
      },
    };
  } catch (error) {
    unsubscribe();
    if (lossTimer !== undefined) clearInterval(lossTimer);
    output?.stop();
    finish();
    throw error;
  }
}
