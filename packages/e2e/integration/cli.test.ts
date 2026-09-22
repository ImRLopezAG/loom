import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import {
  initializeProject,
  generateProject,
  prepareProject,
  activateProject,
  assertGeneratedVersion,
  loadProject,
  readMigrations,
  planRelease,
} from "@loom/tooling";
import { mkdtemp, mkdir, readFile, readlink, rm, symlink, access, writeFile, realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as v from "valibot";
import { createAuthentication } from "@loom/core/server";

test("initialization creates a consumer and preserves existing user files", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-init-"));
  try {
    expect(await initializeProject(root, "tasks")).toContain("backend/schema.ts");
    const before = await readFile(join(root, "backend/schema.ts"), "utf8");
    await assert.rejects(initializeProject(root, "tasks"), /overwrite/);
    expect(await readFile(join(root, "backend/schema.ts"), "utf8")).toBe(before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("generation captures explicit authorization and refuses invalid auth modules without activation", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-auth-import-"));
  try {
    await initializeProject(root, "tasks");
    await mkdir(join(root, "node_modules/@loom"), { recursive: true });
    for (const name of ["@loom/core", "@loom/tooling", "valibot", "drizzle-orm"]) {
      await symlink(
        await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
        join(root, "node_modules", name),
      );
    }
    const first = await generateProject(root);
    const filename = join(root, "backend/auth.ts");
    const context = { name: "tasks:list", kind: "query" as const, requestId: "request", identity: null };
    const initial = await loadProject(root);
    await assert.rejects(createAuthentication(initial.config.auth, initial.auth).authorize(context), /access denied/);
    await writeFile(
      filename,
      `import { defineAuth, FunctionAccessDenied } from "@loom/core/server";
export default defineAuth({ allowAnonymous: true, authorize: ({ name }) => {
  if (name !== "tasks:list") throw new FunctionAccessDenied();
} });`,
    );
    const candidate = await prepareProject(root);
    expect(candidate.version).not.toBe(first.version);
    const loaded = await loadProject(root);
    expect(loaded.auth.allowAnonymous).toBe(true);
    const generated = await import(
      pathToFileURL(join(root, "backend/_generated", candidate.version, "registry.js")).href
    );
    const auth = createAuthentication(loaded.config.auth, generated.auth);
    expect(auth.allowAnonymous).toBe(true);
    await auth.authorize(context);
    await assert.rejects(auth.authorize({ ...context, name: "tasks:other" }), /access denied/);
    for (const source of ["export default null;", "export default { authorize: () => {}, allowAnonymous: true };"]) {
      await writeFile(filename, source);
      await assert.rejects(generateProject(root), /defineAuth/);
      expect(await readlink(join(root, "backend/_generated/current"))).toBe(first.version);
    }
    await auth.authorize(context);
    const runtime = Bun.spawn(
      [
        "node",
        "--input-type=module",
        "-e",
        `
      import assert from "node:assert/strict";
      import { auth } from ${JSON.stringify(pathToFileURL(join(root, "backend/_generated", candidate.version, "registry.js")).href)};
      assert.equal(auth.allowAnonymous, true);
      await auth.authorize(${JSON.stringify(context)});
      await assert.rejects(auth.authorize({ ...${JSON.stringify(context)}, name: "tasks:other" }), /access denied/);
    `,
      ],
      { stdout: "pipe", stderr: "pipe" },
    );
    expect(await new Response(runtime.stderr).text()).toBe("");
    expect(await runtime.exited).toBe(0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("generation loads native relations against its own immutable schema", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-relations-import-"));
  try {
    await initializeProject(root, "tasks");
    await mkdir(join(root, "node_modules/@loom"), { recursive: true });
    for (const name of ["@loom/core", "@loom/tooling", "valibot", "drizzle-orm"]) {
      await symlink(
        await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
        join(root, "node_modules", name),
      );
    }
    const first = await generateProject(root);
    const initial = await import(pathToFileURL(join(root, "backend/_generated", first.version, "registry.js")).href);
    expect(initial.relations.tasks.table).toBe(initial.schema.tables.tasks);
    expect(initial.relations.tasks.relations).toEqual({});
    const filename = join(root, "backend/relations.ts");
    const source = `import { defineRelations } from "drizzle-orm";
import schema from "./schema";
export default defineRelations(schema.tables, (r) => ({
  tasks: { sameTask: r.one.tasks({ from: r.tasks._id, to: r.tasks._id }) },
}));
`;
    await writeFile(filename, source);
    await assert.rejects(assertGeneratedVersion(root, first.version), /stale/);
    const candidate = await prepareProject(root);
    const project = await loadProject(root);
    expect(project.relations.tasks?.table).toBe(project.schema.tables.tasks);
    const generated = await import(
      pathToFileURL(join(root, "backend/_generated", candidate.version, "registry.js")).href
    );
    expect(generated.relations.tasks.table).toBe(generated.schema.tables.tasks);
    expect(generated.relations.tasks.relations.sameTask.targetTable).toBe(generated.schema.tables.tasks);
    expect(await readlink(join(root, "backend/_generated/current"))).toBe(first.version);
    await writeFile(filename, "export default null;");
    await assert.rejects(generateProject(root), /native Drizzle relations/);
    await writeFile(
      filename,
      source.replace(
        'import schema from "./schema";',
        `import { defineSchema } from "@loom/core/server";
const schema = defineSchema((s) => ({ tasks: { title: s.text() } }), { namespace: "app" });`,
      ),
    );
    await assert.rejects(generateProject(root), /compiled table/);
    expect(await readlink(join(root, "backend/_generated/current"))).toBe(first.version);
    expect(initial.relations.tasks.relations).toEqual({});
    expect(generated.relations.tasks.relations.sameTask.targetTable).toBe(generated.schema.tables.tasks);
    const runtime = Bun.spawn(
      [
        "node",
        "--input-type=module",
        "-e",
        `
      import assert from "node:assert/strict";
      import { schema, relations } from ${JSON.stringify(pathToFileURL(join(root, "backend/_generated", candidate.version, "registry.js")).href)};
      assert.equal(relations.tasks.table, schema.tables.tasks);
      assert.equal(relations.tasks.relations.sameTask.targetTable, schema.tables.tasks);
    `,
      ],
      { stdout: "pipe", stderr: "pipe" },
    );
    expect(await new Response(runtime.stderr).text()).toBe("");
    expect(await runtime.exited).toBe(0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("extensionless internal imports work before generation and keep candidate versions stable", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-internal-import-"));
  try {
    await initializeProject(root, "tasks");
    await mkdir(join(root, "node_modules/@loom"), { recursive: true });
    for (const name of ["@loom/core", "@loom/tooling", "valibot", "drizzle-orm"]) {
      await symlink(
        await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
        join(root, "node_modules", name),
      );
    }
    const filename = join(root, "backend/functions/chain.ts");
    const cronsFile = join(root, "backend/crons.ts");
    const cronSource = `import { cron } from "@loom/core/server";
import { internal } from "./_generated/internal";
export default { refresh: cron("* * * * *", internal["chain:target"], {}) };
`;
    await writeFile(cronsFile, cronSource);
    await writeFile(
      filename,
      `
import { internalAction } from "@loom/core/server";
import * as v from "valibot";
import { internal } from "../_generated/internal";
const reference = internal["chain:target"];
export const target = internalAction({ args: v.object({}), returns: v.null(), handler: () => null });
export const inspect = internalAction({
  args: v.object({}), returns: v.object({ name: v.string(), kind: v.string(), visibility: v.string(), version: v.string() }),
  handler: () => {
    if (!Object.isFrozen(internal) || !Object.keys(internal).includes("chain:target"))
      throw new Error("Reference collection differs from the generated API");
    return { ...reference };
  },
});
`,
    );
    const discovered = await Promise.all([loadProject(root), loadProject(root), loadProject(root)]);
    const first = await generateProject(root);
    expect(discovered.map((project) => project.version)).toEqual([first.version, first.version, first.version]);
    expect((await generateProject(root)).version).toBe(first.version);
    expect((await prepareProject(root)).version).toBe(first.version);
    await assertGeneratedVersion(root, first.version);
    const project = await loadProject(root);
    expect(project.crons).toMatchObject({
      refresh: { schedule: "* * * * *", call: { name: "chain:target", version: first.version } },
    });
    const definition = project.functions.find((entry) => entry.name === "chain:inspect")?.definition;
    assert.ok(definition && "handler" in definition);
    const handler = v.parse(v.function(), definition.handler);
    expect(await handler()).toEqual({
      name: "chain:target",
      kind: "action",
      visibility: "internal",
      version: first.version,
    });
    await writeFile(
      filename,
      (await readFile(filename, "utf8")).replace("handler: () => null", "handler: () => { return null; }"),
    );
    const candidate = await prepareProject(root);
    expect(candidate.version).not.toBe(first.version);
    const candidateRegistry = await import(
      pathToFileURL(join(root, "backend/_generated", candidate.version, "registry.js")).href
    );
    expect(candidateRegistry.crons.refresh.call.version).toBe(candidate.version);
    expect(await candidateRegistry.registry["chain:inspect"].handler()).toEqual({
      name: "chain:target",
      kind: "action",
      visibility: "internal",
      version: candidate.version,
    });
    await activateProject(root, candidate.version);
    expect((await generateProject(root)).version).toBe(candidate.version);
    expect(await handler()).toEqual({
      name: "chain:target",
      kind: "action",
      visibility: "internal",
      version: first.version,
    });
    const tsc = Bun.spawn(
      [
        fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)),
        "--project",
        join(root, "tsconfig.json"),
      ],
      { stdout: "pipe", stderr: "pipe" },
    );
    expect((await new Response(tsc.stdout).text()) + (await new Response(tsc.stderr).text())).toBe("");
    expect(await tsc.exited).toBe(0);
    const validSource = await readFile(filename, "utf8");
    await writeFile(filename, validSource.replace('internal["chain:target"]', 'internal["tasks:list"]'));
    await assert.rejects(generateProject(root), /Unknown internal function reference/);
    expect(await readlink(join(root, "backend/_generated/current"))).toBe(candidate.version);
    await writeFile(filename, validSource);
    await writeFile(cronsFile, cronSource.replace('"* * * * *"', '"*/5 * * * *"'));
    await assert.rejects(assertGeneratedVersion(root, candidate.version), /stale/);
    const cronCandidate = await prepareProject(root);
    expect(cronCandidate.version).not.toBe(candidate.version);
    expect(await readlink(join(root, "backend/_generated/current"))).toBe(candidate.version);
    await writeFile(cronsFile, cronSource.replace("refresh:", '"invalid name":'));
    await assert.rejects(generateProject(root), /cron/i);
    expect(await readlink(join(root, "backend/_generated/current"))).toBe(candidate.version);
    await writeFile(
      cronsFile,
      cronSource.replace('internal["chain:target"]', '{ ...internal["chain:target"], version: "0".repeat(64) }'),
    );
    await assert.rejects(generateProject(root), /current internal function/);
    await writeFile(
      cronsFile,
      cronSource.replace('internal["chain:target"]', '{ ...internal["chain:target"], kind: "mutation" }'),
    );
    await assert.rejects(generateProject(root), /current internal function/);
    const configFile = join(root, "loom.config.ts");
    const originalConfig = await readFile(configFile, "utf8");
    await writeFile(
      configFile,
      originalConfig.replace('project: "tasks"', 'project: "tasks", jobs: { maxAttempts: 1 }'),
    );
    await writeFile(cronsFile, cronSource.replace(", {})", ", {}, { maxAttempts: 2 })"));
    await assert.rejects(generateProject(root), /configured attempt limit/);
    await writeFile(configFile, originalConfig);
    expect(await readlink(join(root, "backend/_generated/current"))).toBe(candidate.version);
    // Node loads the immutable generation even though the authoring source is now invalid.
    for (const version of [first.version, candidate.version]) {
      const registryUrl = pathToFileURL(join(root, "backend/_generated", version, "registry.js")).href;
      const node = Bun.spawn(
        [
          "node",
          "--input-type=module",
          "--eval",
          `import { registry, crons } from ${JSON.stringify(registryUrl)}; if (crons.refresh.call.version !== ${JSON.stringify(version)}) throw new Error("Cron version mismatch"); console.log(JSON.stringify(await registry["chain:inspect"].handler()));`,
        ],
        { stdout: "pipe", stderr: "pipe" },
      );
      expect(JSON.parse(await new Response(node.stdout).text())).toEqual({
        name: "chain:target",
        kind: "action",
        visibility: "internal",
        version,
      });
      expect(await new Response(node.stderr).text()).toBe("");
      expect(await node.exited).toBe(0);
    }
    await writeFile(filename, validSource.replace('internal["chain:target"]', 'internal["chain:missing"]'));
    await assert.rejects(generateProject(root), /Unknown internal function reference/);
    expect(await readlink(join(root, "backend/_generated/current"))).toBe(candidate.version);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("initialization refuses a backend symlink outside the project", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-init-"));
  const outside = await mkdtemp(join(tmpdir(), "loom-external-"));
  try {
    await mkdir(join(outside, "functions"));
    await symlink(outside, join(root, "backend"));
    await assert.rejects(initializeProject(root, "tasks"), /escape/);
    await assert.rejects(access(join(outside, "schema.ts")));
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
  }
});

test("offline generation is deterministic, detects stale contracts and keeps internal references out of the browser API", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-generate-"));
  try {
    await initializeProject(root, "tasks");
    await mkdir(join(root, "node_modules/@loom"), { recursive: true });
    for (const name of ["@loom/core", "@loom/tooling", "valibot", "drizzle-orm"]) {
      await symlink(
        await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
        join(root, "node_modules", name),
      );
    }
    const tasksFile = join(root, "backend/functions/tasks.ts");
    await writeFile(
      tasksFile,
      (await readFile(tasksFile, "utf8")) +
        '\nimport { internalAction } from "@loom/core/server";\nexport const secret = internalAction({ args: v.object({}), returns: v.null(), handler: () => null });\nexport const helper = () => "not an endpoint";\n',
    );
    const concurrent = await Promise.all([generateProject(root), generateProject(root), generateProject(root)]);
    const first = concurrent[0];
    if (!first) throw new Error("Missing generated manifest");
    expect(concurrent.map((manifest) => manifest.version)).toEqual([first.version, first.version, first.version]);
    expect(first.functions.map((entry) => entry.name)).toEqual(["tasks:list", "tasks:secret"]);
    expect((await generateProject(root)).version).toBe(first.version);
    const api = await readFile(join(root, "backend/_generated/current/api.js"), "utf8");
    expect(api).not.toContain("tasks:secret");
    expect(await readFile(join(root, "backend/_generated/current/internal.js"), "utf8")).toContain("tasks:secret");
    await writeFile(
      join(root, "backend/consumer.ts"),
      'import { api } from "./_generated/api";\nconst name: string = api["tasks:list"].name;\n// @ts-expect-error internal functions are absent from public references\napi["tasks:secret"];\nvoid name;\n',
    );
    const tsc = Bun.spawn(
      [
        fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)),
        "--project",
        join(root, "tsconfig.json"),
      ],
      { stdout: "pipe", stderr: "pipe" },
    );
    const diagnostics = (await new Response(tsc.stdout).text()) + (await new Response(tsc.stderr).text());
    expect(diagnostics).toBe("");
    expect(await tsc.exited).toBe(0);
    const browser = await Bun.build({ entrypoints: [join(root, "backend/_generated/api.js")], target: "browser" });
    expect(browser.success).toBe(true);
    const browserCode = await browser.outputs[0]?.text();
    expect(browserCode).toContain("tasks:list");
    expect(browserCode).not.toContain("tasks:secret");
    expect(browserCode).not.toContain("@loom/core/server");
    const cli = fileURLToPath(new URL("../../../apps/loom/src/cli.ts", import.meta.url));
    const doctor = Bun.spawn([process.execPath, cli, "doctor", "--cwd", root, "--json"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(await new Response(doctor.stdout).text()).toContain('"ok":true');
    expect(await new Response(doctor.stderr).text()).toBe("");
    expect(await doctor.exited).toBe(0);
    for (const args of [
      ["schema", "diff"],
      ["migrations", "generate", "--name", "initial"],
    ]) {
      const child = Bun.spawn([process.execPath, cli, ...args, "--cwd", root, "--json"], {
        stdout: "pipe",
        stderr: "pipe",
      });
      expect(await new Response(child.stderr).text()).toBe("");
      const output = await new Response(child.stdout).text();
      expect(output.startsWith('{"ok":true')).toBe(true);
      expect(await child.exited).toBe(0);
    }
    expect(await readMigrations(root, "migrations")).toHaveLength(1);
    expect((await planRelease(root)).statements).toEqual([]);
    await assertGeneratedVersion(root, first.version);
    const active = join(root, "backend/_generated/current");
    const beforeFailure = await readlink(active);
    const tasksSource = await readFile(tasksFile, "utf8");
    await writeFile(tasksFile, "export const broken = ;");
    await assert.rejects(generateProject(root));
    expect(await readlink(active)).toBe(beforeFailure);
    await writeFile(tasksFile, tasksSource);
    await writeFile(tasksFile, (await readFile(tasksFile, "utf8")).replace('"not an endpoint"', '"changed helper"'));
    await assert.rejects(assertGeneratedVersion(root, first.version), /stale/);
    const candidate = await prepareProject(root);
    expect(candidate.version).not.toBe(first.version);
    expect(await readlink(active)).toBe(beforeFailure);
    const cancelled = new AbortController();
    cancelled.abort();
    await assert.rejects(activateProject(root, candidate.version, cancelled.signal), { name: "AbortError" });
    expect(await readlink(active)).toBe(beforeFailure);
    await writeFile(tasksFile, (await readFile(tasksFile, "utf8")).replace('"changed helper"', '"newest helper"'));
    await assert.rejects(activateProject(root, candidate.version), /stale/);
    expect(await readlink(active)).toBe(beforeFailure);
    const latest = await prepareProject(root);
    await activateProject(root, latest.version);
    expect(await readlink(active)).toBe(latest.version);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("CLI produces matching structured/human failures without leaking executable config errors", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-doctor-"));
  const cli = fileURLToPath(new URL("../../../apps/loom/src/cli.ts", import.meta.url));
  try {
    await writeFile(
      join(root, "loom.config.ts"),
      'throw new Error("secret-sentinel-do-not-print"); export default {};',
    );
    const outputs = [];
    for (const flags of [[], ["--json"]]) {
      const child = Bun.spawn([process.execPath, cli, "doctor", "--cwd", root, ...flags], {
        stdout: "pipe",
        stderr: "pipe",
      });
      outputs.push(await new Response(child.stderr).text());
      expect(await child.exited).toBe(3);
      expect(await new Response(child.stdout).text()).toBe("");
    }
    expect(outputs[0]).toContain("PROJECT_INVALID");
    expect(outputs[1]).toContain('"code":"PROJECT_INVALID"');
    expect(outputs.join("")).not.toContain("secret-sentinel");
    const missing = Bun.spawn([process.execPath, cli, "init", "--cwd", root, "--json"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(await new Response(missing.stderr).text()).toContain("MISSING_VALUE");
    expect(await missing.exited).toBe(2);
    const extra = Bun.spawn([process.execPath, cli, "doctor", "extra", "unexpected", "--json"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(await new Response(extra.stderr).text()).toContain('"code":"USAGE"');
    expect(await extra.exited).toBe(2);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
