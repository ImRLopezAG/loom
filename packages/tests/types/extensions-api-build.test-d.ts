import { prepareProject, generateProject } from "loom/tooling";
import { createPgTrgm_1_6 } from "loom/extensions/pg-trgm";
import type { ProcedureManifest } from "../../../apps/loom/src/tooling/codegen/generate";
import type { SQL } from "drizzle-orm";
const prepare: (root: string) => Promise<ProcedureManifest> = prepareProject;
const generate: (root: string) => Promise<ProcedureManifest> = generateProject;
type NoSidecar = "requiredApi" extends keyof Awaited<ReturnType<typeof prepareProject>> ? never : true;
const unchangedPublicManifest: NoSidecar = true;
const pgTrgm = createPgTrgm_1_6({
  name: "pg_trgm",
  version: "1.6",
  schema: "extensions",
  apiSupport: { status: "verified", digest: "88e35b55b09e58d6a59847390006ca73483bdb4444346474beb644c63adcbe66" },
});
const score: SQL<number> = pgTrgm.similarity("left", "right");
// @ts-expect-error Accepted public query arguments remain exact.
pgTrgm.similarity(true, "right");
void [prepare, generate, unchangedPublicManifest, score];
