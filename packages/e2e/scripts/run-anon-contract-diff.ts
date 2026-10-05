// Read-only: compares a caller-owned local anon 2.5.1 catalog with the pinned Neon manifest.
import pg from "pg";
import * as v from "valibot";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/anon.json";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { extensionContractDigest } from "../../../apps/loom/src/core/extensions/registry";

const url = process.env.ANON_LOCAL_URL;
if (!url || !/@127\.0\.0\.1:/.test(url)) throw new Error("ANON_LOCAL_URL must name a local 127.0.0.1 fixture");
const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  const local = await captureExtensionContract(client, {
    name: "anon",
    provider: "neon",
    fixture: "local-anon-2.5.1-pg18",
  });
  const byId = new Map(local.contract.members.map((member) => [member.id, JSON.stringify(member)]));
  const pinned = new Set(manifest.contract.members.map((member) => member.id));
  console.log(
    JSON.stringify(
      {
        pinnedDigest: manifest.digest,
        recomputedPinned: extensionContractDigest(v.parse(extensionManifestValidator, manifest).contract),
        localDigest: local.digest,
        version: local.contract.version,
        serverVersion: local.provenance.serverVersion,
        members: [pinned.size, byId.size],
        onlyNeon: [...pinned].filter((id) => !byId.has(id)),
        onlyLocal: [...byId.keys()].filter((id) => !pinned.has(id)),
        changed: manifest.contract.members
          .filter((member) => byId.has(member.id) && byId.get(member.id) !== JSON.stringify(member))
          .map((member) => member.id),
      },
      null,
      1,
    ),
  );
} finally {
  await client.end();
}
