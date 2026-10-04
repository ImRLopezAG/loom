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
import type { ExtensionSelection, ExtensionApiSupport, ExtensionSelectionEntry } from "../../core/extensions/bindings";
import type { ExtensionManifest } from "../../core/extensions/contracts";
import unaccentTextSearch from "../extensions/text-search-contracts/unaccent.json";
import dictIntTextSearch from "../extensions/text-search-contracts/dict_int.json";
import {
  extensionTextSearchCaptureValidator,
  validateExtensionTextSearchCapture,
  type ExtensionTextSearchCapture,
} from "../extensions/text-search-capture";

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
    name: "h3_postgis",
    version: "4.2.3",
    digest: "9803892394c3cec2d4305ca64a925baefbe37c9108e8bb2601c7f384575f481e",
    factory: "createH3Postgis_4_2_3",
    module: "kello/extensions/h3-postgis",
  },
  {
    name: "postgis_topology",
    version: "3.6.4",
    digest: "a935414ebe37f352b234da7634c9c3be407c13921a574dcef16ddbd52d9e922d",
    factory: "createPostgisTopology_3_6_4",
    module: "kello/extensions/postgis-topology",
  },
  {
    name: "lakebase_vector",
    version: "1.1.1",
    digest: "bfa194865eaeda1069f2743247af32e0609848bdee87f1565e17cefc231fec20",
    factory: "createLakebaseVector_1_1_1",
    module: "kello/extensions/lakebase-vector",
  },
  {
    name: "pgrouting",
    version: "3.8.0",
    digest: "853d0e847c740dc95f877297db1c3515a4ebac8f454a85b266ba20be7324ae4c",
    factory: "createPgrouting_3_8_0",
    module: "kello/extensions/pgrouting",
  },
  {
    name: "pg_hashids",
    version: "1.2.1",
    digest: "56a138e83f06ff23344a428d6486237eb9c875db35df970ceb4bcb60240a4041",
    factory: "createPgHashids_1_2_1",
    module: "kello/extensions/pg-hashids",
  },
  {
    name: "pgtap",
    version: "1.3.3",
    digest: "523551d08abe2fbfe43134af4271d798a324146a4a9765a20fc28cd2399f3344",
    factory: "createPgtap_1_3_3",
    module: "kello/extensions/pgtap",
  },
  {
    name: "postgis_raster",
    version: "3.6.4",
    digest: "8f7cd8fe4d832fcc153344cc70b5693f79fa29acb1a6b7f97c0c3de31943def2",
    factory: "createPostgisRaster_3_6_4",
    module: "kello/extensions/postgis-raster",
  },
  {
    name: "postgis_tiger_geocoder",
    version: "3.6.4",
    digest: "8afcc1fb470670f2a40780b473a8e35afe9172eb79cc8bab7391732503bfd966",
    factory: "createPostgisTigerGeocoder_3_6_4",
    module: "kello/extensions/postgis-tiger-geocoder",
  },
  {
    name: "lakebase_tokenizer",
    version: "0.1.1",
    digest: "b57e5d3240d67c933ba1a2665c2fd347f72df94f159f16a4d6c7ebeb8e7d7ef8",
    factory: "createLakebaseTokenizer_0_1_1",
    module: "kello/extensions/lakebase-tokenizer",
  },
  {
    name: "lakebase_text",
    version: "0.1.3",
    digest: "d565a607c3901c0b31f02d59f300ae0b3cf3b5c77bcdf7d06822489fc2d9f6fb",
    factory: "createLakebaseText_0_1_3",
    module: "kello/extensions/lakebase-text",
  },
  {
    name: "address_standardizer_data_us",
    version: "3.6.4",
    digest: "063cb37742a0baf3dd885cb96255db38daf06b13d3b75fd7232b81822a7f01d0",
    factory: "createAddressStandardizerDataUs_3_6_4",
    module: "kello/extensions/address-standardizer-data-us",
  },
  {
    name: "timescaledb",
    version: "2.24.0",
    digest: "cc3487ad909ac0c440eb343101dc7bd52ca4efe5997daf54720c255f6afd6f3f",
    factory: "createTimescaledb_2_24_0",
    module: "kello/extensions/timescaledb",
  },
  {
    name: "pg_repack",
    version: "1.5.2",
    digest: "9199927c1639ebed2a4403def3b2d81e78076865f20b9ad4b78e91c6e1bb5e32",
    factory: "createPgRepack_1_5_2",
    module: "kello/extensions/pg-repack",
  },
  {
    name: "postgis",
    version: "3.6.4",
    digest: "640e798698403a7115f41d3c4e5106917cef0f9dc896b6078f3bd068f3b60d29",
    factory: "createPostgis_3_6_4",
    module: "kello/extensions/postgis",
  },
  {
    name: "rdkit",
    version: "4.8.0",
    digest: "2dcfe3dc27aa808bb3b7ef565a362e829974f39145889aecfb4e73a67c7a0952",
    factory: "createRdkit_4_8_0",
    module: "kello/extensions/rdkit",
  },
  {
    name: "address_standardizer",
    version: "3.6.4",
    digest: "f59d9c3801428f5360f8279dd04c64d7a8c74ed9c58afb733d95399aacdc5cc1",
    factory: "createAddressStandardizer_3_6_4",
    module: "kello/extensions/address-standardizer",
  },
  {
    name: "pg_cron",
    version: "1.6",
    digest: "a5b37c25b617856dbc5afb7a7e1d409e362baf9a809ae384920cbe5b18acff4c",
    factory: "createPgCron_1_6",
    module: "kello/extensions/pg-cron",
  },
  {
    name: "pg_partman",
    version: "5.1.0",
    digest: "f7833b872d553ea877f41e6e15834e9e3bfb4a2cfd84f43e3ac4710188193555",
    factory: "createPgPartman_5_1_0",
    module: "kello/extensions/pg-partman",
  },
  {
    name: "neon",
    version: "1.25",
    digest: "1f2d339beee9dcc3c93fdc0856fb9c307a04d5937a00ad7174014604be39a09e",
    factory: "createNeon_1_25",
    module: "kello/extensions/neon",
  },
  {
    name: "neon_utils",
    version: "1.1",
    digest: "4ceac79f87c6c16fa8dea371b441d6a150f9d25db3244b9bac4cce0275f74cec",
    factory: "createNeonUtils_1_1",
    module: "kello/extensions/neon-utils",
  },
  {
    name: "hypopg",
    version: "1.4.3",
    digest: "cba16a038628eb85dd40262f5d657ecdb01f755a3bc1314e24098278ea441fff",
    factory: "createHypopg_1_4_3",
    module: "kello/extensions/hypopg",
  },
  {
    name: "pg_hint_plan",
    version: "1.8.0",
    digest: "925971596ead990ae9ce609d472072d944c6843361a47f0e97652e53f91a94b4",
    factory: "createPgHintPlan_1_8_0",
    module: "kello/extensions/pg-hint-plan",
  },
  {
    name: "btree_gist",
    version: "1.8",
    digest: "73fdb4831683ee8042ecbcd0d0639909650d018d6c7ca51bb85c1cb38de96072",
    factory: "createBtreeGist_1_8",
    module: "kello/extensions/btree-gist",
  },
  {
    name: "btree_gin",
    version: "1.3",
    digest: "c3c8db3d98f5b687408fa9feac34338a9ad5fc0308c713b709008cd5889b709e",
    factory: "createBtreeGin_1_3",
    module: "kello/extensions/btree-gin",
  },
  {
    name: "roaringbitmap",
    version: "1.2",
    digest: "967ad98be988b37be7f198057e9f02bcbe325a0eab5364722ba4c6763cbc406a",
    factory: "createRoaringbitmap_1_2",
    module: "kello/extensions/roaringbitmap",
  },
  {
    name: "isn",
    version: "1.3",
    digest: "570342dc61cc815ae91896f43c59a79150643b22f540681e6c82d89db6a5e9be",
    factory: "createIsn_1_3",
    module: "kello/extensions/isn",
  },
  {
    name: "semver",
    version: "0.40.0",
    digest: "5a21997dcf96a0af38e49bc1d9309905050a05f18e6afe15f37fb2a63722a86e",
    factory: "createSemver_0_40_0",
    module: "kello/extensions/semver",
  },
  {
    name: "pgx_ulid",
    version: "0.2.2",
    digest: "e2e491782b819b700106736a81ffa9922f24226e1d18ec02ce90931dcef0a60d",
    factory: "createPgxUlid_0_2_2",
    module: "kello/extensions/pgx-ulid",
  },
  {
    name: "hll",
    version: "2.21",
    digest: "44f6623b1b7a463ea7cb26fcd02b434cb33c36a4bd9edfe0397e2536f66f6b19",
    factory: "createHll_2_21",
    module: "kello/extensions/hll",
  },
  {
    name: "prefix",
    version: "1.2.0",
    digest: "954698fcbe5ada03bdf4bcbd9b22014e77570456f0d8471d4ca2bd99d75581a7",
    factory: "createPrefix_1_2_0",
    module: "kello/extensions/prefix",
  },
  {
    name: "intarray",
    version: "1.5",
    digest: "c71054bd4b390e4e0457bb83bbaeaaef426319c14d6f0563fecfb8758d3224f2",
    factory: "createIntarray_1_5",
    module: "kello/extensions/intarray",
  },
  {
    name: "xml2",
    version: "1.2",
    digest: "0353f94ca9d2e1f73f4a490e2a210a6412e88dd516028b44e9b81a59ff3fb03c",
    factory: "createXml2_1_2",
    module: "kello/extensions/xml2",
  },
  {
    name: "tablefunc",
    version: "1.0",
    digest: "08f54e73281a2592eddf0ac6f555ba1a0b3c0961fb7ab6eab05be90ab74b66d4",
    factory: "createTablefunc_1_0",
    module: "kello/extensions/tablefunc",
  },
  {
    name: "ip4r",
    version: "2.4",
    digest: "477396650c5a07dc747e68b59df1af6c2bd6a8de1f2b7aff640fd717e2eebca9",
    factory: "createIp4r_2_4",
    module: "kello/extensions/ip4r",
  },
  {
    name: "h3",
    version: "4.2.3",
    digest: "0402a89cff2876378a25b680936da0841125dc5d194c2dad6f006092914ffbaf",
    factory: "createH3_4_2_3",
    module: "kello/extensions/h3",
  },
  {
    name: "bloom",
    version: "1.0",
    digest: "e35e04e263d75f19673d2b1282a75b7975b74f201c7cd5dc8040188f54b06cc3",
    factory: "createBloom_1_0",
    module: "kello/extensions/bloom",
  },
  {
    name: "pg_session_jwt",
    version: "0.5.0",
    digest: "623c651ce14c1a66283624660e7588f073e56e92628ba73878a47c50150350d8",
    factory: "createPgSessionJwt_0_5_0",
    module: "kello/extensions/pg-session-jwt",
  },
  {
    name: "seg",
    version: "1.4",
    digest: "bba7c8f626ee6352397bd765ae103231780c7aa366ff9819bcf948ed22bd5fff",
    factory: "createSeg_1_4",
    module: "kello/extensions/seg",
  },
  {
    name: "earthdistance",
    version: "1.2",
    digest: "13bae0f141ff6fb7a7e4253e02958e7b6dd18c82db9b51c03bf12605df99fcd6",
    factory: "createEarthdistance_1_2",
    module: "kello/extensions/earthdistance",
  },
  {
    name: "insert_username",
    version: "1.0",
    digest: "1e0649029c558b2e3000544c8066e51f12288377fd520226476740e7b0d25c32",
    factory: "createInsertUsername_1_0",
    module: "kello/extensions/insert-username",
  },
  {
    name: "refint",
    version: "1.0",
    digest: "689cb4ce75e39aea52f0b19a522b1b35bb743a8fca286195e9fa98894fa49011",
    factory: "createRefint_1_0",
    module: "kello/extensions/refint",
  },
  {
    name: "tcn",
    version: "1.0",
    digest: "9e2c3a247e11851d4d598bef9c62c5a7e26ba585089bce5d7a71e2c2db548a8a",
    factory: "createTcn_1_0",
    module: "kello/extensions/tcn",
  },
  {
    name: "lo",
    version: "1.2",
    digest: "84324b728d596a8bdef3088c411f769edab611e4a4a776070372f5e890d96ba1",
    factory: "createLo_1_2",
    module: "kello/extensions/lo",
  },
  {
    name: "pg_prewarm",
    version: "1.2",
    digest: "58d63ed991a2a7dcbce44b574afc81295947387e81a64be88f635478e7bc6495",
    factory: "createPgPrewarm_1_2",
    module: "kello/extensions/pg-prewarm",
  },
  {
    name: "anon",
    version: "2.5.1",
    digest: "93a826ea74c64096e00ad172603b6b4d5ada6a842d50caa3cb4cc76374029878",
    factory: "createAnon_2_5_1",
    module: "kello/extensions/anon",
  },
  {
    name: "plpgsql_check",
    version: "2.8",
    digest: "ef00befd1f61c832689dc4d4b3ee3c21f03585eda686474bb5ec8efd8696e74a",
    factory: "createPlpgsqlCheck_2_8",
    module: "kello/extensions/plpgsql-check",
  },
  {
    name: "pg_stat_statements",
    version: "1.12",
    digest: "daba654d231ac86526c1f6feceed3e644d347c25d443b8bb6d2a02f98bdc5eb8",
    factory: "createPgStatStatements_1_12",
    module: "kello/extensions/pg-stat-statements",
  },
  {
    name: "postgres_fdw",
    version: "1.2",
    digest: "39b3195d0b34c96f9e424299e84a599dc7abb6f21bd48eccfcce08f3071db717",
    factory: "createPostgresFdw_1_2",
    module: "kello/extensions/postgres-fdw",
  },
  {
    name: "pgjwt",
    version: "0.2.0",
    digest: "a2d8b3ee4c390dd05716585a14c23acfebdb05bb3800a06cd72a48578dcabadd",
    factory: "createPgJwt_0_2_0",
    module: "kello/extensions/pgjwt",
  },
  {
    name: "cube",
    version: "1.5",
    digest: "205421c1cacc198ba7088c60ec4f76b0a8e7adec18be87d17a8082dd7b0515e2",
    factory: "createCube_1_5",
    module: "kello/extensions/cube",
  },
  {
    name: "dblink",
    version: "1.2",
    digest: "b713a9ca7a0e00853d0346b44e021c8c48372b5164b4b3f533c2b5022e37eba6",
    factory: "createDblink_1_2",
    module: "kello/extensions/dblink",
  },
  {
    name: "intagg",
    version: "1.1",
    digest: "7e9c80504c50e5a1910b61667a1774d8c1976c676c087c23fd744168986311f1",
    factory: "createIntagg_1_1",
    module: "kello/extensions/intagg",
  },
  {
    name: "dict_int",
    version: "1.0",
    digest: "1a745014cc5c4e94724c34d742b8fb154fe0852306dca4163cc307b8dca9e5da",
    factory: "createDictInt_1_0",
    module: "kello/extensions/dict-int",
  },
  {
    name: "autoinc",
    version: "1.0",
    digest: "bcd5ce0898658378ee20de54d2ca173811612f5d2c41c14345ed3eb9473403ee",
    factory: "createAutoinc_1_0",
    module: "kello/extensions/autoinc",
  },
  {
    name: "moddatetime",
    version: "1.0",
    digest: "bfaa16ea149d74d0f9e6c5a74144a0240ad18e0e02098a5f39f462c942ca68b6",
    factory: "createModdatetime_1_0",
    module: "kello/extensions/moddatetime",
  },
  {
    name: "pgstattuple",
    version: "1.5",
    digest: "6dd83523499b827ca6ba17e3af232cf28a46dded5819afef113fd37ff3913aec",
    factory: "createPgstattuple_1_5",
    module: "kello/extensions/pgstattuple",
  },
  {
    name: "pgrowlocks",
    version: "1.2",
    digest: "d14f05ab2ddaedb3b915bc6cbead50da7c1880dcaf2bf37a1e192d1a4a336f61",
    factory: "createPgrowlocks_1_2",
    module: "kello/extensions/pgrowlocks",
  },
  {
    name: "tsm_system_rows",
    version: "1.0",
    digest: "cb606ea0ec43b299ed4776aaeb12126165f751dbf9c5d40a974df6a8a7067eec",
    factory: "createTsmSystemRows_1_0",
    module: "kello/extensions/tsm-system-rows",
  },
  {
    name: "tsm_system_time",
    version: "1.0",
    digest: "70720316f9c0607be92e7948af63f27a96da580a8f492ce7a3a7d972b779af1f",
    factory: "createTsmSystemTime_1_0",
    module: "kello/extensions/tsm-system-time",
  },
  {
    name: "hstore",
    version: "1.8",
    digest: "cea995a9f416f391e531e262624a397016d7fc562ef1c78cb7247dd76d98daf1",
    factory: "createHstore_1_8",
    module: "kello/extensions/hstore",
  },
  {
    name: "vector",
    version: "0.8.6",
    digest: "4e6679e9277c11a3f26d1a920de5f4c1b5401f418c647402a9e611df4a6fb1e4",
    factory: "createVector_0_8_6",
    module: "kello/extensions/vector",
  },
  {
    name: "pgcrypto",
    version: "1.4",
    digest: "072f04b5bc20b5ed0051a35e8dd44ea29a924ae62ac73e590200254c4105d6b8",
    factory: "createPgcrypto_1_4",
    module: "kello/extensions/pgcrypto",
  },
  {
    name: "pg_uuidv7",
    version: "1.6",
    digest: "f6723e0d29a7ea7a57a7655eebd254c072d1101c19049450863b21337ca7b396",
    factory: "createPgUuidv7_1_6",
    module: "kello/extensions/pg-uuidv7",
  },
  {
    name: "citext",
    version: "1.8",
    digest: "bf50ef209f828f5cbd517fe1a5f0b1ede7f1bbeac379b75c0b2bc02bf0a8eee3",
    factory: "createCitext_1_8",
    module: "kello/extensions/citext",
  },
  {
    name: "uuid-ossp",
    version: "1.1",
    digest: "6961935a6844d9e8007d1d391a2deb0dc766e070e15ad0d4687134b46c4b7796",
    factory: "createUuidOssp_1_1",
    module: "kello/extensions/uuid-ossp",
  },
  {
    name: "pg_jsonschema",
    version: "0.3.4",
    digest: "7a61cf1dd9bcb37e3704e5cb9c5cc92258815f6dddf6a869bd9c6434a66da138",
    factory: "createPgJsonschema_0_3_4",
    module: "kello/extensions/pg-jsonschema",
  },
  {
    name: "pg_graphql",
    version: "1.5.12",
    digest: "a64a8bd702ab1dad6e9b171e6f5cc61ec54c2e31411da5d7c6aec86933538d5f",
    factory: "createPgGraphql_1_5_12",
    module: "kello/extensions/pg-graphql",
  },
  {
    name: "pg_trgm",
    version: "1.6",
    digest: "88e35b55b09e58d6a59847390006ca73483bdb4444346474beb644c63adcbe66",
    factory: "createPgTrgm_1_6",
    module: "kello/extensions/pg-trgm",
  },
  {
    name: "ltree",
    version: "1.3",
    digest: "f0d5b39c468e80a8748a7a35ed30af0e530da547c2c15ebcaee307e34090c82e",
    factory: "createLtree_1_3",
    module: "kello/extensions/ltree",
  },
  {
    name: "fuzzystrmatch",
    version: "1.2",
    digest: "0607e044d263e8999732df67f96cfb29479f6811db8b4df674acf3c9c9d16961",
    factory: "createFuzzystrmatch_1_2",
    module: "kello/extensions/fuzzystrmatch",
  },
  {
    name: "postgis_sfcgal",
    version: "3.6.4",
    digest: "a9f128c0489a24e8fa4bb0b35000570c2f8b1e6db26609863b9e4a24a1518c76",
    factory: "createPostgisSfcgal_3_6_4",
    module: "kello/extensions/postgis-sfcgal",
  },
  {
    name: "pg_tiktoken",
    version: "0.0.1",
    digest: "c4a9c741b544948caca1dd481dad068b48dcd9fb6665edfbe5d02163418b6163",
    factory: "createPgTiktoken_0_0_1",
    module: "kello/extensions/pg-tiktoken",
  },
  {
    name: "unaccent",
    version: "1.1",
    digest: "f983b4bfaa4c974c4ae2eba548249eb86d31d86376d019898b070ff66f9832dd",
    factory: "createUnaccent_1_1",
    module: "kello/extensions/unaccent",
  },
] as const;

interface SelectedExtensionResolution {
  readonly support: ExtensionApiSupport;
  readonly adapter?: (typeof adapters)[number];
  readonly manifest?: ExtensionManifest;
  readonly textSearch?: ExtensionTextSearchCapture;
}

/** One acceptance decision for generated bindings and persisted tooling evidence. */
export function resolveSelectedExtension(name: string, entry: ExtensionSelectionEntry): SelectedExtensionResolution {
  const input = Object.entries(manifests).find(([extension]) => extension === name)?.[1];
  const manifest = input ? v.parse(extensionManifestValidator, input) : undefined;
  const resolution = resolveExtensionContract(manifest ? [manifest] : [], {
    name,
    version: entry.version,
    postgresMajor: 18,
    provider: "neon",
  });
  if (resolution.status !== "verified") return { support: { status: "unverified", reason: resolution.reason } };
  if (name === "pgjwt" && (!entry.schema || /["$'\\\0]/.test(entry.schema)))
    throw new Error(
      "pgjwt installation schema cannot contain double quotes, dollar signs, single quotes or backslashes",
    );
  const fixed = resolution.manifest.contract.installation.fixedSchema;
  if (fixed && fixed !== entry.schema)
    throw new Error(
      `Extension ${name} ${entry.version} requires fixed installation schema ${fixed}; configured ${entry.schema}`,
    );
  const adapter = adapters.find(
    (candidate) =>
      candidate.name === name && candidate.version === entry.version && candidate.digest === resolution.manifest.digest,
  );
  if (!adapter)
    return { support: { status: "unverified", reason: "SQL contract captured; typed API adapter acceptance pending" } };
  const accepted: SelectedExtensionResolution = {
    support: { status: "verified", digest: adapter.digest },
    adapter,
    manifest: resolution.manifest,
  };
  const graph =
    adapter.name === "unaccent" ? unaccentTextSearch : adapter.name === "dict_int" ? dictIntTextSearch : undefined;
  if (!graph) return accepted;
  const textSearch = validateExtensionTextSearchCapture(
    v.parse(extensionTextSearchCaptureValidator, graph),
    resolution.manifest,
  );
  const graphDigest =
    adapter.name === "unaccent"
      ? "9bfba15f9043a004cea04315c1c52dec6ce8a19f4a5e828a369234ac1644ba2d"
      : "30d18d75bba47e968e7cb932340285fbb370bc1abd75caf9145dc17936d1a6b8";
  if (textSearch.digest !== graphDigest)
    throw new Error(`${adapter.name} generated API requires its exact reviewed text-search contract`);
  return { ...accepted, textSearch };
}

/** Shared virtual/disk emitter: this output must remain schema, server, and config independent. */
export function extensionBindingsSource(selection: ExtensionSelection): string {
  if (!selection || !Object.values(selection).some((entry) => entry !== undefined))
    return "export const selection = undefined;\nexport const extensions = undefined;\n";
  const jwt = selection.pgjwt;
  if (jwt && resolveSelectedExtension("pgjwt", jwt).adapter) {
    const crypto = selection.pgcrypto;
    if (!crypto) throw new Error("pgjwt requires an explicit pgcrypto version and schema in database.extensions");
    if (crypto.schema !== jwt.schema)
      throw new Error("pgjwt and pgcrypto require the same installation schema for native function resolution");
  }
  const earth = selection.earthdistance;
  if (earth && resolveSelectedExtension("earthdistance", earth).adapter) {
    const cube = selection.cube;
    if (!cube || resolveSelectedExtension("cube", cube).adapter?.name !== "cube")
      throw new Error("Earthdistance 1.2 requires an explicitly selected, reviewed Cube 1.5 dependency");
    if (/["$'\\]/.test(cube.schema))
      throw new Error(
        "Earthdistance Cube dependency schema cannot contain double quotes, dollar signs, single quotes or backslashes",
      );
  }
  const routing = selection.pgrouting;
  if (routing && resolveSelectedExtension("pgrouting", routing).adapter) {
    const postgis = selection.postgis;
    if (
      !postgis ||
      postgis.version !== "3.6.4" ||
      resolveSelectedExtension("postgis", postgis).adapter?.name !== "postgis"
    )
      throw new Error("pgRouting 3.8.0 requires an explicitly selected verified PostGIS 3.6.4 dependency");
  }
  const topology = selection.postgis_topology;
  if (topology && resolveSelectedExtension("postgis_topology", topology).adapter) {
    const postgis = selection.postgis;
    if (
      !postgis ||
      postgis.version !== "3.6.4" ||
      resolveSelectedExtension("postgis", postgis).adapter?.name !== "postgis"
    )
      throw new Error("postgis_topology 3.6.4 requires an explicitly selected, reviewed PostGIS 3.6.4 dependency");
  }
  const sfcgal = selection.postgis_sfcgal;
  if (sfcgal && resolveSelectedExtension("postgis_sfcgal", sfcgal).adapter) {
    const postgis = selection.postgis;
    if (!postgis || postgis.version !== "3.6.4" || !resolveSelectedExtension("postgis", postgis).manifest)
      throw new Error("postgis_sfcgal 3.6.4 requires an explicitly selected PostGIS 3.6.4 dependency");
  }
  const tiger = selection.postgis_tiger_geocoder;
  if (tiger && resolveSelectedExtension("postgis_tiger_geocoder", tiger).adapter) {
    const postgis = selection.postgis;
    if (!postgis || postgis.version !== "3.6.4" || !resolveSelectedExtension("postgis", postgis).manifest)
      throw new Error("postgis_tiger_geocoder 3.6.4 requires an explicitly selected PostGIS 3.6.4 dependency");
  }
  const raster = selection.postgis_raster;
  if (raster && resolveSelectedExtension("postgis_raster", raster).adapter) {
    const postgis = selection.postgis;
    if (!postgis || postgis.version !== "3.6.4" || !resolveSelectedExtension("postgis", postgis).manifest)
      throw new Error("postgis_raster 3.6.4 requires an explicitly selected PostGIS 3.6.4 dependency");
    if (raster.schema !== postgis.schema)
      throw new Error("postgis_raster 3.6.4 must share the PostGIS installation schema");
  }
  const lakebaseVector = selection.lakebase_vector;
  if (lakebaseVector && resolveSelectedExtension("lakebase_vector", lakebaseVector).adapter) {
    const vector = selection.vector;
    const companion = vector && resolveSelectedExtension("vector", vector);
    if (
      !vector ||
      vector.version !== "0.8.6" ||
      companion?.adapter?.name !== "vector" ||
      companion.support.digest !== "4e6679e9277c11a3f26d1a920de5f4c1b5401f418c647402a9e611df4a6fb1e4"
    )
      throw new Error("lakebase_vector 1.1.1 requires its exact selected vector 0.8.6 companion contract");
  }
  const h3Postgis = selection.h3_postgis;
  if (h3Postgis && resolveSelectedExtension("h3_postgis", h3Postgis).adapter) {
    const companions = [
      ["h3", "4.2.3", "0402a89cff2876378a25b680936da0841125dc5d194c2dad6f006092914ffbaf"],
      ["postgis", "3.6.4", "640e798698403a7115f41d3c4e5106917cef0f9dc896b6078f3bd068f3b60d29"],
      ["postgis_raster", "3.6.4", "8f7cd8fe4d832fcc153344cc70b5693f79fa29acb1a6b7f97c0c3de31943def2"],
    ] as const;
    for (const [name, version, digest] of companions) {
      const entry = selection[name];
      const companion = entry && resolveSelectedExtension(name, entry);
      if (!entry || entry.version !== version || companion?.adapter?.name !== name || companion.support.digest !== digest)
        throw new Error(`h3_postgis 4.2.3 requires its exact selected ${name} ${version} companion contract`);
    }
    if (selection.postgis_raster?.schema !== selection.postgis?.schema)
      throw new Error("h3_postgis 4.2.3 requires postgis_raster and postgis to share the installation schema");
  }
  const support: Record<string, ExtensionApiSupport> = {};
  const imports: string[] = [];
  const bindings: string[] = [];
  for (const [name, entry] of Object.entries(selection)) {
    if (!entry) continue;
    const resolution = resolveSelectedExtension(name, entry);
    support[name] = resolution.support;
    const descriptor = `descriptors[${JSON.stringify(name)}]`;
    let binding = descriptor;
    if (resolution.adapter) {
      imports.push(`import { ${resolution.adapter.factory} } from ${JSON.stringify(resolution.adapter.module)};`);
      const dependency =
        resolution.adapter.name === "h3_postgis"
          ? ', descriptors["h3"], descriptors["postgis"], descriptors["postgis_raster"]'
          : resolution.adapter.name === "lakebase_vector"
          ? ', descriptors["vector"]'
          : resolution.adapter.name === "earthdistance"
            ? ', descriptors["cube"]'
            : resolution.adapter.name === "postgis_sfcgal" ||
                resolution.adapter.name === "postgis_tiger_geocoder" ||
                resolution.adapter.name === "postgis_raster" ||
                resolution.adapter.name === "postgis_topology" ||
                resolution.adapter.name === "pgrouting"
              ? ', descriptors["postgis"]'
              : "";
      binding = `${resolution.adapter.factory}(${descriptor}${dependency})`;
    }
    bindings.push(`  ${JSON.stringify(name)}: ${binding},`);
  }
  return `import { createExtensionBindings } from "kello/server";\n${imports.length ? imports.join("\n") + "\n" : ""}export const selection = ${JSON.stringify(selection)} as const;\nconst descriptors = createExtensionBindings(selection, ${JSON.stringify(support)});\nexport const extensions = Object.freeze({\n${bindings.join("\n")}\n});\n`;
}
