# Typed Neon extension APIs for Loom

Research date: 2026-10-02. Target: Neon PostgreSQL 18. This document describes a proposed API and the work needed to make its types trustworthy. The extension installation lifecycle already exists; the runtime bindings described here are not implemented.

The accompanying [capability inventory](evidence/neon-extension-capability-map-2026-10-02.json) maps every entry in Neon's current extension catalogue. It records installation eligibility, the current Loom configuration boundary, capability families, typing requirements, integration constraints, and primary sources. It is not a list of every SQL member or a tested signature registry.

## Findings

The requested API is feasible:

```ts
// Proposed handler API, when pg_trgm is configured.
const { db, tables, extensions } = context;
const score = extensions.pg_trgm.similarity(tables.documents.title, input.query);

return db.select({ id: tables.documents.id, score }).from(tables.documents).where(gt(score, 0.3)).orderBy(desc(score));
```

`similarity` builds a typed SQL expression. The existing transaction-bound `db` executes the query. Accessing `context.extensions` does not install anything, open another database connection, or execute SQL.

The context contract is:

| Normalized project declaration                | Generated `context.extensions` type and value                        |
| --------------------------------------------- | -------------------------------------------------------------------- |
| Omitted extensions or an empty declaration    | `undefined`                                                          |
| Only `pg_trgm`                                | An object containing `pg_trgm`; other extension keys are type errors |
| `pg_trgm` and `vector`                        | An object containing those two extension APIs                        |
| Installed extension absent from configuration | No corresponding context key                                         |

Configured objects are present without a per-key optional check. Their SQL operations depend on successful migration and activation verification. Installed database state must not silently add capabilities to a project's API. A component may narrow its usable bindings to declared requirements; application-wide installation remains owned by the composition root.

Neon's catalogue has 85 entries. After normalizing display names, all 74 current Loom configuration names appear in the catalogue; there are no missing configuration names in this comparison. Of those 74, 73 have a listed PostgreSQL 18 version without a catalogue deprecation marker and `pgrag` is deprecated. The remaining 11 catalogue entries are eight without PostgreSQL 18 availability, one blocked for new installs, the preinstalled PL/pgSQL language, and a replication decoder plugin. Listing a version does not prove that an installation will succeed on a particular project or role. [Neon extension catalogue](https://neon.com/docs/extensions/pg-extensions).

Complete support needs several surfaces. Scalar functions can be methods like `similarity`; indexes, types, triggers, table-valued functions, text-search dictionaries, and operational tools need different bindings. Every configured extension can have a typed descriptor, even when it has no ordinary RPC expression helpers.

## What already exists in Loom

Adding a declaration records desired installation state. Safe first installations run during `loom dev` before dependent application and component DDL. Existing unmanaged installations, version updates, and schema moves require a reviewed migration. Production applies committed migration artifacts and verifies the required extension state during activation. Editing the configuration alone does not change a database immediately. See the [current extension guide](../../apps/docs/content/docs/integrations/postgres-extensions.mdx).

The relevant integration points are:

| Code                                                                                  | Current behavior                                                                                   | Implication for typed extension support                                                                                     |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| [Configuration catalogue](../../apps/loom/src/tooling/config/extensions.ts)           | Validates 74 names, explicit versions, and optional schema; empty intent normalizes to `undefined` | Keep this installation contract; use its normalized positive entries to generate exact keys                                 |
| [defineConfig](../../apps/loom/src/tooling/config/define-config.ts)                   | Returns the broad validated `LoomConfig` type                                                      | `typeof config` currently loses the exact selected keys; casting that type cannot recover them                              |
| [Server code generation](../../apps/loom/src/tooling/codegen/server.ts)               | Emits schema, tables, validators, and Effect services                                              | Emit a literal extension selection and import only selected server adapters                                                 |
| [RPC project bindings](../../apps/loom/src/core/server/rpc/procedure.ts)              | Supplies tables, validators, and search through project middleware                                 | Thread one extension-selection generic through bindings and procedure construction                                          |
| [Database middleware](../../apps/loom/src/core/server/rpc/database.ts)                | Supplies the invocation's scoped database and transaction capabilities                             | Execute extension SQL through this existing database scope                                                                  |
| [Effect project services](../../apps/loom/src/core/server/effect/services.ts)         | Creates schema-bound Database, Tables, Validators, and Search services                             | Supply a typed Extensions service using the same object as RPC context, with a default empty selection for existing callers |
| [Field declarations](../../apps/loom/src/core/schema/fields.ts)                       | Knows built-in storage kinds; no extension field metadata                                          | Custom fields require compiler, validator, snapshot, and migration support in addition to methods                           |
| [RPC serialization](../../apps/loom/src/core/server/rpc/serialization.ts)             | Validates transportable output before commit                                                       | SQL typing and client wire typing are separate; custom values need explicit codecs                                          |
| [Extension migration lifecycle](../../apps/loom/src/tooling/migrations/extensions.ts) | Inspects versions, membership, dependencies, placement, grants, and drift                          | Add verified public-member contracts while preserving existing migration authority                                          |

Generate bindings from validated configuration during tooling/build work. Do not import executable `loom.config.ts` into the deployed request path. Keep new selection generics backward compatible by defaulting existing constructors and bindings to the empty selection. The proposed Effect Extensions service should contain the same object or `undefined` as the RPC context, with service identity distinct from its value. A generic `defineConfig` overload could improve author-time inference, but generated literal metadata is still needed for builds, component requirements, bundling, and deployment verification.

## Binding design

Keep the accepted direct API for useful domain operations and add a versioned SQL reference surface for broader coverage:

```ts
// Proposed names; exact signatures come from verified version manifests.
extensions.pg_trgm.similarity(title, query);
extensions.pg_trgm.wordSimilarity(title, query);

// Low-level reference names preserve SQL spelling and overloads.
extensions.postgis.sql.functions.ST_DWithin(a, b, distance);
extensions.postgis.sql.operators.intersectsBoundingBox(a, b);
```

The second surface is not an arbitrary `sql<T>()` assertion. Its arguments, output type, overloads, and decoder must come from a reviewed manifest. Operators need meaningful aliases because SQL symbols are awkward property names. Internal input/output functions, planner support functions, trigger entry points, and privileged routines must be classified before export; extension membership does not make every function an application API.

Expose field and index builders from the generated server entry point so schema files can use them before a request exists. The same selected registry should power schema bindings and `context.extensions`. An index-only extension's context entry can expose immutable identity and typed metadata while its index declaration lives in schema authoring. Creating indexes or attaching triggers must go through migrations.

Keep diagnostics and maintenance in explicit tooling/operations adapters with their required privileges. Installing `pg_repack` should not grant every RPC handler an administrative `repack()` method. This is a proposed API boundary; it needs agreement when the implementation plan is written.

A generated literal selection permits the empty/nonempty distinction without optional keys:

```ts
// Type sketch for generated literal tuples, not a complete implementation.
type ExtensionsFor<Names extends readonly ExtensionName[]> = Names extends readonly []
  ? undefined
  : { readonly [Name in Names[number]]: ExtensionApi[Name] };

type NoExtensions = ExtensionsFor<readonly []>; // undefined
type TrigramOnly = ExtensionsFor<readonly ["pg_trgm"]>; // { pg_trgm: ... }
```

The actual registry must also select the declared extension version and observed member namespaces. It must reject unsupported version contracts rather than widening everything to `any` or exposing unconfigured keys. Arbitrary runtime arrays cannot provide the same static certainty as generated literal tuples.

### Type and execution contracts

- Preserve PostgreSQL nullability. Strict functions return null when a supplied argument is null, and some functions can return null even for non-null arguments. Aggregates on empty input and set-returning functions need their own models. A nominal `SQL<number>` alone does not install a runtime decoder.
- Model scalar expressions, aggregates, relation-valued functions, and procedures separately. Defaults, variadics, overload resolution, named OUT/TABLE arguments, polymorphic types, and composite records require signature-aware generation.
- Qualify each function, type, operator, and operator class by its observed namespace. The configured extension schema is not necessarily the namespace of every member. Use PostgreSQL's qualified operator syntax where required; never depend on a writable `search_path`.
- Bind user values as parameters. Quote identifiers from trusted metadata. Some extensions accept an embedded SQL statement as a text argument: those need a typed query compiler, safe value handling inside that statement, and declared relation dependencies. Parameterizing the outer string alone does not make its inner SQL safe or typed.
- Validate custom values at construction and decode at query boundaries. Preserve bigint precision, numeric representation, bytea, arrays, ranges, domains, composite records, and invalid-parse null results. Unknown custom types stay unsupported until they have a reviewed codec.
- Give vectors a dimension contract and distinguish dense, half, sparse, and bit representations. Give spatial values geometry/geography, subtype, SRID, and dimensional contracts. Distance units and coordinate order need documented semantics; compatible TypeScript primitives are insufficient.
- Define a wire representation separately: UUID/ULID/path brands may serialize as strings; vectors as validated arrays; geography as an explicit format; binary sketches/fingerprints as encoded bytes. Do not return a Drizzle SQL node or opaque database object from an RPC.
- Preserve Loom's transaction, authorization, retry, and table-revision behavior. Remote writes, session state, notifications, partition maintenance, and SQL hidden inside function arguments need explicit policy. PostgreSQL volatility is useful metadata, but is not proof of authorization, replay safety, or external side-effect freedom.

The installed Drizzle release already has some vector and geometry column support. Its current vector helpers accept broad SQL wrappers/columns and do not, by themselves, provide Loom's dimension, operand, codec, or wire contracts. Reuse compatible native builders and query composition while adding these guarantees. [Drizzle vector guide](https://orm.drizzle.team/docs/guides/vector-similarity-search), [pgvector reference](https://github.com/pgvector/pgvector).

## Provider and version constraints

| Area                       | Consequence for the bindings                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Custom placement           | Default schema remains `extensions`; resolve actual member namespaces and dependency placements. Some namespaces are fixed or provider-owned.                                                                                                                                                                                                                                                                                                                                                             |
| Lakebase Search            | `lakebase_text` uses PostgreSQL text-search values plus BM25 query/index support; `lakebase_vector` shares pgvector types/operators and adds an ANN index. `lakebase_tokenizer` supplies dictionary templates and configuration data. Extension updates and existing index-format upgrades are separate operations. [Text](https://neon.com/docs/extensions/lakebase-text), [vector](https://neon.com/docs/extensions/lakebase-vector), [tokenizer](https://neon.com/docs/extensions/lakebase-tokenizer). |
| `anon`                     | Neon supports static masking only. Branch resets can restore original data and require masking again; do not advertise dynamic masking from upstream alone. [Neon anonymizer constraints](https://neon.com/docs/extensions/postgresql-anonymizer).                                                                                                                                                                                                                                                        |
| `pg_cron`                  | Endpoint configuration, restart, fixed-schema permissions, and active compute apply. Neon recommends scheduled Function Triggers for work that must fire at scale to zero. [Neon pg_cron](https://neon.com/docs/extensions/pg_cron).                                                                                                                                                                                                                                                                      |
| `pg_repack`                | Requires a paid plan, support enablement, compute restart, and an external CLI. A TypeScript wrapper would orchestrate an operational tool, not just render one SQL expression. [Neon pg_repack](https://neon.com/docs/extensions/pg_repack).                                                                                                                                                                                                                                                             |
| `pg_session_jwt`           | Functions are in `auth`; claim-setting fallback does not verify a signature. Bindings must not replace Loom's verified invocation identity with arbitrary session claims. [Neon session JWT](https://neon.com/docs/extensions/pg_session_jwt).                                                                                                                                                                                                                                                            |
| `timescaledb`              | Restrict contracts to Neon's Apache-2 feature set. Compression is unsupported; upstream paid/other-edition features must not appear simply because upstream docs mention them. [Neon TimescaleDB](https://neon.com/docs/extensions/timescaledb).                                                                                                                                                                                                                                                          |
| Legacy entries             | `pgrag` is deprecated; `pg_search` is unavailable; new `pg_ivm` and `plv8` installs are blocked. Keep historical migration classification separate from new-project bindings. Current Loom still accepts `pgrag`; this research does not change that behavior. [pgrag](https://neon.com/docs/extensions/pgrag), [pg_search](https://neon.com/docs/extensions/pg_search), [plv8](https://neon.com/docs/extensions/plv8).                                                                                   |
| Documentation/version skew | `h3` upstream documents newer spelling and version markers than some provider examples; `pg_ivm` uses different namespaces across PostgreSQL versions. Generate from the exact installed contract, not an unversioned README example. [H3 API](https://github.com/postgis/h3-pg/blob/main/docs/api.md).                                                                                                                                                                                                   |

One catalogue note under `pg_tiktoken` refers to `pg_stat_statements_reset`, which belongs to another extension. It is excluded from the inventory's tokenizer contract; the dedicated tokenizer documentation describes `tiktoken_encode` and `tiktoken_count`. [Tokenizer functions](https://neon.com/docs/extensions/pg_tiktoken).

Dependencies must be explicitly represented and verified. For example, earthdistance uses cube, routing uses PostGIS, and H3/PostGIS bridge operations need their companion installations. A typed helper may reference another extension's types or operators; declaring one extension cannot implicitly expose an undeclared dependency as another top-level context key.

## Whole-catalogue capability map

All rows below have a corresponding structured inventory entry. Names use PostgreSQL installation identity: `pgvector` becomes `vector`, `pg_roaringbitmap` becomes `roaringbitmap`, and the four SPI examples lose the display suffix. Versions in the JSON are provider-listed PostgreSQL 18 versions, not a statement that all have been installed or tested.

Surfaces are proposals: **expressions** build SQL; **relations** add typed row-producing functions; **schema/migrations** declare types, indexes, dictionaries, and triggers; **session** requires scoped connection state; **operations/tests** are explicit adapters; **legacy/baseline/replication** stay outside new extension RPC installation APIs.

| Extension / primary reference                                                                                  | Provider status            | Proposed surfaces                              | Main typing requirement                                                                 |
| -------------------------------------------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| [`address_standardizer`](https://postgis.net/docs/Extras.html#Address_Standardizer)                            | PG18 listed                | expressions, relations                         | Address text, stdaddr composite records, lexicon/rules relation references              |
| [`address_standardizer_data_us`](https://postgis.net/docs/Extras.html#Address_Standardizer_Tables)             | PG18 listed                | schema                                         | Typed US lexicon, gazetteer and rules relation references                               |
| [`anon`](https://neon.com/docs/extensions/postgresql-anonymizer)                                               | PG18 listed                | expressions, migrations, operations            | Typed masking expressions, labels, policies and table references                        |
| [`autoinc`](https://www.postgresql.org/docs/current/contrib-spi.html)                                          | PG18 listed                | migrations                                     | Sequence and integer-column references, trigger declaration                             |
| [`bloom`](https://www.postgresql.org/docs/16/bloom.html)                                                       | PG18 listed                | schema, migrations                             | Index columns, supported operator classes, signature/bit options                        |
| [`btree_gin`](https://neon.com/docs/extensions/btree_gin)                                                      | PG18 listed                | schema, migrations                             | GIN operator classes mapped to eligible built-in column types                           |
| [`btree_gist`](https://neon.com/docs/extensions/btree_gist)                                                    | PG18 listed                | schema, migrations                             | GiST operator classes, scalar comparison and exclusion constraints                      |
| [`citext`](https://neon.com/docs/extensions/citext)                                                            | PG18 listed                | expressions, schema                            | Case-insensitive text brand, casts, comparisons, string codec                           |
| [`cube`](https://neon.com/docs/extensions/cube)                                                                | PG18 listed                | expressions, schema                            | N-dimensional point/box values, coordinate codecs and distance outputs                  |
| [`dblink`](https://neon.com/docs/extensions/dblink)                                                            | PG18 listed                | operations                                     | Connection handles, typed remote queries and explicit row decoders                      |
| [`dict_int`](https://neon.com/docs/extensions/dict_int)                                                        | PG18 listed                | schema, migrations                             | Integer dictionary template and validated dictionary options                            |
| [`earthdistance`](https://neon.com/docs/extensions/earthdistance)                                              | PG18 listed                | expressions, schema                            | Earth-coordinate domain, points, distances and units                                    |
| [`fuzzystrmatch`](https://neon.com/docs/extensions/fuzzystrmatch)                                              | PG18 listed                | expressions                                    | Text inputs, integer edit distances and phonetic output codecs                          |
| [`h3`](https://github.com/postgis/h3-pg/blob/main/docs/api.md)                                                 | PG18 listed                | expressions, relations, schema                 | H3 cell brand, resolutions, points, cell arrays and typed record sets                   |
| [`h3_postgis`](https://github.com/postgis/h3-pg/blob/main/docs/api.md)                                         | PG18 listed                | expressions, relations, schema                 | H3 cells plus geometry/geography, SRID and raster-aware inputs                          |
| [`hll`](https://github.com/citusdata/postgresql-hll)                                                           | PG18 listed                | expressions, schema                            | HLL sketch and hash brands, precision settings and cardinality outputs                  |
| [`hstore`](https://neon.com/docs/extensions/hstore)                                                            | PG18 listed                | expressions, schema                            | Flat string-to-string-or-null maps, key/value arrays and JSON conversions               |
| [`hypopg`](https://hypopg.readthedocs.io/en/rel1_stable/usage.html)                                            | PG18 listed                | operations                                     | Hypothetical-index handles, index definitions and EXPLAIN result records                |
| [`insert_username`](https://www.postgresql.org/docs/current/contrib-spi.html)                                  | PG18 listed                | migrations                                     | Trigger target and user-name column references                                          |
| [`intagg`](https://www.postgresql.org/docs/16/intagg.html)                                                     | PG18 listed                | expressions, relations                         | Integer array aggregate and typed integer row sets                                      |
| [`intarray`](https://neon.com/docs/extensions/intarray)                                                        | PG18 listed                | expressions, schema                            | Null-free integer arrays, query_int expressions and array result codecs                 |
| [`ip4r`](https://github.com/RhodiumToad/ip4r)                                                                  | PG18 listed                | expressions, schema                            | IPv4/IPv6 addresses and ranges with lossless normalized codecs                          |
| [`isn`](https://www.postgresql.org/docs/16/isn.html)                                                           | PG18 listed                | expressions, schema                            | EAN/UPC/ISBN/ISSN and related identifier brands, validation and conversion              |
| [`lakebase_text`](https://neon.com/docs/extensions/lakebase-text)                                              | PG18 listed                | expressions, schema, migrations, session       | tsvector/tsquery, BM25 query value, index reference and rank outputs                    |
| [`lakebase_tokenizer`](https://neon.com/docs/extensions/lakebase-tokenizer)                                    | PG18 listed                | schema, migrations                             | Dictionary/template options, stopword/synonym sets and text-search configuration        |
| [`lakebase_vector`](https://neon.com/docs/extensions/lakebase-vector)                                          | PG18 listed                | schema, migrations, session                    | pgvector-compatible columns, ANN operator classes and build/search options              |
| [`lo`](https://www.postgresql.org/docs/16/lo.html)                                                             | PG18 listed                | schema, migrations, operations                 | Large-object OID domain and lifecycle references                                        |
| [`ltree`](https://neon.com/docs/extensions/ltree)                                                              | PG18 listed                | expressions, schema                            | Path, lquery and ltxtquery brands, path arrays and hierarchy codecs                     |
| [`moddatetime`](https://www.postgresql.org/docs/current/contrib-spi.html)                                      | PG18 listed                | migrations                                     | Timestamp-column references and trigger declaration                                     |
| [`neon`](https://neon.com/docs/extensions/neon)                                                                | PG18 listed                | operations                                     | Provider-owned diagnostic view records and permitted function signatures                |
| [`neon_utils`](https://neon.com/docs/extensions/neon-utils)                                                    | PG18 listed                | expressions, operations                        | CPU-count numeric result and verified callable signature                                |
| [`online_advisor`](https://neon.com/docs/extensions/online_advisor)                                            | No PG18 availability       | legacy, operations                             | Planner/executor recommendation records and versioned functions                         |
| [`pg_cron`](https://neon.com/docs/extensions/pg_cron)                                                          | PG18 listed                | migrations, operations                         | Job IDs, schedules, typed commands and execution-history records                        |
| [`pg_graphql`](https://neon.com/docs/extensions/pg_graphql)                                                    | PG18 listed                | expressions                                    | Document/variables inputs and generated GraphQL operation result types                  |
| [`pg_hashids`](https://github.com/iCyberon/pg_hashids)                                                         | PG18 listed                | expressions                                    | Integer/bigint IDs, ID arrays, salt/alphabet options and text encodings                 |
| [`pg_hint_plan`](https://github.com/ossc-db/pg_hint_plan)                                                      | PG18 listed                | schema, operations                             | Typed planner hints, table aliases and scoped settings                                  |
| [`pg_ivm`](https://github.com/sraoss/pg_ivm)                                                                   | Existing installs only     | legacy, migrations, operations                 | Incremental-view declarations, result schemas and maintenance records                   |
| [`pg_jsonschema`](https://github.com/supabase/pg_jsonschema)                                                   | PG18 listed                | expressions, schema                            | JSON/JSONB inputs, schema validation booleans and error arrays                          |
| [`pg_mooncake`](https://neon.com/docs/extensions/pg_mooncake)                                                  | No PG18 availability       | legacy, schema, operations                     | Columnstore relations, aggregate outputs and external storage handles                   |
| [`pg_partman`](https://github.com/pgpartman/pg_partman/blob/v5.1.0/doc/pg_partman.md)                          | PG18 listed                | migrations, operations                         | Partition parents, interval boundaries, retention policies and configuration rows       |
| [`pg_prewarm`](https://neon.com/docs/extensions/pg_prewarm)                                                    | PG18 listed                | operations                                     | Relation/index references, warm-up modes, block ranges and bigint count                 |
| [`pg_repack`](https://neon.com/docs/extensions/pg_repack)                                                      | PG18 listed                | operations                                     | CLI target/options and progress/verification records                                    |
| [`roaringbitmap`](https://github.com/ChenHuajun/pg_roaringbitmap)                                              | PG18 listed                | expressions, schema                            | Bitmap brand, integer sets, serialized bitmap codec and bigint cardinality              |
| [`pg_session_jwt`](https://neon.com/docs/extensions/pg_session_jwt)                                            | PG18 listed                | expressions, session                           | JWT claim shape, nullable subject and UUID/text identity distinctions                   |
| [`pg_stat_statements`](https://neon.com/docs/extensions/pg_stat_statements)                                    | PG18 listed                | operations                                     | Versioned statistics rows, bigint counters and reset arguments                          |
| [`pg_tiktoken`](https://neon.com/docs/extensions/pg_tiktoken)                                                  | PG18 listed                | expressions                                    | Encoding/model identifiers, token integer arrays and token counts                       |
| [`pg_trgm`](https://neon.com/docs/extensions/pg_trgm)                                                          | PG18 listed                | expressions, schema, session                   | Text operands, numeric similarity/distance, thresholds and GIN/GiST opclasses           |
| [`pg_uuidv7`](https://neon.com/docs/extensions/pg_uuidv7)                                                      | PG18 listed                | expressions                                    | UUID brand, timestamptz conversion and generation defaults                              |
| [`pgcrypto`](https://neon.com/docs/extensions/pgcrypto)                                                        | PG18 listed                | expressions                                    | Text/bytea inputs, digest/HMAC outputs, password hashes and encryption options          |
| [`pgjwt`](https://github.com/michelp/pgjwt)                                                                    | PG18 listed                | expressions, relations                         | JSON claims, algorithm names and verification result records                            |
| [`pgrag`](https://neon.com/docs/extensions/pgrag)                                                              | Deprecated; config accepts | legacy                                         | Embedding/reranking values, model options and versioned result shapes                   |
| [`pgrouting`](https://neon.com/docs/extensions/postgis-related-extensions#pgrouting)                           | PG18 listed                | expressions, relations                         | Typed edge queries, vertex IDs, costs and algorithm-specific route rows                 |
| [`pgrowlocks`](https://neon.com/docs/extensions/pgrowlocks)                                                    | PG18 listed                | operations                                     | Relation references and typed lock records with transaction/process arrays              |
| [`pgstattuple`](https://neon.com/docs/extensions/pgstattuple)                                                  | PG18 listed                | operations                                     | Relation/index references, bigint storage counters and bloat records                    |
| [`pgtap`](https://pgtap.org/documentation.html)                                                                | PG18 listed                | tests                                          | Typed test plans, assertion expressions, TAP strings and session state                  |
| [`vector`](https://neon.com/docs/extensions/pgvector)                                                          | PG18 listed                | expressions, schema, session                   | Dense/half/sparse vectors, bit vectors, dimensions, numeric arrays and codecs           |
| [`pg_search`](https://neon.com/docs/extensions/pg_search)                                                      | No PG18 availability       | legacy                                         | Legacy BM25 indexes, search predicates and result records                               |
| [`pgx_ulid`](https://github.com/pksunkara/pgx_ulid)                                                            | PG18 listed                | expressions, schema                            | ULID brand, generation, timestamp conversion and lossless text codec                    |
| [`plcoffee`](https://coffeescript.org/)                                                                        | No PG18 availability       | legacy                                         | Stored-function declarations, parameter/result schemas and language semantics           |
| [`plls`](https://livescript.net/)                                                                              | No PG18 availability       | legacy                                         | Stored-function declarations, parameter/result schemas and language semantics           |
| [`plpgsql`](https://www.postgresql.org/docs/16/plpgsql.html)                                                   | Preinstalled               | baseline                                       | Application-owned stored function/procedure signatures                                  |
| [`plpgsql_check`](https://pgxn.org/dist/plpgsql_check/)                                                        | PG18 listed                | operations, tests                              | Routine references, validation/profiling options and diagnostic record codecs           |
| [`plv8`](https://neon.com/docs/extensions/plv8)                                                                | No PG18 availability       | legacy                                         | Legacy JavaScript stored-function signatures and result codecs                          |
| [`postgis`](https://postgis.net/docs/reference.html)                                                           | PG18 listed                | expressions, relations, schema                 | Geometry/geography/boxes, subtype, SRID, Z/M dimensions and WKB/WKT/GeoJSON codecs      |
| [`postgis_raster`](https://postgis.net/docs/RT_reference.html)                                                 | PG18 listed                | expressions, relations, schema                 | Raster, bands, nodata, pixel/sample types and summary-stat composite records            |
| [`postgis_sfcgal`](https://postgis.net/docs/reference.html)                                                    | PG18 listed                | expressions, relations                         | 3D geometries, solids, tessellation/extrusion and numeric units                         |
| [`postgis_tiger_geocoder`](https://neon.com/docs/extensions/postgis-related-extensions#postgis-tiger-geocoder) | PG18 listed                | expressions, relations, migrations, operations | Normalized address and geocoding result records, lookup datasets and loader definitions |
| [`postgis_topology`](https://www.postgis.net/docs/Topology.html)                                               | PG18 listed                | expressions, relations, migrations, operations | TopoGeometry and topology element records, topology IDs and layer metadata              |
| [`postgres_fdw`](https://neon.com/docs/extensions/postgres_fdw)                                                | PG18 listed                | schema, migrations, operations                 | Foreign-server/table descriptors, row schemas and credential references                 |
| [`prefix`](https://github.com/dimitri/prefix)                                                                  | PG18 listed                | expressions, schema                            | Prefix-range brand, text prefix matching and GiST opclasses                             |
| [`rdkit`](https://www.rdkit.org/docs/Cartridge.html)                                                           | PG18 listed                | expressions, relations, schema                 | Molecule/query-molecule, sparse/bit fingerprints, SMILES/SMARTS and binary codecs       |
| [`refint`](https://www.postgresql.org/docs/current/contrib-spi.html)                                           | PG18 listed                | migrations                                     | Relation/column references and trigger argument declarations                            |
| [`rum`](https://github.com/postgrespro/rum)                                                                    | No PG18 availability       | legacy, schema                                 | RUM operator classes, text-search/distance operators and index options                  |
| [`seg`](https://www.postgresql.org/docs/16/seg.html)                                                           | PG18 listed                | expressions, schema                            | Interval bounds with precision/uncertainty markers and text codec                       |
| [`semver`](https://github.com/theory/pg-semver/blob/main/doc/semver.md)                                        | PG18 listed                | expressions, schema                            | Semantic-version/range brands, comparisons and normalized string codec                  |
| [`tablefunc`](https://neon.com/docs/extensions/tablefunc)                                                      | PG18 listed                | expressions, relations                         | Typed source/category queries, crosstab record definitions and hierarchy rows           |
| [`tcn`](https://www.postgresql.org/docs/16/tcn.html)                                                           | PG18 listed                | migrations, session                            | Trigger definition, notification channel and parsed notification payload                |
| [`timescaledb`](https://neon.com/docs/extensions/timescaledb)                                                  | PG18 listed                | expressions, relations, migrations, operations | Time buckets, hypertable definitions, intervals and versioned information views         |
| [`tsm_system_rows`](https://www.postgresql.org/docs/16/tsm-system-rows.html)                                   | PG18 listed                | expressions                                    | Typed TABLESAMPLE clause with positive integer row target                               |
| [`tsm_system_time`](https://www.postgresql.org/docs/16/tsm-system-time.html)                                   | PG18 listed                | expressions                                    | Typed TABLESAMPLE clause with millisecond budget                                        |
| [`unaccent`](https://neon.com/docs/extensions/unaccent)                                                        | PG18 listed                | expressions, schema                            | Text values and text-search dictionary references                                       |
| [`unit`](https://github.com/df7cb/postgresql-unit)                                                             | No PG18 availability       | legacy, schema                                 | Unit-aware numeric values, dimensions and conversion targets                            |
| [`uuid-ossp`](https://neon.com/docs/extensions/uuid-ossp)                                                      | PG18 listed                | expressions                                    | UUID brands, namespace constants and version-specific generation inputs                 |
| [`wal2json`](https://neon.com/docs/extensions/wal2json)                                                        | Decoder plugin             | replication                                    | Versioned change-event schemas, replication options, LSN and slot lifecycle             |
| [`xml2`](https://neon.com/docs/extensions/xml2)                                                                | PG18 listed                | expressions, relations                         | XML/XPath/XSLT strings, nullable scalar results and typed XPath table rows              |

## How to discover every member reliably

Documentation establishes capability families and semantics. The installed PostgreSQL catalogue establishes the exact objects for a supported version. Before claiming full member coverage, capture each eligible extension in disposable PostgreSQL 18 fixtures with its explicit dependencies and provider prerequisites. Mutually conflicting or provider-owned installations need separate fixtures. A provider refusal must be recorded, not treated as a successful signature capture.

For each supported extension/version/placement, capture:

| Catalogue area                                                   | Required contract data                                                                                                                                                                                                 |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pg_extension`, available-version views, extension update paths  | Identity, installed version, schema, required dependencies, relocation and privilege constraints                                                                                                                       |
| `pg_depend` and object identity                                  | Extension-owned members plus classified internal/automatic dependents; dependency references alone do not establish ownership                                                                                          |
| `pg_proc`, `pg_aggregate`                                        | Function/procedure kind, overload identity, input/output modes and types, default count, variadic/polymorphic behavior, set returns, strictness, volatility, security mode, aggregate/window semantics, and privileges |
| `pg_type`, `pg_attribute`, `pg_range`                            | Base/domain/composite/array/range/multirange structure, type modifiers, enum/record fields where applicable, I/O and coercion contracts                                                                                |
| `pg_operator`, `pg_cast`, collations                             | Operand/result types, implementation function, casts, namespace and comparison behavior                                                                                                                                |
| Access methods, operator classes/families                        | Supported column/operator/index combinations and build options; custom option semantics still need reviewed documentation                                                                                              |
| Relations, languages, text-search objects, foreign-data wrappers | View/table shapes, dictionaries/templates/configurations, language handlers, foreign server/table capability requirements                                                                                              |
| Extension configuration relations and external tools             | Versioned configuration data and operational requirements; capture schemas/options, not secrets or customer data                                                                                                       |

This read-only query illustrates direct routine membership; it is a starting point, not the complete extractor:

```sql
SELECT
  e.extname,
  e.extversion,
  n.nspname AS member_schema,
  p.proname,
  p.prokind,
  pg_get_function_identity_arguments(p.oid) AS identity_arguments,
  pg_get_function_arguments(p.oid) AS declared_arguments,
  pg_get_function_result(p.oid) AS declared_result,
  p.proargtypes,
  p.proallargtypes,
  p.proargmodes,
  p.proargnames,
  p.pronargdefaults,
  p.provariadic,
  p.prorettype,
  p.proretset,
  p.proisstrict,
  p.provolatile,
  p.prosecdef,
  p.proacl
FROM pg_extension AS e
JOIN pg_depend AS d
  ON d.refclassid = 'pg_extension'::regclass
 AND d.refobjid = e.oid
 AND d.classid = 'pg_proc'::regclass
 AND d.objsubid = 0
 AND d.deptype = 'e'
JOIN pg_proc AS p ON p.oid = d.objid
JOIN pg_namespace AS n ON n.oid = p.pronamespace
ORDER BY e.extname, n.nspname, p.proname, identity_arguments;
```

Resolve type OIDs into stable qualified identities; never serialize fixture-specific OIDs into a build contract. Function ACLs and default privileges need evaluation as the intended runtime role. Manually classify public versus implementation members and annotate behavior that catalogue data cannot infer, including units, dynamic records, inner SQL, remote effects, and provider feature gates. [PostgreSQL routine catalogue](https://www.postgresql.org/docs/18/catalog-pg-proc.html), [dependencies](https://www.postgresql.org/docs/18/catalog-pg-depend.html), [operators](https://www.postgresql.org/docs/18/catalog-pg-operator.html), [types](https://www.postgresql.org/docs/18/catalog-pg-type.html), [available versions](https://www.postgresql.org/docs/18/view-pg-available-extension-versions.html).

Publish reviewed manifests keyed by PostgreSQL major, extension name/version, and provider capability restrictions. Keep installed namespaces as deployment-resolved metadata and compare normalized signatures against the manifest. Builds should work offline using checked-in manifests; request handling should not introspect the database or download current docs.

## Coverage and delivery implications

The registry/extractor is shared infrastructure. The adapters vary substantially: primitive text functions are comparatively small; custom data types need codecs and schema integration; PostGIS, raster, RDKit, H3, routing, and TimescaleDB require substantial semantic work. A mechanically generated declaration for every function cannot establish end-to-end correctness by itself.

Useful development order is to prove the shared contract with `pg_trgm`, `unaccent`, and `fuzzystrmatch`, then exercise custom fields/codecs with `vector`, `citext`, `hstore`, and `ltree`. Lakebase Search, GIS/routing, specialized data types, and operational/session adapters then validate the remaining capability families. This order is a recommendation from the capability map, not a reduced scope or an accepted implementation plan. Full eligible coverage remains the objective.

A supported binding needs evidence at four boundaries:

1. **Compile-time:** exact configured keys, empty selection equals `undefined`, overloads, nullability, dimensions/SRID, and missing/unconfigured member rejection. Test plain Promise handlers and Effect service access through the same generated selection.
2. **Database:** values/decoders, qualified SQL under custom and fixed placement, target-role grants, record/set-returning outputs, migration ordering, update drift, and provider-specific behavior.
3. **Loom:** field snapshots/migrations, transaction/retry behavior, component scoping, relation dependency tracking, table-revision invalidation, and output validation before commit.
4. **Release:** immutable selected manifests in build artifacts, version/member-contract verification on activation, branch inheritance/drift, isolated package-consumer imports, and no unselected adapter or credential leakage into client bundles.

For Lakebase indexes, track reviewed index-format changes separately from extension state. For diagnostics, session helpers, foreign tables, replication, and maintenance, define the operational and freshness policy explicitly rather than implying that a method is safe in any query or live subscription.

Research coverage is complete at the catalogue-entry and capability-family level: 85 unique entries, 74 matched configuration names, all 77 unique catalogue-linked sources retrieved, plus upstream API and PostgreSQL catalogue references. Exact version-specific member signatures, codecs, runtime bindings, and cloud acceptance for those bindings remain implementation work. No new extension has been installed and no runtime API has been changed by this research.
