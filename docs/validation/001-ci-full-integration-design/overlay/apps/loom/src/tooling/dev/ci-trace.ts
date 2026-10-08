// TEMPORARY DIAGNOSTIC OVERLAY. Never publish this file as a Kello API.
import { AsyncLocalStorage } from "node:async_hooks";
import { createHash, randomUUID } from "node:crypto";
import { closeSync, constants, openSync, writeFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";

const directory = process.env.KELLO_CI_STAGE_DIRECTORY;
const instance = randomUUID();
const surface = import.meta.url.includes("/apps/loom/src/") ? "source" : import.meta.url.includes("/apps/loom/dist/") ? "built" : "other";
const clock = process.hrtime.bigint.bind(process.hrtime);
let sequence = 0;
let bytes = 0;
let disabled = false;
const limit = 1024 * 1024;
const maxRecords = 4096;
const file = directory && isAbsolute(directory) ? join(directory, `${process.pid}-${instance}.jsonl`) : undefined;
export function ciHash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
export function ciId(): string {
  return randomUUID();
}
type Stage =
  | "dev.credentials.restored" | "dev.recovery.write.begin" | "dev.recovery.write.end"
  | "dev.recovery.poll" | "dev.recovery.wait.end" | "dev.recovery.settled"
  | "watch.admitted" | "watch.error" | "revision.check" | "candidate.unchanged"
  | "admission.begin" | "admission.install" | "admission.end"
  | "watch.create" | "watch.event" | "watch.stop.begin" | "watch.stop.end"
  | "coordinator.create" | "coordinator.invalidate" | "coordinator.ready"
  | "revision.cancel" | "revision.begin" | "revision.success" | "revision.failure" | "revision.end"
  | "update.begin" | "candidate.ready" | "sync.begin" | "sync.end"
  | "runtime.begin" | "runtime.ready" | "active.installed"
  | "lock.wait" | "lock.acquired" | "lock.release.begin" | "lock.release.end"
  | "dev.fixture.begin" | "dev.obsolete.write" | "dev.provider.entered"
  | "dev.intermediate.write" | "dev.latest.write" | "dev.provider.resumed"
  | "dev.expected.prepare.begin" | "dev.expected.prepare.end" | "dev.latest.poll"
  | "dev.latest.wait.end" | "dev.cleanup.begin" | "dev.cleanup.end"
  | "provision.fixture.begin" | "provision.child.start" | "provision.child.spawned"
  | "provision.child.exit" | "provision.child.await.end"
  | "provision.cleanup.begin" | "provision.cleanup.end";
type Fields = {
  rootHash?: string; operation?: string; coordinator?: string; revision?: number; currentRevision?: number; event?: string;
  candidateHash?: string; expectedHash?: string; activeHash?: string; filenameHash?: string;
  filenameKind?: "missing" | "schema" | "generated" | "internal" | "other";
  eventKind?: "rename" | "change" | "other";
  aborted?: boolean; stopped?: boolean; pending?: boolean; failed?: boolean; watchFailed?: boolean;
  childPid?: number; childExit?: number | null; caseIndex?: number;
};
const context = new AsyncLocalStorage<Fields>();
export function ciScope<T>(fields: Fields, operation: () => T): T {
  return context.run({ ...context.getStore(), ...fields }, operation);
}
// Call sites supply only constants, UUIDs, hashes, booleans and bounded integers.
// No error objects/messages, environment dumps, SQL, arguments, stream content or app payloads.
export function ciStage(stage: Stage, fields: Fields = {}): void {
  if (disabled || !file) return;
  const started = clock();
  const exhausted = sequence >= maxRecords || bytes >= limit - 8192;
  const record = exhausted
    ? { schema: 1, diagnostic: "001-full-435-r1", surface, pid: process.pid, instance, sequence: ++sequence, ns: String(started), stage: "trace.truncated" }
    : { schema: 1, diagnostic: "001-full-435-r1", surface, pid: process.pid, instance, sequence: ++sequence, ns: String(started), stage, ...context.getStore(), ...fields };
  let fd: number | undefined;
  try {
    const line = JSON.stringify(record) + "\n";
    if (Buffer.byteLength(line) > 4096) throw new Error("CI_TRACE_RECORD_BOUND");
    fd = openSync(file, constants.O_WRONLY | constants.O_CREAT | constants.O_APPEND | constants.O_NOFOLLOW, 0o600);
    writeFileSync(fd, line);
    bytes += Buffer.byteLength(line);
    // Includes open/write overhead, not close overhead. Never claim zero observer cost.
    const elapsedNs = String(clock() - started);
    const cost = JSON.stringify({ schema: 1, diagnostic: "001-full-435-r1", surface, pid: process.pid, instance, sequence, stage: "trace.cost", elapsedNs }) + "\n";
    writeFileSync(fd, cost);
    bytes += Buffer.byteLength(cost);
    if (exhausted) disabled = true;
  } catch {
    disabled = true;
    // Fixed literal only; runner treats a missing stage or this marker as an invalid trace.
    process.stderr.write("CI_TRACE_IO_FAILURE\n");
  } finally {
    if (fd !== undefined) {
      try { closeSync(fd); } catch { disabled = true; process.stderr.write("CI_TRACE_CLOSE_FAILURE\n"); }
    }
  }
}
