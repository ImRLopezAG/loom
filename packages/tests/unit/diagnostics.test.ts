import { describe, expect, expectTypeOf, test } from "vite-plus/test";
import type { RuntimeMetric } from "../../../apps/loom/src/core/server/observability";
import type { DeploymentMetric } from "../../../apps/loom/src/tooling/deploy/observability";
import { projectDeploymentMetric, projectRuntimeMetric } from "../../../apps/loom/src/tooling/diagnostics/project";
import type { DiagnosticsRecord, DiagnosticsStats } from "../../../apps/loom/src/tooling/diagnostics/types";

const runtime = {
  "rpc.procedure": { type: "rpc.procedure", mode: "finite", status: "success", durationMs: 0.5 },
  "realtime.listener": { type: "realtime.listener", status: "connected" },
  "realtime.coordinator": { type: "realtime.coordinator", subscriptions: 0, evaluating: 1, queued: 2 },
  "transaction.retry": { type: "transaction.retry", kind: "query", attempt: 1 },
  "revision.read": { type: "revision.read", status: "success", durationMs: 0, tableCount: 0 },
  "job.claim": { type: "job.claim", ageMs: 0, dueLagMs: 0.5, attempt: 1, recovered: false },
  "job.lease.reaped": { type: "job.lease.reaped", count: 0 },
  "job.lease.lost": { type: "job.lease.lost", reason: "deadline" },
  "database.acquire": { type: "database.acquire", status: "success", durationMs: 1, total: 0, idle: 0, waiting: 0 },
} satisfies { [Type in RuntimeMetric["type"]]: Extract<RuntimeMetric, { readonly type: Type }> };

const stages = {
  metadata: true,
  quarantine: true,
  migrations: true,
  prepared: true,
  bootstrap: true,
  triggers: true,
  functions: true,
  health: true,
  activated: true,
  complete: true,
} satisfies Record<DeploymentMetric["stage"], true>;

describe("finite diagnostics projection", () => {
  test("copies every runtime variant and strips payload canaries", () => {
    for (const event of Object.values(runtime)) {
      const projected = projectRuntimeMetric({ ...event, token: "SECRET", sql: "SECRET", payload: { secret: true } });
      expect(projected).toEqual(event);
      expect(projected).not.toBe(event);
      expect(JSON.stringify(projected)).not.toContain("SECRET");
    }
  });

  test("accepts all runtime enum combinations", () => {
    for (const mode of ["finite", "live", "mutation"])
      for (const status of ["success", "error"])
        expect(projectRuntimeMetric({ ...runtime["rpc.procedure"], mode, status })).toEqual({
          ...runtime["rpc.procedure"],
          mode,
          status,
        });
    for (const status of ["connected", "degraded", "idle"])
      expect(projectRuntimeMetric({ type: "realtime.listener", status })).toEqual({
        type: "realtime.listener",
        status,
      });
    for (const kind of ["query", "mutation"])
      expect(projectRuntimeMetric({ ...runtime["transaction.retry"], kind })).toEqual({
        ...runtime["transaction.retry"],
        kind,
      });
    for (const reason of ["deadline", "ownership", "activation", "queue"])
      expect(projectRuntimeMetric({ type: "job.lease.lost", reason })).toEqual({ type: "job.lease.lost", reason });
    for (const type of ["revision.read", "database.acquire"] as const)
      for (const status of ["success", "error"])
        expect(projectRuntimeMetric({ ...runtime[type], status })).toEqual({ ...runtime[type], status });
    expect(projectRuntimeMetric({ ...runtime["job.claim"], recovered: true })).toEqual({
      ...runtime["job.claim"],
      recovered: true,
    });
  });

  test("copies all deployment stages and statuses with no provider payload", () => {
    for (const stage of Object.keys(stages)) {
      for (const status of ["recorded", "replayed", "write-error"]) {
        const event = { type: "release.acknowledgement", stage, status };
        const input = { ...event, path: "SECRET", providerId: "SECRET", error: new Error("SECRET") };
        const projected = projectDeploymentMetric(input);
        expect(projected).toEqual(event);
        expect(projected).not.toBe(input);
        input.stage = "changed";
        input.status = "changed";
        expect(projected).toEqual(event);
      }
    }
  });

  test("retained input mutation cannot alter approved primitives", () => {
    for (const event of Object.values(runtime)) {
      const input = { ...event };
      const projected = projectRuntimeMetric(input);
      for (const field of Object.keys(input)) Object.defineProperty(input, field, { value: "changed" });
      expect(projected).toEqual(event);
    }
  });

  test("rejects missing, inherited, accessor and malformed fields in every variant", () => {
    let calls = 0;
    for (const event of [
      ...Object.values(runtime),
      { type: "release.acknowledgement", stage: "metadata", status: "recorded" },
    ]) {
      const project = event.type === "release.acknowledgement" ? projectDeploymentMetric : projectRuntimeMetric;
      for (const field of Object.keys(event)) {
        const missing = { ...event };
        Reflect.deleteProperty(missing, field);
        expect(project(missing)).toBeNull();
        expect(project(Object.assign(Object.create(event), missing))).toBeNull();
        const accessor = { ...event };
        Object.defineProperty(accessor, field, {
          get: () => {
            calls++;
            throw new Error("SECRET");
          },
        });
        expect(project(accessor)).toBeNull();
        for (const value of [undefined, null, "SECRET", {}, [], () => {}, Symbol("SECRET"), 1n])
          expect(project({ ...event, [field]: value })).toBeNull();
      }
    }
    expect(calls).toBe(0);
  });

  test("rejects nonfinite or negative numbers and unsafe or fractional counts/attempts", () => {
    for (const event of Object.values(runtime)) {
      for (const [field, original] of Object.entries(event)) {
        // oxlint-disable-next-line anti-slop/no-runtime-typeof -- Select numeric fields from the exhaustive test fixtures.
        if (typeof original !== "number") continue;
        for (const value of [NaN, Infinity, -Infinity, -1, "1", new Number(1)])
          expect(projectRuntimeMetric({ ...event, [field]: value })).toBeNull();
        const duration = ["durationMs", "ageMs", "dueLagMs"].includes(field);
        for (const value of duration ? [0, 0.5, Number.MAX_VALUE] : [Number.MAX_SAFE_INTEGER])
          expect(projectRuntimeMetric({ ...event, [field]: value })).toEqual({ ...event, [field]: value });
        if (!duration) {
          for (const value of [0.5, Number.MAX_SAFE_INTEGER + 1])
            expect(projectRuntimeMetric({ ...event, [field]: value })).toBeNull();
          expect(projectRuntimeMetric({ ...event, [field]: 0 })).toEqual(
            field === "attempt" ? null : { ...event, [field]: 0 },
          );
        }
      }
    }
    for (const recovered of [0, 1, "false", new Boolean(false)])
      expect(projectRuntimeMetric({ ...runtime["job.claim"], recovered })).toBeNull();
  });

  test("ignores extra accessors and proxy read/enumeration traps", () => {
    let calls = 0;
    for (const event of [
      ...Object.values(runtime),
      { type: "release.acknowledgement", stage: "metadata", status: "recorded" },
    ]) {
      const project = event.type === "release.acknowledgement" ? projectDeploymentMetric : projectRuntimeMetric;
      const input = { ...event };
      Object.defineProperty(input, "secret", {
        enumerable: true,
        get: () => {
          calls++;
          throw new Error("SECRET");
        },
      });
      Object.defineProperty(input, "toJSON", {
        get: () => {
          calls++;
          throw new Error("SECRET");
        },
      });
      const proxy = new Proxy(input, {
        get: () => {
          calls++;
          throw new Error("SECRET");
        },
        ownKeys: () => {
          calls++;
          throw new Error("SECRET");
        },
        getPrototypeOf: () => {
          calls++;
          throw new Error("SECRET");
        },
      });
      expect(project(proxy)).toEqual(event);
    }
    expect(calls).toBe(0);
  });

  test("contains hostile descriptor proxies and revoked proxies at every approved field", () => {
    for (const event of [
      ...Object.values(runtime),
      { type: "release.acknowledgement", stage: "metadata", status: "recorded" },
    ]) {
      const project = event.type === "release.acknowledgement" ? projectDeploymentMetric : projectRuntimeMetric;
      for (const field of Object.keys(event)) {
        const proxy = new Proxy(event, {
          getOwnPropertyDescriptor(target, key) {
            if (key === field) throw new Error("SECRET");
            return Object.getOwnPropertyDescriptor(target, key);
          },
        });
        expect(project(proxy)).toBeNull();
      }
      const revoked = Proxy.revocable(event, {});
      revoked.revoke();
      expect(project(revoked.proxy)).toBeNull();
    }
  });

  test("accepts nonenumerable own data properties and null prototypes", () => {
    for (const event of Object.values(runtime)) {
      const input = Object.create(null);
      for (const [field, value] of Object.entries(event)) Object.defineProperty(input, field, { value });
      expect(projectRuntimeMetric(input)).toEqual(event);
    }
  });

  test("rejects nonobjects, unknown variants, prototype keys and wrong channels", () => {
    for (const input of [undefined, null, true, 1, "SECRET", Symbol("SECRET"), 1n, () => {}, [], {}]) {
      expect(projectRuntimeMetric(input)).toBeNull();
      expect(projectDeploymentMetric(input)).toBeNull();
    }
    for (const type of [
      "unknown",
      "constructor",
      "__proto__",
      "toString",
      "diagnostics.loss",
      "rate_limit.decision",
      "rate_limit.cleanup",
    ]) {
      expect(projectRuntimeMetric({ type })).toBeNull();
      expect(projectDeploymentMetric({ type, stage: "metadata", status: "recorded" })).toBeNull();
    }
    expect(projectRuntimeMetric({ type: "release.acknowledgement", stage: "metadata", status: "recorded" })).toBeNull();
    for (const event of Object.values(runtime)) expect(projectDeploymentMetric(event)).toBeNull();
  });

  test("versioned public records include cumulative diagnostics loss counters", () => {
    expectTypeOf<Extract<DiagnosticsRecord, { source: "diagnostics" }>["event"]>().toEqualTypeOf<
      { readonly type: "diagnostics.loss" } & DiagnosticsStats
    >();
    const record: DiagnosticsRecord = {
      schemaVersion: 1,
      scope: "local-process",
      sequence: 1,
      timestamp: "2026-10-07T00:00:00.000Z",
      source: "diagnostics",
      event: { type: "diagnostics.loss", accepted: 1, invalid: 2, dropped: 3, outputFailures: 4, exportFailures: 5 },
    };
    expect(JSON.parse(JSON.stringify(record))).toEqual(record);
  });
});
