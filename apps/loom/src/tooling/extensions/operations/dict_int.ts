import * as v from "valibot";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import {
  dictionaryReference,
  dictionaryReferenceValidator,
  type DictionaryReference,
} from "../../../core/extensions/dictionary-reference";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { validateExtensionManifest } from "../../../core/extensions/registry";
import { acquireExtensionLock } from "../../migrations/connection";
import { withExtensionOperation, type ExtensionOperationContext } from "../operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "../verify";
import {
  dictIntOptionsValidator,
  parseDictIntOptions,
  type DictIntOptions,
  type DictIntResolvedOptions,
} from "../../../core/extensions/adapters/dict_int-codecs";
import source from "../manifests/dict_int.json";
import graph from "../text-search-contracts/dict_int.json";
import {
  captureExtensionTextSearch,
  extensionTextSearchCaptureValidator,
  validateExtensionTextSearchCapture,
} from "../text-search-capture";

const digest = "1a745014cc5c4e94724c34d742b8fb154fe0852306dca4163cc307b8dca9e5da";
const initId = "routine:$extension:dict_int.dintdict_init(pg_catalog.internal)";
const lexizeId =
  "routine:$extension:dict_int.dintdict_lexize(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)";
const templateMember = 'text search template:"$extension:dict_int".intdict_template';
type DictIntDescriptor = ExtensionDescriptor<"dict_int", { version: "1.0"; schema: string }>;
const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, source));
const textSearch = validateExtensionTextSearchCapture(v.parse(extensionTextSearchCaptureValidator, graph), manifest);
if (textSearch.digest !== "30d18d75bba47e968e7cb932340285fbb370bc1abd75caf9145dc17936d1a6b8")
  throw new Error("dict_int tooling requires its exact reviewed text-search contract");

export interface DictIntDictionaryFacts {
  readonly reference: DictionaryReference;
  readonly template: { readonly schema: string; readonly name: "intdict_template" };
  readonly owner: string;
  readonly options: string | null;
  readonly parsed: DictIntResolvedOptions;
}
export interface DictIntTemplateFacts {
  readonly schema: string;
  readonly name: "intdict_template";
  readonly member: typeof templateMember;
  readonly init: typeof initId;
  readonly lexize: typeof lexizeId;
}
export interface DictIntDictionaries {
  readonly inspectDictionary: (reference?: DictionaryReference) => Promise<DictIntDictionaryFacts>;
  readonly inspectTemplate: () => Promise<DictIntTemplateFacts>;
  readonly createDictionary: (
    reference: DictionaryReference,
    options?: DictIntOptions,
  ) => Promise<DictIntDictionaryFacts>;
  readonly alterDictionary: (
    reference: DictionaryReference,
    options: DictIntOptions,
  ) => Promise<DictIntDictionaryFacts>;
}

const dictionaryRow = v.strictObject({
  schema: v.string(),
  name: v.string(),
  templateSchema: v.string(),
  templateName: v.string(),
  templateOwners: v.array(v.string()),
  owner: v.string(),
  options: v.nullable(v.string()),
});
const callbackRow = v.strictObject({
  name: v.string(),
  schema: v.string(),
  owners: v.array(v.string()),
  kind: v.string(),
  returnsSet: v.boolean(),
  returnNamespace: v.string(),
  returnName: v.string(),
  arguments: v.array(v.strictObject({ namespace: v.string(), name: v.string() })),
});
const templateRow = v.strictObject({
  schema: v.string(),
  name: v.string(),
  owners: v.array(v.string()),
  init: callbackRow,
  lexize: callbackRow,
});

function requirement(descriptor: DictIntDescriptor) {
  if (
    descriptor.name !== "dict_int" ||
    descriptor.version !== "1.0" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest ||
    manifest.digest !== digest
  )
    throw new Error("dict_int 1.0 requires its exact verified contract");
  const reference = dictionaryReference({ schema: descriptor.schema, name: "intdict" });
  return {
    reference,
    requirement: validateExtensionApiRequirement({ schema: reference.schema, manifest, textSearch }),
  };
}

function optionClause(options: DictIntOptions | undefined): string {
  const checked = v.parse(dictIntOptionsValidator, options ?? {});
  const parts: string[] = [];
  if (checked.maxlen !== undefined) parts.push(`MAXLEN = ${checked.maxlen}`);
  if (checked.rejectlong !== undefined) parts.push(`REJECTLONG = ${checked.rejectlong ? "TRUE" : "FALSE"}`);
  if (checked.absval !== undefined) parts.push(`ABSVAL = ${checked.absval ? "TRUE" : "FALSE"}`);
  return parts.join(", ");
}

async function inspect(
  context: ExtensionOperationContext,
  reference: DictionaryReference,
  schema: string,
): Promise<DictIntDictionaryFacts> {
  const target = v.parse(dictionaryReferenceValidator, reference);
  const result = await context.client.query(
    `SELECT n.nspname AS schema,d.dictname AS name,tn.nspname AS "templateSchema",t.tmplname AS "templateName",pg_catalog.pg_get_userbyid(d.dictowner) AS owner,d.dictinitoption AS options,
    COALESCE((SELECT jsonb_agg(e.extname ORDER BY e.extname) FROM pg_catalog.pg_depend p JOIN pg_catalog.pg_extension e ON e.oid=p.refobjid WHERE p.classid='pg_catalog.pg_ts_template'::pg_catalog.regclass AND p.objid=t.oid AND p.objsubid=0 AND p.refclassid='pg_catalog.pg_extension'::pg_catalog.regclass AND p.deptype='e'),'[]'::jsonb) AS "templateOwners"
    FROM pg_catalog.pg_ts_dict d JOIN pg_catalog.pg_namespace n ON n.oid=d.dictnamespace JOIN pg_catalog.pg_ts_template t ON t.oid=d.dicttemplate JOIN pg_catalog.pg_namespace tn ON tn.oid=t.tmplnamespace WHERE n.nspname=$1 AND d.dictname=$2`,
    [target.schema, target.name],
  );
  const rows = v.parse(v.array(dictionaryRow), result.rows);
  const row = rows[0];
  if (rows.length !== 1 || !row) throw new Error("Expected one existing qualified dict_int dictionary");
  if (
    row.schema !== target.schema ||
    row.name !== target.name ||
    row.templateSchema !== schema ||
    row.templateName !== "intdict_template" ||
    row.templateOwners.length !== 1 ||
    row.templateOwners[0] !== "dict_int"
  )
    throw new Error("Dictionary does not use the selected extension-owned intdict_template");
  return Object.freeze({
    reference: target,
    template: Object.freeze({ schema: row.templateSchema, name: "intdict_template" as const }),
    owner: row.owner,
    options: row.options,
    parsed: parseDictIntOptions(row.options),
  });
}

function requireCallback(
  callback: v.InferOutput<typeof callbackRow>,
  schema: string,
  name: string,
  arity: number,
): void {
  if (
    callback.schema !== schema ||
    callback.name !== name ||
    callback.owners.length !== 1 ||
    callback.owners[0] !== "dict_int" ||
    callback.kind !== "f" ||
    callback.returnsSet ||
    callback.returnNamespace !== "pg_catalog" ||
    callback.returnName !== "internal" ||
    callback.arguments.length !== arity ||
    callback.arguments.some((argument) => argument.namespace !== "pg_catalog" || argument.name !== "internal")
  )
    throw new Error("dict_int template callback catalogue linkage changed");
}

async function template(context: ExtensionOperationContext, schema: string): Promise<DictIntTemplateFacts> {
  const result = await context.client.query(
    `SELECT n.nspname AS schema,t.tmplname AS name,
      COALESCE((SELECT jsonb_agg(e.extname ORDER BY e.extname) FROM pg_catalog.pg_depend p JOIN pg_catalog.pg_extension e ON e.oid=p.refobjid WHERE p.classid='pg_catalog.pg_ts_template'::pg_catalog.regclass AND p.objid=t.oid AND p.objsubid=0 AND p.refclassid='pg_catalog.pg_extension'::pg_catalog.regclass AND p.deptype='e'),'[]'::jsonb) AS owners,
      jsonb_build_object('name',init.proname,'schema',in_n.nspname,'kind',init.prokind,'returnsSet',init.proretset,
        'returnNamespace',irn.nspname,'returnName',irt.typname,
        'owners',COALESCE((SELECT jsonb_agg(e.extname ORDER BY e.extname) FROM pg_catalog.pg_depend p JOIN pg_catalog.pg_extension e ON e.oid=p.refobjid WHERE p.classid='pg_catalog.pg_proc'::pg_catalog.regclass AND p.objid=init.oid AND p.objsubid=0 AND p.refclassid='pg_catalog.pg_extension'::pg_catalog.regclass AND p.deptype='e'),'[]'::jsonb),
        'arguments',COALESCE((SELECT jsonb_agg(jsonb_build_object('namespace',tn.nspname,'name',ty.typname) ORDER BY a.ordinal)
          FROM unnest(init.proargtypes::oid[]) WITH ORDINALITY a(typeoid,ordinal)
          JOIN pg_catalog.pg_type ty ON ty.oid=a.typeoid JOIN pg_catalog.pg_namespace tn ON tn.oid=ty.typnamespace),'[]'::jsonb)) AS init,
      jsonb_build_object('name',lexize.proname,'schema',lx_n.nspname,'kind',lexize.prokind,'returnsSet',lexize.proretset,
        'returnNamespace',lrn.nspname,'returnName',lrt.typname,
        'owners',COALESCE((SELECT jsonb_agg(e.extname ORDER BY e.extname) FROM pg_catalog.pg_depend p JOIN pg_catalog.pg_extension e ON e.oid=p.refobjid WHERE p.classid='pg_catalog.pg_proc'::pg_catalog.regclass AND p.objid=lexize.oid AND p.objsubid=0 AND p.refclassid='pg_catalog.pg_extension'::pg_catalog.regclass AND p.deptype='e'),'[]'::jsonb),
        'arguments',COALESCE((SELECT jsonb_agg(jsonb_build_object('namespace',tn.nspname,'name',ty.typname) ORDER BY a.ordinal)
          FROM unnest(lexize.proargtypes::oid[]) WITH ORDINALITY a(typeoid,ordinal)
          JOIN pg_catalog.pg_type ty ON ty.oid=a.typeoid JOIN pg_catalog.pg_namespace tn ON tn.oid=ty.typnamespace),'[]'::jsonb)) AS lexize
     FROM pg_catalog.pg_ts_template t
     JOIN pg_catalog.pg_namespace n ON n.oid=t.tmplnamespace
     JOIN pg_catalog.pg_proc init ON init.oid=t.tmplinit
     JOIN pg_catalog.pg_namespace in_n ON in_n.oid=init.pronamespace
     JOIN pg_catalog.pg_type irt ON irt.oid=init.prorettype
     JOIN pg_catalog.pg_namespace irn ON irn.oid=irt.typnamespace
     JOIN pg_catalog.pg_proc lexize ON lexize.oid=t.tmpllexize
     JOIN pg_catalog.pg_namespace lx_n ON lx_n.oid=lexize.pronamespace
     JOIN pg_catalog.pg_type lrt ON lrt.oid=lexize.prorettype
     JOIN pg_catalog.pg_namespace lrn ON lrn.oid=lrt.typnamespace
     WHERE n.nspname=$1 AND t.tmplname='intdict_template'`,
    [schema],
  );
  const rows = v.parse(v.array(templateRow), result.rows);
  const row = rows[0];
  if (rows.length !== 1 || !row || row.schema !== schema || row.name !== "intdict_template")
    throw new Error("Expected one extension-owned intdict_template");
  if (row.owners.length !== 1 || row.owners[0] !== "dict_int")
    throw new Error("intdict_template is missing or not owned by dict_int");
  requireCallback(row.init, schema, "dintdict_init", 1);
  requireCallback(row.lexize, schema, "dintdict_lexize", 4);
  return Object.freeze({
    schema,
    name: "intdict_template",
    member: templateMember,
    init: initId,
    lexize: lexizeId,
  });
}

async function probe(context: ExtensionOperationContext, reference: DictionaryReference) {
  const result = await context.client.query(
    "SELECT pg_catalog.ts_lexize(pg_catalog.format('%I.%I',$1::text,$2::text)::pg_catalog.regdictionary,$3::text) AS lexemes",
    [reference.schema, reference.name, "123"],
  );
  v.parse(v.tuple([v.strictObject({ lexemes: v.nullable(v.array(v.string())) })]), result.rows);
}

async function change(
  context: ExtensionOperationContext,
  schema: string,
  kind: "create" | "alter",
  reference: DictionaryReference,
  options?: DictIntOptions,
): Promise<DictIntDictionaryFacts> {
  const target = v.parse(dictionaryReferenceValidator, reference);
  const extras = optionClause(options);
  if (kind === "alter") {
    if (!extras) throw new Error("dict_int ALTER requires at least one option");
    await inspect(context, target, schema);
  }
  const formatted =
    kind === "create"
      ? extras
        ? await context.client.query(
            "SELECT pg_catalog.format('CREATE TEXT SEARCH DICTIONARY %I.%I (TEMPLATE = %I.%I, %s)',$1::text,$2::text,$3::text,$4::text,$5::text) AS statement",
            [target.schema, target.name, schema, "intdict_template", extras],
          )
        : await context.client.query(
            "SELECT pg_catalog.format('CREATE TEXT SEARCH DICTIONARY %I.%I (TEMPLATE = %I.%I)',$1::text,$2::text,$3::text,$4::text) AS statement",
            [target.schema, target.name, schema, "intdict_template"],
          )
      : await context.client.query(
          "SELECT pg_catalog.format('ALTER TEXT SEARCH DICTIONARY %I.%I (%s)',$1::text,$2::text,$3::text) AS statement",
          [target.schema, target.name, extras],
        );
  const [row] = v.parse(v.tuple([v.strictObject({ statement: v.pipe(v.string(), v.minLength(1)) })]), formatted.rows);
  const result = await context.client.query(row.statement);
  const command = kind === "create" ? "CREATE" : "ALTER";
  if (result.command !== command) throw new Error(`Unexpected dict_int dictionary command: ${result.command}`);
  await probe(context, target);
  return inspect(context, target, schema);
}

/** Dedicated operator credentials; dictionary option writes stay outside application bindings. */
export async function withDictIntDictionaries<Result>(
  connectionString: string,
  descriptor: DictIntDescriptor,
  operation: (dictionaries: DictIntDictionaries) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{ readonly completion: "committed"; readonly value: Result }> {
  const checked = requirement(descriptor);
  return withExtensionOperation(
    connectionString,
    async (context) => {
      await acquireExtensionLock(context.client, signal);
      // Operator actions intentionally change dictionary options. The exact owned callback graph remains required;
      // generated/release requirements keep the original option pin and report intentional drift separately.
      const currentGraph = await captureExtensionTextSearch(context.client, manifest, {
        provider: manifest.contract.provider,
        fixture: "dict-int-operator-verification",
      });
      await verifyExtensionApiContracts(context.client, [{ ...checked.requirement, textSearch: currentGraph }]);
      const schema = checked.reference.schema;
      return Object.freeze({
        inspectDictionary: (reference = checked.reference) => context.run(() => inspect(context, reference, schema)),
        inspectTemplate: () => context.run(() => template(context, schema)),
        createDictionary: (reference: DictionaryReference, options?: DictIntOptions) =>
          context.run(() => change(context, schema, "create", reference, options)),
        alterDictionary: (reference: DictionaryReference, options: DictIntOptions) =>
          context.run(() => change(context, schema, "alter", reference, options)),
      });
    },
    operation,
    signal,
  );
}
