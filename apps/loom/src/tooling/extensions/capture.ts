import type pg from "pg";
import * as v from "valibot";
import { extensionMembershipCte } from "../migrations/extension-membership";
import { createExtensionManifest } from "../../core/extensions/registry";
import type {
  ExtensionContract,
  ExtensionMember,
  ExtensionProvenance,
  ExtensionTypeReference,
} from "../../core/extensions/contracts";

type CatalogValue = string | number | boolean | null | CatalogValue[] | CatalogRow;
type CatalogRow = { [key: string]: CatalogValue };
const catalogValueValidator: v.GenericSchema<CatalogValue> = v.lazy(() =>
  v.union([
    v.string(),
    v.number(),
    v.boolean(),
    v.null(),
    v.array(catalogValueValidator),
    v.record(v.string(), catalogValueValidator),
  ]),
);
const catalogRowValidator = v.record(v.string(), catalogValueValidator);
const catalogNumberValidator = v.pipe(
  v.union([v.number(), v.pipe(v.string(), v.regex(/^-?[0-9]+$/))]),
  v.transform(Number),
  v.finite(),
);
const snapshotValidator = v.object({
  installed: v.array(
    v.object({
      name: v.string(),
      version: v.string(),
      namespace: v.string(),
      requires: v.array(v.string()),
      relocatable: v.boolean(),
      fixedSchema: v.nullable(v.string()),
    }),
  ),
  extensionNamespaces: v.array(v.object({ name: v.string(), namespace: v.string() })),
  serverVersion: v.string(),
  postgresMajor: v.number(),
  members: v.array(
    v.object({
      className: v.string(),
      oid: catalogNumberValidator,
      subid: v.number(),
      direct: v.boolean(),
      objectType: v.string(),
      namespace: v.nullable(v.string()),
      name: v.nullable(v.string()),
      identity: v.string(),
      definition: v.nullable(v.string()),
    }),
  ),
  types: v.array(catalogRowValidator),
  routines: v.array(catalogRowValidator),
  operators: v.array(catalogRowValidator),
  families: v.array(catalogRowValidator),
  methods: v.array(catalogRowValidator),
  casts: v.array(catalogRowValidator),
  classes: v.array(catalogRowValidator),
  relations: v.array(catalogRowValidator),
});
type CatalogSnapshot = v.InferInput<typeof snapshotValidator>;

/** One catalogue snapshot, with membership following only extension and subordinate ownership edges. */
const captureSql = `WITH RECURSIVE ${extensionMembershipCte},
  owned AS (SELECT DISTINCT classid,objid,objsubid FROM members WHERE extension=$1),
  ownership AS (SELECT DISTINCT classid,objid,extension FROM members WHERE objsubid=0),
  installed AS (SELECT e.extname AS name,e.extversion AS version,n.nspname AS namespace,e.extrelocatable AS relocatable,
    (SELECT available.schema FROM pg_available_extension_versions available WHERE available.name=e.extname AND available.version=e.extversion) AS "fixedSchema",
    COALESCE((SELECT jsonb_agg(required.extname ORDER BY required.extname) FROM pg_depend d JOIN pg_extension required ON required.oid=d.refobjid
      WHERE d.classid='pg_extension'::regclass AND d.objid=e.oid AND d.refclassid='pg_extension'::regclass AND d.deptype='n'),'[]'::jsonb) AS requires
    FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname=$1)
SELECT jsonb_build_object(
 'installed',(SELECT COALESCE(jsonb_agg(installed),'[]') FROM installed),
 'extensionNamespaces',(SELECT jsonb_agg(jsonb_build_object('name',e.extname,'namespace',n.nspname)) FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace),
 'serverVersion',current_setting('server_version'),'postgresMajor',current_setting('server_version_num')::integer/10000,
 'members',(SELECT COALESCE(jsonb_agg(jsonb_build_object('className',c.relname,'oid',o.objid,'subid',o.objsubid,
   'direct',EXISTS(SELECT 1 FROM roots r WHERE r.extension=$1 AND r.classid=o.classid AND r.objid=o.objid AND r.objsubid=o.objsubid),
   'objectType',i.type,'namespace',i.schema,'name',i.name,'identity',i.identity,
   'definition',CASE WHEN o.classid='pg_constraint'::regclass THEN pg_get_constraintdef(o.objid,true) WHEN o.classid='pg_trigger'::regclass THEN pg_get_triggerdef(o.objid,true) WHEN o.classid='pg_rewrite'::regclass THEN pg_get_ruledef(o.objid,true) ELSE NULL END)),'[]')
   FROM owned o JOIN pg_class c ON c.oid=o.classid CROSS JOIN LATERAL pg_identify_object(o.classid,o.objid,o.objsubid) i),
 'types',(SELECT COALESCE(jsonb_agg(to_jsonb(t)||jsonb_build_object('oid',t.oid,'namespace',n.nspname,'extension',w.extension,
   'typinput',t.typinput::oid,'typoutput',t.typoutput::oid,'typreceive',t.typreceive::oid,'typsend',t.typsend::oid,'typmodin',t.typmodin::oid,'typmodout',t.typmodout::oid,
   'enumValues',COALESCE((SELECT jsonb_agg(e.enumlabel ORDER BY e.enumsortorder) FROM pg_enum e WHERE e.enumtypid=t.oid),'[]'),
   'collation',(SELECT quote_ident(cn.nspname)||'.'||quote_ident(c.collname) FROM pg_collation c JOIN pg_namespace cn ON cn.oid=c.collnamespace WHERE c.oid=t.typcollation),
   'attributes',COALESCE((SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',a.atttypid,'nullable',NOT a.attnotnull,'ordinal',a.attnum,'modifier',a.atttypmod,
     'collation',(SELECT quote_ident(cn.nspname)||'.'||quote_ident(c.collname) FROM pg_collation c JOIN pg_namespace cn ON cn.oid=c.collnamespace WHERE c.oid=a.attcollation)) ORDER BY a.attnum)
     FROM pg_attribute a WHERE a.attrelid=t.typrelid AND a.attnum>0 AND NOT a.attisdropped),'[]'),
   'range',(SELECT to_jsonb(r)||jsonb_build_object('rngcanonical',r.rngcanonical::oid,'rngsubdiff',r.rngsubdiff::oid) FROM pg_range r WHERE r.rngtypid=t.oid))),'[]')
   FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace LEFT JOIN ownership w ON w.classid='pg_type'::regclass AND w.objid=t.oid),
 'routines',(SELECT COALESCE(jsonb_agg(to_jsonb(p)||jsonb_build_object('oid',p.oid,'namespace',n.nspname,'extension',w.extension,'language',l.lanname,
   'inputTypes',to_jsonb(p.proargtypes::oid[]),'defaults',pg_get_expr(p.proargdefaults,0),
   'publicExecute',EXISTS(SELECT 1 FROM aclexplode(COALESCE(p.proacl,acldefault('f',p.proowner))) acl WHERE acl.grantee=0 AND acl.privilege_type='EXECUTE'),
   'aggregate',(SELECT to_jsonb(a)||jsonb_build_object('aggtransfn',a.aggtransfn::oid,'aggfinalfn',a.aggfinalfn::oid,'aggcombinefn',a.aggcombinefn::oid,
     'aggserialfn',a.aggserialfn::oid,'aggdeserialfn',a.aggdeserialfn::oid,'aggmtransfn',a.aggmtransfn::oid,'aggminvtransfn',a.aggminvtransfn::oid,'aggmfinalfn',a.aggmfinalfn::oid) FROM pg_aggregate a WHERE a.aggfnoid=p.oid))),'[]')
   FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace JOIN pg_language l ON l.oid=p.prolang LEFT JOIN ownership w ON w.classid='pg_proc'::regclass AND w.objid=p.oid),
 'operators',(SELECT COALESCE(jsonb_agg(to_jsonb(o)||jsonb_build_object('oid',o.oid,'namespace',n.nspname,'extension',w.extension,'oprcode',o.oprcode::oid,'oprrest',o.oprrest::oid,'oprjoin',o.oprjoin::oid)),'[]')
   FROM pg_operator o JOIN pg_namespace n ON n.oid=o.oprnamespace LEFT JOIN ownership w ON w.classid='pg_operator'::regclass AND w.objid=o.oid),
 'families',(SELECT COALESCE(jsonb_agg(to_jsonb(f)||jsonb_build_object('oid',f.oid,'namespace',n.nspname,'extension',w.extension,
   'operators',COALESCE((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.amopstrategy,a.amoplefttype,a.amoprighttype) FROM pg_amop a WHERE a.amopfamily=f.oid),'[]'),
   'procedures',COALESCE((SELECT jsonb_agg(to_jsonb(p)||jsonb_build_object('amproc',p.amproc::oid) ORDER BY p.amprocnum,p.amproclefttype,p.amprocrighttype) FROM pg_amproc p WHERE p.amprocfamily=f.oid),'[]'))),'[]')
   FROM pg_opfamily f JOIN pg_namespace n ON n.oid=f.opfnamespace LEFT JOIN ownership w ON w.classid='pg_opfamily'::regclass AND w.objid=f.oid),
 'methods',(SELECT COALESCE(jsonb_agg(to_jsonb(a)||jsonb_build_object('oid',a.oid,'amhandler',a.amhandler::oid)),'[]') FROM pg_am a),
 'casts',(SELECT COALESCE(jsonb_agg(to_jsonb(c)||jsonb_build_object('oid',c.oid)),'[]') FROM pg_cast c JOIN owned o ON o.classid='pg_cast'::regclass AND o.objid=c.oid AND o.objsubid=0),
 'classes',(SELECT COALESCE(jsonb_agg(to_jsonb(c)||jsonb_build_object('oid',c.oid)),'[]') FROM pg_opclass c JOIN owned o ON o.classid='pg_opclass'::regclass AND o.objid=c.oid AND o.objsubid=0),
 'relations',(SELECT COALESCE(jsonb_agg(to_jsonb(c)||jsonb_build_object('oid',c.oid,
   'toastParent',(SELECT parent.relname FROM pg_class parent WHERE parent.reltoastrelid=c.oid),
   'toastIndexParent',(SELECT parent.relname FROM pg_index i JOIN pg_class toast ON toast.oid=i.indrelid JOIN pg_class parent ON parent.reltoastrelid=toast.oid WHERE i.indexrelid=c.oid),
   'columns',COALESCE((SELECT jsonb_agg(jsonb_build_object('name',a.attname,'type',a.atttypid,'nullable',NOT a.attnotnull,'ordinal',a.attnum,'modifier',a.atttypmod,
     'collation',(SELECT quote_ident(cn.nspname)||'.'||quote_ident(coll.collname) FROM pg_collation coll JOIN pg_namespace cn ON cn.oid=coll.collnamespace WHERE coll.oid=a.attcollation)) ORDER BY a.attnum)
     FROM pg_attribute a WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped),'[]'),
   'definition',CASE WHEN c.relkind IN ('v','m') THEN pg_get_viewdef(c.oid,true) ELSE NULL END)),'[]')
   FROM pg_class c JOIN owned o ON o.classid='pg_class'::regclass AND o.objid=c.oid AND o.objsubid=0)
) AS snapshot`;

function numeric(row: CatalogRow, key: string): number {
  return v.parse(catalogNumberValidator, row[key]);
}
function text(row: CatalogRow, key: string): string {
  return v.parse(v.string(), row[key]);
}
function boolean(row: CatalogRow, key: string): boolean {
  return v.parse(v.boolean(), row[key]);
}
function numbers(value: CatalogValue | undefined): number[] {
  return v.parse(v.array(catalogNumberValidator), value);
}
function rows(value: CatalogValue | undefined): CatalogRow[] {
  return v.parse(v.array(catalogRowValidator), value);
}

function indexed(entries: CatalogRow[]): Map<number, CatalogRow> {
  return new Map(entries.map((entry) => [numeric(entry, "oid"), entry]));
}
function required(map: Map<number, CatalogRow>, oid: number, kind: string): CatalogRow {
  const row = map.get(oid);
  if (!row) throw new Error(`Missing ${kind} catalogue reference: ${oid}`);
  return row;
}
function routineKind(row: CatalogRow): Extract<ExtensionMember, { kind: "routine" }>["routineKind"] {
  if (row.prokind === "p") return "procedure";
  if (row.prokind === "a") return "aggregate";
  if (row.prokind === "w") return "window";
  return "function";
}

/** Normalize identifier tokens only. Literal SQL strings must retain their exact values. */
function symbolicSql(sql: string, namespace: string, extension: string, generatedNames: Map<string, string>): string {
  const tokens = sql.match(/'(?:''|[^'])*'|"(?:""|[^"])*"|[A-Za-z_][A-Za-z_0-9$]*|\s+|./gs) ?? [];
  return tokens
    .map((token, index) => {
      const identifier = token.startsWith('"') ? token.slice(1, -1).replaceAll('""', '"') : token;
      if (identifier === namespace && namespace !== "pg_catalog" && tokens[index + 1] === ".")
        return `"$extension:${extension}"`;
      const generated = generatedNames.get(identifier);
      return generated ? `"${generated}"` : token;
    })
    .join("");
}

export type ExtensionCaptureOptions = { name: string; provider: string; fixture: string; capturedAt?: string };
export type ExtensionCaptureRestriction = {
  status: "restricted";
  name: string;
  provider: string;
  prerequisite: string;
  verified: false;
};
export function restrictedExtensionCapture(
  name: string,
  provider: string,
  prerequisite: string,
): ExtensionCaptureRestriction {
  if (!prerequisite.trim()) throw new Error("A restricted capture requires its unmet prerequisite");
  return { status: "restricted", name, provider, prerequisite, verified: false };
}

/** Read-only; accepts a direct pg connection owned by the caller. Installation is deliberately separate. */
export async function captureExtensionContract(client: Pick<pg.Client, "query">, options: ExtensionCaptureOptions) {
  const result = await client.query<{ snapshot: CatalogSnapshot }>(captureSql, [options.name]);
  const snapshot = v.parse(snapshotValidator, result.rows[0]?.snapshot);
  if (snapshot.postgresMajor !== 18) throw new Error("Extension capture requires PostgreSQL 18");
  const installed = snapshot.installed[0];
  if (!installed) throw new Error(`Extension is not installed: ${options.name}`);
  const types = indexed(snapshot.types),
    routines = indexed(snapshot.routines),
    operators = indexed(snapshot.operators);
  const families = indexed(snapshot.families),
    methods = indexed(snapshot.methods),
    casts = indexed(snapshot.casts);
  const classes = indexed(snapshot.classes),
    relations = indexed(snapshot.relations);
  const extensionNamespaces = new Map(snapshot.extensionNamespaces.map((entry) => [entry.name, entry.namespace]));
  const namespace = (row: CatalogRow) => {
    const actual = text(row, "namespace");
    const owner = row.extension ? text(row, "extension") : null;
    return owner && actual !== "pg_catalog" && extensionNamespaces.get(owner) === actual
      ? `$extension:${owner}`
      : actual;
  };
  const type = (oid: number): ExtensionTypeReference => {
    const row = required(types, oid, "type");
    return { namespace: namespace(row), name: text(row, "typname") };
  };
  const optionalType = (oid: number) => (oid ? type(oid) : null);
  const typeName = (oid: number) => {
    const value = type(oid);
    return `${value.namespace}.${value.name}`;
  };
  const routineName = (oid: number): string => {
    const row = required(routines, oid, "routine");
    return `${namespace(row)}.${text(row, "proname")}(${numbers(row.inputTypes).map(typeName).join(",")})`;
  };
  const optionalRoutine = (oid: number) => (oid ? routineName(oid) : null);
  const operatorName = (oid: number): string => {
    const row = required(operators, oid, "operator");
    return `${namespace(row)}.${text(row, "oprname")}(${numeric(row, "oprleft") ? typeName(numeric(row, "oprleft")) : ""},${numeric(row, "oprright") ? typeName(numeric(row, "oprright")) : ""})`;
  };
  const optionalOperator = (oid: number) => (oid ? operatorName(oid) : null);
  const methodName = (oid: number) => text(required(methods, oid, "access method"), "amname");
  const familyName = (oid: number): string => {
    const row = required(families, oid, "operator family");
    return `${namespace(row)}.${text(row, "opfname")}/${methodName(numeric(row, "opfmethod"))}`;
  };
  const columnList = (value: CatalogValue | undefined) =>
    rows(value).map((column) => ({
      name: text(column, "name"),
      type: type(numeric(column, "type")),
      nullable: boolean(column, "nullable"),
      ordinal: numeric(column, "ordinal"),
      modifier: numeric(column, "modifier"),
      collation: column.collation === null ? null : text(column, "collation"),
    }));
  const generatedNames = new Map<string, string>();
  for (const row of snapshot.relations) {
    if (row.toastParent) generatedNames.set(text(row, "relname"), `$toast:${text(row, "toastParent")}`);
    if (row.toastIndexParent) generatedNames.set(text(row, "relname"), `$toast-index:${text(row, "toastIndexParent")}`);
  }
  const normalize = (value: string) => symbolicSql(value, installed.namespace, installed.name, generatedNames);
  const members: ExtensionMember[] = snapshot.members.map((member): ExtensionMember => {
    const objectOid = Number(member.oid);
    const common = {
      id: `${member.objectType}:${normalize(member.identity)}`,
      namespace:
        member.namespace === installed.namespace && member.namespace !== "pg_catalog"
          ? `$extension:${installed.name}`
          : member.namespace,
      name: normalize(member.name ?? member.identity),
      ownership: member.direct ? ("direct" as const) : ("subordinate" as const),
    };
    if (member.className === "pg_proc") {
      const row = required(routines, objectOid, "routine");
      const inputs = numbers(row.inputTypes),
        allTypes = row.proallargtypes ? numbers(row.proallargtypes) : inputs;
      const modes = row.proargmodes === null ? allTypes.map(() => "i") : v.parse(v.array(v.string()), row.proargmodes);
      const names = row.proargnames === null ? [] : v.parse(v.array(v.string()), row.proargnames);
      let inputIndex = 0;
      const argumentModes = { i: "in", o: "out", b: "inout", v: "variadic", t: "table" } as const;
      const argumentsList = allTypes.map((oid, index) => {
        const mode = v.parse(v.picklist(["i", "o", "b", "v", "t"]), modes[index]);
        const input = mode === "i" || mode === "b" || mode === "v";
        const hasDefault = input && inputIndex >= inputs.length - numeric(row, "pronargdefaults");
        if (input) inputIndex++;
        return {
          name: names[index] || null,
          type: type(oid),
          mode: argumentModes[mode],
          hasDefault,
        };
      });
      const aggregate = v.parse(v.nullable(catalogRowValidator), row.aggregate);
      return {
        ...common,
        id: `routine:${routineName(objectOid)}`,
        kind: "routine",
        name: text(row, "proname"),
        namespace: namespace(row),
        routineKind: routineKind(row),
        arguments: argumentsList,
        returns: type(numeric(row, "prorettype")),
        returnsSet: boolean(row, "proretset"),
        defaults: row.defaults === null ? null : normalize(text(row, "defaults")),
        variadic: optionalType(numeric(row, "provariadic")),
        strict: boolean(row, "proisstrict"),
        volatility: row.provolatile === "i" ? "immutable" : row.provolatile === "s" ? "stable" : "volatile",
        parallel: row.proparallel === "s" ? "safe" : row.proparallel === "r" ? "restricted" : "unsafe",
        securityDefiner: boolean(row, "prosecdef"),
        leakproof: boolean(row, "proleakproof"),
        publicExecute: boolean(row, "publicExecute"),
        language: text(row, "language"),
        configuration: Array.isArray(row.proconfig) ? v.parse(v.array(v.string()), row.proconfig).map(normalize) : [],
        aggregate: aggregate
          ? {
              kind: aggregate.aggkind === "o" ? "ordered-set" : aggregate.aggkind === "h" ? "hypothetical" : "normal",
              directArguments: numeric(aggregate, "aggnumdirectargs"),
              transitionType: type(numeric(aggregate, "aggtranstype")),
              transition: routineName(numeric(aggregate, "aggtransfn")),
              final: optionalRoutine(numeric(aggregate, "aggfinalfn")),
              combine: optionalRoutine(numeric(aggregate, "aggcombinefn")),
              serial: optionalRoutine(numeric(aggregate, "aggserialfn")),
              deserial: optionalRoutine(numeric(aggregate, "aggdeserialfn")),
              initial: aggregate.agginitval === null ? null : text(aggregate, "agginitval"),
              finalExtra: boolean(aggregate, "aggfinalextra"),
              finalModify: text(aggregate, "aggfinalmodify"),
              movingTransition: optionalRoutine(numeric(aggregate, "aggmtransfn")),
              movingInverse: optionalRoutine(numeric(aggregate, "aggminvtransfn")),
              movingFinal: optionalRoutine(numeric(aggregate, "aggmfinalfn")),
              movingTransitionType: optionalType(numeric(aggregate, "aggmtranstype")),
              movingInitial: aggregate.aggminitval === null ? null : text(aggregate, "aggminitval"),
              movingFinalExtra: boolean(aggregate, "aggmfinalextra"),
              movingFinalModify: text(aggregate, "aggmfinalmodify"),
            }
          : null,
      };
    }
    if (member.className === "pg_type") {
      const row = required(types, objectOid, "type");
      const range = v.parse(v.nullable(catalogRowValidator), row.range);
      return {
        ...common,
        id: `type:${typeName(objectOid)}`,
        kind: "type",
        name: text(row, "typname"),
        namespace: namespace(row),
        typeKind: text(row, "typtype"),
        category: text(row, "typcategory"),
        base: optionalType(numeric(row, "typbasetype")),
        element: optionalType(numeric(row, "typelem")),
        array: optionalType(numeric(row, "typarray")),
        delimiter: text(row, "typdelim"),
        length: numeric(row, "typlen"),
        byValue: boolean(row, "typbyval"),
        input: routineName(numeric(row, "typinput")),
        output: routineName(numeric(row, "typoutput")),
        receive: optionalRoutine(numeric(row, "typreceive")),
        send: optionalRoutine(numeric(row, "typsend")),
        typmodInput: optionalRoutine(numeric(row, "typmodin")),
        typmodOutput: optionalRoutine(numeric(row, "typmodout")),
        enumValues: Array.isArray(row.enumValues) ? row.enumValues.map(String) : [],
        attributes: columnList(row.attributes),
        nullable: !boolean(row, "typnotnull"),
        modifier: numeric(row, "typtypmod"),
        default: row.typdefault === null ? null : normalize(text(row, "typdefault")),
        alignment: text(row, "typalign"),
        storage: text(row, "typstorage"),
        collation: row.collation === null ? null : text(row, "collation"),
        range: range
          ? {
              subtype: type(numeric(range, "rngsubtype")),
              multirange: type(numeric(range, "rngmultitypid")),
              canonical: optionalRoutine(numeric(range, "rngcanonical")),
              subdiff: optionalRoutine(numeric(range, "rngsubdiff")),
            }
          : null,
      };
    }
    if (member.className === "pg_operator") {
      const row = required(operators, objectOid, "operator");
      return {
        ...common,
        id: `operator:${operatorName(objectOid)}`,
        kind: "operator",
        name: text(row, "oprname"),
        namespace: namespace(row),
        left: optionalType(numeric(row, "oprleft")),
        right: optionalType(numeric(row, "oprright")),
        returns: optionalType(numeric(row, "oprresult")),
        procedure: optionalRoutine(numeric(row, "oprcode")),
        defined: numeric(row, "oprresult") !== 0 && numeric(row, "oprcode") !== 0,
        commutator: optionalOperator(numeric(row, "oprcom")),
        negator: optionalOperator(numeric(row, "oprnegate")),
        canHash: boolean(row, "oprcanhash"),
        canMerge: boolean(row, "oprcanmerge"),
        restrict: optionalRoutine(numeric(row, "oprrest")),
        join: optionalRoutine(numeric(row, "oprjoin")),
      };
    }
    if (member.className === "pg_cast") {
      const row = required(casts, objectOid, "cast");
      return {
        ...common,
        id: `cast:${typeName(numeric(row, "castsource"))}->${typeName(numeric(row, "casttarget"))}`,
        kind: "cast",
        source: type(numeric(row, "castsource")),
        target: type(numeric(row, "casttarget")),
        context: row.castcontext === "i" ? "implicit" : row.castcontext === "a" ? "assignment" : "explicit",
        method: row.castmethod === "f" ? "function" : row.castmethod === "b" ? "binary" : "inout",
        procedure: optionalRoutine(numeric(row, "castfunc")),
      };
    }
    if (member.className === "pg_opclass") {
      const row = required(classes, objectOid, "operator class");
      return {
        ...common,
        id: `opclass:${common.namespace}.${text(row, "opcname")}/${methodName(numeric(row, "opcmethod"))}`,
        kind: "opclass",
        accessMethod: methodName(numeric(row, "opcmethod")),
        family: familyName(numeric(row, "opcfamily")),
        input: type(numeric(row, "opcintype")),
        storage: optionalType(numeric(row, "opckeytype")),
        isDefault: boolean(row, "opcdefault"),
      };
    }
    if (member.className === "pg_opfamily") {
      const row = required(families, objectOid, "operator family");
      return {
        ...common,
        id: `opfamily:${familyName(objectOid)}`,
        kind: "opfamily",
        accessMethod: methodName(numeric(row, "opfmethod")),
        operators: rows(row.operators)
          .map((item) => ({
            left: type(numeric(item, "amoplefttype")),
            right: type(numeric(item, "amoprighttype")),
            strategy: numeric(item, "amopstrategy"),
            purpose: text(item, "amoppurpose"),
            operator: operatorName(numeric(item, "amopopr")),
            sortFamily: numeric(item, "amopsortfamily") ? familyName(numeric(item, "amopsortfamily")) : null,
          }))
          .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
        procedures: rows(row.procedures)
          .map((item) => ({
            left: type(numeric(item, "amproclefttype")),
            right: type(numeric(item, "amprocrighttype")),
            number: numeric(item, "amprocnum"),
            procedure: routineName(numeric(item, "amproc")),
          }))
          .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
      };
    }
    if (member.className === "pg_am") {
      const row = required(methods, objectOid, "access method");
      return {
        ...common,
        kind: "access-method",
        methodKind: text(row, "amtype"),
        handler: routineName(numeric(row, "amhandler")),
      };
    }
    if (member.className === "pg_class" && !member.subid) {
      const row = required(relations, objectOid, "relation");
      return {
        ...common,
        kind: "relation",
        relationKind: text(row, "relkind"),
        columns: columnList(row.columns),
        definition: row.definition === null ? null : normalize(text(row, "definition")),
      };
    }
    return {
      ...common,
      kind: "other",
      objectType: member.objectType,
      identity: normalize(member.identity),
      definition: member.definition === null ? null : normalize(member.definition),
    };
  });
  const contract: ExtensionContract = {
    extension: installed.name,
    postgresMajor: snapshot.postgresMajor,
    version: installed.version,
    provider: options.provider,
    installation: { relocatable: installed.relocatable, fixedSchema: installed.fixedSchema },
    requires: installed.requires,
    members,
  };
  const provenance: ExtensionProvenance = {
    capturedAt: options.capturedAt ?? new Date().toISOString(),
    fixture: options.fixture,
    source: "pg_catalog",
    serverVersion: snapshot.serverVersion,
    installationSchema: installed.namespace,
    verified: true,
  };
  return createExtensionManifest(contract, provenance);
}
