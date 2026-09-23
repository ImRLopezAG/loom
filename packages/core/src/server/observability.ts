import { channel } from "node:diagnostics_channel";

/** Bounded operational labels; never include identities, arguments, SQL or credentials. */
interface TransactionRetryMetric {
  readonly type: "transaction.retry";
  readonly kind: "query" | "mutation";
  /** The attempt about to start, including the original attempt in the count. */
  readonly attempt: number;
}

interface RevisionReadMetric {
  readonly type: "revision.read";
  readonly status: "success" | "error";
  /** Wall time for the database read and result validation, including pool wait if any. */
  readonly durationMs: number;
  readonly tableCount: number;
}

interface FunctionDispatchMetric {
  readonly type: "function.dispatch";
  readonly mode: "public" | "internal" | "subscription";
  readonly kind: "query" | "mutation" | "action" | "unknown";
  readonly status: "success" | "error";
  /** End-to-end dispatch wall time, including authorization, transactions and retries. */
  readonly durationMs: number;
}

export type RuntimeMetric = TransactionRetryMetric | RevisionReadMetric | FunctionDispatchMetric;

const metrics = channel("loom.runtime.metric");

export function publishRuntimeMetric(metric: RuntimeMetric): void {
  metrics.publish(metric);
}
