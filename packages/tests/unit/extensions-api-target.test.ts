import { expect, test } from "vite-plus/test";
import type pg from "pg";
import { buildRequiredApi } from "../../../apps/loom/src/tooling/migrations/required-api";
import { verifyRequiredApiOnTarget } from "../../../apps/loom/src/tooling/migrations/required-api-verification";

const payload = buildRequiredApi({ pg_trgm: { version: "1.6", schema: "extensions" } })!;
test("target gate validates every stored pin and the named role before any native I/O", async () => {
  let calls = 0;
  const client: Pick<pg.Client, "query"> = {
    query: () => {
      calls++;
      throw new Error("Native I/O must not run for invalid evidence");
    },
  };
  const foreign = { ...payload, apis: [...payload.apis, { ...payload.apis[0]!, schema: "other" }] };
  await expect(verifyRequiredApiOnTarget(client, foreign, "runtime")).rejects.toThrow(/Duplicate/);
  const malformed = { ...payload, fields: [{ table: "tasks", field: "title", metadata: { foreign: true } }] };
  await expect(verifyRequiredApiOnTarget(client, malformed, "runtime")).rejects.toThrow();
  await expect(verifyRequiredApiOnTarget(client, payload, "bad\0role")).rejects.toThrow();
  expect(calls).toBe(0);
});
