import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import { mkdtemp, mkdir, realpath, symlink, writeFile, readFile, readlink, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generateProject, initializeProject, loadProject } from "@loom/tooling";

test("native generation bootstraps, isolates internal routes, and atomically replaces bounded artifacts", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-rpc-codegen-"));
  try {
    await initializeProject(root, "rpc");
    await mkdir(join(root, "node_modules/@loom"), { recursive: true });
    for (const name of ["@loom/core", "@loom/tooling", "valibot", "drizzle-orm"]) {
      await symlink(
        await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
        join(root, "node_modules", name),
      );
    }
    const initialized = await generateProject(root);
    expect(initialized.protocol).toBe("loom-orpc-2");
    expect(initialized.procedures).toEqual([{ path: ["tasks", "list"], visibility: "public" }]);
    const source = (name: string, live = false) => `import { clientMode } from "@loom/core/server";
import { procedure, validators, databaseRead } from "../_generated/server";
export const ${name} = procedure${live ? '.meta(clientMode("live"))' : ""}.input(validators.id("tasks")).use(databaseRead).handler(({ input, context }) => ({ id: input, title: context.tables.tasks.title.name }));
export const helper = () => "PRIVATE_HELPER_SENTINEL";
`;
    await writeFile(join(root, "loom/functions/tasks.ts"), source("list"));
    await mkdir(join(root, "loom/internal"));
    await writeFile(
      join(root, "loom/internal/admin.ts"),
      `import { procedure } from "../_generated/server";
export const router = { inspect: procedure.handler(() => "INTERNAL_SENTINEL") };
`,
    );
    await writeFile(
      join(root, "loom/upgrade.ts"),
      `import * as v from "valibot";
import { defineJobMigration } from "@loom/core/server";
import { router } from "./internal/admin";
export default [defineJobMigration({
  from: { protocol: "loom-legacy-1", version: "${"1".repeat(64)}", name: "admin:inspect", kind: "action" },
  input: v.null(), to: router.inspect, transform: () => undefined,
})];`,
    );
    const first = await generateProject(root);
    expect(first.protocol).toBe("loom-orpc-2");
    expect(first.procedures).toEqual([
      { path: ["admin", "inspect"], visibility: "internal" },
      { path: ["tasks", "list"], visibility: "public" },
    ]);
    expect((await generateProject(root)).version).toBe(first.version);
    const generated = join(root, "loom/_generated");
    const originalLink = await readlink(join(generated, "current"));
    const router = await readFile(join(generated, "current/router.js"), "utf8");
    expect(router).toContain('"list": project.module0["list"]');
    expect(router).toContain('"inspect": project.module1["router"]["inspect"]');
    const generatedRuntime = await import(pathToFileURL(join(generated, "current/runtime.js")).href);
    const options = generatedRuntime.runtimeOptions();
    expect(options.jobMigrations).toHaveLength(1);
    expect(
      options.procedures.map((entry: { path: string[]; visibility: string }) => ({
        path: entry.path,
        visibility: entry.visibility,
      })),
    ).toEqual(first.procedures);
    expect(options.auth.allowAnonymous).toBe(false);
    expect(await readFile(join(generated, "current/service.js"), "utf8")).toContain("createNeonRpcService");
    expect(await readFile(join(generated, "current/worker.js"), "utf8")).toContain("createNeonRpcWorker");
    const apiTypes = await readFile(join(generated, "current/api.d.ts"), "utf8");
    expect(apiTypes).toContain('"tasks"');
    expect(apiTypes).not.toContain("admin");
    await writeFile(
      join(root, "loom/client-types.ts"),
      `import { createClient, createApi } from "./_generated/api";
declare const link: Parameters<typeof createClient>[0];
const client = createClient(link);
const session = createApi({ link, deployment: "https://example.test", version: "v1", identity: null });
session.api.tasks.list({ onSuccess: (value, input) => { const title: string = value.title; const id: string = input; void [title, id]; } });
// @ts-expect-error mutation options preserve the schema's output type
session.api.tasks.list({ onSuccess: (value: number) => value });
const result: Promise<{ id: string; title: string }> = client.tasks.list("00000000-0000-0000-0000-000000000000");
void result;
// @ts-expect-error public client excludes internal routes
client.admin.inspect();
// @ts-expect-error native input is inferred from the procedure schema
client.tasks.list(123);
// @ts-expect-error helpers are not procedures
client.tasks.helper();
`,
    );
    const tsc = Bun.spawn(
      [fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)), "-p", join(root, "tsconfig.json")],
      { stdout: "pipe", stderr: "pipe" },
    );
    expect((await new Response(tsc.stdout).text()) + (await new Response(tsc.stderr).text())).toBe("");
    expect(await tsc.exited).toBe(0);
    await rm(join(root, "loom/client-types.ts"));
    const browser = await Bun.build({ entrypoints: [join(generated, "api.js")], target: "browser", minify: true });
    expect(browser.success).toBe(true);
    const browserText = await Promise.all(browser.outputs.map((file) => file.text()));
    for (const text of browserText) {
      for (const forbidden of [
        "PRIVATE_HELPER_SENTINEL",
        "INTERNAL_SENTINEL",
        "DATABASE_URL",
        "pg-protocol",
        "loom.config",
        "effect/Context",
      ])
        expect(text).not.toContain(forbidden);
    }
    await writeFile(join(root, "loom/functions/tasks.ts"), "export const router = { broken: 42 };\n");
    await assert.rejects(generateProject(root), /tasks.broken/);
    expect(await readlink(join(generated, "current"))).toBe(originalLink);
    expect(await readFile(join(generated, "current/router.js"), "utf8")).toBe(router);
    await writeFile(join(root, "loom/functions/tasks.ts"), source("renamed", true));
    const second = await generateProject(root);
    expect(second.version).not.toBe(first.version);
    await writeFile(
      join(root, "loom/client-types.ts"),
      `import { createApi } from "./_generated/api";
declare const options: Parameters<typeof createApi>[0];
const session = createApi(options);
const query = session.api.tasks.renamed({ input: "00000000-0000-0000-0000-000000000000", select: (row) => row.title.length });
const value: Promise<{ id: string; title: string }> = session.queryClient.fetchQuery(query);
const raw: Promise<AsyncIteratorObject<{ id: string; title: string }>> = session.raw.tasks.renamed("00000000-0000-0000-0000-000000000000");
void [value, raw];
// @ts-expect-error a live callable takes native query options, not mutation callbacks
session.api.tasks.renamed({ onSuccess: () => {} });
`,
    );
    const liveTypes = Bun.spawn(
      [fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)), "-p", join(root, "tsconfig.json")],
      { stdout: "pipe", stderr: "pipe" },
    );
    expect((await new Response(liveTypes.stdout).text()) + (await new Response(liveTypes.stderr).text())).toBe("");
    expect(await liveTypes.exited).toBe(0);
    await rm(join(root, "loom/client-types.ts"));
    expect(await readFile(join(generated, "current/api.d.ts"), "utf8")).not.toContain('["list"]');
    await rm(join(root, "loom/functions/tasks.ts"));
    await generateProject(root);
    expect(await readFile(join(generated, "current/api.d.ts"), "utf8")).not.toContain('"tasks"');
    expect((await readdir(join(root, ".loom/generations"))).length).toBe(2);
    expect((await readdir(generated)).filter((name) => /^[a-f0-9]{64}$/.test(name))).toEqual([]);
    expect((await loadProject(root)).procedures.length).toBe(1);
    await rm(join(root, "loom/upgrade.ts"));
    await rm(join(root, "loom/internal/admin.ts"));
    const empty = await generateProject(root);
    expect(empty.protocol).toBe("loom-orpc-2");
    expect(empty.procedures).toEqual([]);
    const protectedFile = join(root, "user-owned.ts");
    await writeFile(protectedFile, "user-owned");
    await rm(join(generated, "server.ts"));
    await symlink(protectedFile, join(generated, "server.ts"));
    await assert.rejects(generateProject(root), /non-file generated server/);
    expect(await readFile(protectedFile, "utf8")).toBe("user-owned");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 30000);

test("native capability modules resolve internal objects and reject invalid target changes", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-rpc-capabilities-"));
  try {
    await initializeProject(root, "capabilities");
    await mkdir(join(root, "node_modules/@loom"), { recursive: true });
    for (const name of ["@loom/core", "@loom/tooling", "valibot", "drizzle-orm"]) {
      await symlink(
        await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
        join(root, "node_modules", name),
      );
    }
    await mkdir(join(root, "loom/internal"));
    await writeFile(
      join(root, "loom/internal/jobs.ts"),
      `import { procedure } from "../_generated/server";
import { storageObjectCreatedValidator } from "@loom/core/server";
import * as v from "valibot";
export const tick = procedure.input(v.number()).handler(({ input }) => input);
export const uploaded = procedure.input(storageObjectCreatedValidator).handler(() => null);
`,
    );
    await writeFile(
      join(root, "loom/auth.ts"),
      `import { defineRpcAuth } from "@loom/core/server";
export default defineRpcAuth({ allowAnonymous: true, authorize: () => {} });`,
    );
    await writeFile(
      join(root, "loom/crons.ts"),
      `import { procedureCron } from "@loom/core/server";
import { tick } from "./internal/jobs";
export default { minute: procedureCron("* * * * *", tick, 1) };`,
    );
    await writeFile(
      join(root, "loom/storage.ts"),
      `import { defineProcedureStorage, procedureObjectCreated } from "@loom/core/server";
import { uploaded } from "./internal/jobs";
export default defineProcedureStorage({ buckets: { uploads: { onObjectCreated: procedureObjectCreated(uploaded) } } });`,
    );
    const generated = await generateProject(root);
    const project = await loadProject(root);
    if (project.protocol !== "loom-orpc-2") throw new Error("Expected native project");
    expect(project.auth.allowAnonymous).toBe(true);
    expect(project.crons.minute?.call.path).toEqual(["jobs", "tick"]);
    const runtime = await import(pathToFileURL(join(root, ".loom/generations", generated.version, "runtime.js")).href);
    const options = runtime.runtimeOptions();
    expect(options.crons.minute.procedure).toBe(
      options.procedures.find((entry: { path: string[] }) => entry.path.join(".") === "jobs.tick").procedure,
    );
    const link = await readlink(join(root, "loom/_generated/current"));
    await writeFile(
      join(root, "loom/crons.ts"),
      `import { procedureCron } from "@loom/core/server";
import { list } from "./functions/tasks";
export default { minute: procedureCron("* * * * *", list, undefined) };`,
    );
    await assert.rejects(generateProject(root), /registered internal procedure/);
    expect(await readlink(join(root, "loom/_generated/current"))).toBe(link);
    await writeFile(join(root, "loom/auth.ts"), "export default null;");
    await assert.rejects(generateProject(root), /defineRpcAuth/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
