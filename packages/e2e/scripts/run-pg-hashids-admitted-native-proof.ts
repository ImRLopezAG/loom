import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const directory = mkdtempSync(join(tmpdir(), "loom-pg-hashids-admitted-native-"));
const pinned = {
  "hashids.c": "b9ec39c8e279bc912556ff7877b741a4848c140bfc0e7e7a36745cd9263c30c9",
  "hashids.h": "f1ab31282ce9c1771e00c682319caa0ec1bdc44e7dffd3efc545a0b707940bf7",
};
for (const [name, digest] of Object.entries(pinned)) {
  const response = await fetch(`https://raw.githubusercontent.com/iCyberon/pg_hashids/v1.2.1/${name}`);
  assert(response.ok);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(createHash("sha256").update(bytes).digest("hex"), digest);
  writeFileSync(join(directory, name), bytes);
}
// This characterizes the pinned native library, not the defective PostgreSQL wrapper.
// Guards come directly from native initialization, never from a JS shuffle/Hashids implementation.
const probe = String.raw`#include <assert.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include "hashids.h"

static int admitted(hashids_t *h, const char *hash, const char *original) {
  if (!*hash) return 0;
  for (const char *p = hash; *p; ++p) if (!strchr(original, *p)) return 0;
  if (h->min_hash_length) {
    for (const char *p = hash; *p; ++p) {
      if (strchr(h->guards, *p)) return p[1] != 0;
    }
  }
  return 1;
}
static void witness(const char *salt, size_t minimum, const char *alphabet,
                    size_t count, unsigned long long *numbers, const char *expected) {
  hashids_t *h = hashids_init3(salt, minimum, alphabet);
  assert(h);
  size_t size = hashids_estimate_encoded_size(h, count, numbers);
  char *hash = calloc(size, 1);
  assert(hash);
  size_t length = hashids_encode(h, hash, count, numbers);
  assert(length == strlen(expected) && strcmp(hash, expected) == 0);
  assert(admitted(h, hash, alphabet));
  size_t decoded_count = hashids_numbers_count(h, hash);
  assert(decoded_count == count);
  unsigned long long *decoded = calloc(decoded_count, sizeof(*decoded));
  assert(decoded);
  assert(hashids_decode(h, hash, decoded) == count);
  for (size_t i = 0; i < count; ++i) assert(decoded[i] == numbers[i]);
  printf("native salt=%s minimum=%zu hash=%s count=%zu guards=%s\n", salt, minimum, hash, count, h->guards);
  free(decoded); free(hash); hashids_free(h);
}
int main(void) {
  unsigned long long one[] = {1001}, zero[] = {0}, max[] = {9223372036854775807ull};
  unsigned long long min[] = {9223372036854775808ull}, minus[] = {18446744073709551615ull};
  unsigned long long many[] = {1,2,3}, salted[] = {1234567};
  const char *a = HASHIDS_DEFAULT_ALPHABET;
  const char *custom = "abcdefghijABCDxFGHIJ1234567890";
  witness("",0,a,1,one,"jNl"); witness("",0,a,1,zero,"gY");
  witness("",0,a,1,max,"p21ZD04m8GQ42"); witness("",0,a,1,min,"qZ1QEvgn7JYg2");
  witness("",0,a,1,minus,"AOo9Ql5nQR1VO"); witness("",0,a,3,many,"o2fXhV");
  witness("This is my salt",0,a,1,salted,"Pdzxp");
  witness("This is my salt",10,a,1,salted,"PlRPdzxpR7");
  witness("This is my salt",10,custom,1,salted,"3GJ956J9B9");
  witness("This is my salt",10,custom,3,many,"4G31H3f7GD");
  witness("",0,"0123456789abcdef",1,zero,"3a");
  hashids_t *h = hashids_init3("",8,a); assert(h);
  assert(!admitted(h,"a",a)); assert(!admitted(h,"ja",a));
  assert(!admitted(h,"",a)); assert(!admitted(h,"!",a));
  assert(admitted(h,"aj",a));
  printf("source-derived admission rejected empty/unknown/trailing-native-guard before decode; guards=%s\n",h->guards);
  hashids_free(h);
  puts("11 valid encode/decode native library witnesses passed; PostgreSQL SQL member gate remains pending");
  return 0;
}
`;
writeFileSync(join(directory, "probe.c"), probe);
const compile = spawnSync(
  "clang",
  [
    "-O1",
    "-g",
    "-fsanitize=address",
    "-fno-omit-frame-pointer",
    "-o",
    join(directory, "probe"),
    "hashids.c",
    "probe.c",
  ],
  { cwd: directory, encoding: "utf8" },
);
writeFileSync(join(directory, "compile.log"), (compile.stdout ?? "") + (compile.stderr ?? ""));
assert.equal(compile.status, 0, `Compilation failed; ${directory}`);
const run = spawnSync(join(directory, "probe"), {
  encoding: "utf8",
  env: { ...process.env, ASAN_OPTIONS: "abort_on_error=0:halt_on_error=1:detect_leaks=0" },
});
writeFileSync(join(directory, "probe.log"), (run.stdout ?? "") + (run.stderr ?? ""));
assert.equal(run.status, 0, `Admitted native characterization failed; ${directory}`);
console.log(`Native library characterization retained at ${directory}\n${run.stdout}`);
