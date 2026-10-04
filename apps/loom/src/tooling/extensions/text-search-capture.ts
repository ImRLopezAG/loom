import { createHash } from "node:crypto";
import type pg from "pg";
import * as v from "valibot";
import type { ExtensionManifest, ExtensionMember } from "../../core/extensions/contracts";
import { validateExtensionManifest } from "../../core/extensions/registry";
import { extensionMembershipCte } from "../migrations/extension-membership";

const token = v.pipe(v.string(), v.minLength(1));
const digest = v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/));
export const extensionTextSearchContractValidator = v.strictObject({
  extension: token,
  postgresMajor: v.pipe(v.number(), v.integer()),
  version: token,
  provider: token,
  manifestDigest: digest,
  dictionaries: v.array(v.strictObject({ id: token, template: token, options: v.nullable(v.string()) })),
  templates: v.array(v.strictObject({ id: token, init: v.nullable(token), lexize: v.nullable(token) })),
});
const provenanceValidator = v.strictObject({
  capturedAt: token,
  fixture: token,
  source: v.literal("pg_catalog"),
  collector: v.literal("loom:text-search-capture:1"),
  serverVersion: token,
  installationSchema: token,
  dictionaryOwners: v.array(v.strictObject({ id: token, owner: token })),
});
export const extensionTextSearchCaptureValidator = v.strictObject({
  format: v.literal(1),
  contract: extensionTextSearchContractValidator,
  provenance: provenanceValidator,
  digest,
});
export type ExtensionTextSearchContract = v.InferOutput<typeof extensionTextSearchContractValidator>;
export type ExtensionTextSearchCapture = v.InferOutput<typeof extensionTextSearchCaptureValidator>;
export type ExtensionTextSearchProvenance = v.InferOutput<typeof provenanceValidator>;

function textSearchProfile(contract: ExtensionManifest["contract"]) {
  const { extension, version, postgresMajor } = contract;
  if (
    postgresMajor !== 18 ||
    !((extension === "unaccent" && version === "1.1") || (extension === "dict_int" && version === "1.0"))
  )
    throw new Error("Text-search capture requires an exact reviewed PostgreSQL 18 extension profile");
  const dictionaryName = extension === "unaccent" ? "unaccent" : "intdict";
  const templateName = extension === "unaccent" ? "unaccent" : "intdict_template";
  const initName = extension === "unaccent" ? "unaccent_init" : "dintdict_init";
  const lexizeName = extension === "unaccent" ? "unaccent_lexize" : "dintdict_lexize";
  const namespace = `$extension:${extension}`;
  const dictionaryId = `text search dictionary:"${namespace}".${dictionaryName}`;
  const templateId = `text search template:"${namespace}".${templateName}`;
  const initId = `routine:${namespace}.${initName}(pg_catalog.internal)`;
  const lexizeId = `routine:${namespace}.${lexizeName}(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)`;
  const memberIds = [dictionaryId, templateId, initId, lexizeId];
  if (extension === "unaccent")
    memberIds.push(
      "routine:$extension:unaccent.unaccent(pg_catalog.text)",
      "routine:$extension:unaccent.unaccent(pg_catalog.regdictionary,pg_catalog.text)",
    );
  return {
    extension,
    namespace,
    dictionaryName,
    templateName,
    initName,
    lexizeName,
    dictionaryId,
    templateId,
    initId,
    lexizeId,
    memberIds,
  };
}

function pointerCallback(member: ExtensionMember | undefined, namespace: string, name: string, arity: number) {
  return (
    member?.kind === "routine" &&
    member.namespace === namespace &&
    member.name === name &&
    member.ownership === "direct" &&
    member.routineKind === "function" &&
    !member.returnsSet &&
    member.returns.namespace === "pg_catalog" &&
    member.returns.name === "internal" &&
    member.arguments.length === arity &&
    member.arguments.every(
      (argument) =>
        argument.mode === "in" &&
        !argument.hasDefault &&
        argument.type.namespace === "pg_catalog" &&
        argument.type.name === "internal",
    ) &&
    member.variadic === null &&
    member.aggregate === null
  );
}

function validateSource(source: ExtensionManifest) {
  const manifest = validateExtensionManifest(source);
  const contract = manifest.contract;
  const profile = textSearchProfile(contract);
  const { dictionaryId, templateId, initId, lexizeId, memberIds } = profile;
  if (
    contract.members.length !== memberIds.length ||
    memberIds.some((id) => !contract.members.some((member) => member.id === id))
  )
    throw new Error("Text-search source manifest must contain its exact reviewed members");
  for (const [id, objectType, name] of [
    [dictionaryId, "text search dictionary", profile.dictionaryName],
    [templateId, "text search template", profile.templateName],
  ]) {
    const member = contract.members.find((entry) => entry.id === id);
    if (
      member?.kind !== "other" ||
      member.objectType !== objectType ||
      member.name !== name ||
      member.namespace !== profile.namespace ||
      member.ownership !== "direct" ||
      member.identity !== `"${profile.namespace}".${name}`
    )
      throw new Error("Invalid captured extension text-search member");
  }
  if (
    !pointerCallback(
      contract.members.find((member) => member.id === initId),
      profile.namespace,
      profile.initName,
      1,
    ) ||
    !pointerCallback(
      contract.members.find((member) => member.id === lexizeId),
      profile.namespace,
      profile.lexizeName,
      4,
    )
  )
    throw new Error("Text-search source callbacks must have their exact captured internal signatures");
  return manifest;
}

function canonicalContract(source: ExtensionManifest, input: ExtensionTextSearchContract) {
  const manifest = validateSource(source);
  const { dictionaryId, templateId, initId, lexizeId } = textSearchProfile(manifest.contract);
  const contract = v.parse(extensionTextSearchContractValidator, input);
  if (
    contract.extension !== manifest.contract.extension ||
    contract.postgresMajor !== manifest.contract.postgresMajor ||
    contract.version !== manifest.contract.version ||
    contract.provider !== manifest.contract.provider ||
    contract.manifestDigest !== manifest.digest
  )
    throw new Error("Text-search capture source manifest/profile mismatch");
  if (contract.dictionaries.length !== 1 || contract.templates.length !== 1)
    throw new Error("Text-search capture requires exactly one dictionary and one template");
  const dictionary = contract.dictionaries[0];
  const template = contract.templates[0];
  if (
    dictionary?.id !== dictionaryId ||
    dictionary.template !== templateId ||
    template?.id !== templateId ||
    template.init !== initId ||
    template.lexize !== lexizeId
  )
    throw new Error("Missing or changed extension dictionary/template callback relationship");
  return contract;
}

function contractDigest(contract: ExtensionTextSearchContract) {
  return createHash("sha256").update(JSON.stringify(contract)).digest("hex");
}

/** Supplementary symbolic facts only: source manifests and their historical digests are never rewritten. */
export function createExtensionTextSearchCapture(
  source: ExtensionManifest,
  input: ExtensionTextSearchContract,
  provenance: ExtensionTextSearchProvenance,
): ExtensionTextSearchCapture {
  const contract = canonicalContract(source, input);
  const { dictionaryId } = textSearchProfile(source.contract);
  const observed = v.parse(provenanceValidator, provenance);
  if (observed.dictionaryOwners.length !== 1 || observed.dictionaryOwners[0]?.id !== dictionaryId)
    throw new Error("Missing or foreign text-search dictionary owner provenance");
  return v.parse(extensionTextSearchCaptureValidator, {
    format: 1,
    contract,
    provenance: observed,
    digest: contractDigest(contract),
  });
}

export function validateExtensionTextSearchCapture(input: ExtensionTextSearchCapture, source: ExtensionManifest) {
  const artifact = v.parse(extensionTextSearchCaptureValidator, input);
  const normalized = createExtensionTextSearchCapture(source, artifact.contract, artifact.provenance);
  if (artifact.digest !== normalized.digest) throw new Error("Text-search capture digest mismatch");
  return normalized;
}

const ownedObject = {
  name: token,
  namespace: token,
  owners: v.array(token),
};
const typeReference = v.strictObject({ namespace: token, name: token });
const routineValidator = v.strictObject({
  ...ownedObject,
  arguments: v.array(typeReference),
  returns: typeReference,
  kind: token,
  returnsSet: v.boolean(),
});
const snapshotValidator = v.strictObject({
  installed: v.array(v.strictObject({ name: token, version: token, namespace: token })),
  postgresMajor: v.number(),
  serverVersion: token,
  dictionaries: v.array(
    v.strictObject({
      ...ownedObject,
      owner: token,
      options: v.nullable(v.string()),
      template: v.nullable(v.strictObject(ownedObject)),
    }),
  ),
  templates: v.array(
    v.strictObject({
      ...ownedObject,
      init: v.nullable(routineValidator),
      lexize: v.nullable(routineValidator),
    }),
  ),
});

/** One read-only snapshot resolves actual dictionary/template pointers before discarding all live OIDs. */
const captureSql = `WITH RECURSIVE ${extensionMembershipCte},
  owned AS (SELECT DISTINCT classid,objid FROM members WHERE extension=$1 AND objsubid=0),
  ownership AS (SELECT classid,objid,jsonb_agg(extension ORDER BY extension) AS owners
    FROM roots WHERE objsubid=0 GROUP BY classid,objid),
  templates AS (SELECT t.*,n.nspname AS namespace,w.owners FROM pg_ts_template t
    JOIN pg_namespace n ON n.oid=t.tmplnamespace
    JOIN owned o ON o.classid='pg_ts_template'::regclass AND o.objid=t.oid
    LEFT JOIN ownership w ON w.classid='pg_ts_template'::regclass AND w.objid=t.oid),
  callbacks AS (SELECT p.oid,jsonb_build_object('name',p.proname,'namespace',n.nspname,
    'owners',COALESCE(w.owners,'[]'::jsonb),'kind',p.prokind,'returnsSet',p.proretset,
    'arguments',COALESCE((SELECT jsonb_agg(jsonb_build_object('namespace',tn.nspname,'name',ty.typname) ORDER BY a.ordinal)
      FROM unnest(p.proargtypes::oid[]) WITH ORDINALITY a(typeoid,ordinal)
      JOIN pg_type ty ON ty.oid=a.typeoid JOIN pg_namespace tn ON tn.oid=ty.typnamespace),'[]'::jsonb),
    'returns',jsonb_build_object('namespace',rn.nspname,'name',rt.typname)) AS callback
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    JOIN pg_type rt ON rt.oid=p.prorettype JOIN pg_namespace rn ON rn.oid=rt.typnamespace
    LEFT JOIN ownership w ON w.classid='pg_proc'::regclass AND w.objid=p.oid
    WHERE p.oid IN (SELECT tmplinit FROM templates UNION SELECT tmpllexize FROM templates))
SELECT jsonb_build_object(
  'installed',(SELECT COALESCE(jsonb_agg(jsonb_build_object('name',e.extname,'version',e.extversion,'namespace',n.nspname)),'[]'::jsonb)
    FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname=$1),
  'postgresMajor',current_setting('server_version_num')::integer/10000,'serverVersion',current_setting('server_version'),
  'dictionaries',(SELECT COALESCE(jsonb_agg(jsonb_build_object('name',d.dictname,'namespace',n.nspname,
    'owners',COALESCE(w.owners,'[]'::jsonb),'owner',pg_get_userbyid(d.dictowner),'options',d.dictinitoption,
    'template',CASE WHEN t.oid IS NULL THEN NULL ELSE jsonb_build_object('name',t.tmplname,'namespace',tn.nspname,
      'owners',COALESCE(tw.owners,'[]'::jsonb)) END)),'[]'::jsonb)
    FROM pg_ts_dict d JOIN owned o ON o.classid='pg_ts_dict'::regclass AND o.objid=d.oid
    JOIN pg_namespace n ON n.oid=d.dictnamespace
    LEFT JOIN ownership w ON w.classid='pg_ts_dict'::regclass AND w.objid=d.oid
    LEFT JOIN pg_ts_template t ON t.oid=d.dicttemplate LEFT JOIN pg_namespace tn ON tn.oid=t.tmplnamespace
    LEFT JOIN ownership tw ON tw.classid='pg_ts_template'::regclass AND tw.objid=t.oid),
  'templates',(SELECT COALESCE(jsonb_agg(jsonb_build_object('name',t.tmplname,'namespace',t.namespace,
    'owners',COALESCE(t.owners,'[]'::jsonb),'init',(SELECT callback FROM callbacks WHERE oid=t.tmplinit),
    'lexize',(SELECT callback FROM callbacks WHERE oid=t.tmpllexize))),'[]'::jsonb) FROM templates t)
) AS snapshot`;

function requireOwned(
  object: { name: string; namespace: string; owners: string[] } | null,
  schema: string,
  extension: string,
) {
  if (!object || object.namespace !== schema || object.owners.length !== 1 || object.owners[0] !== extension)
    throw new Error("Missing, foreign or cross-schema text-search catalogue reference");
  return object;
}

export type ExtensionTextSearchCaptureOptions = { provider: string; fixture: string; capturedAt?: string };

/** Caller owns the direct connection. The supplied provider profile is a claim, not authentication. */
export async function captureExtensionTextSearch(
  client: Pick<pg.Client, "query">,
  source: ExtensionManifest,
  options: ExtensionTextSearchCaptureOptions,
): Promise<ExtensionTextSearchCapture> {
  const manifest = validateSource(source);
  const profile = textSearchProfile(manifest.contract);
  const { dictionaryId, templateId } = profile;
  if (options.provider !== manifest.contract.provider) throw new Error("Text-search capture provider profile mismatch");
  const result = await client.query<{ snapshot: v.InferInput<typeof snapshotValidator> }>(captureSql, [
    manifest.contract.extension,
  ]);
  const snapshot = v.parse(snapshotValidator, result.rows[0]?.snapshot);
  const installed = snapshot.installed[0];
  if (
    snapshot.postgresMajor !== 18 ||
    snapshot.installed.length !== 1 ||
    installed?.name !== manifest.contract.extension ||
    installed.version !== manifest.contract.version
  )
    throw new Error("Text-search capture requires the exact installed PostgreSQL 18 extension profile");
  if (snapshot.dictionaries.length !== 1 || snapshot.templates.length !== 1)
    throw new Error("Missing or duplicate extension-owned text-search dictionary/template");
  const dictionary = snapshot.dictionaries[0];
  const template = snapshot.templates[0];
  if (!dictionary || !template) throw new Error("Missing text-search dictionary/template");
  requireOwned(dictionary, installed.namespace, profile.extension);
  requireOwned(template, installed.namespace, profile.extension);
  const target = requireOwned(dictionary.template, installed.namespace, profile.extension);
  if (
    dictionary.name !== profile.dictionaryName ||
    template.name !== profile.templateName ||
    target.name !== template.name
  )
    throw new Error("Changed dictionary/template relationship");
  const callbackId = (callback: v.InferOutput<typeof routineValidator> | null) => {
    requireOwned(callback, installed.namespace, profile.extension);
    if (
      !callback ||
      callback.kind !== "f" ||
      callback.returnsSet ||
      callback.returns.namespace !== "pg_catalog" ||
      callback.returns.name !== "internal"
    )
      throw new Error("Changed text-search callback signature");
    return `routine:${profile.namespace}.${callback.name}(${callback.arguments.map((argument) => `${argument.namespace}.${argument.name}`).join(",")})`;
  };
  return createExtensionTextSearchCapture(
    manifest,
    {
      extension: installed.name,
      postgresMajor: snapshot.postgresMajor,
      version: installed.version,
      provider: options.provider,
      manifestDigest: manifest.digest,
      dictionaries: [{ id: dictionaryId, template: templateId, options: dictionary.options }],
      templates: [{ id: templateId, init: callbackId(template.init), lexize: callbackId(template.lexize) }],
    },
    {
      capturedAt: options.capturedAt ?? new Date().toISOString(),
      fixture: options.fixture,
      source: "pg_catalog",
      collector: "loom:text-search-capture:1",
      serverVersion: snapshot.serverVersion,
      installationSchema: installed.namespace,
      dictionaryOwners: [{ id: dictionaryId, owner: dictionary.owner }],
    },
  );
}
