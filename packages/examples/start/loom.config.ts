import { defineConfig, type LoomConfigInput } from "@loom/tooling";

const branchId = process.env.NEON_BRANCH_ID;
const developmentBranchId = process.env.NEON_DEVELOPMENT_BRANCH_ID;
const targets: NonNullable<LoomConfigInput["provider"]>["targets"] = {};
if (branchId) targets.preview = { branchId };
if (developmentBranchId) targets.development = { branchId: developmentBranchId };
const authUrl = process.env.NEON_AUTH_URL;
export default defineConfig({
  project: "start",
  database: {
    namespace: "start_app",
    metadataNamespace: "loom_start",
    runtimeUrlEnv: "LOOM_DATABASE_URL",
    migrationUrlEnv: "LOOM_MIGRATION_DATABASE_URL",
  },
  provider:
    branchId || developmentBranchId
      ? {
          projectId: "late-moon-69483649",
          targets,
        }
      : undefined,
  development: {
    deployment: "start-development",
    databaseName: process.env.NEON_DATABASE_NAME ?? "neondb",
    migrationRole: process.env.NEON_MIGRATION_ROLE ?? "neondb_owner",
    runtimeRole: "loom_start_runtime",
  },
  deployment: {
    environment: "preview",
    deployment: "start-preview",
    databaseName: process.env.NEON_DATABASE_NAME ?? "neondb",
    migrationRole: process.env.NEON_MIGRATION_ROLE ?? "neondb_owner",
    runtimeRole: "loom_start_runtime",
  },
  auth: {
    origins: (process.env.APP_ORIGINS ?? "http://localhost:3001").split(","),
    issuers: authUrl
      ? [{ issuer: new URL(authUrl).origin, jwksUrl: `${authUrl.replace(/\/$/, "")}/.well-known/jwks.json` }]
      : [],
  },
});
