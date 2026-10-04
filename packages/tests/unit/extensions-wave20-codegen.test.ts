import { expect, test } from "vite-plus/test";
import { extensionBindingsSource, resolveSelectedExtension } from "../../../apps/loom/src/tooling/codegen/extensions";

const families = [
  ["insert_username", "1.0", "createInsertUsername_1_0", "insert-username"],
  ["refint", "1.0", "createRefint_1_0", "refint"],
  ["tcn", "1.0", "createTcn_1_0", "tcn"],
  ["lo", "1.2", "createLo_1_2", "lo"],
  ["pg_prewarm", "1.2", "createPgPrewarm_1_2", "pg-prewarm"],
  ["pg_stat_statements", "1.12", "createPgStatStatements_1_12", "pg-stat-statements"],
  ["pgjwt", "0.2.0", "createPgJwt_0_2_0", "pgjwt"],
  ["pg_session_jwt", "0.5.0", "createPgSessionJwt_0_5_0", "pg-session-jwt"],
  ["seg", "1.4", "createSeg_1_4", "seg"],
  ["earthdistance", "1.2", "createEarthdistance_1_2", "earthdistance"],
] as const;

test.each(families)("selected %s emits its exact factory and public module", (name, version, factory, module) => {
  const configured = { [name]: { version, schema: "extensions" } };
  const selection =
    name === "pgjwt"
      ? { ...configured, pgcrypto: { version: "1.4", schema: "extensions" } }
      : name === "earthdistance"
        ? { ...configured, cube: { version: "1.5", schema: "cube_types" } }
        : configured;
  const source = extensionBindingsSource(selection);
  expect(source).toContain(`import { ${factory} } from "kello/extensions/${module}";`);
  const dependency = name === "earthdistance" ? ', descriptors["cube"]' : "";
  expect(source).toContain(`${JSON.stringify(name)}: ${factory}(descriptors[${JSON.stringify(name)}]${dependency})`);
  expect(resolveSelectedExtension(name, { version, schema: "extensions" }).support.status).toBe("verified");
  const future = extensionBindingsSource({ [name]: { version: "future", schema: "extensions" } });
  expect(future).not.toContain('from "kello/extensions/');
});

test("Earthdistance binding requires the exact reviewed Cube dependency", () => {
  expect(() => extensionBindingsSource({ earthdistance: { version: "1.2", schema: "earth" } })).toThrow("Cube 1.5");
  expect(() =>
    extensionBindingsSource({
      earthdistance: { version: "1.2", schema: "earth" },
      cube: { version: "future", schema: "cube_types" },
    }),
  ).toThrow("Cube 1.5");
  for (const schema of ['cube"bad', "cube$bad", "cube'bad", "cube\\bad"]) {
    expect(() =>
      extensionBindingsSource({
        earthdistance: { version: "1.2", schema: "earth" },
        cube: { version: "1.5", schema },
      }),
    ).toThrow("Cube dependency schema");
  }
});

test("JWT generation requires its native pgcrypto dependency in the same namespace", () => {
  expect(() => extensionBindingsSource({ pgjwt: { version: "0.2.0", schema: "jwt" } })).toThrow("pgcrypto");
  expect(() =>
    extensionBindingsSource({
      pgjwt: { version: "0.2.0", schema: "jwt" },
      pgcrypto: { version: "1.4", schema: "crypto" },
    }),
  ).toThrow("same installation schema");
  for (const schema of ['jwt"bad', "jwt$bad", "jwt'bad", "jwt\\bad"]) {
    expect(() =>
      extensionBindingsSource({
        pgjwt: { version: "0.2.0", schema },
        pgcrypto: { version: "1.4", schema },
      }),
    ).toThrow("pgjwt installation schema");
  }
  expect(
    extensionBindingsSource({
      pgjwt: { version: "0.2.0", schema: "JWT 日本" },
      pgcrypto: { version: "1.4", schema: "JWT 日本" },
    }),
  ).toContain("createPgJwt_0_2_0");
});
