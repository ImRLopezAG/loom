#!/usr/bin/env bun
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import {
  generateProject,
  initializeProject,
  loadProject,
  planRelease,
  generateRelease,
  generateCustomRelease,
  readRenameHints,
  projectMigrationStatus,
  applyProjectMigrations,
  MigrationCommandError,
} from "@loom/tooling";

const help = `Usage: loom <command> [--cwd <directory>] [--json]

  init [directory] --name <name>  Create a project without overwriting files
  generate                      Generate public/internal references and manifest
  schema inspect                Inspect compiled storage metadata
  schema diff                   Plan changes from the committed migration baseline
  migrations generate --name <name>  Write release SQL and snapshot artifacts
  migrations status             Inspect applied history and live drift without DDL
  migrations apply --runtime-role <role>  Apply validated release artifacts
  doctor                        Validate configuration, schema, and registered functions

Schema diff and migration generation accept --renames <project-relative JSON file>.
Migration application accepts repeated --reviewed-hash <hash> for reviewed changes.
Custom generation accepts --sql <project-relative file> --mode transactional|nontransactional.
`;

export async function runCli(args: readonly string[]): Promise<number> {
  const structured = args.includes("--json");
  let command = "arguments";
  let databaseCommand = false;
  try {
    const parsed = parseArgs({
      args: [...args],
      allowPositionals: true,
      strict: true,
      options: {
        cwd: { type: "string" },
        name: { type: "string" },
        renames: { type: "string" },
        json: { type: "boolean" },
        help: { type: "boolean", short: "h" },
        "runtime-role": { type: "string" },
        "reviewed-hash": { type: "string", multiple: true },
        sql: { type: "string" },
        mode: { type: "string" },
      },
    });
    const [first, second, ...extra] = parsed.positionals;
    if (parsed.values.help || !first) {
      console.log(structured ? JSON.stringify({ ok: true, help }) : help);
      return 0;
    }
    command = first;
    const root = resolve(parsed.values.cwd ?? process.cwd());
    if (parsed.values.sql !== undefined || parsed.values.mode !== undefined) {
      const mode = parsed.values.mode;
      if (
        first !== "migrations" ||
        second !== "generate" ||
        !parsed.values.sql ||
        !parsed.values.name ||
        parsed.values.renames !== undefined ||
        (mode !== "transactional" && mode !== "nontransactional") ||
        extra.length
      ) {
        reportFailure(
          structured,
          command,
          "USAGE",
          "Custom generation requires --name, --sql and --mode transactional|nontransactional, without --renames",
          2,
        );
        return 2;
      }
      const artifact = await generateCustomRelease(root, parsed.values.name, parsed.values.sql, mode);
      console.log(
        structured
          ? JSON.stringify({ ok: true, command, artifact })
          : `Generated custom migration ${artifact.name}. Review and commit its SQL and snapshot before application.`,
      );
      return 0;
    }
    if (extra.length) {
      reportFailure(structured, command, "USAGE", "Unexpected positional arguments; run loom --help", 2);
      return 2;
    }
    if (first === "init") {
      if (!parsed.values.name) {
        reportFailure(structured, command, "MISSING_VALUE", "init requires --name", 2);
        return 2;
      }
      const created = await initializeProject(resolve(root, second ?? "."), parsed.values.name);
      console.log(
        structured
          ? JSON.stringify({ ok: true, command, files: created })
          : `Created ${created.length} project files. Install the local Loom packages, then run loom generate.`,
      );
      return 0;
    }
    if (first === "generate" && !second) {
      const manifest = await generateProject(root);
      console.log(
        structured
          ? JSON.stringify({ ok: true, command, manifest })
          : `Generated ${manifest.functions.length} function contracts (${manifest.version}).`,
      );
      return 0;
    }
    if (first === "migrations" && (second === "apply" || second === "status")) {
      if (second === "apply" && !parsed.values["runtime-role"]) {
        reportFailure(structured, command, "MISSING_VALUE", "migrations apply requires --runtime-role", 2);
        return 2;
      }
      databaseCommand = true;
      if (second === "status") {
        const status = await projectMigrationStatus(root);
        console.log(
          structured ? JSON.stringify({ ok: status.consistent, command, status }) : JSON.stringify(status, null, 2),
        );
        return status.consistent ? 0 : 4;
      }
      const role = parsed.values["runtime-role"];
      if (role) {
        const receipt = await applyProjectMigrations(root, role, parsed.values["reviewed-hash"]);
        console.log(
          structured
            ? JSON.stringify({ ok: true, command, receipt })
            : `Applied ${receipt.applied.length} migrations to ${receipt.target.database}/${receipt.namespace} as ${receipt.target.role}.`,
        );
      }
      return 0;
    }
    if ((first === "schema" && second === "diff") || (first === "migrations" && second === "generate")) {
      if (first === "migrations" && !parsed.values.name) {
        reportFailure(structured, command, "MISSING_VALUE", "migrations generate requires --name", 2);
        return 2;
      }
      const renames = parsed.values.renames ? await readRenameHints(root, parsed.values.renames) : [];
      if (first === "schema") {
        const plan = await planRelease(root, renames);
        console.log(
          structured
            ? JSON.stringify({ ok: true, command, baseline: "committed", plan })
            : JSON.stringify({ baseline: "committed", statements: plan.statements, safety: plan.safety }, null, 2),
        );
      } else if (parsed.values.name) {
        const artifact = await generateRelease(root, parsed.values.name, renames);
        console.log(
          structured
            ? JSON.stringify({ ok: true, command, artifact })
            : `Generated migration ${artifact.name}. Review and commit its SQL and snapshot before application.`,
        );
      }
      return 0;
    }
    if ((first === "schema" && second === "inspect") || (first === "doctor" && !second)) {
      const project = await loadProject(root);
      const result = {
        project: project.config.project,
        version: project.version,
        schemaFingerprint: project.schema.fingerprint,
        functions: project.functions.length,
        target: project.config.provider ?? null,
      };
      console.log(
        structured
          ? JSON.stringify({ ok: true, command, ...result, schema: project.schema.metadata })
          : first === "schema"
            ? JSON.stringify(project.schema.metadata, null, 2)
            : `Project ${result.project}: valid configuration, schema and ${result.functions} functions. Version ${result.version}.`,
      );
      return 0;
    }
    reportFailure(structured, command, "USAGE", "Unknown command or arguments; run loom --help", 2);
    return 2;
  } catch (cause) {
    // Executable project code can throw arbitrary strings or credentials. Never print it by default.
    if (command === "arguments") {
      reportFailure(structured, command, "USAGE", "Invalid arguments; run loom --help", 2);
      return 2;
    }
    if (cause instanceof MigrationCommandError) {
      reportFailure(structured, command, cause.code, cause.message, 4);
      return 4;
    }
    if (databaseCommand) {
      reportFailure(
        structured,
        command,
        "MIGRATION_FAILED",
        "Migration operation failed. Inspect migration status, reviewed artifacts and database access.",
        4,
      );
      return 4;
    }
    reportFailure(
      structured,
      command,
      "PROJECT_INVALID",
      "Project validation failed. Check configuration, source imports, paths and existing files.",
      3,
    );
    return 3;
  }
}

function reportFailure(structured: boolean, command: string, code: string, message: string, exitCode: number): void {
  console.error(
    structured ? JSON.stringify({ ok: false, command, error: { code, message }, exitCode }) : `${code}: ${message}`,
  );
}

if (import.meta.main) process.exitCode = await runCli(process.argv.slice(2));
