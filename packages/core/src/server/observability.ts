import { channel } from "node:diagnostics_channel";

/** Bounded operational labels; never include identities, arguments, SQL or credentials. */
export interface RuntimeMetric {
  readonly type: "transaction.retry";
  readonly kind: "query" | "mutation";
  /** The attempt about to start, including the original attempt in the count. */
  readonly attempt: number;
}

const metrics = channel("loom.runtime.metric");

export function publishRuntimeMetric(metric: RuntimeMetric): void {
  metrics.publish(metric);
}
