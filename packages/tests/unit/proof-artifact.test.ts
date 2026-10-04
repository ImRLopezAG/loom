import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { afterEach, describe, expect, test } from "vite-plus/test";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  readTarEntries,
  removeConsumerNodeModules,
  sha256,
  verifyPackedBuildSources,
} from "../../e2e/fixtures/proof-artifact";

// Adversarial coverage for the shared packed-artifact helper. Archives are written by the in-test ustar/pax writer
// below, byte for byte; nothing here fabricates a PostgreSQL, package-manager or host result.

interface TarMember {
  readonly name: string;
  readonly body?: string;
  readonly type?: string;
  readonly linkname?: string;
  readonly checksum?: "wrong";
  readonly size?: number;
}
function block(member: TarMember): Buffer {
  const header = Buffer.alloc(512);
  const body = Buffer.from(member.body ?? "");
  header.write(member.name, 0, 100);
  header.write("0000644\0", 100);
  header.write("0000000\0", 108);
  header.write("0000000\0", 116);
  header.write(`${(member.size ?? body.length).toString(8).padStart(11, "0")}\0`, 124);
  header.write("00000000000\0", 136);
  header.write("        ", 148);
  header.write(member.type ?? "0", 156);
  header.write(member.linkname ?? "", 157, 100);
  header.write("ustar\0", 257);
  header.write("00", 263);
  let sum = 0;
  for (const byte of header) sum += byte;
  if (member.checksum === "wrong") sum += 1;
  header.write(`${sum.toString(8).padStart(6, "0")}\0 `, 148);
  return header;
}
const padded = (body: Buffer) => Buffer.concat([body, Buffer.alloc((512 - (body.length % 512)) % 512)]);
/** A pax record whose leading decimal length counts the whole record, for a body that starts with the separating space. */
function framed(body: string): string {
  let length = body.length + 1;
  while (`${length}${body}`.length !== length) length = `${length}${body}`.length;
  return `${length}${body}`;
}
const paxRecord = (path: string) => framed(` path=${path}\n`);
function archive(members: readonly TarMember[], trailer: Buffer = Buffer.alloc(1024)): Buffer {
  const chunks = members.flatMap((member) => [block(member), padded(Buffer.from(member.body ?? ""))]);
  return gzipSync(Buffer.concat([...chunks, trailer]));
}
const manifest = JSON.stringify({ name: "kello", version: "0.0.0" });
const valid = (extra: readonly TarMember[] = []) =>
  archive([
    { name: "package/", type: "5" },
    { name: "package/package.json", body: manifest },
    { name: "package/dist/", type: "5" },
    { name: "package/dist/a.js", body: "export const a = 1;\n" },
    { name: "package/bin/kello", body: "#!/usr/bin/env node\n" },
    ...extra,
  ]);

describe("archive entry validation", () => {
  test("accepts regular files, directories and a pax long-name override", () => {
    const longName = `package/dist/${"x".repeat(150)}.js`;
    const record = paxRecord(longName);
    const entries = readTarEntries(
      archive([
        { name: "package/", type: "5" },
        { name: "package/package.json", body: manifest },
        { name: "PaxHeader", type: "x", body: record },
        { name: "package/dist/truncated-placeholder", body: "long" },
      ]),
    );
    expect([...entries.keys()].sort()).toEqual([longName, "package/package.json"].sort());
    expect(entries.get(longName)?.toString()).toBe("long");
  });

  const unsupported: readonly (readonly [string, TarMember])[] = [
    ["symbolic link", { name: "package/dist/link.js", type: "2", linkname: "../../etc/passwd" }],
    ["hard link", { name: "package/dist/hard.js", type: "1", linkname: "package/dist/a.js" }],
    ["character device", { name: "package/dist/dev", type: "3" }],
    ["block device", { name: "package/dist/block", type: "4" }],
    ["FIFO", { name: "package/dist/fifo", type: "6" }],
    ["contiguous file", { name: "package/dist/contiguous", type: "7" }],
    ["GNU long link", { name: "package/dist/longlink", type: "K", body: "target\0" }],
    ["unknown type", { name: "package/dist/odd", type: "Z" }],
  ];
  for (const [label, member] of unsupported)
    test(`rejects a ${label} entry instead of ignoring it`, () => {
      expect(() => readTarEntries(valid([member]))).toThrow(/Unsupported tar entry type/);
    });

  const unsafe: readonly (readonly [string, string])[] = [
    ["parent traversal", "package/../evil.js"],
    ["nested traversal", "package/dist/../../evil.js"],
    ["absolute path", "/etc/passwd"],
    ["outside the package directory", "other/dist/a.js"],
    ["the bare package directory as a file", "package/"],
    ["a backslash", "package/dist\\a.js"],
    ["an empty segment", "package//dist/a.js"],
    ["a dot segment", "package/./dist/a.js"],
    ["a dependency directory", "package/node_modules/dep/index.js"],
    ["a nested dependency directory", "package/dist/node_modules/dep.js"],
  ];
  for (const [label, name] of unsafe)
    test(`rejects ${label}`, () => {
      expect(() => readTarEntries(valid([{ name, body: "x" }]))).toThrow(
        /Archive path|dependency|outside package|traverses/,
      );
    });

  test("rejects an unsafe path supplied through a pax override and an unsupported global override", () => {
    expect(() =>
      readTarEntries(
        valid([
          { name: "PaxHeader", type: "x", body: paxRecord("package/../../escape.js") },
          { name: "package/dist/benign.js", body: "x" },
        ]),
      ),
    ).toThrow(/traverses|not normalised/);
    expect(() =>
      readTarEntries(valid([{ name: "GlobalHead", type: "g", body: paxRecord("package/dist/global.js") }])),
    ).toThrow(/global pax/);
  });

  test("rejects duplicates, a file sharing a directory path, a directory with content and a dangling long name", () => {
    expect(() => readTarEntries(valid([{ name: "package/dist/a.js", body: "again" }]))).toThrow(
      /Duplicate or colliding tar entry/,
    );
    expect(() => readTarEntries(valid([{ name: "package/dist", body: "file over directory" }]))).toThrow(
      /Duplicate or colliding tar entry/,
    );
    expect(() => readTarEntries(valid([{ name: "package/extra/", type: "5", body: "content", size: 7 }]))).toThrow(
      /Directory entry has content/,
    );
    expect(() =>
      readTarEntries(valid([{ name: "PaxHeader", type: "x", body: paxRecord("package/dist/b.js") }])),
    ).toThrow(/Dangling long-name/);
  });

  test("rejects a regular file with a trailing slash, in any position", () => {
    expect(() => readTarEntries(valid([{ name: "package/dist/b.js/", body: "x" }]))).toThrow(/trailing slash/);
    expect(() => readTarEntries(archive([{ name: "package/package.json/", body: manifest }]))).toThrow(
      /trailing slash/,
    );
  });

  test("rejects file and directory collisions on one normalised key, whichever comes first", () => {
    const directoryThenFile = [
      { name: "package/extra/", type: "5" },
      { name: "package/extra", body: "x" },
    ];
    const fileThenDirectory = [
      { name: "package/extra", body: "x" },
      { name: "package/extra/", type: "5" },
    ];
    expect(() => readTarEntries(valid(directoryThenFile))).toThrow(/Duplicate or colliding tar entry/);
    expect(() => readTarEntries(valid(fileThenDirectory))).toThrow(/Duplicate or colliding tar entry/);
    // A repeated directory is also a collision, not an idempotent no-op.
    expect(() => readTarEntries(valid([{ name: "package/dist/", type: "5" }]))).toThrow(/Duplicate or colliding/);
  });

  test("rejects a file used as an ancestor of another entry, in either order", () => {
    const fileThenChild = [
      { name: "package/sub", body: "x" },
      { name: "package/sub/y.js", body: "y" },
    ];
    expect(() => readTarEntries(valid(fileThenChild))).toThrow(/used as a directory/);
    expect(() => readTarEntries(valid([...fileThenChild].reverse()))).toThrow(/used as a directory/);
    const withChildDirectory = [
      { name: "package/sub", body: "x" },
      { name: "package/sub/deeper/", type: "5" },
    ];
    expect(() => readTarEntries(valid(withChildDirectory))).toThrow(/used as a directory/);
  });

  describe("strict pax framing", () => {
    const withPax = (body: string) =>
      valid([
        { name: "PaxHeader", type: "x", body },
        { name: "package/dist/b.js", body: "x" },
      ]);
    test("accepts exact records, several keys, and ignores unrelated keys", () => {
      const entries = readTarEntries(withPax(framed(" mtime=1.5\n") + paxRecord("package/dist/ok.js")));
      expect(entries.get("package/dist/ok.js")?.toString()).toBe("x");
    });
    const malformed: readonly (readonly [string, string, RegExp])[] = [
      ["a non-digit length", `x9${paxRecord("package/dist/b.js")}`, /Malformed pax record length/],
      ["a leading-zero length", `0${paxRecord("package/dist/b.js")}`, /Malformed pax record length/],
      ["a zero length", ` path=package/dist/b.js\n`.replace(/^/, "0"), /Malformed pax record length/],
      ["a negative length", ` path=package/dist/b.js\n`.replace(/^/, "-5"), /Malformed pax record length/],
      ["an unsafe integer length", "99999999999999999999 path=package/dist/b.js\n", /safe integer/],
      [
        "a length beyond the header body",
        paxRecord("package/dist/b.js").replace(/^\d+/, "9999"),
        /exceeds its header body/,
      ],
      ["a length that ends mid-record", paxRecord("package/dist/b.js").replace(/^\d+/, "12"), /newline terminated/],
      ["a record shorter than its own length field", "3 \n", /shorter than its own length field|key=value/],
      ["a missing newline", framed(" path=package/dist/b.js"), /newline terminated/],
      ["a record without key=value", framed(" justtext\n"), /key=value/],
      ["an empty key", framed(" =package/dist/b.js\n"), /key=value/],
      ["trailing bytes after the last record", `${paxRecord("package/dist/b.js")}garbage`, /Malformed pax record/],
      ["a repeated path", paxRecord("package/dist/b.js") + paxRecord("package/dist/c.js"), /repeats its path/],
      ["a NUL byte", framed(" path=package/dist/\0b.js\n"), /NUL/],
    ];
    for (const [label, body, expected] of malformed)
      test(`rejects ${label}`, () => {
        expect(() => readTarEntries(withPax(body))).toThrow(expected);
      });
  });

  test("rejects corrupt framing: bad checksum, truncation and data after the end marker", () => {
    expect(() => readTarEntries(valid([{ name: "package/dist/bad.js", body: "x", checksum: "wrong" }]))).toThrow(
      /checksum/,
    );
    expect(() => readTarEntries(valid([{ name: "package/dist/short.js", body: "ab", size: 4096 }]))).toThrow(
      /Truncated/,
    );
    const trailing = Buffer.alloc(1024);
    trailing[700] = 1;
    expect(() => readTarEntries(archive([{ name: "package/package.json", body: manifest }], trailing))).toThrow(
      /after its end marker/,
    );
  });
});

describe("tarball to build source binding", () => {
  const source = (file: string, body: string) => ({ file, sha256: sha256(Buffer.from(body)) });
  test("binds exact bytes and reports the digest of the bytes it read", () => {
    const bytes = valid();
    const result = verifyPackedBuildSources(bytes, [source("apps/loom/dist/a.js", "export const a = 1;\n")]);
    expect(result.tarballSha256).toBe(sha256(bytes));
    expect(result.entries).toBe(3);
  });
  test("rejects differing bytes, a missing file, a non-compiled source, no sources and a foreign package", () => {
    const bytes = valid();
    expect(() => verifyPackedBuildSources(bytes, [source("apps/loom/dist/a.js", "different")])).toThrow(/differ/);
    expect(() => verifyPackedBuildSources(bytes, [source("apps/loom/dist/missing.js", "x")])).toThrow(
      /lacks build source/,
    );
    expect(() => verifyPackedBuildSources(bytes, [source("apps/loom/src/a.ts", "x")])).toThrow(
      /not compiled kello output/,
    );
    expect(() => verifyPackedBuildSources(bytes, [])).toThrow(/needs build sources/);
    const foreign = archive([{ name: "package/package.json", body: JSON.stringify({ name: "other" }) }]);
    expect(() => verifyPackedBuildSources(foreign, [source("apps/loom/dist/a.js", "x")])).toThrow(
      /not the kello package/,
    );
  });
});

const roots: string[] = [];
afterEach(async () => {
  for (const directory of roots.splice(0)) await rm(directory, { recursive: true, force: true });
});
async function consumer(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "loom-proof-artifact-"));
  roots.push(directory);
  return directory;
}
async function install(root: string, destination = "node_modules/kello"): Promise<string> {
  const directory = join(root, destination);
  await mkdir(join(directory, "dist"), { recursive: true });
  await mkdir(join(directory, "bin"), { recursive: true });
  await writeFile(join(directory, "package.json"), manifest);
  await writeFile(join(directory, "dist/a.js"), "export const a = 1;\n");
  await writeFile(join(directory, "bin/kello"), "#!/usr/bin/env node\n");
  return directory;
}
const tarball = valid();

describe("installed package containment", () => {
  test("accepts a real directory, and the isolated layout's link that stays inside the consumer", async () => {
    const real = await consumer();
    await install(real);
    expect(await assertInstalledPackageMatchesTarball(real, tarball)).toBe(3);
    const isolated = await consumer();
    await install(isolated, "node_modules/.bun/kello@file+kello.tgz/node_modules/kello");
    await symlink(
      join(isolated, "node_modules/.bun/kello@file+kello.tgz/node_modules/kello"),
      join(isolated, "node_modules/kello"),
    );
    expect(await assertInstalledPackageMatchesTarball(isolated, tarball)).toBe(3);
  });

  test("rejects a workspace or file link that resolves outside the consumer root", async () => {
    const root = await consumer();
    const outside = await consumer();
    await install(outside, "workspace/kello");
    await mkdir(join(root, "node_modules"), { recursive: true });
    await symlink(join(outside, "workspace/kello"), join(root, "node_modules/kello"));
    await expect(assertInstalledPackageMatchesTarball(root, tarball)).rejects.toThrow(/outside the consumer root/);
  });

  test("rejects a node_modules that is itself a link", async () => {
    const root = await consumer();
    const outside = await consumer();
    await install(outside, "modules/kello");
    await symlink(join(outside, "modules"), join(root, "node_modules"));
    await expect(assertInstalledPackageMatchesTarball(root, tarball)).rejects.toThrow(/not a real directory/);
  });

  test("rejects a compared file replaced by a link, even to identical bytes inside the root", async () => {
    const root = await consumer();
    const directory = await install(root);
    await writeFile(join(root, "same.js"), "export const a = 1;\n");
    await rm(join(directory, "dist/a.js"));
    await symlink(join(root, "same.js"), join(directory, "dist/a.js"));
    await expect(assertInstalledPackageMatchesTarball(root, tarball)).rejects.toThrow(/not a regular file/);
  });

  test("rejects a directory link on the path of a compared file", async () => {
    const root = await consumer();
    const directory = await install(root);
    await mkdir(join(root, "real-dist"));
    await writeFile(join(root, "real-dist/a.js"), "export const a = 1;\n");
    await rm(join(directory, "dist"), { recursive: true });
    await symlink(join(root, "real-dist"), join(directory, "dist"));
    await expect(assertInstalledPackageMatchesTarball(root, tarball)).rejects.toThrow(/through a link/);
  });

  test("compares package.json bytes, every compared file, and refuses extra or missing compiled files", async () => {
    const changedManifest = await consumer();
    const first = await install(changedManifest);
    await writeFile(join(first, "package.json"), JSON.stringify({ name: "kello", version: "9.9.9" }));
    await expect(assertInstalledPackageMatchesTarball(changedManifest, tarball)).rejects.toThrow(
      /differs from its tarball/,
    );
    const changedFile = await consumer();
    await writeFile(join(await install(changedFile), "dist/a.js"), "export const a = 2;\n");
    await expect(assertInstalledPackageMatchesTarball(changedFile, tarball)).rejects.toThrow(
      /differs from its tarball/,
    );
    const extra = await consumer();
    await writeFile(join(await install(extra), "dist/injected.js"), "x");
    await expect(assertInstalledPackageMatchesTarball(extra, tarball)).rejects.toThrow(/not shipped by the archive/);
    const missing = await consumer();
    await rm(join(await install(missing), "bin/kello"));
    await expect(assertInstalledPackageMatchesTarball(missing, tarball)).rejects.toThrow();
  });

  test("rejects a link hidden among extra compiled files", async () => {
    const root = await consumer();
    const directory = await install(root);
    await symlink("/etc/hosts", join(directory, "dist/hosts.js"));
    await expect(assertInstalledPackageMatchesTarball(root, tarball)).rejects.toThrow(/contains a link/);
  });
});

describe("lockfile preservation and cold reinstall", () => {
  test("hashes a regular lockfile and rejects a link or a missing file", async () => {
    const root = await consumer();
    await writeFile(join(root, "bun.lock"), "lock\n");
    expect(await consumerLockfileSha256(root)).toBe(sha256(Buffer.from("lock\n")));
    const linked = await consumer();
    await writeFile(join(linked, "real.lock"), "lock\n");
    await symlink(join(linked, "real.lock"), join(linked, "bun.lock"));
    await expect(consumerLockfileSha256(linked)).rejects.toThrow(/not a regular file/);
    await expect(consumerLockfileSha256(await consumer())).rejects.toThrow();
  });

  test("removes only the consumer's own node_modules and preserves the lockfile, manifest and tarball", async () => {
    const root = await consumer();
    await install(root);
    await writeFile(join(root, "bun.lock"), "lock\n");
    await writeFile(join(root, "package.json"), "{}");
    await writeFile(join(root, "kello.tgz"), "archive");
    await removeConsumerNodeModules(root);
    await expect(readFile(join(root, "node_modules/kello/package.json"))).rejects.toThrow();
    expect(await readFile(join(root, "bun.lock"), "utf8")).toBe("lock\n");
    expect(await readFile(join(root, "package.json"), "utf8")).toBe("{}");
    expect(await readFile(join(root, "kello.tgz"), "utf8")).toBe("archive");
  });

  test("refuses a linked or missing node_modules and never follows the link", async () => {
    const root = await consumer();
    const other = await consumer();
    await install(other, "keep/kello");
    await symlink(join(other, "keep"), join(root, "node_modules"));
    await expect(removeConsumerNodeModules(root)).rejects.toThrow(/not a real directory/);
    expect(await readFile(join(other, "keep/kello/package.json"), "utf8")).toBe(manifest);
    await expect(removeConsumerNodeModules(await consumer())).rejects.toThrow();
  });
});
