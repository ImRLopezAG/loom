/* oxlint-disable anti-slop/no-unknown-parameters, anti-slop/no-unknown-returns, anti-slop/no-object-parameters, anti-slop/no-runtime-typeof -- This module is the own-descriptor I/O decoder for untrusted channel messages. */
import type { RuntimeMetric } from "../../core/server/observability";
import type { DeploymentMetric } from "../deploy/observability";
import type { DiagnosticsDeploymentEvent, DiagnosticsRuntimeEvent } from "./types";

type Validator<Value> = (value: unknown) => value is Value;
type Fields<Event> = { readonly [Field in keyof Event]-?: Validator<Event[Field]> };
type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2 ? true : false;

/** Check exact variants/fields against both independent contracts, including enum drift. */
type Projectors<Published extends { readonly type: string }, Projected extends { readonly type: string }> = {
  readonly [Type in Published["type"] | Projected["type"]]: Equal<
    Extract<Published, { readonly type: Type }>,
    Extract<Projected, { readonly type: Type }>
  > extends true
    ? Fields<Extract<Published, { readonly type: Type }>>
    : never;
};

// Boundary validation: descriptor values come from untrusted channel payloads.
const duration: Validator<number> = (value): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
const count: Validator<number> = (value): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const attempt: Validator<number> = (value): value is number => count(value) && value >= 1;
const boolean: Validator<boolean> = (value): value is boolean => value === true || value === false;
const status: Validator<"success" | "error"> = (value): value is "success" | "error" =>
  value === "success" || value === "error";

const runtimeProjectors = {
  "rpc.procedure": {
    type: (value): value is "rpc.procedure" => value === "rpc.procedure",
    mode: (value): value is "finite" | "live" | "mutation" =>
      value === "finite" || value === "live" || value === "mutation",
    status,
    durationMs: duration,
  },
  "realtime.listener": {
    type: (value): value is "realtime.listener" => value === "realtime.listener",
    status: (value): value is "connected" | "degraded" | "idle" =>
      value === "connected" || value === "degraded" || value === "idle",
  },
  "realtime.coordinator": {
    type: (value): value is "realtime.coordinator" => value === "realtime.coordinator",
    subscriptions: count,
    evaluating: count,
    queued: count,
  },
  "transaction.retry": {
    type: (value): value is "transaction.retry" => value === "transaction.retry",
    kind: (value): value is "query" | "mutation" => value === "query" || value === "mutation",
    attempt,
  },
  "revision.read": {
    type: (value): value is "revision.read" => value === "revision.read",
    status,
    durationMs: duration,
    tableCount: count,
  },
  "job.claim": {
    type: (value): value is "job.claim" => value === "job.claim",
    ageMs: duration,
    dueLagMs: duration,
    attempt,
    recovered: boolean,
  },
  "job.lease.reaped": {
    type: (value): value is "job.lease.reaped" => value === "job.lease.reaped",
    count,
  },
  "job.lease.lost": {
    type: (value): value is "job.lease.lost" => value === "job.lease.lost",
    reason: (value): value is "deadline" | "ownership" | "activation" | "queue" =>
      value === "deadline" || value === "ownership" || value === "activation" || value === "queue",
  },
  "database.acquire": {
    type: (value): value is "database.acquire" => value === "database.acquire",
    status,
    durationMs: duration,
    total: count,
    idle: count,
    waiting: count,
  },
} satisfies Projectors<RuntimeMetric, DiagnosticsRuntimeEvent>;

const deploymentProjectors = {
  "release.acknowledgement": {
    type: (value): value is "release.acknowledgement" => value === "release.acknowledgement",
    stage: (value): value is DiagnosticsDeploymentEvent["stage"] =>
      value === "metadata" ||
      value === "quarantine" ||
      value === "migrations" ||
      value === "prepared" ||
      value === "bootstrap" ||
      value === "triggers" ||
      value === "functions" ||
      value === "health" ||
      value === "activated" ||
      value === "complete",
    status: (value): value is DiagnosticsDeploymentEvent["status"] =>
      value === "recorded" || value === "replayed" || value === "write-error",
  },
} satisfies Projectors<DeploymentMetric, DiagnosticsDeploymentEvent>;

function ownValue(input: object, field: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(input, field);
  return descriptor && Object.hasOwn(descriptor, "value") ? descriptor.value : undefined;
}

function project<Event extends { readonly type: string }>(
  input: unknown,
  projectors: { readonly [Type in Event["type"]]: Fields<Extract<Event, { readonly type: Type }>> },
): Event | null {
  try {
    // Boundary validation: never read properties or enumerate the untrusted payload.
    if (typeof input !== "object" || input === null) return null;
    const type = ownValue(input, "type");
    if (typeof type !== "string" || !Object.hasOwn(projectors, type)) return null;
    // SAFETY: the key is an own member of the compile-time exhaustive, private allowlist.
    const fields = projectors[type as Event["type"]];
    // oxlint-disable-next-line anti-slop/no-unsafe-dictionary-type -- Internal accumulator; only allowlisted, validated primitive fields enter the returned event.
    const result: Record<string, unknown> = {};
    for (const field in fields) {
      if (!Object.hasOwn(fields, field)) continue;
      const value = field === "type" ? type : ownValue(input, field);
      if (!fields[field](value)) return null;
      result[field] = value;
    }
    // SAFETY: every required field passed its primitive validator; no input extras were copied.
    return result as Event;
  } catch {
    // Proxy descriptor traps and revoked proxies must never escape an owned subscriber.
    return null;
  }
}

export function projectRuntimeMetric(input: unknown): DiagnosticsRuntimeEvent | null {
  return project<DiagnosticsRuntimeEvent>(input, runtimeProjectors);
}

export function projectDeploymentMetric(input: unknown): DiagnosticsDeploymentEvent | null {
  return project<DiagnosticsDeploymentEvent>(input, deploymentProjectors);
}
