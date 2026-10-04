import type {
  ExtensionProofCase,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import insertUsername from "../../../apps/loom/src/tooling/extensions/manifests/insert_username.json";
import refint from "../../../apps/loom/src/tooling/extensions/manifests/refint.json";
import tcn from "../../../apps/loom/src/tooling/extensions/manifests/tcn.json";
import lo from "../../../apps/loom/src/tooling/extensions/manifests/lo.json";
import prewarm from "../../../apps/loom/src/tooling/extensions/manifests/pg_prewarm.json";
import statistics from "../../../apps/loom/src/tooling/extensions/manifests/pg_stat_statements.json";
import jwt from "../../../apps/loom/src/tooling/extensions/manifests/pgjwt.json";
import seg from "../../../apps/loom/src/tooling/extensions/manifests/seg.json";
import earthdistance from "../../../apps/loom/src/tooling/extensions/manifests/earthdistance.json";
import cube from "../../../apps/loom/src/tooling/extensions/manifests/cube.json";
import pgcrypto from "../../../apps/loom/src/tooling/extensions/manifests/pgcrypto.json";
import sessionJwt from "../../../apps/loom/src/tooling/extensions/manifests/pg_session_jwt.json";

// Dependencies participate in emitted bindings; this proof claims the ten requested families.
export const wave20ConsumerSelection = {
  insert_username: { version: insertUsername.contract.version, schema: "Triggers日本" },
  refint: { version: refint.contract.version, schema: "Triggers日本" },
  tcn: { version: tcn.contract.version, schema: "Triggers日本" },
  lo: { version: lo.contract.version, schema: "Objects日本" },
  pg_prewarm: { version: prewarm.contract.version, schema: "Cache日本" },
  pg_stat_statements: { version: statistics.contract.version, schema: "Statistics日本" },
  pgjwt: { version: jwt.contract.version, schema: "Jwt日本" },
  seg: { version: seg.contract.version, schema: 'Seg"日本' },
  earthdistance: { version: earthdistance.contract.version, schema: "Earth日本" },
  cube: { version: cube.contract.version, schema: "Cube日本" },
  pgcrypto: { version: pgcrypto.contract.version, schema: "Jwt日本" },
  pg_session_jwt: { version: sessionJwt.contract.version, schema: "Session日本" },
} as const;

export const wave20ConsumerFamilies: readonly ExtensionProofFamily[] = [
  insertUsername,
  refint,
  tcn,
  lo,
  prewarm,
  statistics,
  jwt,
  seg,
  earthdistance,
  sessionJwt,
].map((manifest) => ({
  extension: manifest.contract.extension,
  version: manifest.contract.version,
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: manifest.digest,
}));

export const wave20ConsumerProofCase: ExtensionProofCase = {
  id: "wave20.adapters.packed-public-consumer",
  file: "packages/e2e/integration/packed-wave20-extension-adapters.test.ts",
  title:
    "ten wave20 adapters retain precise public declarations and isolated Node runtime behavior after frozen reinstall",
  gate: "consumer",
  families: [...wave20ConsumerFamilies],
  claims: [],
};
