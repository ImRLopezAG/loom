import assert from "node:assert/strict";
import { test, expect } from "bun:test";
import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateProject, initializeProject, loadProject } from "loom/tooling";

test("generation discovers only mounted components and emits isolated current facades", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-components-"));
  try {
    await initializeProject(root, "components");
    await mkdir(join(root, "node_modules"));
    for (const name of ["loom", "valibot", "zod", "drizzle-orm"]) {
      await symlink(
        await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
        join(root, "node_modules", name),
      );
    }
    for (const name of ["identity", "unused"]) await mkdir(join(root, "loom/components", name), { recursive: true });
    await writeFile(
      join(root, "loom/components/identity/setup.ts"),
      `import { defineComponent } from "loom";
import { z } from "zod";
export default defineComponent({ name: "identity", env: { KEY: z.string() }, services: () => { throw new Error("SDK must not initialize during generation"); } });`,
    );
    await writeFile(
      join(root, "loom/components/unused/setup.ts"),
      `import { defineComponent } from "loom";
import { z } from "zod";
export default defineComponent({ name: "unused", env: { REQUIRED: z.string() } });`,
    );
    await writeFile(
      join(root, "loom/app.config.ts"),
      `import { defineApplication } from "loom";
import identity from "./components/identity/setup";
import { z } from "zod";
const app = defineApplication({ env: { CUSTOMER_KEY: z.string() }, rpc: ({ os }) => ({ os }) });
app.use(identity, { env: { KEY: app.env.CUSTOMER_KEY } });
app.use(identity, { name: "staff" });
export default app;`,
    );
    const project = await loadProject(root);
    expect(project.components.map((entry) => entry.path)).toEqual(["identity", "staff"]);
    const generated = await generateProject(root);
    const server = await readFile(join(root, "loom/components/identity/_generated/server.ts"), "utf8");
    expect(server).toContain("env");
    expect(server).not.toContain('declare module "loom/contract"');
    expect(await Bun.file(join(root, "loom/components/unused/_generated/server.ts")).exists()).toBe(false);
    expect((await generateProject(root)).version).toBe(generated.version);
    const output = join(root, "loom/components/identity/_generated");
    await writeFile(join(output, "contracts-stale.ts"), "stale");
    await generateProject(root);
    expect(await Bun.file(join(output, "contracts-stale.ts")).exists()).toBe(false);
    const before = await readFile(join(output, "server.ts"), "utf8");
    await writeFile(join(root, "loom/components/identity/setup.ts"), "invalid TypeScript !!!");
    await assert.rejects(generateProject(root));
    expect(await readFile(join(output, "server.ts"), "utf8")).toBe(before);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("component RPC bindings use component tables and contracts without ambient application registration", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-component-rpc-"));
  try {
    await initializeProject(root, "componentrpc");
    await mkdir(join(root, "node_modules"));
    for (const name of ["loom", "valibot", "zod", "drizzle-orm"]) {
      await symlink(
        await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
        join(root, "node_modules", name),
      );
    }
    for (const name of ["contracts", "functions"])
      await mkdir(join(root, "loom/components/catalog", name), { recursive: true });
    await writeFile(
      join(root, "loom/components/catalog/setup.ts"),
      `import { defineComponent } from "./_generated/setup";
export default defineComponent({ name: "catalog", rpc: ({ os }) => ({ os }) });`,
    );
    await writeFile(
      join(root, "loom/components/catalog/schema.ts"),
      `import { defineSchema } from "loom/server";
export default defineSchema((s) => ({ products: { title: s.text().notNull() } }));`,
    );
    await writeFile(
      join(root, "loom/components/catalog/contracts/products.ts"),
      `import { defineContract, oc } from "../_generated/contract";
import { z } from "zod";
import * as v from "valibot";
export default defineContract(({ validators }) => ({ get: oc.input(v.strictObject({ id: validators.id("products") })).output(z.string()) }));`,
    );
    await writeFile(
      join(root, "loom/components/catalog/functions/products.ts"),
      `import { os } from "../_generated/rpc";
export default os.products.router({ get: os.products.get.handler(({ context }) => context.tables.products.title.name) });`,
    );
    await mkdir(join(root, "loom/components/ledger"), { recursive: true });
    await writeFile(
      join(root, "loom/components/ledger/setup.ts"),
      `import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "ledger" });`,
    );
    await writeFile(
      join(root, "loom/components/ledger/schema.ts"),
      `import { defineSchema } from "loom/server"; export default defineSchema((s) => ({ entries: { amount: s.integer().notNull() } }));`,
    );
    await writeFile(
      join(root, "loom/app.config.ts"),
      `import { defineApplication } from "loom";
import ledger from "./components/ledger/setup";
import catalog from "./components/catalog/setup";
const app = defineApplication({ rpc: ({ os }) => ({ os }) });
app.use(catalog); app.use(catalog, { name: "second" }); app.use(ledger); export default app;`,
    );
    const result = await generateProject(root);
    const project = await loadProject(root);
    expect(project.components).toHaveLength(3);
    expect(project.componentScopes[0]?.procedures).toHaveLength(1);
    expect(result.procedures.every((entry) => entry.path[0] !== "catalog")).toBe(true);
    const registration = await readFile(join(root, "loom/components/catalog/_generated/registration.ts"), "utf8");
    expect(registration).not.toContain("declare module");
    expect(registration).toContain("ComponentRegistration");
    await writeFile(
      join(root, "loom/components/catalog/typecheck.ts"),
      `import { os } from "./_generated/rpc";
import { validators } from "./_generated/schema";
import { validators as ledger } from "../ledger/_generated/schema";
ledger.id("entries");
// @ts-expect-error Component registrations never merge across scopes.
ledger.id("products");
// @ts-expect-error Only component tables are available.
validators.id("tasks");
os.products.get.handler(({ context, input }) => {
  const id: string = input.id;
  // @ts-expect-error Application tables must not leak into components.
  void context.tables.tasks;
  // @ts-expect-error The contract input is not numeric.
  const wrong: number = input.id;
  void wrong;
  return id;
});`,
    );
    const tsc = Bun.spawn(
      [fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)), "-p", join(root, "tsconfig.json")],
      { stdout: "pipe", stderr: "pipe" },
    );
    const output = (await new Response(tsc.stdout).text()) + (await new Response(tsc.stderr).text());
    assert.equal(await tsc.exited, 0, output);
    expect((await generateProject(root)).version).toBe(result.version);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
