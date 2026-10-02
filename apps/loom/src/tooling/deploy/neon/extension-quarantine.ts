import type pg from "pg";
import type { NeonApi } from "@neon/config-runtime/v1";
import { assertExtensionLock } from "../../migrations/connection";
import { ExtensionError } from "../../migrations/extensions";
import { readdir, readFile } from "node:fs/promises";
import * as v from "valibot";
import { resolveProjectPath } from "../../config/paths";
import { writeReceiptFile } from "../receipt-file";

/** Retain source table locks until the provider has finished copying the branch. */
export async function withCloneSourceGuard<T>(source: pg.Client, create: () => Promise<T>): Promise<T> {
  assertExtensionLock(source);
  await source.query("BEGIN");
  try {
    await assertExtensionBackgroundIdle(source);
    return await create();
  } finally {
    await source.query("ROLLBACK");
  }
}

/** Caller owns a transaction so the schedule lock remains effective through its operation. */
export async function assertExtensionBackgroundIdle(source: pg.Client): Promise<void> {
  const extensions = await source.query<{ extname: string }>(
    "SELECT extname FROM pg_extension WHERE extname IN ('pg_cron', 'timescaledb') ORDER BY extname",
  );
  // Background worker prevention for TimescaleDB is not part of Neon's endpoint contract.
  if (extensions.rows.some((entry) => entry.extname === "timescaledb"))
    throw new ExtensionError(
      "PREREQUISITE",
      "Cloning TimescaleDB requires provider-established prevention of inherited background execution before compute startup",
    );
  if (extensions.rows.some((entry) => entry.extname === "pg_cron")) {
    await source.query("LOCK TABLE cron.job IN SHARE MODE");
    const jobs = await source.query("SELECT 1 FROM cron.job WHERE active LIMIT 1");
    if (jobs.rowCount)
      throw new ExtensionError(
        "PREREQUISITE",
        "Disable inherited cron schedules on the source before cloning; SQL quarantine after clone startup cannot prevent execution",
      );
  }
}

const provenanceValidator = v.strictObject({
  createdAt: v.string(),
  projectCreatedAt: v.string(),
  resetAt: v.nullable(v.string()),
  restoreId: v.nullable(v.string()),
  initSource: v.nullable(v.string()),
});
const branchGuardValidator = v.object({
  id: v.string(),
  parentId: v.optional(v.string()),
  provenance: v.optional(provenanceValidator),
});
const cloneGuardReceiptValidator = v.strictObject({
  format: v.literal(1),
  projectId: v.string(),
  parentBranchId: v.string(),
  branchId: v.string(),
  provenance: v.nullable(provenanceValidator),
});
type CloneGuardProvider = Pick<NeonApi, "listBranches">;
type CloneGuardTarget = { readonly projectId: string; readonly branchId: string };

async function inspectGuardBranch(api: CloneGuardProvider, target: CloneGuardTarget) {
  const branches = v.parse(v.array(branchGuardValidator), await api.listBranches(target.projectId));
  const matches = branches.filter((entry) => entry.id === target.branchId);
  const branch = matches[0];
  if (!branch || matches.length !== 1) throw new Error("Clone source identity is ambiguous");
  return branch;
}

/** Called only after creation under every copied database's source guard, before opening the target. */
export async function recordCloneGuard(
  root: string,
  key: string,
  api: CloneGuardProvider,
  target: CloneGuardTarget,
  parentBranchId: string,
): Promise<void> {
  const branch = await inspectGuardBranch(api, target);
  if (branch.provenance?.resetAt || branch.provenance?.restoreId)
    throw new ExtensionError("PREREQUISITE", "Provisioned branch was reset or restored before baseline adoption");
  const directory = await resolveProjectPath(root, `.loom/provision/${key}`);
  await writeReceiptFile(
    directory,
    "clone-guard.json",
    JSON.stringify(
      {
        format: 1,
        projectId: target.projectId,
        branchId: target.branchId,
        parentBranchId,
        provenance: branch.provenance ?? null,
      },
      null,
      2,
    ) + "\n",
  );
}

/** Current parent state cannot prove what a previously created clone inherited. */
export async function withTargetCloneGuard<T>(
  api: CloneGuardProvider,
  target: CloneGuardTarget,
  operation: () => Promise<T>,
  root = process.cwd(),
): Promise<T> {
  const branch = await inspectGuardBranch(api, target);
  const provenance = branch.provenance;
  // A provider adapter without provenance may identify an original root by absent parentId.
  // The real adapter binds roots to project creation and detects parent-schema copies and resets.
  if (
    !branch.parentId &&
    (!provenance ||
      (provenance.createdAt === provenance.projectCreatedAt &&
        provenance.initSource === "parent-data" &&
        !provenance.resetAt &&
        !provenance.restoreId))
  )
    return operation();
  const directory = await resolveProjectPath(root, ".loom/provision");
  let entries: string[];
  try {
    entries = await readdir(directory);
  } catch (cause) {
    if (!(cause instanceof Error && "code" in cause && cause.code === "ENOENT")) throw cause;
    entries = [];
  }
  for (const key of entries.filter((entry) => /^[a-f0-9]{64}$/.test(entry))) {
    const path = await resolveProjectPath(root, `.loom/provision/${key}/clone-guard.json`);
    let receipt: v.InferOutput<typeof cloneGuardReceiptValidator>;
    try {
      receipt = v.parse(cloneGuardReceiptValidator, JSON.parse(await readFile(path, "utf8")));
    } catch (cause) {
      if (!(cause instanceof Error && "code" in cause && cause.code === "ENOENT"))
        throw new Error("Invalid clone creation guard receipt");
      continue;
    }
    if (
      receipt.projectId === target.projectId &&
      receipt.branchId === target.branchId &&
      (!branch.parentId || receipt.parentBranchId === branch.parentId) &&
      JSON.stringify(receipt.provenance) === JSON.stringify(provenance ?? null)
    )
      return operation();
  }
  throw new ExtensionError(
    "PREREQUISITE",
    "Clone creation safety is unproven; create a fresh branch through Loom from a guarded source and retain its .loom/provision receipts. Parent inspection today cannot establish inherited schedule safety, and a reset or restore invalidates the creation proof",
  );
}
