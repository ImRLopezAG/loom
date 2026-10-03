import * as v from "valibot";
import type { ExtensionDescriptor } from "../../core/extensions/bindings";
import {
  dictionaryReference,
  dictionaryReferenceValidator,
  type DictionaryReference,
} from "../../core/extensions/dictionary-reference";
import { extensionManifestValidator } from "../../core/extensions/contracts";
import { validateExtensionManifest } from "../../core/extensions/registry";
import { acquireExtensionLock } from "../migrations/connection";
import { captureExtensionContract } from "./capture";
import { withExtensionOperation, type ExtensionOperationContext } from "./operations";
import {
  captureExtensionTextSearch,
  extensionTextSearchCaptureValidator,
  validateExtensionTextSearchCapture,
} from "./text-search-capture";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "./verify";
import source from "./manifests/unaccent.json";
import graphSource from "./text-search-contracts/unaccent.json";

export interface UnaccentDictionaryFacts {
  readonly reference: DictionaryReference;
  readonly template: { readonly schema: string; readonly name: "unaccent" };
  readonly owner: string;
  readonly options: string | null;
}
export interface UnaccentTemplateFacts {
  readonly schema: string;
  readonly name: "unaccent";
  readonly member: 'text search template:"$extension:unaccent".unaccent';
  readonly init: "routine:$extension:unaccent.unaccent_init(pg_catalog.internal)";
  readonly lexize: "routine:$extension:unaccent.unaccent_lexize(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)";
}
export interface UnaccentDictionaries {
  readonly inspectDictionary: (reference?: DictionaryReference) => Promise<UnaccentDictionaryFacts>;
  readonly inspectTemplate: () => Promise<UnaccentTemplateFacts>;
  readonly createDictionary: (reference: DictionaryReference, rules?: string) => Promise<UnaccentDictionaryFacts>;
  readonly setRules: (reference: DictionaryReference, rules: string) => Promise<UnaccentDictionaryFacts>;
  readonly reloadRules: (reference?: DictionaryReference) => Promise<UnaccentDictionaryFacts>;
}
type UnaccentDescriptor = ExtensionDescriptor<"unaccent", { version: "1.1"; schema: string }>;
const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, source));
const textSearch = validateExtensionTextSearchCapture(
  v.parse(extensionTextSearchCaptureValidator, graphSource),
  manifest,
);
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { ignoreBOM: true });
const rulesValidator = v.pipe(
  v.string(),
  v.minLength(1),
  v.check(
    (value) => !value.includes("\u0000") && decoder.decode(encoder.encode(value)) === value,
    "Expected a lossless NUL-free installed rules basename",
  ),
);
const dictionaryRow = v.strictObject({
  schema: v.string(),
  name: v.string(),
  templateSchema: v.string(),
  templateName: v.string(),
  templateOwners: v.array(v.string()),
  owner: v.string(),
  options: v.nullable(v.string()),
});

function requirement(descriptor: UnaccentDescriptor) {
  if (
    descriptor.name !== "unaccent" ||
    descriptor.version !== "1.1" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== manifest.digest
  )
    throw new Error("unaccent 1.1 requires its exact verified contract");
  const reference = dictionaryReference({ schema: descriptor.schema, name: "unaccent" });
  return {
    reference,
    requirement: validateExtensionApiRequirement({ schema: reference.schema, manifest, textSearch }),
  };
}

async function inspect(
  context: ExtensionOperationContext,
  reference: DictionaryReference,
  schema: string,
): Promise<UnaccentDictionaryFacts> {
  const target = v.parse(dictionaryReferenceValidator, reference);
  const result = await context.client.query(
    `SELECT n.nspname AS schema,d.dictname AS name,tn.nspname AS "templateSchema",t.tmplname AS "templateName",pg_catalog.pg_get_userbyid(d.dictowner) AS owner,d.dictinitoption AS options,
    COALESCE((SELECT jsonb_agg(e.extname ORDER BY e.extname) FROM pg_catalog.pg_depend p JOIN pg_catalog.pg_extension e ON e.oid=p.refobjid WHERE p.classid='pg_catalog.pg_ts_template'::pg_catalog.regclass AND p.objid=t.oid AND p.objsubid=0 AND p.refclassid='pg_catalog.pg_extension'::pg_catalog.regclass AND p.deptype='e'),'[]'::jsonb) AS "templateOwners"
    FROM pg_catalog.pg_ts_dict d JOIN pg_catalog.pg_namespace n ON n.oid=d.dictnamespace JOIN pg_catalog.pg_ts_template t ON t.oid=d.dicttemplate JOIN pg_catalog.pg_namespace tn ON tn.oid=t.tmplnamespace WHERE n.nspname=$1 AND d.dictname=$2`,
    [target.schema, target.name],
  );
  const rows = v.parse(v.array(dictionaryRow), result.rows);
  const row = rows[0];
  if (rows.length !== 1 || !row) throw new Error("Expected one existing qualified Unaccent dictionary");
  if (
    row.schema !== target.schema ||
    row.name !== target.name ||
    row.templateSchema !== schema ||
    row.templateName !== "unaccent" ||
    row.templateOwners.length !== 1 ||
    row.templateOwners[0] !== "unaccent"
  )
    throw new Error("Dictionary does not use the selected extension-owned Unaccent template");
  return Object.freeze({
    reference: target,
    template: Object.freeze({ schema: row.templateSchema, name: "unaccent" as const }),
    owner: row.owner,
    options: row.options,
  });
}
async function probe(context: ExtensionOperationContext, reference: DictionaryReference) {
  const result = await context.client.query(
    "SELECT pg_catalog.ts_lexize(pg_catalog.format('%I.%I',$1::text,$2::text)::pg_catalog.regdictionary,$3::text) AS lexemes",
    [reference.schema, reference.name, "Hôtel"],
  );
  v.parse(v.tuple([v.strictObject({ lexemes: v.nullable(v.array(v.string())) })]), result.rows);
}
const formats = {
  create:
    "SELECT pg_catalog.format('CREATE TEXT SEARCH DICTIONARY %I.%I (TEMPLATE = %I.%I, RULES = %L)',$1::text,$2::text,$3::text,$4::text,$5::text) AS statement",
  set: "SELECT pg_catalog.format('ALTER TEXT SEARCH DICTIONARY %I.%I (RULES = %L)',$1::text,$2::text,$3::text) AS statement",
  reload: "SELECT pg_catalog.format('ALTER TEXT SEARCH DICTIONARY %I.%I (dummy)',$1::text,$2::text) AS statement",
} as const;
async function change(
  context: ExtensionOperationContext,
  schema: string,
  kind: keyof typeof formats,
  reference: DictionaryReference,
  rules?: string,
): Promise<UnaccentDictionaryFacts> {
  const target = v.parse(dictionaryReferenceValidator, reference);
  if (kind !== "create") await inspect(context, target, schema);
  const parameters =
    kind === "create"
      ? [target.schema, target.name, schema, "unaccent", v.parse(rulesValidator, rules)]
      : kind === "set"
        ? [target.schema, target.name, v.parse(rulesValidator, rules)]
        : [target.schema, target.name];
  const formatted = await context.client.query(formats[kind], parameters);
  const [row] = v.parse(v.tuple([v.strictObject({ statement: v.pipe(v.string(), v.minLength(1)) })]), formatted.rows);
  const result = await context.client.query(row.statement);
  const command = kind === "create" ? "CREATE" : "ALTER";
  if (result.command !== command) throw new Error(`Unexpected Unaccent dictionary command: ${result.command}`);
  await probe(context, target);
  return inspect(context, target, schema);
}
async function template(context: ExtensionOperationContext, schema: string): Promise<UnaccentTemplateFacts> {
  const observed = await captureExtensionTextSearch(context.client, manifest, {
    provider: manifest.contract.provider,
    fixture: "unaccent-template-inspection",
  });
  validateExtensionTextSearchCapture(observed, manifest);
  if (observed.provenance.installationSchema !== schema) throw new Error("Unaccent template namespace mismatch");
  return Object.freeze({
    schema,
    name: "unaccent",
    member: 'text search template:"$extension:unaccent".unaccent',
    init: "routine:$extension:unaccent.unaccent_init(pg_catalog.internal)",
    lexize:
      "routine:$extension:unaccent.unaccent_lexize(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
  });
}

/** Dedicated operator credentials; mutable native dictionary state stays outside application bindings. */
export async function withUnaccentDictionaries<Result>(
  connectionString: string,
  descriptor: UnaccentDescriptor,
  operation: (dictionaries: UnaccentDictionaries) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{ readonly completion: "committed"; readonly value: Result }> {
  const checked = requirement(descriptor);
  return withExtensionOperation(
    connectionString,
    async (context) => {
      await acquireExtensionLock(context.client, signal);
      await verifyExtensionApiContracts(context.client, [checked.requirement]);
      const schema = checked.reference.schema;
      return Object.freeze({
        inspectDictionary: (reference = checked.reference) => context.run(() => inspect(context, reference, schema)),
        inspectTemplate: () => context.run(() => template(context, schema)),
        createDictionary: (reference: DictionaryReference, rules = "unaccent") =>
          context.run(() => change(context, schema, "create", reference, rules)),
        setRules: (reference: DictionaryReference, rules: string) =>
          context.run(() => change(context, schema, "set", reference, rules)),
        reloadRules: (reference = checked.reference) => context.run(() => change(context, schema, "reload", reference)),
      });
    },
    operation,
    signal,
  );
}

/** Restore only the installed default's standard rules, with exact structure before and strict pin after. */
export async function restoreUnaccentDictionary(
  connectionString: string,
  descriptor: UnaccentDescriptor,
  signal?: AbortSignal,
): Promise<{ readonly completion: "committed"; readonly value: UnaccentDictionaryFacts }> {
  const checked = requirement(descriptor);
  return withExtensionOperation(
    connectionString,
    async (context) => {
      await acquireExtensionLock(context.client, signal);
      const observed = await captureExtensionContract(context.client, {
        name: "unaccent",
        provider: manifest.contract.provider,
        fixture: "unaccent-dictionary-restoration",
      });
      if (observed.digest !== manifest.digest || observed.provenance.installationSchema !== checked.reference.schema)
        throw new Error("Unaccent restoration SQL contract or namespace mismatch");
      const graph = await captureExtensionTextSearch(context.client, observed, {
        provider: manifest.contract.provider,
        fixture: "unaccent-dictionary-restoration",
      });
      validateExtensionTextSearchCapture(graph, manifest);
      if (graph.provenance.installationSchema !== checked.reference.schema)
        throw new Error("Unaccent restoration graph namespace mismatch");
      return () =>
        context.run(async () => {
          const facts = await change(context, checked.reference.schema, "set", checked.reference, "unaccent");
          await verifyExtensionApiContracts(context.client, [checked.requirement]);
          return facts;
        });
    },
    (restore) => restore(),
    signal,
  );
}
