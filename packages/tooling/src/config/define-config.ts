import * as v from "valibot";

const identifier = v.pipe(v.string(), v.regex(/^[a-z][a-z0-9_-]{0,62}$/));
const path = v.pipe(v.string(), v.minLength(1));
const secretName = v.pipe(v.string(), v.regex(/^[A-Z][A-Z0-9_]*$/));
const bounded = (minimum: number, maximum: number) => v.pipe(v.number(), v.integer(), v.minValue(minimum), v.maxValue(maximum));
const target = v.strictObject({ branchId: v.pipe(v.string(), v.minLength(1)), protected: v.optional(v.boolean(), false) });
const configSchema = v.strictObject({
  version: v.optional(v.literal(1), 1),
  project: identifier,
  backend: v.optional(path, "backend"),
  database: v.optional(v.pipe(v.strictObject({
    namespace: v.optional(v.pipe(identifier, v.regex(/^[a-z][a-z0-9_]*$/), v.check((name) => !name.startsWith("pg_") && !name.startsWith("loom_") && name !== "information_schema", "Reserved namespace")), "app"),
    postgresVersion: v.optional(v.literal(18), 18),
    migrations: v.optional(path, "migrations"),
    runtimeUrlEnv: v.optional(secretName, "LOOM_DATABASE_URL"),
    migrationUrlEnv: v.optional(secretName, "LOOM_MIGRATION_DATABASE_URL"),
    metadataNamespace: v.optional(v.pipe(identifier, v.regex(/^loom_[a-z0-9_]+$/)), "loom_meta"),
  }), v.check((database) => database.runtimeUrlEnv !== database.migrationUrlEnv, "Runtime and migration credentials require separate environment variables")), {}),
  provider: v.optional(v.strictObject({
    projectId: v.pipe(v.string(), v.minLength(1)),
    targets: v.strictObject({ development: v.optional(target), preview: v.optional(target), production: v.optional(target) }),
  })),
  auth: v.optional(v.strictObject({
    issuers: v.optional(v.array(v.pipe(v.string(), v.url())), []),
    audience: v.optional(v.string()),
    origins: v.optional(v.array(v.pipe(v.string(), v.url())), []),
  }), {}),
  realtime: v.optional(v.strictObject({
    pollIntervalMs: v.optional(bounded(100, 60000), 1000),
    heartbeatMs: v.optional(bounded(1000, 120000), 15000),
    maxSubscriptions: v.optional(bounded(1, 1000), 100),
    maxResultBytes: v.optional(bounded(1024, 10485760), 1048576),
  }), {}),
  jobs: v.optional(v.strictObject({
    maxAttempts: v.optional(bounded(1, 100), 5),
    leaseMs: v.optional(bounded(1000, 3600000), 60000),
    retryBaseMs: v.optional(bounded(100, 3600000), 1000),
    retentionDays: v.optional(bounded(1, 365), 30),
  }), {}),
});
export type LoomConfigInput = v.InferInput<typeof configSchema>;
export type LoomConfig = v.InferOutput<typeof configSchema>;

export function defineConfig(input: LoomConfigInput): LoomConfig {
  return v.parse(configSchema, input);
}
/** The schema is also used for imported executable configuration's untyped default export. */
export const configValidator = configSchema;
