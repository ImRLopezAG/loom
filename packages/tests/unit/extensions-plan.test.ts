import { expect, test } from "vite-plus/test";
import { defineConfig, type LoomExtensionsInput } from "loom/tooling";
import {
  planExtensions,
  extensionStateHash,
  renderExtensionOperation,
  verifyExtensions,
  validateExtensionPlan,
  type ExtensionInspection,
  type ExtensionState,
} from "../../../apps/loom/src/tooling/migrations/extensions";

function target(): ExtensionInspection {
  return {
    database: "fixture",
    role: "owner",
    canCreateDatabaseObjects: true,
    installed: [],
    schemas: [],
    provider: {},
    cronDatabase: null,
    available: [
      { name: "pg_trgm", version: "1.6", schema: null, requires: [], relocatable: true, canInstall: true },
      { name: "cube", version: "1.5", schema: null, requires: [], relocatable: true, canInstall: true },
      { name: "earthdistance", version: "1.2", schema: null, requires: ["cube"], relocatable: true, canInstall: true },
    ],
    updatePaths: [],
    members: [],
  };
}
function intent(extensions: LoomExtensionsInput) {
  return defineConfig({ database: { extensions } }).database.extensions;
}
const trgm: ExtensionState = { name: "pg_trgm", version: "1.6", schema: "extensions", requires: [] };

test("dependency pins produce deterministic installation order and never CASCADE", () => {
  expect(() => planExtensions(intent({ earthdistance: { version: "1.2" } }), target())).toThrow("declare cube");
  const plan = planExtensions(intent({ earthdistance: { version: "1.2" }, cube: { version: "1.5" } }), target());
  expect(plan.operations.map((operation) => operation.after.name)).toEqual(["cube", "earthdistance"]);
  expect(plan.automatic).toBe(true);
  expect(plan.operations.map(renderExtensionOperation).join("\n")).not.toContain("CASCADE");
});

test("nonrelocatable initial placement differs from a reviewed move and fixed placement is explicit", () => {
  const inspection = target();
  inspection.available[0] = { ...inspection.available[0]!, relocatable: false };
  expect(planExtensions(intent({ pg_trgm: { version: "1.6", schema: "custom" } }), inspection).automatic).toBe(true);
  inspection.installed.push({ ...trgm, canAlter: true, relocatable: false });
  expect(() => planExtensions(intent({ pg_trgm: { version: "1.6", schema: "custom" } }), inspection, [trgm])).toThrow(
    "not relocatable",
  );
  inspection.installed = [];
  inspection.available[0] = { ...inspection.available[0]!, schema: "provider_fixed" };
  expect(() => planExtensions(intent({ pg_trgm: { version: "1.6" } }), inspection)).toThrow("provider_fixed");
  inspection.schemas.push({ name: "provider_fixed", owned: false, secure: true, canCreate: true, canUse: true });
  expect(
    planExtensions(intent({ pg_trgm: { version: "1.6", schema: "provider_fixed" } }), inspection).operations,
  ).toHaveLength(1);
});

test("unmanaged matching state needs adoption and managed matching state is idempotent", () => {
  const inspection = target();
  inspection.installed.push({ ...trgm, canAlter: true, relocatable: true });
  const declaration = intent({ pg_trgm: { version: "1.6" } });
  const adoption = planExtensions(declaration, inspection);
  expect(adoption.operations[0]?.kind).toBe("adopt");
  expect(adoption.automatic).toBe(false);
  expect(renderExtensionOperation(adoption.operations[0]!)).toBeUndefined();
  expect(planExtensions(declaration, inspection, [trgm]).operations).toEqual([]);
  inspection.installed[0] = { ...inspection.installed[0]!, version: "1.5" };
  expect(() => planExtensions(declaration, inspection, [trgm])).toThrow("drift");
});

test("updates follow exact PostgreSQL update paths and removal retains installed state", () => {
  const inspection = target();
  const previous = { ...trgm, version: "1.5" };
  inspection.installed.push({ ...previous, canAlter: true, relocatable: true });
  expect(() => planExtensions(intent({ pg_trgm: { version: "1.6" } }), inspection, [previous])).toThrow("update path");
  inspection.updatePaths.push({ name: "pg_trgm", source: "1.5", target: "1.6", path: "1.5--1.6" });
  const updated = planExtensions(intent({ pg_trgm: { version: "1.6" } }), inspection, [previous]);
  expect(updated.operations[0]?.kind).toBe("update");
  expect(updated.automatic).toBe(false);
  const removed = planExtensions(undefined, inspection, [previous]);
  expect(removed.operations).toEqual([]);
  expect(removed.after).toEqual([previous]);
  expect(removed.requirements).toEqual([]);
});

test("unsafe schemas, missing privileges and provider prerequisites fail before operations", () => {
  const inspection = target();
  inspection.schemas.push({ name: "extensions", owned: true, secure: false, canCreate: true, canUse: true });
  expect(() => planExtensions(intent({ pg_trgm: { version: "1.6" } }), inspection)).toThrow("CREATE");
  inspection.schemas = [{ name: "extensions", owned: false, secure: true, canCreate: true, canUse: true }];
  expect(() => planExtensions(intent({ pg_trgm: { version: "1.6" } }), inspection)).toThrow("ownership");
  inspection.schemas = [];
  inspection.available[0] = { ...inspection.available[0]!, canInstall: false };
  expect(() => planExtensions(intent({ pg_trgm: { version: "1.6" } }), inspection)).toThrow("privilege");
  inspection.available.push({
    name: "pg_cron",
    version: "1.6",
    schema: "cron",
    requires: [],
    relocatable: false,
    canInstall: true,
  });
  expect(() => planExtensions(intent({ pg_cron: { version: "1.6", schema: "cron" } }), inspection)).toThrow(
    "cron.database_name",
  );
});

test("opaque versions must be available exactly and typed rendering cannot inject SQL", () => {
  expect(() => planExtensions(intent({ pg_trgm: { version: "^1.6" } }), target())).toThrow("unavailable");
  expect(
    renderExtensionOperation({
      kind: "install",
      before: null,
      after: { ...trgm, name: "uuid-ossp", version: "1.1'; DROP TABLE users;--\\" },
    }),
  ).toBe("CREATE EXTENSION \"uuid-ossp\" WITH SCHEMA \"extensions\" VERSION E'1.1''; DROP TABLE users;--\\\\';");
  expect(() =>
    renderExtensionOperation({ kind: "install", before: null, after: { ...trgm, schema: "loom_meta" } }),
  ).toThrow();
});

test("portable state identity excludes ownership and observation order; verification checks dependencies", () => {
  const cube: ExtensionState = { name: "cube", version: "1.5", schema: "extensions", requires: [] };
  expect(extensionStateHash([trgm, cube])).toBe(extensionStateHash([cube, trgm]));
  expect(extensionStateHash([trgm])).not.toBe(extensionStateHash([{ ...trgm, version: "1.5" }]));
  const inspection = target();
  inspection.installed.push({ ...trgm, canAlter: true, relocatable: true });
  expect(() => verifyExtensions(inspection, [trgm])).not.toThrow();
  expect(() => verifyExtensions(inspection, [{ ...trgm, schema: "custom" }])).toThrow("mismatch");
  expect(() => verifyExtensions(inspection, [{ ...trgm, requires: ["cube"] }])).toThrow("mismatch");
});

test("portable operations must exactly account for their state changes and safety", () => {
  const plan = planExtensions(intent({ pg_trgm: { version: "1.6" } }), target());
  expect(() => validateExtensionPlan({ ...plan, operations: [] })).toThrow("operation result");
  expect(() => validateExtensionPlan({ ...plan, automatic: false })).toThrow("safety");
  expect(() => validateExtensionPlan({ ...plan, before: [trgm] })).toThrow("precondition");
  expect(() => validateExtensionPlan({ ...plan, requirements: [{ ...trgm, version: "1.5" }] })).toThrow("requirement");
});
