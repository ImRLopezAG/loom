#!/usr/bin/env bun
import { parseArgs } from "node:util";
import { resolve } from "node:path";
import { generateProject, initializeProject, loadProject, planRelease, generateRelease, readRenameHints } from "@loom/tooling";

const help = `Usage: loom <command> [--cwd <directory>] [--json]

  init [directory] --name <name>  Create a project without overwriting files
  generate                      Generate public/internal references and manifest
  schema inspect                Inspect compiled storage metadata
  schema diff                   Plan changes from the committed migration baseline
  migrations generate --name <name>  Write release SQL and snapshot artifacts
  doctor                        Validate configuration, schema, and registered functions

Schema diff and migration generation accept --renames <project-relative JSON file>.
`;

export async function runCli(args: readonly string[]): Promise<number> {
  const structured = args.includes("--json");
  let command = "arguments";
  try {
    const parsed = parseArgs({ args: [...args], allowPositionals: true, strict: true, options: {
      cwd: { type: "string" }, name: { type: "string" }, renames: { type: "string" }, json: { type: "boolean" }, help: { type: "boolean", short: "h" },
    } });
    const [first, second, ...extra] = parsed.positionals;
    if (parsed.values.help || !first) { console.log(structured ? JSON.stringify({ ok: true, help }) : help); return 0; }
    command = first;
    const root = resolve(parsed.values.cwd ?? process.cwd());
    if (extra.length) {
      reportFailure(structured, command, "USAGE", "Unexpected positional arguments; run loom --help", 2);
      return 2;
    }
    if (first === "init") {
      if (!parsed.values.name) { reportFailure(structured, command, "MISSING_VALUE", "init requires --name", 2); return 2; }
      const created = await initializeProject(resolve(root, second ?? "."), parsed.values.name);
      console.log(structured ? JSON.stringify({ ok: true, command, files: created }) : `Created ${created.length} project files. Install the local Loom packages, then run loom generate.`);
      return 0;
    }
    if (first === "generate" && !second) {
      const manifest = await generateProject(root);
      console.log(structured ? JSON.stringify({ ok: true, command, manifest }) : `Generated ${manifest.functions.length} function contracts (${manifest.version}).`);
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
        console.log(structured ? JSON.stringify({ ok: true, command, baseline: "committed", plan })
          : JSON.stringify({ baseline: "committed", statements: plan.statements, safety: plan.safety }, null, 2));
      } else if (parsed.values.name) {
        const artifact = await generateRelease(root, parsed.values.name, renames);
        console.log(structured ? JSON.stringify({ ok: true, command, artifact }) : `Generated migration ${artifact.name}. Review and commit its SQL and snapshot before application.`);
      }
      return 0;
    }
    if ((first === "schema" && second === "inspect") || (first === "doctor" && !second)) {
      const project = await loadProject(root);
      const result = { project: project.config.project, version: project.version, schemaFingerprint: project.schema.fingerprint,
        functions: project.functions.length, target: project.config.provider ?? null };
      console.log(structured ? JSON.stringify({ ok: true, command, ...result, schema: project.schema.metadata })
        : first === "schema" ? JSON.stringify(project.schema.metadata, null, 2)
        : `Project ${result.project}: valid configuration, schema and ${result.functions} functions. Version ${result.version}.`);
      return 0;
    }
    reportFailure(structured, command, "USAGE", "Unknown command or arguments; run loom --help", 2);
    return 2;
  } catch {
    // Executable project code can throw arbitrary strings or credentials. Never print it by default.
    if (command === "arguments") {
      reportFailure(structured, command, "USAGE", "Invalid arguments; run loom --help", 2);
      return 2;
    }
    reportFailure(structured, command, "PROJECT_INVALID", "Project validation failed. Check configuration, source imports, paths and existing files.", 3);
    return 3;
  }
}

function reportFailure(structured: boolean, command: string, code: string, message: string, exitCode: number): void {
  console.error(structured ? JSON.stringify({ ok: false, command, error: { code, message }, exitCode }) : `${code}: ${message}`);
}

if (import.meta.main) process.exitCode = await runCli(process.argv.slice(2));
