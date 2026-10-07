/** Finite, primitive-only local events. Publisher changes require a projection review. */
export type DiagnosticsRuntimeEvent =
  | {
      readonly type: "rpc.procedure";
      readonly mode: "finite" | "live" | "mutation";
      readonly status: "success" | "error";
      readonly durationMs: number;
    }
  | { readonly type: "realtime.listener"; readonly status: "connected" | "degraded" | "idle" }
  | {
      readonly type: "realtime.coordinator";
      readonly subscriptions: number;
      readonly evaluating: number;
      readonly queued: number;
    }
  | { readonly type: "transaction.retry"; readonly kind: "query" | "mutation"; readonly attempt: number }
  | {
      readonly type: "revision.read";
      readonly status: "success" | "error";
      readonly durationMs: number;
      readonly tableCount: number;
    }
  | {
      readonly type: "job.claim";
      readonly ageMs: number;
      readonly dueLagMs: number;
      readonly attempt: number;
      readonly recovered: boolean;
    }
  | { readonly type: "job.lease.reaped"; readonly count: number }
  | { readonly type: "job.lease.lost"; readonly reason: "deadline" | "ownership" | "activation" | "queue" }
  | {
      readonly type: "database.acquire";
      readonly status: "success" | "error";
      readonly durationMs: number;
      readonly total: number;
      readonly idle: number;
      readonly waiting: number;
    };

/** Receipt writes describe acknowledgements, not successful provider operations. */
export interface DiagnosticsDeploymentEvent {
  readonly type: "release.acknowledgement";
  readonly stage:
    | "metadata"
    | "quarantine"
    | "migrations"
    | "prepared"
    | "bootstrap"
    | "triggers"
    | "functions"
    | "health"
    | "activated"
    | "complete";
  readonly status: "recorded" | "replayed" | "write-error";
}

export interface DiagnosticsOptions {
  readonly output?: {
    readonly format: "text" | "jsonl";
    /** Return promptly and cooperate with cancellation to prevent deferred writes. */
    readonly write: (chunk: string, signal: AbortSignal) => void | Promise<void>;
  };
  readonly telemetry?: {
    readonly protocol: "otlp-http-json";
    readonly endpoint: string;
    readonly bearerToken?: string;
  };
}

export interface DiagnosticsStats {
  readonly accepted: number;
  readonly invalid: number;
  readonly dropped: number;
  readonly outputFailures: number;
  readonly exportFailures: number;
}

export interface DiagnosticsSession {
  stop(): Promise<void>;
  snapshot(): Readonly<DiagnosticsStats>;
}

export type DiagnosticsRecord = {
  readonly schemaVersion: 1;
  readonly scope: "local-process";
  /** Monotonic within the owning session; never a metric attribute. */
  readonly sequence: number;
  /** UTC ISO observation time; never a metric attribute. */
  readonly timestamp: string;
} & (
  | { readonly source: "runtime"; readonly event: DiagnosticsRuntimeEvent }
  | { readonly source: "deployment"; readonly event: DiagnosticsDeploymentEvent }
  | { readonly source: "diagnostics"; readonly event: { readonly type: "diagnostics.loss" } & DiagnosticsStats }
);
