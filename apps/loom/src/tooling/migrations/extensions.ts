import type pg from "pg";
import { extensionMembershipCte } from "./extension-membership";
import * as v from "valibot";
import { createHash } from "node:crypto";
import { neonExtensionNames, extensionSchemaValidator } from "../config/extensions";
import type { LoomExtensions } from "../config/extensions";
import {
  assertMigrationConnection,
  assertExtensionLock,
  quoteIdentifier,
  quoteExtensionName,
  extensionProviderEvidence,
} from "./connection";

const versionToken = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => !value.includes("\0"), "Invalid version token"),
);
export const extensionStateValidator = v.strictObject({
  name: v.picklist(neonExtensionNames),
  version: versionToken,
  schema: extensionSchemaValidator,
  requires: v.array(v.pipe(v.string(), v.regex(/^[a-z][a-z0-9_-]{0,62}$/))),
});
export type ExtensionState = v.InferOutput<typeof extensionStateValidator>;
export const extensionOperationValidator = v.variant("kind", [
  v.strictObject({ kind: v.literal("install"), before: v.null(), after: extensionStateValidator }),
  v.strictObject({ kind: v.literal("adopt"), before: extensionStateValidator, after: extensionStateValidator }),
  v.strictObject({ kind: v.literal("update"), before: extensionStateValidator, after: extensionStateValidator }),
  v.strictObject({ kind: v.literal("move"), before: extensionStateValidator, after: extensionStateValidator }),
]);
export type ExtensionOperation = v.InferOutput<typeof extensionOperationValidator>;
export const extensionPlanValidator = v.strictObject({
  before: v.array(extensionStateValidator),
  after: v.array(extensionStateValidator),
  requirements: v.array(extensionStateValidator),
  operations: v.array(extensionOperationValidator),
  automatic: v.boolean(),
});
export type ExtensionPlan = v.InferOutput<typeof extensionPlanValidator>;

export interface InstalledExtension {
  name: string;
  version: string;
  schema: string;
  requires: string[];
  canAlter: boolean;
  relocatable: boolean;
}
export interface AvailableExtensionVersion {
  name: string;
  version: string;
  schema: string | null;
  requires: string[];
  relocatable: boolean;
  canInstall: boolean;
}
export interface ExtensionSchema {
  name: string;
  owned: boolean;
  secure: boolean;
  canCreate: boolean;
  canUse: boolean;
}
export interface ExtensionMember {
  extension: string;
  className: string;
  objectId: number;
  subId: number;
  kind: string;
  schema: string | null;
  name: string | null;
  identity: string;
}
export interface ExtensionProviderEvidence {
  /** Observed provider endpoint configuration: automatic suspension is disabled. */
  activeCompute?: boolean;
  /** Observed support-enabled endpoint prerequisite, never enabled by Loom. */
  pgRepackEnabled?: boolean;
}
export interface ExtensionInspection {
  database: string;
  role: string;
  canCreateDatabaseObjects: boolean;
  installed: InstalledExtension[];
  available: AvailableExtensionVersion[];
  schemas: ExtensionSchema[];
  updatePaths: { name: string; source: string; target: string; path: string | null }[];
  provider: ExtensionProviderEvidence;
  cronDatabase: string | null;
  members: ExtensionMember[];
}
export class ExtensionError extends Error {
  constructor(
    readonly code:
      | "UNAVAILABLE"
      | "DEPENDENCY"
      | "PLACEMENT"
      | "PRIVILEGE"
      | "PREREQUISITE"
      | "DRIFT"
      | "UPDATE_PATH"
      | "MANUAL_OPERATION",
    message: string,
  ) {
    super(message);
    this.name = "ExtensionError";
  }
}

function state(entry: Pick<InstalledExtension, "name" | "version" | "schema" | "requires">): ExtensionState {
  return v.parse(extensionStateValidator, {
    name: entry.name,
    version: entry.version,
    schema: entry.schema,
    requires: [...new Set(entry.requires)].sort(),
  });
}
export function canonicalExtensionState(entries: readonly ExtensionState[]): ExtensionState[] {
  const normalized = entries.map(state).sort((left, right) => left.name.localeCompare(right.name));
  if (new Set(normalized.map((entry) => entry.name)).size !== normalized.length)
    throw new Error("Duplicate extension state");
  return normalized;
}
export function extensionStateHash(entries: readonly ExtensionState[]): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalExtensionState(entries)))
    .digest("hex");
}
/** Validate the portable operation chain independently of target OIDs and permissions. */
export function validateExtensionPlan(input: ExtensionPlan): ExtensionPlan {
  const plan = v.parse(extensionPlanValidator, input);
  const current = new Map(canonicalExtensionState(plan.before).map((entry) => [entry.name, entry]));
  for (const operation of plan.operations) {
    const existing = current.get(operation.after.name);
    if (operation.before === null ? existing !== undefined : !existing || !same(existing, operation.before))
      throw new Error("Invalid extension operation precondition");
    if (operation.kind !== "install") {
      if (operation.before.name !== operation.after.name) throw new Error("Extension operation cannot change its name");
      if (operation.kind === "adopt" && !same(operation.before, operation.after))
        throw new Error("Adoption cannot change extension state");
      if (operation.kind === "update" && operation.before.schema !== operation.after.schema)
        throw new Error("Update cannot move an extension");
      if (operation.kind === "move" && !same({ ...operation.before, schema: operation.after.schema }, operation.after))
        throw new Error("Move cannot change extension version or dependencies");
    }
    current.set(operation.after.name, operation.after);
  }
  if (extensionStateHash([...current.values()]) !== extensionStateHash(plan.after))
    throw new Error("Invalid extension operation result");
  for (const requirement of canonicalExtensionState(plan.requirements)) {
    const installed = current.get(requirement.name);
    if (!installed || !same(installed, requirement))
      throw new Error("Extension operation result excludes a requirement");
  }
  if (plan.automatic !== plan.operations.every((operation) => operation.kind === "install"))
    throw new Error("Invalid extension operation safety");
  return plan;
}
function same(left: ExtensionState, right: ExtensionState): boolean {
  return extensionStateHash([left]) === extensionStateHash([right]);
}

/** Authority and membership are observations, never portable hash inputs. */
export async function inspectExtensions(
  client: pg.Client,
  provider: ExtensionProviderEvidence = extensionProviderEvidence(client),
): Promise<ExtensionInspection> {
  assertMigrationConnection(client);
  const authority = await client.query<{
    database: string;
    role: string;
    canCreateDatabaseObjects: boolean;
    superuser: boolean;
    neonSuperuser: boolean;
    cronDatabase: string | null;
  }>(
    `SELECT current_database() AS database, current_user AS role,
      has_database_privilege(current_user,current_database(),'CREATE') AS "canCreateDatabaseObjects",
      (SELECT rolsuper FROM pg_roles WHERE rolname=current_user) AS superuser,
      COALESCE(pg_has_role(current_user,to_regrole('neon_superuser'),'MEMBER'),false) AS "neonSuperuser",
      current_setting('cron.database_name',true) AS "cronDatabase"`,
  );
  const privileges = authority.rows[0];
  if (!privileges) throw new Error("Cannot inspect extension authority");
  const installed = await client.query<InstalledExtension>(
    `SELECT e.extname AS name,e.extversion AS version,n.nspname AS schema,e.extrelocatable AS relocatable,
      pg_has_role(current_user,e.extowner,'USAGE') AS "canAlter",
      ARRAY(SELECT r.extname FROM pg_depend d JOIN pg_extension r ON r.oid=d.refobjid
        WHERE d.classid='pg_extension'::regclass AND d.objid=e.oid
          AND d.refclassid='pg_extension'::regclass AND d.deptype='n' ORDER BY r.extname)::text[] AS requires
      FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace ORDER BY e.extname`,
  );
  const available = await client.query<AvailableExtensionVersion>(
    `SELECT name,version,schema,COALESCE(requires,'{}'::name[])::text[] AS requires,relocatable,
      ($2::boolean OR $3::boolean OR (NOT superuser OR trusted) AND $4::boolean) AS "canInstall"
      FROM pg_available_extension_versions WHERE name=ANY($1::name[]) ORDER BY name,version`,
    [neonExtensionNames, privileges.superuser, privileges.neonSuperuser, privileges.canCreateDatabaseObjects],
  );
  const schemas = await client.query<ExtensionSchema>(
    `SELECT n.nspname AS name,pg_has_role(current_user,n.nspowner,'USAGE') AS owned,
      has_schema_privilege(current_user,n.oid,'CREATE') AS "canCreate",
      has_schema_privilege(current_user,n.oid,'USAGE') AS "canUse",
      NOT EXISTS (SELECT 1 FROM aclexplode(COALESCE(n.nspacl,acldefault('n',n.nspowner))) a
        LEFT JOIN pg_roles r ON r.oid=a.grantee
        WHERE a.privilege_type='CREATE' AND (a.grantee=0 OR
          NOT (a.grantee=n.nspowner OR r.rolsuper OR pg_has_role(current_user,a.grantee,'USAGE') OR
            COALESCE(pg_has_role(a.grantee,to_regrole('neon_superuser'),'MEMBER'),false)))) AS secure
      FROM pg_namespace n ORDER BY n.nspname`,
  );
  const updatePaths = await client.query<ExtensionInspection["updatePaths"][number]>(
    `SELECT e.name,p.source,p.target,p.path FROM pg_available_extensions e
      CROSS JOIN LATERAL pg_extension_update_paths(e.name) p
      WHERE e.name=ANY($1::name[]) ORDER BY e.name,p.source,p.target`,
    [neonExtensionNames],
  );
  // Follow subordinate auto/internal dependencies, never ordinary type/function dependencies.
  const members = await client.query<ExtensionMember>(
    `WITH RECURSIVE ${extensionMembershipCte} SELECT m.extension,m.classid::regclass::text AS "className",m.objid::integer AS "objectId",m.objsubid AS "subId",
      o.type AS kind,o.schema,o.name,o.identity FROM members m
      CROSS JOIN LATERAL pg_identify_object(m.classid,m.objid,m.objsubid) o
      ORDER BY m.extension,o.identity,m.objsubid`,
  );
  return {
    database: privileges.database,
    role: privileges.role,
    canCreateDatabaseObjects: privileges.canCreateDatabaseObjects,
    installed: installed.rows,
    available: available.rows,
    schemas: schemas.rows,
    updatePaths: updatePaths.rows,
    provider,
    cronDatabase: privileges.cronDatabase,
    members: members.rows,
  };
}

function checkSchema(target: ExtensionInspection, desired: ExtensionState, fixedSchema: string | null): void {
  v.parse(extensionSchemaValidator, desired.schema);
  if (fixedSchema !== null && fixedSchema !== desired.schema)
    throw new ExtensionError(
      "PLACEMENT",
      `${desired.name} requires schema ${fixedSchema}; explicitly configure that schema instead of ${desired.schema}`,
    );
  const schema = target.schemas.find((entry) => entry.name === desired.schema);
  if (!schema) {
    if (!target.canCreateDatabaseObjects)
      throw new ExtensionError(
        "PRIVILEGE",
        `Migration role lacks CREATE privilege for extension schema ${desired.schema}`,
      );
    return;
  }
  if (!schema.secure)
    throw new ExtensionError(
      "PRIVILEGE",
      `Remove untrusted CREATE privileges from extension schema ${desired.schema} before installation`,
    );
  if (!schema.owned && fixedSchema !== desired.schema)
    throw new ExtensionError(
      "PRIVILEGE",
      `Extension schema ${desired.schema} requires migration authority ownership; Loom will not rewrite existing ownership`,
    );
  if (!schema.canUse || !schema.canCreate)
    throw new ExtensionError("PRIVILEGE", `Migration role lacks required schema privileges on ${desired.schema}`);
}
function checkProvider(target: ExtensionInspection, name: string): void {
  if (name === "pg_cron") {
    if (target.cronDatabase !== target.database)
      throw new ExtensionError(
        "PREREQUISITE",
        `Set cron.database_name to ${target.database} through the Neon endpoint settings and restart compute before installing pg_cron; Loom does not change endpoint settings`,
      );
    if (target.provider.activeCompute !== true)
      throw new ExtensionError("PREREQUISITE", "pg_cron requires verified disabled scale-to-zero on its Neon compute");
  }
  if (name === "pg_repack" && target.provider.pgRepackEnabled !== true)
    throw new ExtensionError(
      "PREREQUISITE",
      "pg_repack requires a paid Neon plan, Support enablement and a compute restart; verify these prerequisites before applying",
    );
}

/** Plan against a fresh observation. Pre-existing capabilities require explicit reviewed adoption. */
export function planExtensions(
  intent: LoomExtensions | undefined,
  target: ExtensionInspection,
  managed: readonly ExtensionState[] = [],
): ExtensionPlan {
  const desired = new Map<string, ExtensionState>();
  const versions = new Map<string, AvailableExtensionVersion>();
  for (const [name, entry] of Object.entries(intent ?? {})) {
    if (!entry) continue;
    const available = target.available.find(
      (candidate) => candidate.name === name && candidate.version === entry.version,
    );
    if (!available)
      throw new ExtensionError(
        "UNAVAILABLE",
        `Extension ${name} version ${entry.version} is unavailable on this target; inspect pg_available_extension_versions and restart compute after provider updates if required`,
      );
    checkProvider(target, name);
    const requirement = state({
      name,
      version: entry.version,
      schema: entry.schema,
      requires: available.requires.filter((dependency) => dependency !== "plpgsql"),
    });
    checkSchema(target, requirement, available.schema);
    desired.set(name, requirement);
    versions.set(name, available);
  }
  const ordered: ExtensionState[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();
  function visit(requirement: ExtensionState) {
    if (visited.has(requirement.name)) return;
    if (visiting.has(requirement.name))
      throw new ExtensionError("DEPENDENCY", `Extension dependency cycle at ${requirement.name}`);
    visiting.add(requirement.name);
    for (const dependency of requirement.requires) {
      const declaration = desired.get(dependency);
      if (!declaration)
        throw new ExtensionError(
          "DEPENDENCY",
          `${requirement.name} requires an explicit version and schema: declare ${dependency} in database.extensions`,
        );
      visit(declaration);
    }
    visiting.delete(requirement.name);
    visited.add(requirement.name);
    ordered.push(requirement);
  }
  for (const requirement of canonicalExtensionState([...desired.values()])) visit(requirement);
  const tracked = canonicalExtensionState(managed);
  verifyExtensions(target, tracked);
  const names = new Set([...desired.keys(), ...tracked.map((entry) => entry.name)]);
  const before = canonicalExtensionState(target.installed.filter((entry) => names.has(entry.name)).map(state));
  const after = new Map(before.map((entry) => [entry.name, entry]));
  const operations: ExtensionOperation[] = [];
  for (const requirement of ordered) {
    const installed = target.installed.find((entry) => entry.name === requirement.name);
    const available = versions.get(requirement.name);
    if (!available) throw new Error("Missing checked extension version");
    let previous = installed ? state(installed) : null;
    if (!previous) {
      if (!available.canInstall)
        throw new ExtensionError("PRIVILEGE", `Migration role lacks installation privilege for ${requirement.name}`);
      operations.push({ kind: "install", before: null, after: requirement });
    } else {
      if (!tracked.some((entry) => entry.name === requirement.name))
        operations.push({ kind: "adopt", before: previous, after: previous });
      if (previous.version !== requirement.version) {
        if (!installed?.canAlter || !available.canInstall)
          throw new ExtensionError(
            "PRIVILEGE",
            `Migration role lacks update privilege or ownership for ${requirement.name}`,
          );
        if (
          !target.updatePaths.some(
            (path) =>
              path.name === requirement.name &&
              path.source === previous?.version &&
              path.target === requirement.version &&
              path.path !== null,
          )
        )
          throw new ExtensionError(
            "UPDATE_PATH",
            `No PostgreSQL update path for ${requirement.name} from ${previous.version} to ${requirement.version}; prepare a supported provider version before applying`,
          );
        const updated = { ...requirement, schema: previous.schema };
        operations.push({ kind: "update", before: previous, after: updated });
        previous = updated;
      }
      if (previous.schema !== requirement.schema) {
        if (!available.relocatable)
          throw new ExtensionError(
            "PLACEMENT",
            `${requirement.name} is not relocatable; initial schema placement does not permit a later move`,
          );
        if (!installed?.canAlter)
          throw new ExtensionError("PRIVILEGE", `Migration role lacks ownership to relocate ${requirement.name}`);
        operations.push({ kind: "move", before: previous, after: requirement });
      }
    }
    after.set(requirement.name, requirement);
  }
  return validateExtensionPlan({
    before,
    after: canonicalExtensionState([...after.values()]),
    requirements: canonicalExtensionState([...desired.values()]),
    operations,
    automatic: operations.every((operation) => operation.kind === "install"),
  });
}

export function verifyExtensions(target: ExtensionInspection, requirements: readonly ExtensionState[]): void {
  for (const requirement of canonicalExtensionState(requirements)) {
    const installed = target.installed.find((entry) => entry.name === requirement.name);
    if (!installed || !same(state(installed), requirement))
      throw new ExtensionError(
        "DRIFT",
        `Extension drift: ${requirement.name} state mismatch; expected version ${requirement.version} in schema ${requirement.schema}`,
      );
  }
}

/** Runtime can resolve extension SQL, while extension routines/tables retain their installation ACLs. */
export async function grantExtensionUsage(
  client: pg.Client,
  requirements: readonly ExtensionState[],
  runtimeRole: string,
): Promise<void> {
  assertExtensionLock(client);
  const target = await inspectExtensions(client);
  verifyExtensions(target, requirements);
  const role = quoteIdentifier(runtimeRole);
  for (const schema of new Set(requirements.map((entry) => entry.schema))) {
    const placement = target.schemas.find((entry) => entry.name === schema);
    if (placement?.owned) {
      await client.query(`GRANT USAGE ON SCHEMA ${quoteIdentifier(schema)} TO ${role}`);
      await client.query(`REVOKE CREATE ON SCHEMA ${quoteIdentifier(schema)} FROM ${role}`);
    } else {
      const usage = await client.query<{ allowed: boolean }>("SELECT has_schema_privilege($1,$2,'USAGE') AS allowed", [
        runtimeRole,
        schema,
      ]);
      if (!usage.rows[0]?.allowed)
        throw new ExtensionError(
          "PRIVILEGE",
          `Runtime needs provider-authorized USAGE on fixed extension schema ${schema}; Loom does not rewrite provider grants`,
        );
    }
  }
}
function versionLiteral(version: string): string {
  v.parse(versionToken, version);
  return `E'${version.replaceAll("\\", "\\\\").replaceAll("'", "''")}'`;
}
export function renderExtensionOperation(input: ExtensionOperation): string | undefined {
  const operation = v.parse(extensionOperationValidator, input);
  const name = quoteExtensionName(operation.after.name);
  if (operation.kind === "adopt") return undefined;
  if (operation.kind === "install")
    return `CREATE EXTENSION ${name} WITH SCHEMA ${quoteIdentifier(operation.after.schema)} VERSION ${versionLiteral(operation.after.version)};`;
  if (operation.before.name !== operation.after.name) throw new Error("Extension operation cannot change its name");
  if (operation.kind === "update")
    return `ALTER EXTENSION ${name} UPDATE TO ${versionLiteral(operation.after.version)};`;
  return `ALTER EXTENSION ${name} SET SCHEMA ${quoteIdentifier(operation.after.schema)};`;
}

/** Check a portable operation chain without changing the target. The next artifact sees this artifact's result. */
export function preflightExtensionPlan(target: ExtensionInspection, input: ExtensionPlan): ExtensionInspection {
  const plan = validateExtensionPlan(input);
  const names = new Set<string>([...plan.before, ...plan.after].map((entry) => entry.name));
  const observed = target.installed.filter((entry) => names.has(entry.name)).map(state);
  if (extensionStateHash(observed) !== extensionStateHash(plan.before))
    throw new ExtensionError(
      "DRIFT",
      "Extension drift: stale operation precondition; regenerate and review the migration against the current target",
    );
  const intent = Object.fromEntries(
    plan.requirements.map((entry) => [entry.name, { version: entry.version, schema: entry.schema }]),
  );
  const checked = planExtensions(intent, target, []);
  const mutations = (operations: readonly ExtensionOperation[]) =>
    operations.filter((operation) => operation.kind !== "adopt");
  if (JSON.stringify(mutations(checked.operations)) !== JSON.stringify(mutations(plan.operations)))
    throw new ExtensionError("DRIFT", "Extension operations differ from the checked target plan");
  if (JSON.stringify(checked.requirements) !== JSON.stringify(canonicalExtensionState(plan.requirements)))
    throw new ExtensionError("DRIFT", "Extension dependency requirements changed since planning");
  const installed = plan.after.map((entry): InstalledExtension => {
    const existing = target.installed.find((candidate) => candidate.name === entry.name);
    const available = target.available.find(
      (candidate) => candidate.name === entry.name && candidate.version === entry.version,
    );
    return {
      ...entry,
      canAlter: existing?.canAlter ?? true,
      relocatable: available?.relocatable ?? existing?.relocatable ?? false,
    };
  });
  const schemas = [...target.schemas];
  for (const operation of mutations(plan.operations)) {
    if (
      (operation.kind === "install" || operation.kind === "move") &&
      !schemas.some((schema) => schema.name === operation.after.schema)
    )
      schemas.push({ name: operation.after.schema, owned: true, secure: true, canCreate: true, canUse: true });
  }
  return {
    ...target,
    installed: [...target.installed.filter((entry) => !names.has(entry.name)), ...installed],
    schemas,
  };
}

/** Caller owns BEGIN/COMMIT and the dependent DDL/history. The session lock must precede scope locks. */
export async function applyExtensionOperations(
  client: pg.Client,
  input: ExtensionPlan,
  provider: ExtensionProviderEvidence = extensionProviderEvidence(client),
): Promise<void> {
  assertExtensionLock(client);
  const plan = validateExtensionPlan(input);
  // SAVEPOINT proves the caller has an explicit transaction before any mutation.
  await client.query("SAVEPOINT loom_extension_preflight");
  await client.query("RELEASE SAVEPOINT loom_extension_preflight");
  const target = await inspectExtensions(client, provider);
  // Recheck the actual observation under the held lock, including between successive artifacts.
  preflightExtensionPlan(target, plan);
  for (const operation of plan.operations) {
    const sql = renderExtensionOperation(operation);
    if (!sql) continue;
    const available = target.available.find(
      (entry) => entry.name === operation.after.name && entry.version === operation.after.version,
    );
    if (!available)
      throw new ExtensionError(
        "UNAVAILABLE",
        `Extension ${operation.after.name} version ${operation.after.version} is unavailable`,
      );
    if (operation.kind === "install" || operation.kind === "move") {
      const schema = await client.query<{ exists: boolean }>(
        "SELECT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname=$1) AS exists",
        [operation.after.schema],
      );
      if (!schema.rows[0]?.exists && available.schema !== operation.after.schema) {
        await client.query(`CREATE SCHEMA ${quoteIdentifier(operation.after.schema)} AUTHORIZATION CURRENT_USER`);
        await client.query(`REVOKE CREATE ON SCHEMA ${quoteIdentifier(operation.after.schema)} FROM PUBLIC`);
      }
    }
    try {
      // PostgreSQL 18 executes extension scripts within a transaction and forbids transaction-control/VACUUM.
      // https://www.postgresql.org/docs/18/extend-extensions.html#EXTEND-EXTENSIONS-FILES
      await client.query(sql);
    } catch (cause) {
      if (cause instanceof Error && "code" in cause && ["25001", "0A000"].includes(String(cause.code)))
        throw new ExtensionError(
          "MANUAL_OPERATION",
          `${operation.after.name} has unsupported transactional installation behavior; a reviewed manual provider operation is required`,
        );
      throw cause;
    }
  }
  verifyExtensions(await inspectExtensions(client, provider), plan.after);
}
