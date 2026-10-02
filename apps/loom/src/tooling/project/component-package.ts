import { createHash } from "node:crypto";
import { readFile, readdir, realpath } from "node:fs/promises";
import { dirname, join, relative, isAbsolute } from "node:path";
import * as v from "valibot";

export function componentPackageName(specifier: string): string {
  return specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0]!;
}

/** Hash a descriptor's owning installed package, including private compiled helpers. */
async function componentPackageDirectory(entry: string, specifier: string): Promise<string> {
  const expected = componentPackageName(specifier);
  let directory = dirname(entry);
  for (;;) {
    const manifest = await readFile(join(directory, "package.json"), "utf8").catch((cause: unknown) => {
      if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") return undefined;
      throw cause;
    });
    if (manifest) {
      const parsed = v.safeParse(v.object({ name: v.optional(v.string()) }), JSON.parse(manifest));
      if (parsed.success && parsed.output.name === expected) break;
    }
    const parent = dirname(directory);
    if (parent === directory) throw new Error(`Cannot find installed component package: ${specifier}`);
    directory = parent;
  }
  return realpath(directory);
}

/** Read only the owning package's statically resolvable runtime imports. An unused facade must
 * not evaluate its raw schema merely because the descriptor names it. */
export async function componentSetupImportsServer(entry: string, specifier: string, server: string): Promise<boolean> {
  const { Transpiler, resolveSync } = await import("bun");
  const directory = await componentPackageDirectory(entry, specifier);
  const target = await realpath(server);
  const transpiler = new Transpiler({ loader: "tsx" });
  const visited = new Set<string>();
  async function visit(file: string): Promise<boolean> {
    const canonical = await realpath(file);
    if (canonical === target) return true;
    if (visited.has(canonical)) return false;
    const local = relative(directory, canonical);
    if (local === ".." || local.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`) || isAbsolute(local))
      return false;
    visited.add(canonical);
    if (!/\.[cm]?[jt]sx?$/.test(canonical)) return false;
    for (const dependency of transpiler.scanImports(await readFile(canonical, "utf8"))) {
      if (dependency.kind !== "import-statement" && dependency.kind !== "dynamic-import") continue;
      if (!dependency.path.startsWith(".") && componentPackageName(dependency.path) !== componentPackageName(specifier))
        continue;
      if (await visit(resolveSync(dependency.path, dirname(canonical)))) return true;
    }
    return false;
  }
  return visit(entry);
}

/** Hash a descriptor's owning installed package, including private compiled helpers. */
export async function componentPackageHash(entry: string, specifier: string): Promise<string> {
  const directory = await componentPackageDirectory(entry, specifier);
  const hash = createHash("sha256");
  async function visit(relative: string) {
    const entries = await readdir(join(directory, relative), { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      if (entry.name === "node_modules") continue;
      const path = join(relative, entry.name);
      if (entry.isSymbolicLink()) throw new Error("Published component artifacts cannot contain symlinks");
      if (entry.isDirectory()) await visit(path);
      else if (entry.isFile())
        hash
          .update(path)
          .update("\0")
          .update(await readFile(join(directory, path)))
          .update("\0");
      else throw new Error("Published component artifacts must be regular files");
    }
  }
  await visit("");
  return hash.digest("hex");
}
