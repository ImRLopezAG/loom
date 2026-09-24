import type { loadProject } from "../project/load";

type LoadedProject = Awaited<ReturnType<typeof loadProject>>;

export function runtimeArtifacts(project: LoadedProject) {
  const native = project.protocol === "loom-orpc-2";
  const config = {
    auth: project.config.auth,
    jobs: project.config.jobs,
    realtime: project.config.realtime,
    openapi: project.config.openapi,
  };
  const artifacts = new Map([
    [
      "runtime.js",
      [
        native
          ? 'import { schema, relations, auth, crons, storage, procedures, jobMigrations } from "./router.js";'
          : 'import { schema, relations, auth, crons, storage, registry } from "./registry.js";',
        'import { version } from "./version.mjs";',
        "export function runtimeOptions() {",
        `  return { schema, relations, auth, crons, storage, ${native ? "procedures, jobMigrations" : "functions: registry"}, version, metadataNamespace: ${JSON.stringify(project.config.database.metadataNamespace)}, config: ${JSON.stringify(config)} };`,
        "}",
        "",
      ].join("\n"),
    ],
  ]);
  for (const [name, exported, legacyFactory] of [
    ["service", "createService", "createNeonService"],
    ["worker", "createWorker", "createNeonWorker"],
  ] as const) {
    const factory = native ? legacyFactory.replace("Neon", "NeonRpc") : legacyFactory;
    const runtimeType = native ? "RpcRuntimeOptions" : "RuntimeOptions";
    artifacts.set(
      `${name}.js`,
      [
        `import { ${factory} } from "@loom/core/neon";`,
        'import { runtimeOptions } from "./runtime.js";',
        `export function ${exported}(options) { return ${factory}({ ...options, ...runtimeOptions() }); }`,
        "",
      ].join("\n"),
    );
    const binding = name === "worker" ? " & { readonly bindings: Readonly<Record<string, NeonTriggerBinding>> }" : "";
    artifacts.set(
      `${name}.d.ts`,
      [
        `import type { ${factory}${name === "worker" ? ", NeonTriggerBinding" : ""} } from "@loom/core/neon";`,
        `import type { ${runtimeType} } from "@loom/core/server";`,
        'import type { AnyRelations } from "drizzle-orm";',
        `type ConnectionOptions = Pick<${runtimeType}<AnyRelations>, "connectionString" | "deployment" | "assertActive" | "assertIngress" | "maxConnections" | "storageBackend"${native ? ' | "directConnectionString"' : ""}>;`,
        `export declare function ${exported}(options: ConnectionOptions${binding}): ReturnType<typeof ${factory}>;`,
        "",
      ].join("\n"),
    );
  }
  return Object.fromEntries(artifacts);
}
