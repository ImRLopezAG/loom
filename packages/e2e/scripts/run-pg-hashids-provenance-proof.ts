import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import provenance from "../fixtures/pg-hashids-native-provenance.json";

// Fetches public source only. Never loads native code, runs SQL, or creates a gate receipt.
const sources = new Map(
  await Promise.all(
    provenance.sources.map(async (source) => {
      const response = await fetch(source.url, {
        headers: { "User-Agent": "loom-pg-hashids-provenance-proof" },
      });
      assert(response.ok, `${source.id}: HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(bytes.length, source.bytes, `${source.id}: byte count`);
      assert.equal(createHash("sha256").update(bytes).digest("hex"), source.sha256, `${source.id}: SHA256`);
      return [source.id, bytes.toString("utf8")] as const;
    }),
  ),
);
function source(id: string) {
  const value = sources.get(id);
  assert(value !== undefined, `Missing source ${id}`);
  return value;
}

const recipe = source("neon-compute-Dockerfile");
const stage = recipe.slice(
  recipe.indexOf("FROM build-deps AS pg_hashids-src"),
  recipe.indexOf("FROM build-deps AS rum-src"),
);
assert(stage.startsWith("FROM build-deps AS pg_hashids-src"));
assert.match(stage, /refs\/tags\/v1\.2\.1\.tar\.gz/);
assert.match(stage, /74576b992d9277c92196dd8d816baa2cc2d8046fe102f3dcd7f3c3febed6822a pg_hashids\.tar\.gz/);
assert.match(stage, /make -j .* install USE_PGXS=1/);
assert.match(stage, /echo 'trusted = true' >> .*pg_hashids\.control/);
assert(!/\bpatch\b|\bsed\b/.test(stage), "Published pg_hashids stage has a source transformation");
const tree: { truncated: boolean; tree: { path: string }[] } = JSON.parse(source("neon-tree-pinned"));
assert.equal(tree.truncated, false);
assert(!tree.tree.some((entry) => /hashids/i.test(entry.path)), "Public tree acquired a pg_hashids source/patch file");
assert(!tree.tree.some((entry) => entry.path === "vendor/postgres-v18"));
assert.match(source("neon-cloud-extensions-workflow"), /pg-version: \[16, 17\]/);
assert.match(source("neon-docs-pinned"), /\|\s+PG14\s+\|\s+PG15\s+\|\s+PG16\s+\|\s+PG17\s+\|\s+PG18\s+\|/);
assert.match(
  source("neon-docs-pinned"),
  /\[pg_hashids\][^\n]+\|\s+1\.2\.1\s+\|\s+1\.2\.1\s+\|\s+1\.2\.1\s+\|\s+1\.2\.1\s+\|\s+1\.2\.1\s+\|/,
);

const wrapper = source("upstream-v1.2.1-pg_hashids.c-raw");
assert.equal([...wrapper.matchAll(/palloc\( bytes_encoded \)/g)].length, 2);
assert.equal([...wrapper.matchAll(/SET_VARSIZE\(hash_string, bytes_encoded \+ VARHDRSZ\)/g)].length, 2);
assert.equal([...source("upstream-scalar-fix-source").matchAll(/palloc\(bytes_encoded \+ VARHDRSZ\)/g)].length, 1);
assert.equal([...source("upstream-scalar-fix-source").matchAll(/palloc\( bytes_encoded \)/g)].length, 1);
for (const id of ["upstream-array-fix-source", "upstream-head-pg_hashids.c"]) {
  assert.equal([...source(id).matchAll(/cstring_to_text_with_len\(hash, bytes_encoded\)/g)].length, 2);
}
for (const id of ["upstream-v1.2.1-hashids.c-raw", "upstream-head-hashids.c"]) {
  const library = source(id);
  const decode = library.slice(library.indexOf("\nhashids_decode("));
  assert.match(decode, /str = p \+ 1;/);
  assert.match(decode, /lottery = \*str\+\+;/);
  assert.match(decode, /while \(\(ch = \*str\)\)/);
}
const selectedSql = source("upstream-v1.2.1-sql");
const replacementSql = source("upstream-head-upgrade-sql");
assert.equal([...selectedSql.matchAll(/CREATE OR REPLACE FUNCTION/g)].length, 20);
assert(!/IMMUTABLE|STRICT/.test(selectedSql));
assert.equal([...replacementSql.matchAll(/LANGUAGE C IMMUTABLE STRICT/g)].length, 20);
assert.match(source("upstream-head-control"), /default_version = '1\.3'/);

const manifestBytes = readFileSync(
  new URL("../../../apps/loom/src/tooling/extensions/manifests/pg_hashids.json", import.meta.url),
);
assert.equal(createHash("sha256").update(manifestBytes).digest("hex"), provenance.manifestObservation.sha256);
const manifest = JSON.parse(manifestBytes.toString("utf8"));
assert.equal(manifest.digest, provenance.manifestObservation.contractDigest);
assert.equal(manifest.contract.members.length, 20);
assert(
  manifest.contract.members.every(
    (member: { strict: boolean; volatility: string }) => !member.strict && member.volatility === "volatile",
  ),
);
assert.equal(provenance.conclusions.deployedPg18BinaryPatched, "unknown");
assert.equal(provenance.behaviorChange, false);
assert.equal(provenance.standalone_shipping_skipped, true);
console.log(
  JSON.stringify(
    {
      result: "public source provenance verified",
      verifiedSourceHashes: sources.size,
      publishedRecipePatched: false,
      deployedPg18BinaryPatched: "unknown",
      nativeSqlExecuted: false,
      canonicalFiveGateReceipt: false,
      standalone_shipping_skipped: true,
    },
    null,
    2,
  ),
);
