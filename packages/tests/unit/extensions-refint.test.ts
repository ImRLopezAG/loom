import { expect } from "vite-plus/test";
import { integer, pgSchema, pgTable, text } from "drizzle-orm/pg-core";
import { createRefint_1_0 } from "../../../apps/loom/src/core/extensions/adapters/refint";
import { refintAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/refint";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/refint.json";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { refintUnitCase } from "../../e2e/fixtures/refint-proof-cases";

extensionProofUnitTest(refintUnitCase, () => {
  const descriptor = {
    name: "refint",
    version: "1.0",
    schema: 'trig"ext',
    apiSupport: { status: "verified", digest: manifest.digest },
  } as const;
  const extension = createRefint_1_0(descriptor);
  expect(() => createRefint_1_0({ ...descriptor, apiSupport: { status: "unverified" } })).toThrow();
  expect(() => createRefint_1_0({ ...descriptor, apiSupport: { status: "verified", digest: "0" } })).toThrow();
  const parent = pgSchema('app"s').table("Parent's", { key: integer('Key"Id'), scope: text() });
  const child = pgSchema('app"s').table("Child", { key: integer("Foreign'Id"), scope: text() });
  const reference = { table: parent, columns: [parent.key, parent.scope] } as const;
  const trigger = extension.checkPrimaryKey({
    name: 'child"fk',
    table: child,
    columns: [child.key, child.scope],
    references: reference,
  });
  expect(trigger).toMatchObject({
    timing: "after",
    level: "row",
    events: ["insert", "update"],
    arguments: ["Foreign'Id", "scope", '"app""s"."Parent\'s"', '"Key""Id"', '"scope"'],
  });
  expect(trigger.create).toBe(
    `CREATE TRIGGER "child""fk" AFTER INSERT OR UPDATE ON "app""s"."Child" FOR EACH ROW EXECUTE FUNCTION "trig""ext"."check_primary_key"('Foreign''Id', 'scope', '"app""s"."Parent''s"', '"Key""Id"', '"scope"')`,
  );
  for (const action of ["restrict", "cascade", "setnull"] as const) {
    const foreign = extension.checkForeignKey({
      name: "p",
      table: parent,
      columns: [parent.key, parent.scope],
      references: [
        { table: child, columns: [child.key, child.scope] },
        { table: child, columns: [child.key, child.scope] },
      ],
      action,
    });
    expect(foreign.events).toEqual(["update", "delete"]);
    expect(foreign.arguments).toEqual([
      "2",
      action,
      'Key"Id',
      "scope",
      '"app""s"."Child"',
      '"Foreign\'Id"',
      '"scope"',
      '"app""s"."Child"',
      '"Foreign\'Id"',
      '"scope"',
    ]);
  }
  const other = pgTable("other", { key: integer() });
  expect(() =>
    extension.checkPrimaryKey({
      name: "x",
      table: child,
      columns: [other.key],
      references: { table: parent, columns: [parent.key] },
    }),
  ).toThrow("declared table");
  expect(() =>
    extension.checkPrimaryKey({
      name: "x",
      table: child,
      columns: [child.key],
      references: { table: parent, columns: [other.key] },
    }),
  ).toThrow();
  expect(() =>
    extension.checkPrimaryKey({
      name: "x",
      table: child,
      columns: [child.key, child.key],
      references: { table: parent, columns: [parent.key, parent.key] },
    }),
  ).toThrow("distinct");
  expect(() =>
    extension.checkPrimaryKey({
      name: "x",
      table: child,
      columns: [child.key, child.scope],
      // @ts-expect-error mismatching tuple lengths
      references: { table: parent, columns: [parent.key] },
    }),
  ).toThrow("counts");
  expect(() =>
    extension.checkPrimaryKey({
      name: "x",
      table: child,
      columns: [child.key],
      references: { table: parent, columns: [parent.key] },
      // @ts-expect-error DELETE is not supported by check_primary_key
      events: ["delete"],
    }),
  ).toThrow();
  expect(extension.sql.functions).toEqual({});
  expect(refintAnnotations.map((entry) => entry.id)).toEqual(manifest.contract.members.map((entry) => entry.id));
});
