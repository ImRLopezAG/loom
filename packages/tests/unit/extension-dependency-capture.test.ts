import { expect, test, vi } from "vite-plus/test";
import pg from "pg";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";

async function captureForeignKeyTriggers(oid: number, schema: string, settings: readonly string[] = []) {
  const quoted = pg.escapeIdentifier(schema);
  const triggerName = `RI_ConstraintTrigger_c_${oid}`;
  const snapshot = {
    installed: [
      { name: "fixture", version: "1.0", namespace: schema, requires: [], relocatable: true, fixedSchema: null },
    ],
    extensionNamespaces: [{ name: "fixture", namespace: schema }],
    serverVersion: "18.6",
    postgresMajor: 18,
    members: [
      {
        className: "pg_trigger",
        oid,
        subid: 0,
        direct: false,
        objectType: "trigger",
        namespace: null,
        name: null,
        identity: `"${triggerName}" on ${quoted}.child`,
        definition: `CREATE CONSTRAINT TRIGGER "${triggerName}" AFTER INSERT ON ${quoted}.child FROM ${quoted}.parent DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION "RI_FKey_check_ins"()`,
        generatedName: {
          name: triggerName,
          identity: `$fk-trigger:child_parent_fkey on ${quoted}.child:5:RI_FKey_check_ins`,
        },
      },
      {
        className: "pg_proc",
        oid: 1,
        subid: 0,
        direct: true,
        objectType: "function",
        namespace: schema,
        name: "read_fixture",
        identity: `${quoted}.read_fixture()`,
        definition: null,
      },
    ],
    types: [{ oid: 2, namespace: "pg_catalog", typname: "int4" }],
    routines: [
      {
        oid: 1,
        namespace: schema,
        extension: "fixture",
        proname: "read_fixture",
        prokind: "f",
        inputTypes: [],
        proallargtypes: null,
        proargmodes: null,
        proargnames: null,
        pronargdefaults: 0,
        prorettype: 2,
        proretset: false,
        defaults: null,
        provariadic: 0,
        proisstrict: false,
        provolatile: "s",
        proparallel: "u",
        prosecdef: false,
        proleakproof: false,
        publicExecute: true,
        language: "sql",
        proconfig: [`search_path=${quoted}, pg_temp`, "application_name=literal_schema", ...settings],
        aggregate: null,
      },
    ],
    operators: [],
    families: [],
    methods: [],
    casts: [],
    classes: [],
    relations: [],
  };
  const client = new pg.Client();
  vi.spyOn(client, "query").mockImplementation(async () => ({
    command: "SELECT",
    rowCount: 1,
    oid: 0,
    fields: [],
    rows: [{ snapshot }],
  }));
  return captureExtensionContract(client, { name: "fixture", provider: "neon", fixture: "synthetic-fk-identity" });
}

test("catalog capture gives native generated FK triggers the same identity across installation OIDs and schemas", async () => {
  const first = await captureForeignKeyTriggers(23276, 'First"日本');
  const second = await captureForeignKeyTriggers(16473, "second");
  expect(first.contract).toEqual(second.contract);
  expect(first.digest).toEqual(second.digest);
  const trigger = first.contract.members.find((member) => member.id.includes("$fk-trigger:"));
  expect(trigger?.id).toContain("$fk-trigger:child_parent_fkey");
  expect(trigger?.id).not.toContain("23276");
  if (trigger?.kind !== "other") throw new Error("Missing trigger");
  expect(trigger.definition).toContain('EXECUTE FUNCTION "RI_FKey_check_ins"()');
  expect(trigger.definition).toContain("DEFERRABLE INITIALLY DEFERRED");
  const routine = first.contract.members.find((member) => member.kind === "routine");
  if (routine?.kind !== "routine") throw new Error("Missing routine");
  expect(routine.configuration).toEqual([
    'search_path="$extension:fixture", pg_temp',
    "application_name=literal_schema",
  ]);
});

test("catalog capture preserves non-search-path routine settings as literal values", async () => {
  const settings = [
    "application_name=extensions.read_fixture",
    'fixture.label="extensions".read_fixture',
    "fixture.generated=RI_ConstraintTrigger_c_23276",
  ];
  const result = await captureForeignKeyTriggers(23276, "extensions", settings);
  const routine = result.contract.members.find((member) => member.kind === "routine");
  if (routine?.kind !== "routine") throw new Error("Missing routine");
  expect(routine.configuration).toEqual([
    'search_path="$extension:fixture", pg_temp',
    "application_name=literal_schema",
    ...settings,
  ]);
});

// A minimal catalog fixture tests normalization only; it is not provider acceptance.
async function capture(earthSchema: string, cubeSchema: string, sharedRoutine = false, sharedDefinition = false) {
  const e = pg.escapeIdentifier(earthSchema),
    c = pg.escapeIdentifier(cubeSchema);
  const members: {
    className: string;
    oid: number;
    subid: number;
    direct: boolean;
    objectType: string;
    namespace: string;
    name: string | null;
    identity: string;
    definition: string | null;
  }[] = [
    {
      className: "pg_constraint",
      oid: 10,
      subid: 0,
      direct: false,
      objectType: "domain constraint",
      namespace: earthSchema,
      name: "on_surface",
      identity: `on_surface on ${e}.earth`,
      definition: `CHECK (${c}.cube_distance(VALUE, '(0)'::${c}.cube) / ${e}.earth() < '1'::double precision AND '${cubeSchema}.cube_distance' <> '')`,
    },
  ];
  const routine = (oid: number, namespace: string, extension: string, proname: string) => ({
    oid,
    namespace,
    extension,
    proname,
    prokind: "f",
    inputTypes: [1],
    proallargtypes: null,
    proargmodes: null,
    proargnames: null,
    pronargdefaults: 0,
    prorettype: 1,
    proretset: false,
    defaults: null,
    provariadic: 0,
    proisstrict: true,
    provolatile: "i",
    proparallel: "s",
    prosecdef: false,
    proleakproof: false,
    publicExecute: true,
    language: "sql",
    proconfig: null,
    aggregate: null,
  });
  const snapshot = {
    installed: [
      {
        name: "earthdistance",
        version: "1.2",
        namespace: earthSchema,
        requires: ["cube"],
        relocatable: true,
        fixedSchema: null,
      },
    ],
    extensionNamespaces: [
      { name: "earthdistance", namespace: earthSchema },
      { name: "cube", namespace: cubeSchema },
    ],
    serverVersion: "18.6",
    postgresMajor: 18,
    members,
    types: [
      { oid: 1, namespace: cubeSchema, extension: "cube", typname: "cube" },
      { oid: 2, namespace: earthSchema, extension: "earthdistance", typname: "earth" },
    ],
    routines: [routine(3, cubeSchema, "cube", "cube_distance"), routine(4, earthSchema, "earthdistance", "earth")],
    operators: [],
    families: [],
    methods: [],
    casts: [],
    classes: [],
    relations: [],
  };
  if (sharedRoutine) {
    snapshot.members.push({
      className: "pg_proc",
      oid: 5,
      subid: 0,
      direct: true,
      objectType: "function",
      namespace: earthSchema,
      name: null,
      identity: `${e}.shared_routine(${c}.cube)`,
      definition: null,
    });
    snapshot.routines.push(
      routine(5, earthSchema, "earthdistance", "shared_routine"),
      routine(6, cubeSchema, "cube", "shared_routine"),
    );
    if (sharedDefinition) {
      snapshot.members[0]!.definition = `CHECK (${c}.shared_routine(VALUE) IS NOT NULL AND '${earthSchema}.shared_routine' <> '')`;
      if (earthSchema !== cubeSchema) {
        snapshot.extensionNamespaces.push({ name: "other", namespace: cubeSchema });
        snapshot.routines.push(routine(7, cubeSchema, "other", "shared_routine"));
      }
    }
  }
  const client = new pg.Client();
  vi.spyOn(client, "query").mockImplementation(async () => ({
    command: "SELECT",
    rowCount: 1,
    oid: 0,
    fields: [],
    rows: [{ snapshot }],
  }));
  return captureExtensionContract(client, {
    name: "earthdistance",
    provider: "neon",
    fixture: "synthetic-dependency-normalization",
  });
}

test("catalog capture attributes co-located dependency SQL to its owning extension", async () => {
  const manifest = await capture("Shared日本", "Shared日本");
  const constraint = manifest.contract.members[0];
  expect(constraint).toMatchObject({ kind: "other", identity: 'on_surface on "$extension:earthdistance".earth' });
  if (constraint?.kind !== "other") throw new Error("Missing synthetic constraint");
  expect(constraint.definition).toContain('"$extension:cube".cube_distance');
  expect(constraint.definition).toContain("'(0)'::\"$extension:cube\".cube");
  expect(constraint.definition).toContain('"$extension:earthdistance".earth()');
  expect(constraint.definition).toContain("'Shared日本.cube_distance'");
});

test("catalog capture normalizes dependency identifiers across separately installed schemas", async () => {
  const manifest = await capture('Earth"日本', "Cube日本");
  const constraint = manifest.contract.members[0];
  if (constraint?.kind !== "other") throw new Error("Missing synthetic constraint");
  expect(constraint.definition).toContain('"$extension:cube".cube_distance');
  expect(constraint.definition).toContain('"$extension:cube".cube');
  expect(constraint.definition).toContain('"$extension:earthdistance".earth()');
  expect(constraint.definition).toContain("'Cube日本.cube_distance'");
});

test("catalog capture resolves co-located routine overload ownership from catalog OIDs", async () => {
  const manifest = await capture("shared", "shared", true);
  const routine = manifest.contract.members.find((member) => member.kind === "routine");
  expect(routine?.id).toBe("routine:$extension:earthdistance.shared_routine($extension:cube.cube)");
  expect(routine?.namespace).toBe("$extension:earthdistance");
});

test("catalog capture preserves the installed namespace of ambiguous co-located SQL overloads", async () => {
  const first = await capture("first", "first", true, true);
  const second = await capture("second", "second", true, true);
  const constraint = first.contract.members.find((member) => member.kind === "other");
  if (constraint?.kind !== "other") throw new Error("Missing synthetic constraint");
  expect(constraint.definition).toContain('"$extension:earthdistance".shared_routine(VALUE)');
  expect(constraint.definition).toContain("'first.shared_routine'");
  const secondConstraint = second.contract.members.find((member) => member.kind === "other");
  if (secondConstraint?.kind !== "other") throw new Error("Missing second synthetic constraint");
  expect(secondConstraint.definition).toContain('"$extension:earthdistance".shared_routine(VALUE)');
});

test("catalog capture retains rejection of ambiguous SQL in a separate dependency namespace", async () => {
  await expect(capture("application", "dependency", true, true)).rejects.toThrow(/Ambiguous extension ownership/);
});

test("catalog capture resolves co-located operator overload ownership from catalog OIDs", async () => {
  const client = new pg.Client();
  const operator = {
    oid: 3,
    namespace: "shared",
    extension: "fixture",
    oprname: "~",
    oprleft: 1,
    oprright: 1,
    oprresult: 2,
    oprcode: 5,
    oprcom: 0,
    oprnegate: 0,
    oprcanhash: false,
    oprcanmerge: false,
    oprrest: 0,
    oprjoin: 0,
  };
  const snapshot = {
    installed: [
      {
        name: "fixture",
        version: "1.0",
        namespace: "shared",
        requires: ["dependency"],
        relocatable: true,
        fixedSchema: null,
      },
    ],
    extensionNamespaces: [
      { name: "fixture", namespace: "shared" },
      { name: "dependency", namespace: "shared" },
    ],
    serverVersion: "18.6",
    postgresMajor: 18,
    members: [
      {
        className: "pg_operator",
        oid: 3,
        subid: 0,
        direct: true,
        objectType: "operator",
        namespace: "shared",
        name: null,
        identity: "shared.~(integer,integer)",
        definition: null,
      },
    ],
    types: [
      { oid: 1, namespace: "pg_catalog", typname: "int4" },
      { oid: 2, namespace: "pg_catalog", typname: "bool" },
    ],
    routines: [{ oid: 5, namespace: "pg_catalog", proname: "int4eq", inputTypes: [1, 1] }],
    operators: [operator, { ...operator, oid: 4, extension: "dependency", oprleft: 2, oprright: 2 }],
    families: [],
    methods: [],
    casts: [],
    classes: [],
    relations: [],
  };
  vi.spyOn(client, "query").mockImplementation(async () => ({
    command: "SELECT",
    rowCount: 1,
    oid: 0,
    fields: [],
    rows: [{ snapshot }],
  }));
  const manifest = await captureExtensionContract(client, {
    name: "fixture",
    provider: "neon",
    fixture: "synthetic-operator-overloads",
  });
  expect(manifest.contract.members[0]).toMatchObject({
    id: "operator:$extension:fixture.~(pg_catalog.int4,pg_catalog.int4)",
    name: "~",
    namespace: "$extension:fixture",
    procedure: "pg_catalog.int4eq(pg_catalog.int4,pg_catalog.int4)",
  });
});

test("catalog capture resolves cast type ownership independently of co-located function names", async () => {
  const client = new pg.Client();
  const snapshot = {
    installed: [
      {
        name: "fixture",
        version: "1.0",
        namespace: "shared",
        requires: ["dependency"],
        relocatable: true,
        fixedSchema: null,
      },
    ],
    extensionNamespaces: [
      { name: "fixture", namespace: "shared" },
      { name: "dependency", namespace: "shared" },
    ],
    serverVersion: "18.6",
    postgresMajor: 18,
    members: [
      {
        className: "pg_cast",
        oid: 3,
        subid: 0,
        direct: true,
        objectType: "cast",
        namespace: null,
        name: null,
        identity: "(integer AS shared.cube)",
        definition: null,
      },
    ],
    types: [
      { oid: 1, namespace: "pg_catalog", typname: "int4" },
      { oid: 2, namespace: "shared", extension: "dependency", typname: "cube" },
    ],
    routines: [{ oid: 5, namespace: "shared", extension: "fixture", proname: "cube", inputTypes: [1] }],
    casts: [{ oid: 3, castsource: 1, casttarget: 2, castcontext: "a", castmethod: "b", castfunc: 0 }],
    operators: [],
    families: [],
    methods: [],
    classes: [],
    relations: [],
  };
  vi.spyOn(client, "query").mockImplementation(async () => ({
    command: "SELECT",
    rowCount: 1,
    oid: 0,
    fields: [],
    rows: [{ snapshot }],
  }));
  const manifest = await captureExtensionContract(client, {
    name: "fixture",
    provider: "neon",
    fixture: "synthetic-cast-type-ownership",
  });
  expect(manifest.contract.members[0]).toMatchObject({
    id: "cast:pg_catalog.int4->$extension:dependency.cube",
    name: '(integer AS "$extension:dependency".cube)',
    target: { namespace: "$extension:dependency", name: "cube" },
  });
});
