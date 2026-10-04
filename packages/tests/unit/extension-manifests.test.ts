import { readFileSync, readdirSync } from "node:fs";
import { expect, test } from "vite-plus/test";
import * as v from "valibot";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";

const directory = new URL("../../../apps/loom/src/tooling/extensions/manifests/", import.meta.url);
const research = v.parse(
  v.object({
    entries: v.array(
      v.object({ name: v.string(), providerStatus: v.string(), postgres18ListedVersion: v.nullable(v.string()) }),
    ),
  }),
  JSON.parse(
    readFileSync(new URL("../../../apps/loom/src/tooling/extensions/catalogue.json", import.meta.url), "utf8"),
  ),
);

test("checked Neon manifests reconcile every eligible catalogue entry without inventing versions", () => {
  const eligible = research.entries.filter((entry) => entry.providerStatus === "listed-pg18");
  const files = readdirSync(directory).filter((name) => name.endsWith(".json"));
  expect(files.sort()).toEqual(eligible.map((entry) => `${entry.name}.json`).sort());
  for (const entry of eligible) {
    const manifest = validateExtensionManifest(
      JSON.parse(readFileSync(new URL(`${entry.name}.json`, directory), "utf8")),
    );
    expect(manifest.contract).toMatchObject({ extension: entry.name, postgresMajor: 18, provider: "neon" });
    expect(manifest.provenance).toMatchObject({ source: "pg_catalog", verified: true });
    expect(manifest.contract.version).toBe(entry.name === "plpgsql_check" ? "2.8" : entry.postgres18ListedVersion);
    expect(manifest.contract.members.length).toBeGreaterThan(0);
  }
});

test("every manifest has unique symbolic members and rejects a stale contract fingerprint", () => {
  for (const entry of research.entries) {
    if (entry.providerStatus !== "listed-pg18") {
      expect(readdirSync(directory)).not.toContain(`${entry.name}.json`);
      continue;
    }
    const manifest = validateExtensionManifest(
      JSON.parse(readFileSync(new URL(`${entry.name}.json`, directory), "utf8")),
    );
    const identities = manifest.contract.members.map((member) => member.id);
    expect(new Set(identities).size).toBe(identities.length);
    expect(() =>
      validateExtensionManifest({ ...manifest, contract: { ...manifest.contract, version: "unverified-version" } }),
    ).toThrow("digest");
  }
});

test("captured SQL facts preserve direct similarity signatures and fixed member namespaces", () => {
  const load = (name: string) =>
    validateExtensionManifest(JSON.parse(readFileSync(new URL(`${name}.json`, directory), "utf8")));
  const similarity = load("pg_trgm").contract.members.find(
    (member) => member.kind === "routine" && member.name === "similarity",
  );
  expect(similarity).toMatchObject({
    namespace: "$extension:pg_trgm",
    arguments: [
      { type: { namespace: "pg_catalog", name: "text" }, mode: "in" },
      { type: { namespace: "pg_catalog", name: "text" }, mode: "in" },
    ],
    returns: { namespace: "pg_catalog", name: "float4" },
  });
  expect(
    load("pg_graphql").contract.members.some(
      (member) => member.kind === "routine" && member.namespace === "$extension:pg_graphql",
    ),
  ).toBe(true);
  expect(load("pg_graphql").contract.installation.fixedSchema).toBe("graphql");
  expect(
    load("pg_cron").contract.members.some((member) => member.kind === "routine" && member.namespace === "cron"),
  ).toBe(true);
});
