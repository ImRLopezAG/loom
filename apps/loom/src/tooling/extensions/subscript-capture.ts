import { createHash } from "node:crypto";
import type pg from "pg";
import * as v from "valibot";
import type { ExtensionManifest, ExtensionMember } from "../../core/extensions/contracts";
import { validateExtensionManifest } from "../../core/extensions/registry";
import { extensionMembershipCte } from "../migrations/extension-membership";

const token = v.pipe(v.string(), v.minLength(1));
const digest = v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/));
export const extensionSubscriptContractValidator = v.strictObject({
  extension: token,
  postgresMajor: v.pipe(v.number(), v.integer()),
  version: token,
  provider: token,
  manifestDigest: digest,
  types: v.array(v.strictObject({ id: token, handler: v.nullable(token) })),
});
const provenanceValidator = v.strictObject({
  capturedAt: token,
  fixture: token,
  source: v.literal("pg_catalog"),
  collector: v.literal("loom:subscript-capture:1"),
  serverVersion: token,
  installationSchema: token,
});
export const extensionSubscriptCaptureValidator = v.strictObject({
  format: v.literal(1),
  contract: extensionSubscriptContractValidator,
  provenance: provenanceValidator,
  digest,
});
export type ExtensionSubscriptContract = v.InferOutput<typeof extensionSubscriptContractValidator>;
export type ExtensionSubscriptCapture = v.InferOutput<typeof extensionSubscriptCaptureValidator>;
export type ExtensionSubscriptProvenance = v.InferOutput<typeof provenanceValidator>;

const typeId = (name: string) => `type:$extension:hstore.${name}`;
const extensionHandlerId = "routine:$extension:hstore.hstore_subscript_handler(pg_catalog.internal)";
const arrayHandlerId = "routine:pg_catalog.array_subscript_handler(pg_catalog.internal)";
/** Reviewed hstore 1.8 relationships, sorted by exact member ID: scalar callback, native array callbacks, none for ghstore. */
const expectedTypes = [
  { id: typeId("_ghstore"), handler: arrayHandlerId },
  { id: typeId("_hstore"), handler: arrayHandlerId },
  { id: typeId("ghstore"), handler: null },
  { id: typeId("hstore"), handler: extensionHandlerId },
];
const expectedArrays = [
  { scalar: "hstore", array: "_hstore" },
  { scalar: "ghstore", array: "_ghstore" },
];

function compareIds(left: string, right: string) {
  if (left < right) return -1;
  return left > right ? 1 : 0;
}

function typeMember(contract: ExtensionManifest["contract"], name: string): ExtensionMember | undefined {
  return contract.members.find((member) => member.id === typeId(name));
}

function validateSource(source: ExtensionManifest) {
  const manifest = validateExtensionManifest(source);
  const contract = manifest.contract;
  if (contract.extension !== "hstore" || contract.postgresMajor !== 18 || contract.version !== "1.8")
    throw new Error("Subscript capture requires the hstore 1.8 PostgreSQL 18 source manifest");
  for (const { id } of expectedTypes) {
    const member = contract.members.find((entry) => entry.id === id);
    if (
      member?.kind !== "type" ||
      member.namespace !== "$extension:hstore" ||
      member.ownership !== "direct" ||
      member.typeKind !== "b" ||
      id !== typeId(member.name)
    )
      throw new Error("Subscript source manifest must contain the four exact direct hstore types");
  }
  for (const { scalar: scalarName, array: arrayName } of expectedArrays) {
    const scalar = typeMember(contract, scalarName);
    const element = typeMember(contract, arrayName);
    if (
      scalar?.kind !== "type" ||
      element?.kind !== "type" ||
      scalar.array?.namespace !== "$extension:hstore" ||
      scalar.array.name !== arrayName ||
      element.element?.namespace !== "$extension:hstore" ||
      element.element.name !== scalarName
    )
      throw new Error("Subscript source manifest must keep the captured hstore array relationships");
  }
  const handler = contract.members.find((member) => member.id === extensionHandlerId);
  if (
    handler?.kind !== "routine" ||
    handler.namespace !== "$extension:hstore" ||
    handler.name !== "hstore_subscript_handler" ||
    handler.ownership !== "direct" ||
    handler.routineKind !== "function" ||
    handler.returnsSet ||
    handler.returns.namespace !== "pg_catalog" ||
    handler.returns.name !== "internal" ||
    handler.arguments.length !== 1 ||
    handler.arguments.some(
      (argument) =>
        argument.mode !== "in" ||
        argument.hasDefault ||
        argument.type.namespace !== "pg_catalog" ||
        argument.type.name !== "internal",
    ) ||
    handler.defaults !== null ||
    handler.variadic !== null ||
    handler.aggregate !== null
  )
    throw new Error("Subscript source handler must have its exact captured internal signature");
  return manifest;
}

function canonicalContract(source: ExtensionManifest, input: ExtensionSubscriptContract): ExtensionSubscriptContract {
  const manifest = validateSource(source);
  const contract = v.parse(extensionSubscriptContractValidator, input);
  if (
    contract.extension !== manifest.contract.extension ||
    contract.postgresMajor !== manifest.contract.postgresMajor ||
    contract.version !== manifest.contract.version ||
    contract.provider !== manifest.contract.provider ||
    contract.manifestDigest !== manifest.digest
  )
    throw new Error("Subscript capture source manifest/profile mismatch");
  const types = [...contract.types].sort((left, right) => compareIds(left.id, right.id));
  if (types.length !== expectedTypes.length || types.some((entry, index) => entry.id !== expectedTypes[index]?.id))
    throw new Error("Subscript capture requires exactly the four captured hstore types");
  if (types.some((entry, index) => entry.handler !== expectedTypes[index]?.handler))
    throw new Error("Missing or changed hstore subscripting handler relationship");
  return { ...contract, types };
}

function contractDigest(contract: ExtensionSubscriptContract) {
  return createHash("sha256").update(JSON.stringify(contract)).digest("hex");
}

/** Supplementary symbolic facts only: source manifests and their historical digests are never rewritten. */
export function createExtensionSubscriptCapture(
  source: ExtensionManifest,
  input: ExtensionSubscriptContract,
  provenance: ExtensionSubscriptProvenance,
): ExtensionSubscriptCapture {
  const contract = canonicalContract(source, input);
  const observed = v.parse(provenanceValidator, provenance);
  return v.parse(extensionSubscriptCaptureValidator, {
    format: 1,
    contract,
    provenance: observed,
    digest: contractDigest(contract),
  });
}

export function validateExtensionSubscriptCapture(input: ExtensionSubscriptCapture, source: ExtensionManifest) {
  const artifact = v.parse(extensionSubscriptCaptureValidator, input);
  const normalized = createExtensionSubscriptCapture(source, artifact.contract, artifact.provenance);
  if (artifact.digest !== normalized.digest) throw new Error("Subscript capture digest mismatch");
  return normalized;
}

const typeReference = v.strictObject({ namespace: token, name: token });
const handlerValidator = v.strictObject({
  name: token,
  namespace: token,
  owners: v.array(token),
  kind: token,
  returnsSet: v.boolean(),
  hasDefaults: v.boolean(),
  variadic: v.boolean(),
  outputArguments: v.boolean(),
  arguments: v.array(typeReference),
  returns: typeReference,
});
const snapshotValidator = v.strictObject({
  installed: v.array(v.strictObject({ name: token, version: token, namespace: token })),
  postgresMajor: v.number(),
  serverVersion: token,
  types: v.array(
    v.strictObject({
      name: token,
      namespace: token,
      owners: v.array(token),
      state: v.picklist(["none", "resolved", "dangling"]),
      handler: v.nullable(handlerValidator),
    }),
  ),
});
type ExtensionSubscriptSnapshot = v.InferInput<typeof snapshotValidator>;

/**
 * One read-only snapshot joins each owned type's actual typsubscript pointer to its callback by OID and
 * discards every live OID. Pointer zero (none) is reported explicitly; a nonzero pointer without a callback
 * row is reported as dangling. No handler is invoked: subscripting handlers are native method tables.
 */
const captureSql = `WITH RECURSIVE ${extensionMembershipCte},
  owned AS (SELECT DISTINCT classid,objid FROM members WHERE extension=$1 AND objsubid=0),
  ownership AS (SELECT classid,objid,jsonb_agg(extension ORDER BY extension) AS owners
    FROM roots WHERE objsubid=0 GROUP BY classid,objid)
SELECT jsonb_build_object(
  'installed',(SELECT COALESCE(jsonb_agg(jsonb_build_object('name',e.extname,'version',e.extversion,'namespace',n.nspname)),'[]'::jsonb)
    FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname=$1),
  'postgresMajor',current_setting('server_version_num')::integer/10000,'serverVersion',current_setting('server_version'),
  'types',(SELECT COALESCE(jsonb_agg(jsonb_build_object('name',t.typname,'namespace',n.nspname,
    'owners',COALESCE(w.owners,'[]'::jsonb),
    'state',CASE WHEN t.typsubscript::oid=0 THEN 'none' WHEN p.oid IS NULL THEN 'dangling' ELSE 'resolved' END,
    'handler',CASE WHEN p.oid IS NULL THEN NULL ELSE jsonb_build_object('name',p.proname,'namespace',pn.nspname,
      'owners',COALESCE(pw.owners,'[]'::jsonb),'kind',p.prokind,'returnsSet',p.proretset,
      'hasDefaults',p.pronargdefaults>0,'variadic',p.provariadic<>0,
      'outputArguments',COALESCE((SELECT bool_or(m<>'i') FROM unnest(p.proargmodes) m),false),
      'arguments',COALESCE((SELECT jsonb_agg(jsonb_build_object('namespace',tn.nspname,'name',ty.typname) ORDER BY a.ordinal)
        FROM unnest(p.proargtypes::oid[]) WITH ORDINALITY a(typeoid,ordinal)
        JOIN pg_type ty ON ty.oid=a.typeoid JOIN pg_namespace tn ON tn.oid=ty.typnamespace),'[]'::jsonb),
      'returns',(SELECT jsonb_build_object('namespace',rn.nspname,'name',rt.typname)
        FROM pg_type rt JOIN pg_namespace rn ON rn.oid=rt.typnamespace WHERE rt.oid=p.prorettype)) END)
    ORDER BY n.nspname,t.typname),'[]'::jsonb)
    FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
    JOIN owned o ON o.classid='pg_type'::regclass AND o.objid=t.oid
    LEFT JOIN ownership w ON w.classid='pg_type'::regclass AND w.objid=t.oid
    LEFT JOIN pg_proc p ON p.oid=t.typsubscript::oid
    LEFT JOIN pg_namespace pn ON pn.oid=p.pronamespace
    LEFT JOIN ownership pw ON pw.classid='pg_proc'::regclass AND pw.objid=p.oid)
) AS snapshot`;

export type ExtensionSubscriptCaptureOptions = { provider: string; fixture: string; capturedAt?: string };

function handlerId(handler: v.InferOutput<typeof handlerValidator>, schema: string) {
  const internal = (reference: { namespace: string; name: string }) =>
    reference.namespace === "pg_catalog" && reference.name === "internal";
  if (
    handler.kind !== "f" ||
    handler.returnsSet ||
    handler.hasDefaults ||
    handler.variadic ||
    handler.outputArguments ||
    !internal(handler.returns) ||
    handler.arguments.length !== 1 ||
    !handler.arguments.every(internal)
  )
    throw new Error("Changed subscript handler signature");
  if (handler.owners.length === 1 && handler.owners[0] === "hstore" && handler.namespace === schema)
    return `routine:$extension:hstore.${handler.name}(pg_catalog.internal)`;
  if (handler.owners.length === 0 && handler.namespace === "pg_catalog")
    return `routine:pg_catalog.${handler.name}(pg_catalog.internal)`;
  throw new Error("Missing, foreign or cross-schema subscript handler catalogue reference");
}

/** Interpret a native catalogue snapshot against the reviewed relationships. */
function resolveExtensionSubscriptSnapshot(
  source: ExtensionManifest,
  input: ExtensionSubscriptSnapshot,
  options: ExtensionSubscriptCaptureOptions,
): ExtensionSubscriptCapture {
  const manifest = validateSource(source);
  if (options.provider !== manifest.contract.provider) throw new Error("Subscript capture provider profile mismatch");
  const snapshot = v.parse(snapshotValidator, input);
  const installed = snapshot.installed[0];
  if (
    snapshot.postgresMajor !== 18 ||
    snapshot.installed.length !== 1 ||
    installed?.name !== "hstore" ||
    installed.version !== "1.8"
  )
    throw new Error("Subscript capture requires installed hstore 1.8 on PostgreSQL 18");
  if (snapshot.types.length !== expectedTypes.length)
    throw new Error("Subscript capture requires exactly the four extension-owned hstore types");
  const types = snapshot.types.map((type) => {
    if (type.namespace !== installed.namespace || type.owners.length !== 1 || type.owners[0] !== "hstore")
      throw new Error("Missing, foreign or cross-schema subscript type catalogue reference");
    if (type.state === "dangling") throw new Error("Dangling subscript handler reference");
    if (type.state === "none" && !type.handler) return { id: typeId(type.name), handler: null };
    if (!type.handler || type.state === "none") throw new Error("Inconsistent subscript handler catalogue row");
    return { id: typeId(type.name), handler: handlerId(type.handler, installed.namespace) };
  });
  return createExtensionSubscriptCapture(
    manifest,
    {
      extension: installed.name,
      postgresMajor: snapshot.postgresMajor,
      version: installed.version,
      provider: options.provider,
      manifestDigest: manifest.digest,
      types,
    },
    {
      capturedAt: options.capturedAt ?? new Date().toISOString(),
      fixture: options.fixture,
      source: "pg_catalog",
      collector: "loom:subscript-capture:1",
      serverVersion: snapshot.serverVersion,
      installationSchema: installed.namespace,
    },
  );
}

/** Caller owns the direct connection. The supplied provider profile is a claim, not authentication. */
export async function captureExtensionSubscript(
  client: Pick<pg.Client, "query">,
  source: ExtensionManifest,
  options: ExtensionSubscriptCaptureOptions,
): Promise<ExtensionSubscriptCapture> {
  const manifest = validateSource(source);
  if (options.provider !== manifest.contract.provider) throw new Error("Subscript capture provider profile mismatch");
  const result = await client.query<{ snapshot: ExtensionSubscriptSnapshot }>(captureSql, [
    manifest.contract.extension,
  ]);
  const row = result.rows[0];
  if (result.rows.length !== 1 || !row) throw new Error("Subscript capture requires exactly one catalogue snapshot");
  return resolveExtensionSubscriptSnapshot(manifest, row.snapshot, options);
}
