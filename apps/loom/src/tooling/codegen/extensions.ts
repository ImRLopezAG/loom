import manifest0 from "../extensions/manifests/address_standardizer.json";
import manifest1 from "../extensions/manifests/address_standardizer_data_us.json";
import manifest2 from "../extensions/manifests/anon.json";
import manifest3 from "../extensions/manifests/autoinc.json";
import manifest4 from "../extensions/manifests/bloom.json";
import manifest5 from "../extensions/manifests/btree_gin.json";
import manifest6 from "../extensions/manifests/btree_gist.json";
import manifest7 from "../extensions/manifests/citext.json";
import manifest8 from "../extensions/manifests/cube.json";
import manifest9 from "../extensions/manifests/dblink.json";
import manifest10 from "../extensions/manifests/dict_int.json";
import manifest11 from "../extensions/manifests/earthdistance.json";
import manifest12 from "../extensions/manifests/fuzzystrmatch.json";
import manifest13 from "../extensions/manifests/h3.json";
import manifest14 from "../extensions/manifests/h3_postgis.json";
import manifest15 from "../extensions/manifests/hll.json";
import manifest16 from "../extensions/manifests/hstore.json";
import manifest17 from "../extensions/manifests/hypopg.json";
import manifest18 from "../extensions/manifests/insert_username.json";
import manifest19 from "../extensions/manifests/intagg.json";
import manifest20 from "../extensions/manifests/intarray.json";
import manifest21 from "../extensions/manifests/ip4r.json";
import manifest22 from "../extensions/manifests/isn.json";
import manifest23 from "../extensions/manifests/lakebase_text.json";
import manifest24 from "../extensions/manifests/lakebase_tokenizer.json";
import manifest25 from "../extensions/manifests/lakebase_vector.json";
import manifest26 from "../extensions/manifests/lo.json";
import manifest27 from "../extensions/manifests/ltree.json";
import manifest28 from "../extensions/manifests/moddatetime.json";
import manifest29 from "../extensions/manifests/neon.json";
import manifest30 from "../extensions/manifests/neon_utils.json";
import manifest31 from "../extensions/manifests/pg_cron.json";
import manifest32 from "../extensions/manifests/pg_graphql.json";
import manifest33 from "../extensions/manifests/pg_hashids.json";
import manifest34 from "../extensions/manifests/pg_hint_plan.json";
import manifest35 from "../extensions/manifests/pg_jsonschema.json";
import manifest36 from "../extensions/manifests/pg_partman.json";
import manifest37 from "../extensions/manifests/pg_prewarm.json";
import manifest38 from "../extensions/manifests/pg_repack.json";
import manifest39 from "../extensions/manifests/pg_session_jwt.json";
import manifest40 from "../extensions/manifests/pg_stat_statements.json";
import manifest41 from "../extensions/manifests/pg_tiktoken.json";
import manifest42 from "../extensions/manifests/pg_trgm.json";
import manifest43 from "../extensions/manifests/pg_uuidv7.json";
import manifest44 from "../extensions/manifests/pgcrypto.json";
import manifest45 from "../extensions/manifests/pgjwt.json";
import manifest46 from "../extensions/manifests/pgrouting.json";
import manifest47 from "../extensions/manifests/pgrowlocks.json";
import manifest48 from "../extensions/manifests/pgstattuple.json";
import manifest49 from "../extensions/manifests/pgtap.json";
import manifest50 from "../extensions/manifests/pgx_ulid.json";
import manifest51 from "../extensions/manifests/plpgsql_check.json";
import manifest52 from "../extensions/manifests/postgis.json";
import manifest53 from "../extensions/manifests/postgis_raster.json";
import manifest54 from "../extensions/manifests/postgis_sfcgal.json";
import manifest55 from "../extensions/manifests/postgis_tiger_geocoder.json";
import manifest56 from "../extensions/manifests/postgis_topology.json";
import manifest57 from "../extensions/manifests/postgres_fdw.json";
import manifest58 from "../extensions/manifests/prefix.json";
import manifest59 from "../extensions/manifests/rdkit.json";
import manifest60 from "../extensions/manifests/refint.json";
import manifest61 from "../extensions/manifests/roaringbitmap.json";
import manifest62 from "../extensions/manifests/seg.json";
import manifest63 from "../extensions/manifests/semver.json";
import manifest64 from "../extensions/manifests/tablefunc.json";
import manifest65 from "../extensions/manifests/tcn.json";
import manifest66 from "../extensions/manifests/timescaledb.json";
import manifest67 from "../extensions/manifests/tsm_system_rows.json";
import manifest68 from "../extensions/manifests/tsm_system_time.json";
import manifest69 from "../extensions/manifests/unaccent.json";
import manifest70 from "../extensions/manifests/uuid-ossp.json";
import manifest71 from "../extensions/manifests/vector.json";
import manifest72 from "../extensions/manifests/xml2.json";
import { resolveExtensionContract } from "../../core/extensions/registry";
import * as v from "valibot";
import { extensionManifestValidator } from "../../core/extensions/contracts";
import type { ExtensionSelection, ExtensionApiSupport } from "../../core/extensions/bindings";

const manifests = {
  address_standardizer: manifest0,
  address_standardizer_data_us: manifest1,
  anon: manifest2,
  autoinc: manifest3,
  bloom: manifest4,
  btree_gin: manifest5,
  btree_gist: manifest6,
  citext: manifest7,
  cube: manifest8,
  dblink: manifest9,
  dict_int: manifest10,
  earthdistance: manifest11,
  fuzzystrmatch: manifest12,
  h3: manifest13,
  h3_postgis: manifest14,
  hll: manifest15,
  hstore: manifest16,
  hypopg: manifest17,
  insert_username: manifest18,
  intagg: manifest19,
  intarray: manifest20,
  ip4r: manifest21,
  isn: manifest22,
  lakebase_text: manifest23,
  lakebase_tokenizer: manifest24,
  lakebase_vector: manifest25,
  lo: manifest26,
  ltree: manifest27,
  moddatetime: manifest28,
  neon: manifest29,
  neon_utils: manifest30,
  pg_cron: manifest31,
  pg_graphql: manifest32,
  pg_hashids: manifest33,
  pg_hint_plan: manifest34,
  pg_jsonschema: manifest35,
  pg_partman: manifest36,
  pg_prewarm: manifest37,
  pg_repack: manifest38,
  pg_session_jwt: manifest39,
  pg_stat_statements: manifest40,
  pg_tiktoken: manifest41,
  pg_trgm: manifest42,
  pg_uuidv7: manifest43,
  pgcrypto: manifest44,
  pgjwt: manifest45,
  pgrouting: manifest46,
  pgrowlocks: manifest47,
  pgstattuple: manifest48,
  pgtap: manifest49,
  pgx_ulid: manifest50,
  plpgsql_check: manifest51,
  postgis: manifest52,
  postgis_raster: manifest53,
  postgis_sfcgal: manifest54,
  postgis_tiger_geocoder: manifest55,
  postgis_topology: manifest56,
  postgres_fdw: manifest57,
  prefix: manifest58,
  rdkit: manifest59,
  refint: manifest60,
  roaringbitmap: manifest61,
  seg: manifest62,
  semver: manifest63,
  tablefunc: manifest64,
  tcn: manifest65,
  timescaledb: manifest66,
  tsm_system_rows: manifest67,
  tsm_system_time: manifest68,
  unaccent: manifest69,
  "uuid-ossp": manifest70,
  vector: manifest71,
  xml2: manifest72,
};

// These digests identify the contracts reviewed by each executable adapter.
// A refreshed capture alone cannot widen the generated API's acceptance.
const adapters = [
  {
    name: "pg_uuidv7",
    version: "1.6",
    digest: "f6723e0d29a7ea7a57a7655eebd254c072d1101c19049450863b21337ca7b396",
    factory: "createPgUuidv7_1_6",
    module: "loom/extensions/pg-uuidv7",
  },
  {
    name: "citext",
    version: "1.8",
    digest: "bf50ef209f828f5cbd517fe1a5f0b1ede7f1bbeac379b75c0b2bc02bf0a8eee3",
    factory: "createCitext_1_8",
    module: "loom/extensions/citext",
  },
  {
    name: "uuid-ossp",
    version: "1.1",
    digest: "6961935a6844d9e8007d1d391a2deb0dc766e070e15ad0d4687134b46c4b7796",
    factory: "createUuidOssp_1_1",
    module: "loom/extensions/uuid-ossp",
  },
  {
    name: "pg_jsonschema",
    version: "0.3.4",
    digest: "7a61cf1dd9bcb37e3704e5cb9c5cc92258815f6dddf6a869bd9c6434a66da138",
    factory: "createPgJsonschema_0_3_4",
    module: "loom/extensions/pg-jsonschema",
  },
  {
    name: "pg_trgm",
    version: "1.6",
    digest: "88e35b55b09e58d6a59847390006ca73483bdb4444346474beb644c63adcbe66",
    factory: "createPgTrgm_1_6",
    module: "loom/extensions/pg-trgm",
  },
  {
    name: "fuzzystrmatch",
    version: "1.2",
    digest: "0607e044d263e8999732df67f96cfb29479f6811db8b4df674acf3c9c9d16961",
    factory: "createFuzzystrmatch_1_2",
    module: "loom/extensions/fuzzystrmatch",
  },
  {
    name: "pg_tiktoken",
    version: "0.0.1",
    digest: "c4a9c741b544948caca1dd481dad068b48dcd9fb6665edfbe5d02163418b6163",
    factory: "createPgTiktoken_0_0_1",
    module: "loom/extensions/pg-tiktoken",
  },
] as const;

/** Shared virtual/disk emitter: this output must remain schema, server, and config independent. */
export function extensionBindingsSource(selection: ExtensionSelection): string {
  if (!selection || !Object.values(selection).some((entry) => entry !== undefined))
    return "export const selection = undefined;\nexport const extensions = undefined;\n";
  const support: Record<string, ExtensionApiSupport> = {};
  const imports: string[] = [];
  const bindings: string[] = [];
  for (const [name, entry] of Object.entries(selection)) {
    if (!entry) continue;
    const input = Object.entries(manifests).find(([extension]) => extension === name)?.[1];
    const manifest = input ? v.parse(extensionManifestValidator, input) : undefined;
    const resolution = resolveExtensionContract(manifest ? [manifest] : [], {
      name,
      version: entry.version,
      postgresMajor: 18,
      provider: "neon",
    });
    const descriptor = `descriptors[${JSON.stringify(name)}]`;
    let binding = descriptor;
    if (resolution.status === "verified") {
      const fixed = resolution.manifest.contract.installation.fixedSchema;
      if (fixed && fixed !== entry.schema)
        throw new Error(
          `Extension ${name} ${entry.version} requires fixed installation schema ${fixed}; configured ${entry.schema}`,
        );
      const adapter = adapters.find(
        (candidate) =>
          candidate.name === name &&
          candidate.version === entry.version &&
          candidate.digest === resolution.manifest.digest,
      );
      if (adapter) {
        support[name] = { status: "verified", digest: adapter.digest };
        imports.push(`import { ${adapter.factory} } from ${JSON.stringify(adapter.module)};`);
        binding = `${adapter.factory}(${descriptor})`;
      } else
        support[name] = { status: "unverified", reason: "SQL contract captured; typed API adapter acceptance pending" };
    } else support[name] = { status: "unverified", reason: resolution.reason };
    bindings.push(`  ${JSON.stringify(name)}: ${binding},`);
  }
  return `import { createExtensionBindings } from "loom/server";\n${imports.length ? imports.join("\n") + "\n" : ""}export const selection = ${JSON.stringify(selection)} as const;\nconst descriptors = createExtensionBindings(selection, ${JSON.stringify(support)});\nexport const extensions = Object.freeze({\n${bindings.join("\n")}\n});\n`;
}
