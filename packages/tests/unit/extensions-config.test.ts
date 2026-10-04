import { expect, test } from "vite-plus/test";
import * as v from "valibot";
import { defineConfig, type KelloConfigInput } from "kello/tooling";
import { configValidator } from "../../../apps/loom/src/tooling/config/define-config";

test("extension configuration preserves exact versions and defaults or overrides placement", () => {
  expect(
    defineConfig({
      database: {
        extensions: {
          vector: { version: "0.8.6" },
          pg_trgm: { version: "1.6", schema: "custom_extensions" },
          "uuid-ossp": { version: "1.1" },
        },
      },
    }).database.extensions,
  ).toEqual({
    pg_trgm: { version: "1.6", schema: "custom_extensions" },
    "uuid-ossp": { version: "1.1", schema: "extensions" },
    vector: { version: "0.8.6", schema: "extensions" },
  });
  // Version tokens are opaque. The target must match this token exactly, never resolve a range.
  expect(defineConfig({ database: { extensions: { vector: { version: "^0.8.6" } } } }).database.extensions).toEqual({
    vector: { version: "^0.8.6", schema: "extensions" },
  });
});

test("invalid declarations identify their configuration path", () => {
  for (const [extensions, path] of [
    [{ pgvector: { version: "0.8.6" } }, "database.extensions.pgvector"],
    [{ vector: {} }, "database.extensions.vector.version"],
    [{ vector: { version: "" } }, "database.extensions.vector.version"],
    [{ vector: { version: "0.8.6", extra: true } }, "database.extensions.vector.extra"],
    [{ vector: { version: "0.8.6", schema: "" } }, "database.extensions.vector.schema"],
    [{ vector: { version: "0.8.6", schema: "pg_catalog" } }, "database.extensions.vector.schema"],
    [{ vector: { version: "0.8.6", schema: "loom_meta" } }, "database.extensions.vector.schema"],
    [{ pg_search: { version: "1" } }, "database.extensions.pg_search"],
    [{ plv8: { version: "1" } }, "database.extensions.plv8"],
    [{ pg_ivm: { version: "1.12" } }, "database.extensions.pg_ivm"],
  ] as const) {
    const result = v.safeParse(configValidator, { database: { extensions } });
    expect(result.success).toBe(false);
    if (result.success) throw new Error("Invalid declaration accepted");
    expect(result.issues.map((issue) => issue.path?.map((item) => item.key).join("."))).toContain(path);
  }
});

test("extension schemas retain quoted Unicode identifiers without truncation or encoding loss", () => {
  for (const schema of ['route"日本', "custom-extensions", "Raster 日本", "日".repeat(21)]) {
    expect(
      v.parse(configValidator, { database: { extensions: { pg_trgm: { version: "1.6", schema } } } }).database
        .extensions?.pg_trgm?.schema,
    ).toBe(schema);
  }
  for (const schema of [
    "",
    "bad\0schema",
    "日".repeat(22),
    "a".repeat(64),
    "\ud800",
    "pg_catalog",
    "loom_meta",
    "information_schema",
  ]) {
    expect(
      v.safeParse(configValidator, { database: { extensions: { pg_trgm: { version: "1.6", schema } } } }).success,
    ).toBe(false);
  }
});

test("empty intent retains the legacy serialized configuration and canonical order", () => {
  const legacy = JSON.stringify(defineConfig({}));
  expect(legacy).not.toContain("extensions");
  expect(JSON.stringify(defineConfig({ database: { extensions: {} } }))).toBe(legacy);
  const first = defineConfig({
    database: { extensions: { vector: { version: "0.8.6" }, citext: { version: "1.8" } } },
  });
  const second = defineConfig({
    database: { extensions: { citext: { version: "1.8" }, vector: { version: "0.8.6" } } },
  });
  expect(JSON.stringify(first)).toBe(JSON.stringify(second));
});

test("authoring types accept canonical names and reject unavailable names and incomplete entries", () => {
  const valid: KelloConfigInput = { database: { extensions: { "uuid-ossp": { version: "1.1" } } } };
  expect(defineConfig(valid).database.extensions?.["uuid-ossp"]?.version).toBe("1.1");
  // @ts-expect-error Neon PG18 installs vector using its SQL name.
  const alias: KelloConfigInput = { database: { extensions: { pgvector: { version: "0.8.6" } } } };
  // @ts-expect-error An exact version is required.
  const incomplete: KelloConfigInput = { database: { extensions: { vector: {} } } };
  expect(() => defineConfig(alias)).toThrow();
  expect(() => defineConfig(incomplete)).toThrow();
});

test("pg_cron accepts its explicit provider control schema without opening other reserved placements", () => {
  expect(
    v.parse(configValidator, { database: { extensions: { pg_cron: { version: "1.6", schema: "pg_catalog" } } } })
      .database.extensions,
  ).toEqual({ pg_cron: { version: "1.6", schema: "pg_catalog" } });
  expect(
    v.safeParse(configValidator, { database: { extensions: { pg_trgm: { version: "1.6", schema: "pg_catalog" } } } })
      .success,
  ).toBe(false);
  expect(
    v.safeParse(configValidator, { database: { extensions: { pg_cron: { version: "1.6", schema: "pg_other" } } } })
      .success,
  ).toBe(false);
  expect(
    v.parse(configValidator, { database: { extensions: { pg_cron: { version: "1.6" } } } }).database.extensions,
  ).toEqual({ pg_cron: { version: "1.6", schema: "extensions" } });
});
