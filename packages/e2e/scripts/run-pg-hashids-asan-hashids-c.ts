import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const HASHIDS_C = "https://raw.githubusercontent.com/iCyberon/pg_hashids/v1.2.1/hashids.c";
const HASHIDS_H = "https://raw.githubusercontent.com/iCyberon/pg_hashids/v1.2.1/hashids.h";
const HASHIDS_C_SHA256 = "b9ec39c8e279bc912556ff7877b741a4848c140bfc0e7e7a36745cd9263c30c9";
const HASHIDS_H_SHA256 = "f1ab31282ce9c1771e00c682319caa0ec1bdc44e7dffd3efc545a0b707940bf7";
const directory = mkdtempSync(join(tmpdir(), "loom-pg-hashids-asan-"));

async function fetchPinned(url: string, expected: string, name: string) {
  const response = await fetch(url);
  assert.equal(response.ok, true, `Failed to fetch ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const digest = createHash("sha256").update(bytes).digest("hex");
  assert.equal(digest, expected, `${name} digest drifted from v1.2.1`);
  writeFileSync(join(directory, name), bytes);
}

await fetchPinned(HASHIDS_C, HASHIDS_C_SHA256, "hashids.c");
await fetchPinned(HASHIDS_H, HASHIDS_H_SHA256, "hashids.h");

const probe = `#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "hashids.h"

static void decode_print(hashids_t *h, const char *hash, const char *label) {
  char *copy = strdup(hash);
  size_t count = hashids_numbers_count(h, copy);
  unsigned long long *numbers = calloc(count, sizeof(unsigned long long));
  char *again = strdup(hash);
  size_t decoded = hashids_decode(h, again, numbers);
  printf("%s hash=%s count=%zu decoded=%zu values=", label, hash, count, decoded);
  for (size_t i = 0; i < decoded; ++i) printf("%llu%s", numbers[i], i + 1 < decoded ? "," : "");
  printf("\\n");
  free(copy);
  free(again);
  free(numbers);
}

int main(void) {
  const char *alpha = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
  const char *hex = "0123456789abcdef";
  hashids_t *h = hashids_init3("", 0, alpha);
  hashids_t *hexids = hashids_init3("", 0, hex);
  hashids_t *min8 = hashids_init3("", 8, alpha);
  if (!h || !hexids || !min8) return 2;
  printf("guards=%s seps=%s\\n", h->guards, h->separators);
  printf("hex_guards=%s hex_seps=%s\\n", hexids->guards, hexids->separators);
  int zeros = 0;
  for (const char *p = alpha; *p; ++p) {
    char one[2] = {*p, 0};
    char *copy = strdup(one);
    if (hashids_numbers_count(h, copy) == 0) zeros++;
    free(copy);
  }
  int hex_zeros = 0;
  for (const char *p = hex; *p; ++p) {
    char one[2] = {*p, 0};
    char *copy = strdup(one);
    if (hashids_numbers_count(hexids, copy) == 0) hex_zeros++;
    free(copy);
  }
  printf("alphabet_zero_counts=%d hex_zero_counts=%d\\n", zeros, hex_zeros);
  char *bang = strdup("!");
  size_t bang_count = hashids_numbers_count(h, bang);
  printf("bang_count=%zu errno=%d\\n", bang_count, hashids_errno);
  free(bang);
  decode_print(h, "a", "guard-only");
  decode_print(h, "c", "separator-only");
  decode_print(h, "jNl", "canonical-1001");
  decode_print(h, "kkkkkkkkkkkkkkkkkkkkkkkk", "overlong-working");
  char buf[64];
  size_t len = hashids_encode_one(h, buf, 1001ull);
  printf("encode_1001=%.*s\\n", (int)len, buf);
  unsigned long long zero = 0;
  printf("estimate_min0=%zu estimate_min2147483645=", hashids_estimate_encoded_size(h, 1, &zero));
  hashids_t *huge = hashids_init3("", 2147483645, alpha);
  if (!huge) return 4;
  printf("%zu\\n", hashids_estimate_encoded_size(huge, 1, &zero));
  hashids_free(huge);
  decode_print(min8, "aj", "aj-min8-guard-first");
  decode_print(min8, "jNl", "jNl-min8");
  hashids_free(h);
  hashids_free(hexids);
  hashids_free(min8);
  return zeros == 0 && hex_zeros == 0 && bang_count == 0 ? 0 : 3;
}
`;
writeFileSync(join(directory, "probe.c"), probe);

function compile(output: string, sources: string[]) {
  const compile = spawnSync(
    "clang",
    ["-O1", "-g", "-fsanitize=address", "-fno-omit-frame-pointer", "-o", join(directory, output), ...sources],
    { cwd: directory, encoding: "utf8" },
  );
  assert.equal(compile.status, 0, compile.stderr);
}

compile("probe", ["hashids.c", "probe.c"]);
const run = spawnSync(join(directory, "probe"), {
  encoding: "utf8",
  env: { ...process.env, ASAN_OPTIONS: "abort_on_error=1:halt_on_error=1" },
});
writeFileSync(join(directory, "probe.log"), run.stdout + run.stderr, { mode: 0o600 });
assert.equal(run.status, 0, run.stdout + run.stderr);
assert.match(run.stdout, /alphabet_zero_counts=0/);
assert.match(run.stdout, /hex_zero_counts=0/);
assert.match(run.stdout, /bang_count=0 errno=-4/);
assert.match(run.stdout, /guard-only hash=a count=1 decoded=1 values=0/);
assert.match(run.stdout, /separator-only hash=c count=2 decoded=2 values=0,0/);
assert.match(run.stdout, /encode_1001=jNl/);
assert.match(
    run.stdout,
    /overlong-working hash=kkkkkkkkkkkkkkkkkkkkkkkk count=1 decoded=1 values=7493284456020305967/,
  );

const crash = `#include <stdlib.h>
#include <string.h>
#include "hashids.h"
int main(int argc, char **argv) {
  if (argc != 4) return 2;
  hashids_t *h = hashids_init3(argv[1], (size_t)atoi(argv[2]),
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890");
  if (!h) return 3;
  char *copy = strdup(argv[3]);
  size_t count = hashids_numbers_count(h, copy);
  unsigned long long *numbers = calloc(count, sizeof(unsigned long long));
  char *again = strdup(argv[3]);
  hashids_decode(h, again, numbers);
  return 0;
}
`;
writeFileSync(join(directory, "crash.c"), crash);
compile("crash", ["hashids.c", "crash.c"]);

function expectAsan(label: string, args: string[]) {
  const child = spawnSync(join(directory, "crash"), args, {
    encoding: "utf8",
    env: { ...process.env, ASAN_OPTIONS: "abort_on_error=0:halt_on_error=1" },
  });
  writeFileSync(join(directory, `${label}.log`), child.stdout + child.stderr, { mode: 0o600 });
  assert.notEqual(child.status, 0, `${label} was expected to abort under ASAN`);
  assert.match(child.stderr + child.stdout, /ERROR: AddressSanitizer|heap-buffer-overflow|heap-buffer-overflow/);
}

expectAsan("crash-count0", ["", "0", "!"]);
expectAsan("crash-empty", ["", "0", ""]);
expectAsan("crash-ja-min8", ["", "8", "ja"]);
expectAsan("crash-a-min8", ["", "8", "a"]);

console.log(`Pinned v1.2.1 hashids.c ASAN probe retained at ${directory}\n${run.stdout}`);
