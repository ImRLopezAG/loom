import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { wave10CallbackUnitCases } from "../../e2e/fixtures/wave10-callback-unit-types-cases";
import { expect, test } from "vite-plus/test";
import { integer, pgSchema, pgTable, timestamp } from "drizzle-orm/pg-core";
import { createModdatetime_1_0 } from "kello/extensions/moddatetime";
import { moddatetimeAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/moddatetime";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/moddatetime.json";

const digest = "bfaa16ea149d74d0f9e6c5a74144a0240ad18e0e02098a5f39f462c942ca68b6";
const extension = createModdatetime_1_0({
  name: "moddatetime",
  version: "1.0",
  schema: 'trig"ext',
  apiSupport: { status: "verified", digest },
});
const posts = pgSchema('app"s').table("Posts", {
  updated: timestamp("Updated'At", { withTimezone: true, precision: 3 }),
  civil: timestamp({ mode: "string" }),
  count: integer(),
});

extensionProofUnitTest(
  wave10CallbackUnitCases.find((entry) => entry.id === "moddatetime.unit-contracts")!,
  () => {
    expect(manifest.digest).toBe(digest);
    expect(() =>
      createModdatetime_1_0({
        name: "moddatetime",
        version: "1.0",
        schema: "x",
        apiSupport: { status: "verified", digest: "0" },
      }),
    ).toThrow("moddatetime 1.0 requires its exact verified contract");
  },
);

test("moddatetime declares a quoted BEFORE UPDATE row trigger", () => {
  const trigger = extension.trigger({ name: "Posts touch", table: posts, column: posts.updated });
  expect(trigger).toMatchObject({
    kind: "trigger",
    member: "routine:$extension:moddatetime.moddatetime()",
    extension: { name: "moddatetime", version: "1.0", digest },
    timing: "before",
    level: "row",
    events: ["update"],
    table: { schema: 'app"s', name: "Posts" },
    function: { schema: 'trig"ext', name: "moddatetime" },
    arguments: ["Updated'At"],
  });
  expect(trigger.create).toBe(
    `CREATE TRIGGER "Posts touch" BEFORE UPDATE ON "app""s"."Posts" FOR EACH ROW EXECUTE FUNCTION "trig""ext"."moddatetime"('Updated''At')`,
  );
  expect(trigger.drop).toBe(`DROP TRIGGER "Posts touch" ON "app""s"."Posts"`);
  expect(extension.trigger({ name: "c", table: posts, column: posts.civil }).arguments).toEqual(["civil"]);
  const plain = pgTable("plain", { at: timestamp() });
  expect(extension.trigger({ name: "p", table: plain, column: plain.at }).create).toContain(`ON "public"."plain"`);
});

test("moddatetime rejects columns the C trigger would reject", () => {
  const other = pgTable("other", { at: timestamp() });
  // @ts-expect-error integer is not a timestamp
  expect(() => extension.trigger({ name: "t", table: posts, column: posts.count })).toThrow(
    "moddatetime target column must be timestamp or timestamptz",
  );
  expect(() => extension.trigger({ name: "t", table: posts, column: other.at })).toThrow(
    "moddatetime target column must belong to the trigger table",
  );
  expect(() => extension.trigger({ name: "", table: posts, column: posts.updated })).toThrow(
    "Invalid PostgreSQL identifier",
  );
});

test("moddatetime exposes no callable scalar RPC helper and accounts for its single member", () => {
  expect(extension.sql.functions).toEqual({});
  expect(extension.function).toEqual({ member: "routine:$extension:moddatetime.moddatetime()", authority: "schema" });
  expect(moddatetimeAnnotations.map((member) => member.id)).toEqual(
    manifest.contract.members.map((member) => member.id),
  );
  expect(moddatetimeAnnotations[0]?.semantics.providerAcceptance).toBe("pending");
});
