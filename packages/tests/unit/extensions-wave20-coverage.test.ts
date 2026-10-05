import { expect, test } from "vite-plus/test";
import { resolveSelectedExtension } from "../../../apps/loom/src/tooling/codegen/extensions";
import { validateExtensionCoverage } from "../../../apps/loom/src/tooling/extensions/coverage";
import { insertUsernameAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/insert-username";
import { refintAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/refint";
import { tcnAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/tcn";
import { loAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/lo";
import { pgPrewarmAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg_prewarm";
import { pgStatStatementsAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg_stat_statements";
import { pgJwtAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pgjwt";
import { segAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/seg";
import { earthdistanceAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/earthdistance";

const families = [
  ["insert_username", "1.0", insertUsernameAnnotations],
  ["refint", "1.0", refintAnnotations],
  ["tcn", "1.0", tcnAnnotations],
  ["lo", "1.2", loAnnotations],
  ["pg_prewarm", "1.2", pgPrewarmAnnotations],
  ["pg_stat_statements", "1.12", pgStatStatementsAnnotations],
  ["pgjwt", "0.2.0", pgJwtAnnotations],
  ["seg", "1.4", segAnnotations],
  ["earthdistance", "1.2", earthdistanceAnnotations],
] as const;

test("nine integrated families annotate every captured member exactly once; native acceptance is separate", () => {
  const manifests = families.map(([name, version]) => {
    const manifest = resolveSelectedExtension(name, { version, schema: "extensions" }).manifest;
    if (!manifest) throw new Error(`Missing integrated manifest ${name}`);
    return manifest;
  });
  const report = validateExtensionCoverage(
    families.map(([name, version]) => ({ name, version, disposition: "eligible" })),
    families.map(([name, , members], index) => ({ name, status: "verified", digest: manifests[index]!.digest, members })),
    manifests,
  );
  expect(report).toEqual({ complete: true, blockers: [] });
  expect(manifests.reduce((count, manifest) => count + manifest.contract.members.length, 0)).toBe(162);
});
