import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { lstat, readdir, readFile, realpath, rm } from "node:fs/promises";
import { join, sep } from "node:path";
import { gunzipSync } from "node:zlib";
import type {
  ExtensionProofArtifact,
  ExtensionProofReceipt,
  ExtensionProofSource,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

// Test-only evidence helpers for packed-artifact proof. Nothing here is authority by itself: the host hashes the
// bytes it retains, the reporter re-reads and re-verifies them, and a child test only copies and compares bytes.

export const sha256 = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");

function text(block: Buffer, start: number, length: number): string {
  const end = block.indexOf(0, start);
  return block.toString("utf8", start, end === -1 || end > start + length ? start + length : end);
}
function octal(block: Buffer, start: number, length: number): number {
  const value = text(block, start, length).trim();
  assert(/^[0-7]*$/.test(value), "Malformed tar numeric field");
  return value ? Number.parseInt(value, 8) : 0;
}
/**
 * pax extended header records are exactly `<decimal length> <key>=<value>\n`, where the length counts the whole record
 * in bytes. Every record must be framed precisely: a canonical positive decimal safe-integer length, a record that ends
 * inside the header body on a newline, a non-empty key before the first `=`, no NUL, and no bytes left over. Only `path`
 * is used (to name long entries); a repeated `path` is rejected.
 */
function paxPath(body: Buffer): string | undefined {
  let offset = 0;
  let path: string | undefined;
  while (offset < body.length) {
    const space = body.indexOf(0x20, offset);
    assert(space > offset, "Malformed pax record");
    const digits = body.toString("latin1", offset, space);
    assert(/^[1-9][0-9]*$/.test(digits), "Malformed pax record length");
    const length = Number(digits);
    assert(Number.isSafeInteger(length), "Pax record length is not a safe integer");
    const end = offset + length;
    assert(end <= body.length, "Pax record exceeds its header body");
    assert(end > space + 1, "Pax record is shorter than its own length field");
    assert(body[end - 1] === 0x0a, "Pax record is not newline terminated");
    assert(!body.subarray(space + 1, end).includes(0), "Pax record contains NUL");
    const record = body.toString("utf8", space + 1, end - 1);
    const equals = record.indexOf("=");
    assert(equals > 0, "Pax record is not key=value");
    if (record.slice(0, equals) === "path") {
      assert(path === undefined, "Pax header repeats its path");
      path = record.slice(equals + 1);
    }
    offset = end;
  }
  return path;
}
/** A tar header checksum is the byte sum of the block with its own checksum field read as eight spaces. */
function checksumMatches(header: Buffer): boolean {
  let sum = 0;
  for (let index = 0; index < 512; index++) sum += index >= 148 && index < 156 ? 0x20 : header[index]!;
  return octal(header, 148, 8) === sum;
}
/**
 * Every archive path, file or directory, must be a normalised relative path inside `package/`: no absolute or drive
 * paths, no `.`/`..`/empty segments, no backslashes or NUL, and no dependency directory of any kind.
 */
function assertSafeArchivePath(path: string, directory: boolean): void {
  assert(directory || !path.endsWith("/"), `Archive path is a regular file with a trailing slash: ${path}`);
  assert(
    path.startsWith("package/") && (path.length > "package/".length || (directory && path === "package/")),
    `Archive path is outside package/: ${path}`,
  );
  assert(!path.includes("\\") && !path.includes("\0"), `Archive path has an unsafe character: ${path}`);
  const segments = path.replace(/\/$/, "").split("/");
  assert(
    segments.every((segment) => segment !== "" && segment !== "." && segment !== ".."),
    `Archive path is not normalised or traverses: ${path}`,
  );
  assert(!segments.includes("node_modules"), `Archive carries a dependency directory: ${path}`);
}

/**
 * Regular files of a gzip-compressed ustar/pax archive, keyed by their exact path. Every entry is validated, including
 * directories and pax/GNU long-name overrides. Only regular files, directories and name-carrying headers are supported;
 * symbolic and hard links, devices, FIFOs and any other entry type are rejected rather than ignored. Duplicate paths,
 * bad checksums and truncation are rejected.
 */
export function readTarEntries(archive: Uint8Array): ReadonlyMap<string, Buffer> {
  const tar = gunzipSync(archive);
  const entries = new Map<string, Buffer>();
  // One normalised key (no trailing slash) for files and directories alike, so a collision is caught at once, in either order.
  const kinds = new Map<string, "file" | "directory">();
  let offset = 0;
  let longPath: string | undefined;
  let ended = false;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) {
      ended = true;
      break;
    }
    assert(checksumMatches(header), "Tar header checksum mismatch");
    const size = octal(header, 124, 12);
    const type = String.fromCharCode(header[156] || 0x30);
    const body = tar.subarray(offset + 512, offset + 512 + size);
    assert(body.length === size, "Truncated tar entry");
    const prefix = text(header, 345, 155);
    const named = text(header, 0, 100);
    offset += 512 + Math.ceil(size / 512) * 512;
    if (type === "x") {
      assert(longPath === undefined, "Dangling long-name header");
      longPath = paxPath(body);
    } else if (type === "L") {
      assert(longPath === undefined, "Dangling long-name header");
      longPath = body.toString("utf8").replace(/\0.*$/s, "");
    } else if (type === "g") {
      assert(paxPath(body) === undefined, "A global pax path override is not supported");
    } else if (type === "0" || type === "5") {
      const path = longPath ?? (prefix ? `${prefix}/${named}` : named);
      longPath = undefined;
      assertSafeArchivePath(path, type === "5");
      const key = path.replace(/\/$/, "");
      assert(!kinds.has(key), `Duplicate or colliding tar entry: ${path}`);
      kinds.set(key, type === "5" ? "directory" : "file");
      if (type === "5") assert(size === 0, `Directory entry has content: ${path}`);
      else entries.set(path, Buffer.from(body));
    } else {
      assert.fail(
        `Unsupported tar entry type ${JSON.stringify(type)} at ${longPath ?? (prefix ? `${prefix}/${named}` : named)}`,
      );
    }
  }
  assert(longPath === undefined, "Dangling long-name header");
  assert(ended || offset === tar.length, "Archive ends mid-block");
  assert(
    tar.subarray(offset).every((byte) => byte === 0),
    "Archive has data after its end marker",
  );
  // A file can never be an ancestor of another entry, whichever came first.
  for (const [key, kind] of kinds)
    if (kind === "file")
      assert(
        ![...kinds.keys()].some((other) => other.startsWith(`${key}/`)),
        `A file is also used as a directory: ${key}`,
      );
  return entries;
}

/**
 * Bind exact tarball bytes to exact build bytes: every build source must be a compiled kello file and appear in the
 * archive's `package/dist/` with identical content. Returns the digest of the bytes it actually read.
 */
export function verifyPackedBuildSources(tarball: Uint8Array, buildSources: readonly ExtensionProofSource[]) {
  assert(buildSources.length > 0, "A packed artifact needs build sources");
  const entries = readTarEntries(tarball);
  const manifest = entries.get("package/package.json");
  assert(manifest, "Packed artifact has no package.json");
  assert.equal(JSON.parse(manifest.toString("utf8")).name, "kello", "Packed artifact is not the kello package");
  for (const source of buildSources) {
    assert(source.file.startsWith("apps/loom/dist/"), `Build source is not compiled kello output: ${source.file}`);
    const packed = entries.get(`package/dist/${source.file.slice("apps/loom/dist/".length)}`);
    assert(packed, `Packed artifact lacks build source: ${source.file}`);
    assert.equal(sha256(packed), source.sha256, `Packed bytes differ from build source: ${source.file}`);
  }
  return { tarballSha256: sha256(tarball), entries: entries.size };
}

const inside = (base: string, path: string) => path.startsWith(base + sep);
const shipped = (path: string) =>
  path === "package/package.json" || path.startsWith("package/dist/") || path.startsWith("package/bin/");

/** Every regular file below `directory` (relative paths); a link, device or other entry anywhere is an error. */
async function installedFiles(directory: string, relative: string): Promise<string[]> {
  const files: string[] = [];
  for (const name of await readdir(join(directory, relative))) {
    const child = `${relative}/${name}`;
    const info = await lstat(join(directory, child));
    assert(!info.isSymbolicLink(), `Installed package contains a link: ${child}`);
    if (info.isDirectory()) files.push(...(await installedFiles(directory, child)));
    else {
      assert(info.isFile(), `Installed package contains a special file: ${child}`);
      files.push(child);
    }
  }
  return files;
}

/**
 * In-test corroboration (not authority). The installed `kello` must live physically inside the consumer's own root
 * (a workspace or `file:` link that resolves anywhere else is rejected), and for every shipped file in the archive,
 * `package.json`, `dist/**` and `bin/**`, the installed file must be a regular file, reached without any link, with
 * identical bytes. No installed `dist/` or `bin/` file may exist that the archive does not ship.
 */
export async function assertInstalledPackageMatchesTarball(root: string, tarball: Uint8Array): Promise<number> {
  const consumer = await realpath(root);
  const nodeModules = join(consumer, "node_modules");
  const modules = await lstat(nodeModules);
  assert(modules.isDirectory() && !modules.isSymbolicLink(), "The consumer node_modules is not a real directory");
  const installed = await realpath(join(nodeModules, "kello"));
  assert(inside(consumer, installed), "Installed kello resolves outside the consumer root");
  const directory = await lstat(installed);
  assert(directory.isDirectory() && !directory.isSymbolicLink(), "Installed kello is not a real directory");
  const entries = readTarEntries(tarball);
  let compared = 0;
  let manifest = false;
  for (const [path, bytes] of entries) {
    if (!shipped(path)) continue;
    const relative = path.slice("package/".length);
    const file = join(installed, relative);
    const info = await lstat(file);
    assert(info.isFile() && !info.isSymbolicLink(), `Installed ${relative} is not a regular file`);
    // No intermediate directory may be a link either: the real path must be the lexical path.
    assert.equal(await realpath(file), file, `Installed ${relative} is reached through a link`);
    assert.equal(sha256(await readFile(file)), sha256(bytes), `Installed kello differs from its tarball: ${path}`);
    compared++;
    if (path === "package/package.json") manifest = true;
  }
  assert(manifest, "The installed package.json was not compared");
  assert(compared > 1, "No compiled package files were compared");
  for (const area of ["dist", "bin"]) {
    const present = await lstat(join(installed, area)).then(
      () => true,
      (error: Error) => {
        if ("code" in error && error.code === "ENOENT") return false;
        throw error;
      },
    );
    if (!present) continue;
    for (const file of await installedFiles(installed, area))
      assert(entries.has(`package/${file}`), `Installed ${file} is not shipped by the archive`);
  }
  return compared;
}

/** The consumer's lockfile must be a regular file in its own root; returns its digest. */
export async function consumerLockfileSha256(root: string): Promise<string> {
  const consumer = await realpath(root);
  const lockfile = join(consumer, "bun.lock");
  const info = await lstat(lockfile);
  assert(info.isFile() && !info.isSymbolicLink(), "The consumer lockfile is not a regular file");
  return sha256(await readFile(lockfile));
}

/**
 * Remove ONLY the disposable consumer's own node_modules, so the next frozen install is a real cold reinstall from the
 * preserved lockfile. It refuses unless that directory is a real directory directly inside the real consumer root.
 */
export async function removeConsumerNodeModules(root: string): Promise<void> {
  const consumer = await realpath(root);
  const nodeModules = join(consumer, "node_modules");
  const info = await lstat(nodeModules);
  assert(
    info.isDirectory() && !info.isSymbolicLink(),
    "Refusing to remove a node_modules that is not a real directory",
  );
  assert.equal(await realpath(nodeModules), nodeModules, "Refusing to remove a node_modules reached through a link");
  await rm(nodeModules, { recursive: true });
  const gone = await lstat(nodeModules).then(
    () => false,
    (error: Error) => "code" in error && error.code === "ENOENT",
  );
  assert(gone, "The consumer node_modules was not removed");
}

/**
 * Reporter-side artifact loading. A retained tarball that is absent yields null (the validator then keeps the consumer
 * gate blocked); a present tarball must hash to the receipt's digest and contain the receipt's build bytes, otherwise
 * the evidence is corrupt and loading throws instead of producing an artifact.
 */
export async function loadRetainedArtifact(
  path: string,
  receipt: Extract<ExtensionProofReceipt, { gate: "consumer" }>,
): Promise<ExtensionProofArtifact | null> {
  let bytes: Buffer;
  try {
    bytes = await readFile(path);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
  const verified = verifyPackedBuildSources(bytes, receipt.package.buildSources);
  assert.equal(verified.tarballSha256, receipt.package.tarballSha256, "Retained tarball does not match its receipt");
  return { tarballSha256: verified.tarballSha256, buildSources: receipt.package.buildSources };
}
