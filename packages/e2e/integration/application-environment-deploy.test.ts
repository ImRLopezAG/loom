import { expect, test } from "bun:test";
import assert from "node:assert/strict";
import * as v from "valibot";
import { applicationEnvironmentSources, resolveReleaseEnvironment } from "../../tooling/src/deploy/neon/environment";

test("application environment forwards declared custom variables and preserves provider injection", async () => {
  const declaration = {
    PORT: v.pipe(v.string(), v.transform(Number)),
    OPTIONAL: v.optional(v.string(), "default"),
    DATABASE_URL: v.string(),
    AWS_SECRET_ACCESS_KEY: v.string(),
  };
  const sources = applicationEnvironmentSources(declaration);
  expect(sources).toEqual({ PORT: "PORT", OPTIONAL: "OPTIONAL" });
  const result = await resolveReleaseEnvironment(
    { ...sources, PORT: "DEPLOY_PORT", LOOM_DATABASE_URL: "RUNTIME_URL" },
    declaration,
    {
      DEPLOY_PORT: "3000",
      RUNTIME_URL: "runtime-url",
      DATABASE_URL: "must-not-forward",
      AWS_SECRET_ACCESS_KEY: "must-not-forward",
      UNDECLARED: "must-not-forward",
    },
  );
  expect(result).toEqual({ PORT: "3000", OPTIONAL: "", LOOM_DATABASE_URL: "runtime-url" });
});

test("deployment validates effective custom values without exposing credentials", async () => {
  const declaration = {
    TOKEN: v.pipe(
      v.string(),
      v.check(() => false, "secret-fixture"),
    ),
  };
  await assert.rejects(
    resolveReleaseEnvironment({ TOKEN: "SOURCE" }, declaration, { SOURCE: "secret-fixture" }),
    (cause: unknown) => {
      assert(cause instanceof Error);
      assert.equal(cause.message, "Invalid application environment variable: TOKEN");
      assert.equal(cause.cause, undefined);
      return true;
    },
  );
  await assert.rejects(
    resolveReleaseEnvironment({ TOKEN: "SOURCE" }, { TOKEN: v.string() }, { SOURCE: "" }),
    /Invalid application environment variable: TOKEN/,
  );
  await assert.rejects(
    resolveReleaseEnvironment({ RUNTIME: "SOURCE" }, undefined, {}),
    /Missing release environment value/,
  );
});
