import { expect, test } from "vite-plus/test";
import { compileBetterAuthSchema, resolveBetterAuthSchema } from "loom/better-auth";
import { getAuthTables } from "@better-auth/core/db";
import { jwt, organization, twoFactor } from "better-auth/plugins";
import { inbox } from "better-inbox";
import { getTableConfig } from "drizzle-orm/pg-core";
import type { BetterAuthOptions } from "better-auth";
import { betterAuth } from "better-auth";

const cases: readonly [string, BetterAuthOptions][] = [
  ["core", {}],
  ["jwt", { plugins: [jwt()] }],
  ["organization", { plugins: [organization()] }],
  ["teams", { plugins: [organization({ teams: { enabled: true } })] }],
  ["two-factor", { plugins: [twoFactor()] }],
  ["inbox", { plugins: [inbox()] }],
  ["combined", { plugins: [jwt(), organization({ teams: { enabled: true } }), twoFactor(), inbox()] }],
  ["rate-limit", { rateLimit: { storage: "database" } }],
  [
    "secondary",
    {
      secondaryStorage: {
        get: async () => null,
        set: async () => {},
        delete: async () => {},
        getAndDelete: async () => null,
        increment: async () => 1,
      },
    },
  ],
];
for (const [name, options] of cases)
  test(`${name}: native resolver tables match adapter and migration tables`, () => {
    const compiled = compileBetterAuthSchema(options, "auth_test");
    const native = getAuthTables(options);
    expect(Object.keys(compiled.tables).sort()).toEqual(
      Object.values(native)
        .map((t) => t.modelName)
        .sort(),
    );
    for (const model of Object.values(native)) {
      const table = getTableConfig(compiled.tables[model.modelName]!);
      expect(table.schema).toBe("auth_test");
      expect(table.columns.map((c) => c.name).sort()).toEqual(
        ["id", ...Object.entries(model.fields).map(([k, f]) => f.fieldName ?? k)].sort(),
      );
      expect(table.columns.some((c) => c.name === "_id" || c.name === "_createdAt")).toBe(false);
    }
  });

test("foreign keys resolve logical keys before physical aliases", () => {
  const schema = compileBetterAuthSchema(
    { user: { modelName: "account", fields: { email: "address" } }, account: { modelName: "credentials" } },
    "auth_test",
  );
  const session = getTableConfig(schema.tables.session!);
  const target = session.foreignKeys[0]!.reference();
  expect(getTableConfig(target.foreignTable).name).toBe("account");
  expect(target.foreignColumns[0]!.name).toBe("id");
});

test("runtime defaults are not frozen into SQL and runtime-only changes preserve fingerprint", () => {
  const first = compileBetterAuthSchema({}, "auth_test");
  const second = compileBetterAuthSchema(
    { trustedOrigins: ["https://different.test"], session: { expiresIn: 100 } },
    "auth_test",
  );
  expect(first.fingerprint).toBe(second.fingerprint);
  expect(getTableConfig(first.tables.user!).columns.find((c) => c.name === "createdAt")!.default).toBeUndefined();
});

test("duplicate aliases and reserved namespaces fail before migration", () => {
  expect(() => compileBetterAuthSchema({ account: { modelName: "user" } }, "auth_test")).toThrow("Duplicate");
  expect(() => compileBetterAuthSchema({}, "neon_auth")).toThrow("namespace");
  expect(() => compileBetterAuthSchema({ user: { fields: { name: "email" } } }, "auth_test")).toThrow("Duplicate");
});

test("external tables remain in the adapter lookup but are excluded from migration ownership", () => {
  const compiled = compileBetterAuthSchema(
    {
      plugins: [
        { id: "external", schema: { audit: { disableMigration: true, fields: { action: { type: "string" } } } } },
      ],
    },
    "auth_test",
  );
  expect(compiled.tables.audit).toBeDefined();
  expect(compiled.ownedTables.audit).toBeUndefined();
});

test("schema-affecting settings change the fingerprint while equivalent field order does not", () => {
  const first = compileBetterAuthSchema(
    { user: { additionalFields: { a: { type: "string" }, b: { type: "number" } } } },
    "auth_test",
  );
  const reordered = compileBetterAuthSchema(
    { user: { additionalFields: { b: { type: "number" }, a: { type: "string" } } } },
    "auth_test",
  );
  expect(reordered.fingerprint).toBe(first.fingerprint);
  expect(
    compileBetterAuthSchema({ plugins: [organization({ teams: { enabled: true } })] }, "auth_test").fingerprint,
  ).not.toBe(compileBetterAuthSchema({ plugins: [organization()] }, "auth_test").fingerprint);
  expect(() => compileBetterAuthSchema({ advanced: { database: { generateId: false } } }, "auth_test")).toThrow(
    "ID mode",
  );
});

const initializationOptions = {
  baseURL: "https://auth.example.test",
  secret: "test-only-auth-schema-resolution-secret-123456789",
  telemetry: { enabled: false },
} satisfies BetterAuthOptions;

test("native initialization supports real combined plugins without accessing a database", async () => {
  const schema = await resolveBetterAuthSchema(
    (database) =>
      betterAuth({ ...initializationOptions, database, plugins: [jwt(), organization(), twoFactor(), inbox()] }),
    "auth_test",
  );
  expect(schema.tables.jwks).toBeDefined();
  expect(schema.tables.organization).toBeDefined();
});

test("schema-changing initialization and nondeterministic factories reject before SQL", async () => {
  await expect(
    resolveBetterAuthSchema(
      (database) =>
        betterAuth({
          ...initializationOptions,
          database,
          plugins: [
            {
              id: "late-schema",
              init: () => ({ options: { user: { additionalFields: { late: { type: "string" } } } } }),
            },
          ],
        }),
      "auth_test",
    ),
  ).rejects.toThrow("before initialization");
  let count = 0;
  await expect(
    resolveBetterAuthSchema(
      (database) =>
        betterAuth({
          ...initializationOptions,
          database,
          user: { additionalFields: { [`field${count++}`]: { type: "string" } } },
        }),
      "auth_test",
    ),
  ).rejects.toThrow("nondeterministic");
});

test("initialization cannot query the database and joins fail explicitly", async () => {
  await expect(
    resolveBetterAuthSchema(
      (database) =>
        betterAuth({
          ...initializationOptions,
          database,
          plugins: [
            {
              id: "query-on-init",
              init: async (context) => {
                await context.adapter.count({ model: "user" });
              },
            },
          ],
        }),
      "auth_test",
    ),
  ).rejects.toThrow("must not access");
  expect(() => compileBetterAuthSchema({ advanced: { database: { joins: true } } }, "auth_test")).toThrow("joins");
  const previous = compileBetterAuthSchema({ plugins: [{ id: "versioned", version: "1" }] }, "auth_test");
  expect(compileBetterAuthSchema({ plugins: [{ id: "versioned", version: "2" }] }, "auth_test").fingerprint).not.toBe(
    previous.fingerprint,
  );
});
