import pg from "pg";
import * as v from "valibot";
import {
  createLakebaseTokenizer_0_1_1,
  lakebaseTokenizerOptionsValidator,
  type LakebaseTokenizerDescriptor,
  type LakebaseTokenizerOptions,
} from "../../../core/extensions/adapters/lakebase_tokenizer";
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
import source from "../manifests/lakebase_tokenizer.json";

const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, source));
const options = {
  lowercase: "Lowercase",
  normalize: "Normalize",
  englishPossessive: "EnglishPossessive",
  stripAccents: "StripAccents",
  stopwords: "Stopwords",
  synonyms: "Synonyms",
  stemmer: "Stemmer",
} as const;
const dictionaryRow = v.strictObject({
  schema: v.string(),
  name: v.string(),
  templateSchema: v.string(),
  templateName: v.literal("tokenizer_wholeword"),
  owner: v.string(),
  options: v.nullable(v.string()),
});
const stopwordRow = v.strictObject({ name: v.string(), word: v.string() });
const synonymRow = v.strictObject({ name: v.string(), word: v.string(), synonym: v.string() });
export interface LakebaseTokenizerMaintenance {
  readonly dictionaries: readonly DictionaryReference[];
  readonly dictionaryCache: "reloaded";
  readonly storedVectors: "regeneration-required";
  readonly dependentIndexes: "review-after-vector-regeneration";
}
export type LakebaseTokenizerDictionaryFacts = v.InferOutput<typeof dictionaryRow>;
export interface LakebaseTokenizerOperations {
  readonly inspectDictionary: (reference: DictionaryReference) => Promise<LakebaseTokenizerDictionaryFacts>;
  readonly inspectTemplate: () => Promise<{
    readonly schema: string;
    readonly name: "tokenizer_wholeword";
    readonly init: string;
    readonly lexize: string;
  }>;
  readonly createDictionary: (
    reference: DictionaryReference,
    options?: LakebaseTokenizerOptions,
  ) => Promise<LakebaseTokenizerDictionaryFacts>;
  readonly alterDictionary: (
    reference: DictionaryReference,
    options: LakebaseTokenizerOptions,
  ) => Promise<LakebaseTokenizerMaintenance>;
  readonly reloadDictionary: (reference: DictionaryReference) => Promise<LakebaseTokenizerMaintenance>;
  readonly listStopwords: (name: string) => Promise<readonly v.InferOutput<typeof stopwordRow>[]>;
  readonly listSynonyms: (name: string) => Promise<readonly v.InferOutput<typeof synonymRow>[]>;
  readonly replaceStopwords: (name: string, words: readonly string[]) => Promise<LakebaseTokenizerMaintenance>;
  readonly replaceSynonyms: (
    name: string,
    words: readonly { readonly word: string; readonly synonym: string }[],
  ) => Promise<LakebaseTokenizerMaintenance>;
}

function qualified(reference: DictionaryReference): string {
  const checked = v.parse(dictionaryReferenceValidator, reference);
  return `${pg.escapeIdentifier(checked.schema)}.${pg.escapeIdentifier(checked.name)}`;
}
function optionClause(input: LakebaseTokenizerOptions, creating: boolean): string {
  const checked = v.parse(lakebaseTokenizerOptionsValidator, input);
  return Object.entries(options)
    .flatMap(([key, name]) => {
      // SAFETY: options has exactly the validator's declared keys; the validator checked every value.
      const value = checked[key as keyof LakebaseTokenizerOptions];
      if (value === undefined || (creating && value === null)) return [];
      return [value === null ? name : `${name} = ${pg.escapeLiteral(String(value))}`];
    })
    .join(", ");
}

/** Reviewable native dictionary DDL, without connecting or executing token transformations. */
export function planLakebaseTokenizerDictionary(
  descriptor: LakebaseTokenizerDescriptor,
  reference: DictionaryReference,
  action: "create" | "alter" | "reload",
  input: LakebaseTokenizerOptions = {},
) {
  const api = createLakebaseTokenizer_0_1_1(descriptor);
  const target = qualified(reference);
  const clauses = optionClause(input, action === "create");
  if (action === "alter" && !clauses) throw new Error("Tokenizer ALTER needs at least one option");
  const statement =
    action === "create"
      ? `CREATE TEXT SEARCH DICTIONARY ${target} (TEMPLATE = ${pg.escapeIdentifier(api.template.schema)}.${pg.escapeIdentifier(api.template.name)}${clauses ? `, ${clauses}` : ""})`
      : `ALTER TEXT SEARCH DICTIONARY ${target} (${action === "reload" ? "dummy" : clauses})`;
  return Object.freeze({
    statement,
    storedVectors: action === "create" ? "unchanged" : "regeneration-required",
    dependentIndexes: action === "create" ? "unchanged" : "review-after-vector-regeneration",
  } as const);
}

async function inspectDictionary(context: ExtensionOperationContext, schema: string, reference: DictionaryReference) {
  const checked = v.parse(dictionaryReferenceValidator, reference);
  const result = await context.client.query(
    `SELECT dn.nspname AS schema, d.dictname AS name, tn.nspname AS "templateSchema", t.tmplname AS "templateName", pg_catalog.pg_get_userbyid(d.dictowner) AS owner, d.dictinitoption AS options
    FROM pg_catalog.pg_ts_dict d JOIN pg_catalog.pg_namespace dn ON dn.oid=d.dictnamespace
    JOIN pg_catalog.pg_ts_template t ON t.oid=d.dicttemplate JOIN pg_catalog.pg_namespace tn ON tn.oid=t.tmplnamespace
    WHERE dn.nspname=$1 AND d.dictname=$2`,
    [checked.schema, checked.name],
  );
  const [row] = v.parse(v.tuple([dictionaryRow]), result.rows);
  if (row.templateSchema !== schema) throw new Error("Dictionary uses a different tokenizer template");
  return row;
}

async function inspectTemplate(context: ExtensionOperationContext, schema: string) {
  const result = await context.client.query(
    `SELECT n.nspname AS schema, t.tmplname AS name, init.proname AS init, lexize.proname AS lexize,
    init.proargtypes::text AS "initArguments", lexize.proargtypes::text AS "lexizeArguments",
    init.prorettype='pg_catalog.internal'::pg_catalog.regtype AS "initInternal", lexize.prorettype='pg_catalog.internal'::pg_catalog.regtype AS "lexizeInternal"
    FROM pg_catalog.pg_ts_template t JOIN pg_catalog.pg_namespace n ON n.oid=t.tmplnamespace
    JOIN pg_catalog.pg_proc init ON init.oid=t.tmplinit JOIN pg_catalog.pg_proc lexize ON lexize.oid=t.tmpllexize
    WHERE n.nspname=$1 AND t.tmplname='tokenizer_wholeword'
      AND init.pronamespace=t.tmplnamespace AND lexize.pronamespace=t.tmplnamespace
      AND init.proargtypes=ARRAY['pg_catalog.internal'::pg_catalog.regtype]::oidvector
      AND lexize.proargtypes=ARRAY['pg_catalog.internal'::pg_catalog.regtype,'pg_catalog.internal'::pg_catalog.regtype,'pg_catalog.internal'::pg_catalog.regtype,'pg_catalog.internal'::pg_catalog.regtype]::oidvector`,
    [schema],
  );
  const [row] = v.parse(
    v.tuple([
      v.strictObject({
        schema: v.string(),
        name: v.literal("tokenizer_wholeword"),
        init: v.literal("lakebase_tokenizer_wholeword_init"),
        lexize: v.literal("lakebase_tokenizer_wholeword_lexize"),
        initArguments: v.string(),
        lexizeArguments: v.string(),
        initInternal: v.literal(true),
        lexizeInternal: v.literal(true),
      }),
    ]),
    result.rows,
  );
  return Object.freeze({ schema: row.schema, name: row.name, init: row.init, lexize: row.lexize });
}

function maintenance(dictionaries: readonly DictionaryReference[]): LakebaseTokenizerMaintenance {
  return Object.freeze({
    dictionaries: Object.freeze([...dictionaries]),
    dictionaryCache: "reloaded",
    storedVectors: "regeneration-required",
    dependentIndexes: "review-after-vector-regeneration",
  });
}

/** Explicit direct operator transaction. Never installs extensions or exposes writes through RPC bindings. */
export async function withLakebaseTokenizer<Result>(
  connectionString: string,
  descriptor: LakebaseTokenizerDescriptor,
  operation: (tokenizer: LakebaseTokenizerOperations) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{ readonly completion: "committed"; readonly value: Result }> {
  const api = createLakebaseTokenizer_0_1_1(descriptor);
  const requirement = validateExtensionApiRequirement({ schema: api.schema, manifest });
  return withExtensionOperation(
    connectionString,
    async (context) => {
      await acquireExtensionLock(context.client, signal);
      await verifyExtensionApiContracts(context.client, [requirement]);
      await inspectTemplate(context, api.schema);
      const table = (name: string) => `${pg.escapeIdentifier(api.schema)}.${pg.escapeIdentifier(name)}`;
      async function ddl(
        reference: DictionaryReference,
        action: "create" | "alter" | "reload",
        input?: LakebaseTokenizerOptions,
      ) {
        if (action !== "create") await inspectDictionary(context, api.schema, reference);
        const plan = planLakebaseTokenizerDictionary(descriptor, reference, action, input);
        const result = await context.client.query(plan.statement);
        if (result.command !== (action === "create" ? "CREATE" : "ALTER"))
          throw new Error("Tokenizer dictionary DDL was not acknowledged");
        return inspectDictionary(context, api.schema, reference);
      }
      // Set edits invalidate every dictionary using the selected template, including ones outside its installation schema.
      async function reloadAll(): Promise<LakebaseTokenizerMaintenance> {
        const result = await context.client.query(
          `SELECT dn.nspname AS schema, d.dictname AS name FROM pg_catalog.pg_ts_dict d
        JOIN pg_catalog.pg_namespace dn ON dn.oid=d.dictnamespace JOIN pg_catalog.pg_ts_template t ON t.oid=d.dicttemplate
        JOIN pg_catalog.pg_namespace tn ON tn.oid=t.tmplnamespace WHERE tn.nspname=$1 AND t.tmplname='tokenizer_wholeword' ORDER BY dn.nspname,d.dictname`,
          [api.schema],
        );
        const dictionaries = v
          .parse(v.array(v.strictObject({ schema: v.string(), name: v.string() })), result.rows)
          .map(dictionaryReference);
        for (const reference of dictionaries) await ddl(reference, "reload");
        return maintenance(dictionaries);
      }
      return Object.freeze({
        inspectDictionary: (reference: DictionaryReference) =>
          context.run(() => inspectDictionary(context, api.schema, reference)),
        inspectTemplate: () => context.run(() => inspectTemplate(context, api.schema)),
        createDictionary: (reference: DictionaryReference, input?: LakebaseTokenizerOptions) =>
          context.run(() => ddl(reference, "create", input)),
        alterDictionary: (reference: DictionaryReference, input: LakebaseTokenizerOptions) =>
          context.run(async () => {
            await ddl(reference, "alter", input);
            return maintenance([reference]);
          }),
        reloadDictionary: (reference: DictionaryReference) =>
          context.run(async () => {
            await ddl(reference, "reload");
            return maintenance([reference]);
          }),
        listStopwords: (name: string) =>
          context.run(async () =>
            v.parse(
              v.array(stopwordRow),
              (
                await context.client.query(
                  `SELECT name, word FROM ${table("lakebase_tokenizer_stopwords")} WHERE name=$1 ORDER BY word`,
                  [v.parse(v.string(), name)],
                )
              ).rows,
            ),
          ),
        listSynonyms: (name: string) =>
          context.run(async () =>
            v.parse(
              v.array(synonymRow),
              (
                await context.client.query(
                  `SELECT name, word, synonym FROM ${table("lakebase_tokenizer_synonyms")} WHERE name=$1 ORDER BY word`,
                  [v.parse(v.string(), name)],
                )
              ).rows,
            ),
          ),
        replaceStopwords: (name: string, words: readonly string[]) =>
          context.run(async () => {
            const set = v.parse(v.string(), name),
              checked = v.parse(v.array(v.string()), words);
            await context.client.query(`DELETE FROM ${table("lakebase_tokenizer_stopwords")} WHERE name=$1`, [set]);
            for (const word of checked)
              await context.client.query(
                `INSERT INTO ${table("lakebase_tokenizer_stopwords")} (name,word) VALUES ($1,$2)`,
                [set, word],
              );
            return reloadAll();
          }),
        replaceSynonyms: (name: string, words: readonly { readonly word: string; readonly synonym: string }[]) =>
          context.run(async () => {
            const set = v.parse(v.string(), name),
              checked = v.parse(v.array(v.strictObject({ word: v.string(), synonym: v.string() })), words);
            await context.client.query(`DELETE FROM ${table("lakebase_tokenizer_synonyms")} WHERE name=$1`, [set]);
            for (const { word, synonym } of checked)
              await context.client.query(
                `INSERT INTO ${table("lakebase_tokenizer_synonyms")} (name,word,synonym) VALUES ($1,$2,$3)`,
                [set, word, synonym],
              );
            return reloadAll();
          }),
      });
    },
    operation,
    signal,
  );
}
