import { h3PostgisAnnotations } from "../extensions/annotations/h3-postgis";
import { lakebaseVectorAnnotations } from "../extensions/annotations/lakebase-vector";
import { pgroutingAnnotations } from "../extensions/annotations/pgrouting";
import { pgHashidsAnnotations } from "../extensions/annotations/pg-hashids";
import { pgtapAnnotations } from "../extensions/annotations/pgtap";
import { postgisRasterAnnotations } from "../extensions/annotations/postgis_raster";
import { postgisTigerGeocoderAnnotations } from "../extensions/annotations/postgis_tiger_geocoder";
import { lakebaseTokenizerAnnotations } from "../extensions/annotations/lakebase_tokenizer";
import { lakebaseTextAnnotations } from "../extensions/annotations/lakebase-text";
import { addressStandardizerDataUsAnnotations } from "../extensions/annotations/address-standardizer-data-us";
import { timescaledbAnnotations } from "../extensions/annotations/timescaledb";
import { pgRepackAnnotations } from "../extensions/annotations/pg_repack";
import { postgisAnnotations } from "../extensions/annotations/postgis";
import { postgisSfcgalAnnotations } from "../extensions/annotations/postgis_sfcgal";
import { postgisTopologyAnnotations } from "../extensions/annotations/postgis-topology";
import { rdkitAnnotations } from "../extensions/annotations/rdkit";
import { addressStandardizerAnnotations } from "../extensions/annotations/address-standardizer";
import { pgCronAnnotations } from "../extensions/annotations/pg_cron";
import { pgPartmanAnnotations } from "../extensions/annotations/pg_partman";
import { neonAnnotations } from "../extensions/annotations/neon";
import { neonUtilsAnnotations } from "../extensions/annotations/neon_utils";
import { hypopgAnnotations } from "../extensions/annotations/hypopg";
import { btreeGistAnnotations } from "../extensions/annotations/btree_gist";
import type pg from "pg";
import * as v from "valibot";
import { canonical } from "../../core/validation/canonical";
import { json } from "../../core/validation/encoding";
import type { ExtensionMember, ExtensionTypeReference } from "../../core/extensions/contracts";
import { resolveSelectedExtension } from "../codegen/extensions";
import { verifyExtensionApiContracts } from "../extensions/verify";
import { cubeAnnotations } from "../extensions/annotations/cube";
import { dblinkAnnotations } from "../extensions/annotations/dblink";
import { xml2Annotations } from "../extensions/annotations/xml2";
import { tablefuncAnnotations } from "../extensions/annotations/tablefunc";
import { pgGraphqlAnnotations } from "../extensions/annotations/pg_graphql";
import { ip4rAnnotations } from "../extensions/annotations/ip4r";
import { h3Annotations } from "../extensions/annotations/h3";
import { bloomAnnotations } from "../extensions/annotations/bloom";
import { btreeGinAnnotations } from "../extensions/annotations/btree_gin";
import { intarrayAnnotations } from "../extensions/annotations/intarray";
import { isnAnnotations } from "../extensions/annotations/isn";
import { postgresFdwAnnotations } from "../extensions/annotations/postgres_fdw";
import { hllAnnotations } from "../extensions/annotations/hll";
import { prefixAnnotations } from "../extensions/annotations/prefix";
import { semverAnnotations } from "../extensions/annotations/semver";
import { pgxUlidAnnotations } from "../extensions/annotations/pgx-ulid";
import { roaringbitmapAnnotations } from "../extensions/annotations/roaringbitmap";
import { earthdistanceAnnotations } from "../extensions/annotations/earthdistance";
import { segAnnotations } from "../extensions/annotations/seg";
import { insertUsernameAnnotations } from "../extensions/annotations/insert-username";
import { refintAnnotations } from "../extensions/annotations/refint";
import { tcnAnnotations } from "../extensions/annotations/tcn";
import { loAnnotations } from "../extensions/annotations/lo";
import { pgPrewarmAnnotations } from "../extensions/annotations/pg_prewarm";
import { anonAnnotations } from "../extensions/annotations/anon";
import { plpgsqlCheckAnnotations } from "../extensions/annotations/plpgsql_check";
import { pgStatStatementsAnnotations } from "../extensions/annotations/pg_stat_statements";
import { pgHintPlanAnnotations } from "../extensions/annotations/pg_hint_plan";
import { pgJwtAnnotations } from "../extensions/annotations/pgjwt";
import { pgSessionJwtAnnotations } from "../extensions/annotations/pg_session_jwt";
import { intaggAnnotations } from "../extensions/annotations/intagg";
import { dictIntAnnotations } from "../extensions/annotations/dict_int";
import { autoincAnnotations } from "../extensions/annotations/autoinc";
import { moddatetimeAnnotations } from "../extensions/annotations/moddatetime";
import { pgstattupleAnnotations } from "../extensions/annotations/pgstattuple";
import { pgrowlocksAnnotations } from "../extensions/annotations/pgrowlocks";
import { tsmSystemRowsAnnotations } from "../extensions/annotations/tsm-system-rows";
import { tsmSystemTimeAnnotations } from "../extensions/annotations/tsm-system-time";
import { hstoreAnnotations } from "../extensions/annotations/hstore";
import { citextAnnotations } from "../extensions/annotations/citext";
import { pgTrgmAnnotations } from "../extensions/annotations/pg-trgm";
import { fuzzystrmatchAnnotations } from "../extensions/annotations/fuzzystrmatch";
import { ltreeAnnotations } from "../extensions/annotations/ltree";
import { uuidOsspAnnotations } from "../extensions/annotations/uuid-ossp";
import { pgUuidv7Annotations } from "../extensions/annotations/pg-uuidv7";
import { pgJsonschemaAnnotations } from "../extensions/annotations/pg-jsonschema";
import { pgTiktokenAnnotations } from "../extensions/annotations/pg-tiktoken";
import { pgcryptoAnnotations } from "../extensions/annotations/pgcrypto";
import { unaccentAnnotations } from "../extensions/annotations/unaccent";
import type { ExtensionMemberCoverage } from "../extensions/coverage";
import { validateRequiredApi } from "./required-api";
import type { RequiredApi } from "./required-api";

const roleName = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => !value.includes("\0") && Buffer.byteLength(value, "utf8") <= 63),
);
const permissionRows = v.pipe(v.array(v.strictObject({ allowed: v.boolean() })), v.length(1));
const reviewed = {
  lakebase_vector: lakebaseVectorAnnotations,
  pgrouting: pgroutingAnnotations,
  pg_hashids: pgHashidsAnnotations,
  pgtap: pgtapAnnotations,
  postgis_raster: postgisRasterAnnotations,
  postgis_tiger_geocoder: postgisTigerGeocoderAnnotations,
  lakebase_tokenizer: lakebaseTokenizerAnnotations,
  lakebase_text: lakebaseTextAnnotations,
  address_standardizer_data_us: addressStandardizerDataUsAnnotations,
  timescaledb: timescaledbAnnotations,

  pg_repack: pgRepackAnnotations,
  postgis: postgisAnnotations,
  postgis_sfcgal: postgisSfcgalAnnotations,
  postgis_topology: postgisTopologyAnnotations,
  rdkit: rdkitAnnotations,
  address_standardizer: addressStandardizerAnnotations,
  pg_cron: pgCronAnnotations,
  neon: neonAnnotations,
  pg_partman: pgPartmanAnnotations,
  neon_utils: neonUtilsAnnotations,
  hypopg: hypopgAnnotations,
  btree_gist: btreeGistAnnotations,
  semver: semverAnnotations,
  roaringbitmap: roaringbitmapAnnotations,
  pgx_ulid: pgxUlidAnnotations,
  hll: hllAnnotations,
  prefix: prefixAnnotations,
  intarray: intarrayAnnotations,
  isn: isnAnnotations,
  postgres_fdw: postgresFdwAnnotations,
  xml2: xml2Annotations,
  tablefunc: tablefuncAnnotations,
  pg_graphql: pgGraphqlAnnotations,
  ip4r: ip4rAnnotations,
  h3: h3Annotations,
  bloom: bloomAnnotations,
  btree_gin: btreeGinAnnotations,
  earthdistance: earthdistanceAnnotations,
  h3_postgis: h3PostgisAnnotations,
  seg: segAnnotations,
  insert_username: insertUsernameAnnotations,
  refint: refintAnnotations,
  tcn: tcnAnnotations,
  lo: loAnnotations,
  pg_prewarm: pgPrewarmAnnotations,
  anon: anonAnnotations,
  plpgsql_check: plpgsqlCheckAnnotations,
  pg_stat_statements: pgStatStatementsAnnotations,
  pg_hint_plan: pgHintPlanAnnotations,
  pgjwt: pgJwtAnnotations,
  pg_session_jwt: pgSessionJwtAnnotations,
  cube: cubeAnnotations,
  dblink: dblinkAnnotations,
  intagg: intaggAnnotations,
  dict_int: dictIntAnnotations,
  autoinc: autoincAnnotations,
  moddatetime: moddatetimeAnnotations,
  pgstattuple: pgstattupleAnnotations,
  pgrowlocks: pgrowlocksAnnotations,
  tsm_system_rows: tsmSystemRowsAnnotations,
  tsm_system_time: tsmSystemTimeAnnotations,
  hstore: hstoreAnnotations,
  citext: citextAnnotations,
  pg_trgm: pgTrgmAnnotations,
  fuzzystrmatch: fuzzystrmatchAnnotations,
  ltree: ltreeAnnotations,
  "uuid-ossp": uuidOsspAnnotations,
  pg_uuidv7: pgUuidv7Annotations,
  pg_jsonschema: pgJsonschemaAnnotations,
  pg_tiktoken: pgTiktokenAnnotations,
  pgcrypto: pgcryptoAnnotations,
  unaccent: unaccentAnnotations,
} satisfies Readonly<Record<string, readonly Pick<ExtensionMemberCoverage, "id" | "disposition">[]>>;

function identity(member: ExtensionMember): string {
  // Effective ACLs belong to the named role, while PUBLIC ACL remains part of native structural equality.
  const memberContract = member.kind === "routine" ? { ...member, publicExecute: undefined } : member;
  return canonical(v.parse(json, JSON.parse(JSON.stringify(memberContract))));
}

function publicMembers(payload: RequiredApi) {
  return payload.apis.map((api) => {
    const contract = api.manifest.contract;
    const support = resolveSelectedExtension(contract.extension, { version: contract.version, schema: api.schema });
    const annotations: readonly Pick<ExtensionMemberCoverage, "id" | "disposition">[] | undefined = Object.entries(
      reviewed,
    ).find(([name]) => name === contract.extension)?.[1];
    if (!support.manifest || !annotations)
      throw new Error(`No reviewed runtime API privilege contract: ${contract.extension} ${contract.version}`);
    if (support.textSearch?.digest !== api.textSearch?.digest)
      throw new Error(`Required text-search contract lacks a reviewed matching pin: ${contract.extension}`);
    const accepted = new Map(support.manifest.contract.members.map((member) => [member.id, member]));
    const stored = new Map(contract.members.map((member) => [member.id, member]));
    const members = annotations.flatMap((annotation) => {
      if (annotation.disposition !== "query" && annotation.disposition !== "schema") return [];
      const member = stored.get(annotation.id);
      const expected = accepted.get(annotation.id);
      if (!member || !expected || identity(member) !== identity(expected))
        throw new Error(`Required public member lacks a reviewed matching contract: ${annotation.id}`);
      return [member];
    });
    return { api, members };
  });
}

function quoted(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}

// oxlint-disable-next-line anti-slop/no-unknown-parameters -- Strictly parses untrusted persisted target evidence before lifecycle mutation or catalogue I/O.
export function validateRequiredApiForTarget(input: unknown): RequiredApi {
  const payload = validateRequiredApi(input);
  publicMembers(payload);
  return payload;
}

type RequiredPrivilege =
  | { readonly kind: "routine"; readonly id: string; readonly signature: string }
  | { readonly kind: "type"; readonly id: string; readonly signature: string }
  | {
      readonly kind: "operator";
      readonly id: string;
      readonly schema: string;
      readonly name: string;
      readonly left: string | null;
      readonly right: string | null;
    };

/** Catalogue equality and named-role privileges are separate fresh observations on the owned session. */
export async function verifyRequiredApiOnTarget(
  client: Pick<pg.Client, "query">,
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- The owned-session verification boundary strictly parses all target evidence before native I/O.
  input: unknown,
  runtimeRole: string,
): Promise<void> {
  const payload = validateRequiredApi(input);
  const requirements = publicMembers(payload);
  const role = v.parse(roleName, runtimeRole);
  const placements = new Map(payload.apis.map((api) => [api.manifest.contract.extension, api.schema]));
  function namespace(symbol: string | null): string {
    if (!symbol) throw new Error("Missing required native member namespace");
    if (!symbol.startsWith("$extension:")) return symbol;
    const placement = placements.get(symbol.slice("$extension:".length));
    if (!placement) throw new Error(`Missing required symbolic extension placement: ${symbol}`);
    return placement;
  }
  function type(reference: ExtensionTypeReference): string {
    return `${quoted(namespace(reference.namespace))}.${quoted(reference.name)}`;
  }
  // Resolve all symbolic identities before any catalogue I/O.
  const required = requirements.map(({ api, members }) => ({
    schema: api.schema,
    namespaces: [
      ...new Set([api.schema, ...members.flatMap((member) => (member.namespace ? [namespace(member.namespace)] : []))]),
    ],
    members: members.flatMap<RequiredPrivilege>((member) => {
      if (member.kind === "routine") {
        const argumentsList = member.arguments
          .filter((argument) => argument.mode !== "out" && argument.mode !== "table")
          .map((argument) => type(argument.type));
        return [
          {
            kind: "routine",
            id: member.id,
            signature: `${quoted(namespace(member.namespace))}.${quoted(member.name)}(${argumentsList.join(",")})`,
          },
        ];
      }
      if (member.kind === "operator") {
        return [
          {
            kind: "operator",
            id: member.id,
            schema: namespace(member.namespace),
            name: member.name,
            left: member.left ? type(member.left) : null,
            right: member.right ? type(member.right) : null,
          },
        ];
      }
      if (member.kind === "type")
        return [
          { kind: "type", id: member.id, signature: `${quoted(namespace(member.namespace))}.${quoted(member.name)}` },
        ];
      return [];
    }),
  }));
  await verifyExtensionApiContracts(client, payload.apis);
  async function permission(statement: string, values: readonly (string | null)[], privilege: string, member: string) {
    const observed = v.parse(permissionRows, (await client.query(statement, [...values])).rows);
    if (!observed[0]?.allowed) throw new Error(`Required runtime role ${privilege} denied: ${role} ${member}`);
  }
  for (const scope of required) {
    for (const schema of scope.namespaces)
      await permission(
        "SELECT COALESCE((SELECT pg_catalog.has_schema_privilege($1::name,n.oid,'USAGE') FROM pg_catalog.pg_namespace n WHERE n.nspname=$2),false) AS allowed",
        [role, schema],
        "USAGE",
        schema,
      );
    for (const member of scope.members) {
      if (member.kind === "routine")
        await permission(
          "SELECT COALESCE(pg_catalog.has_function_privilege($1::name,pg_catalog.to_regprocedure($2)::oid,'EXECUTE'),false) AS allowed",
          [role, member.signature],
          "EXECUTE",
          member.id,
        );
      else if (member.kind === "type")
        await permission(
          "SELECT COALESCE(pg_catalog.has_type_privilege($1::name,pg_catalog.to_regtype($2)::oid,'USAGE'),false) AS allowed",
          [role, member.signature],
          "USAGE",
          member.id,
        );
      else
        await permission(
          "SELECT COALESCE((SELECT pg_catalog.has_function_privilege($1::name,o.oprcode::oid,'EXECUTE') FROM pg_catalog.pg_operator o JOIN pg_catalog.pg_namespace n ON n.oid=o.oprnamespace WHERE n.nspname=$2 AND o.oprname=$3 AND o.oprleft=COALESCE(pg_catalog.to_regtype($4)::oid,0::oid) AND o.oprright=COALESCE(pg_catalog.to_regtype($5)::oid,0::oid)),false) AS allowed",
          [role, member.schema, member.name, member.left, member.right],
          "EXECUTE",
          member.id,
        );
    }
  }
}
