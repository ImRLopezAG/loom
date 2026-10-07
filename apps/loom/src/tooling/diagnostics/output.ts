import type { DiagnosticsOptions, DiagnosticsRecord } from "./types";

/** Fixed storage shared by the ingress and output pumps; removed entries release references. */
export class Ring<Value> {
  private readonly values: (Value | undefined)[];
  private head = 0;
  private tail = 0;
  size = 0;
  constructor(private readonly capacity: number) {
    this.values = Array.from<Value | undefined>({ length: capacity });
  }
  push(value: Value): boolean {
    if (this.size === this.capacity) return false;
    this.values[this.tail] = value;
    this.tail = (this.tail + 1) % this.capacity;
    this.size++;
    return true;
  }
  pop(): Value | undefined {
    if (!this.size) return undefined;
    const value = this.values[this.head];
    this.values[this.head] = undefined;
    this.head = (this.head + 1) % this.capacity;
    this.size--;
    return value;
  }
  clear(): number {
    const count = this.size;
    while (this.size) this.pop();
    return count;
  }
}

function formatRecord(record: DiagnosticsRecord, format: "text" | "jsonl"): string {
  const json = JSON.stringify(record);
  const line = format === "jsonl" ? `${json}\n` : `${record.timestamp} ${record.source} ${json}\n`;
  if (new TextEncoder().encode(line).byteLength > 2048) throw new Error("DIAGNOSTICS_LINE_TOO_LARGE");
  return line;
}

interface Settlement {
  done: (() => void) | undefined;
  failed: (() => void) | undefined;
}

// This scope never captures queues, a session or its guard. Stop severs both callbacks.
function observeWrite(promise: Promise<void>, settlement: Settlement): void {
  void promise.then(
    () => settlement.done?.(),
    () => settlement.failed?.(),
  );
}

export function createOutput(
  output: NonNullable<DiagnosticsOptions["output"]>,
  dropped: (count: number) => void,
  failed: () => void,
) {
  const queue = new Ring<DiagnosticsRecord>(256);
  const controller = new AbortController();
  let enabled = true;
  let busy = false;
  let scheduled: ReturnType<typeof setTimeout> | undefined;
  let settlement: Settlement | undefined;
  function detach() {
    if (settlement) {
      settlement.done = undefined;
      settlement.failed = undefined;
      settlement = undefined;
    }
  }
  function disable() {
    enabled = false;
    detach();
    if (scheduled !== undefined) {
      clearTimeout(scheduled);
      scheduled = undefined;
    }
    dropped(queue.clear());
    controller.abort();
  }
  function failure() {
    failed();
    disable();
  }
  function schedule() {
    if (enabled && !busy && queue.size && scheduled === undefined) scheduled = setTimeout(pump, 0);
  }
  function pump() {
    scheduled = undefined;
    if (!enabled || busy) return;
    const record = queue.pop();
    if (!record) return;
    try {
      const line = formatRecord(record, output.format);
      busy = true;
      const result = output.write(line, controller.signal);
      // A writer may synchronously stop its own session.
      if (!enabled) {
        if (result) observeWrite(Promise.resolve(result), { done: undefined, failed: undefined });
        return;
      }
      if (result) {
        const current: Settlement = {
          done: () => {
            detach();
            busy = false;
            schedule();
          },
          failed: failure,
        };
        settlement = current;
        // Normalization can invoke a caller-controlled constructor getter and stop.
        // Keep the detached object stable even when stop clears the owner reference.
        observeWrite(Promise.resolve(result), current);
      } else {
        busy = false;
        schedule();
      }
    } catch {
      if (enabled) failure();
    }
  }
  return {
    enqueue(record: DiagnosticsRecord) {
      if (enabled) {
        if (!queue.push(record)) dropped(1);
        schedule();
      }
    },
    stop: disable,
  };
}
