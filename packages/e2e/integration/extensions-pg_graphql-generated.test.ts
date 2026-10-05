import type { createPgGraphql_1_5_12 } from "kello/extensions/pg-graphql";
import { expect } from "bun:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import { extensionBindingsSource } from "../../../apps/loom/src/tooling/codegen/extensions";
import { pgGraphqlAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg_graphql";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/pg_graphql.json";
import { extensionProofTest } from "../fixtures/extension-proof";
import {
  checkPgGraphqlDiskBindings,
  pgGraphqlGeneratedModes,
  writePgGraphqlProject,
} from "../fixtures/pg_graphql-generated-project";
import { withPgGraphqlApi } from "../fixtures/pg_graphql";
import {
  pgGraphqlGenerationProofCase,
  pgGraphqlMembers,
  pgGraphqlQueryMembers,
} from "../fixtures/pg_graphql-proof-cases";

import { runPgGraphqlGeneratedRuntime } from "../fixtures/pg-graphql-generated-runtime";

const selection = { pg_graphql: { version: "1.5.12", schema: "graphql" } } as const;

async function verifyGeneratedMembers(api: Pick<ReturnType<typeof createPgGraphql_1_5_12>, "sql">) {
  for (const member of pgGraphqlMembers) {
    const annotation = pgGraphqlAnnotations.find((row) => row.id === member);
    assert(annotation);
    {
      const present = Object.hasOwn(api.sql.overloads, member);
      if (pgGraphqlQueryMembers.some((queryMember) => queryMember === member)) {
        expect(annotation.disposition).toBe("query");
        expect(present).toBe(true);
        expect(Object.entries(api.sql.overloads).find(([id]) => id === member)?.[1]).toBeDefined();
      } else {
        expect(["schema", "internal"]).toContain(annotation.disposition);
        expect(present).toBe(false);
        expect(member in api.sql.functions).toBe(false);
      }
    }
  }
}

extensionProofTest(
  pgGraphqlGenerationProofCase,
  async () => {
    expect(() => extensionBindingsSource({ pg_graphql: { version: "1.5.12", schema: "extensions" } })).toThrow(
      "requires fixed installation schema graphql",
    );
    const source = extensionBindingsSource(selection);
    expect(source).toContain('import { createPgGraphql_1_5_12 } from "kello/extensions/pg-graphql";');
    expect(source).toContain('"pg_graphql": createPgGraphql_1_5_12(descriptors["pg_graphql"])');
    expect(source).toContain(manifest.digest);
    for (const forbidden of ["kello/extensions/pg-trgm", "kello/extensions/xml2", "./schema", "./server"])
      expect(source).not.toContain(forbidden);
    const unsupported = extensionBindingsSource({ pg_graphql: { version: "0.0.0", schema: "graphql" } });
    expect(unsupported).not.toContain("createPgGraphql_1_5_12");
    expect(unsupported).toContain('"status":"unverified"');

    const directory = await mkdtemp(join(tmpdir(), "loom-pg-graphql-generation-"));
    try {
      for (const mode of pgGraphqlGeneratedModes) {
        const root = join(directory, mode);
        await initializeProject(root, "gqlproof");
        await mkdir(join(root, "node_modules"));
        for (const name of ["kello", "valibot", "drizzle-orm", "effect", "pg", "@orpc/server"]) {
          await mkdir(join(root, "node_modules", name, ".."), { recursive: true });
          await symlink(
            await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
            join(root, "node_modules", name),
          );
        }
        await writePgGraphqlProject(root, mode);
        await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
        await assert.rejects(readFile(join(root, "kello/components/queries/_generated/extensions.ts")), {
          code: "ENOENT",
        });
        const first = await loadProject(root);
        assert(first);
        const generated = await generateProject(root);
        const disk = await checkPgGraphqlDiskBindings(root, mode);
        if (mode === "selected") {
          expect(disk.extensions.pg_graphql.apiSupport.digest).toBe(manifest.digest);
          expect(Object.keys(disk.extensions.pg_graphql.sql.overloads)).toHaveLength(5);
          await verifyGeneratedMembers(disk.extensions.pg_graphql);
        }
        const typecheck = Bun.spawn(
          [
            fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)),
            "-p",
            join(root, "tsconfig.json"),
          ],
          { stdout: "pipe", stderr: "pipe" },
        );
        const diagnostics =
          (await new Response(typecheck.stdout).text()) + (await new Response(typecheck.stderr).text());
        assert.equal(await typecheck.exited, 0, diagnostics);
        const bindingFiles = ["kello/_generated/extensions.ts", "kello/components/queries/_generated/extensions.ts"];
        const before = await Promise.all(bindingFiles.map((file) => readFile(join(root, file), "utf8")));
        expect((await generateProject(root)).version).toBe(generated.version);
        assert.deepEqual(await Promise.all(bindingFiles.map((file) => readFile(join(root, file), "utf8"))), before);

        await withPgGraphqlApi(({ url }) =>
          runPgGraphqlGeneratedRuntime(root, generated.version, "graphql", url, mode),
        );
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  },
  720000,
);
