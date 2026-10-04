import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import {
  appendFileSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { extensionBindingsSource } from "../../../apps/loom/src/tooling/codegen/extensions";
import {
  extensionProofCasesDigest,
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofReceipt,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { collectExtensionProofCases, type ExtensionProofEvent } from "../fixtures/extension-proof";
import { bloomUnitProofCase, bloomTypesProofCase } from "../fixtures/bloom-proof-cases";
import { bloomGateProofSources } from "../fixtures/bloom-semantic-proof";

// Reviewed repository closures for each gate, captured with LOOM_CAPTURE_ROSTER=1 and checked on every run.
const reviewedUnitSources: readonly string[] = [
  "apps/loom/dist/bindings-cM3hyHEU.js",
  "apps/loom/dist/core/extensions/adapters/bloom.js",
  "apps/loom/src/core/adapters/neon/auth.ts",
  "apps/loom/src/core/adapters/neon/neon-auth-http.ts",
  "apps/loom/src/core/better-auth/state.ts",
  "apps/loom/src/core/extensions/adapters/anon-codecs.ts",
  "apps/loom/src/core/extensions/adapters/anon-fields.ts",
  "apps/loom/src/core/extensions/adapters/anon-specs.ts",
  "apps/loom/src/core/extensions/adapters/anon.ts",
  "apps/loom/src/core/extensions/adapters/bloom.ts",
  "apps/loom/src/core/extensions/bindings.ts",
  "apps/loom/src/core/extensions/codecs.ts",
  "apps/loom/src/core/extensions/contracts.ts",
  "apps/loom/src/core/extensions/fields.ts",
  "apps/loom/src/core/extensions/hstore-codec.ts",
  "apps/loom/src/core/extensions/json-transport.ts",
  "apps/loom/src/core/extensions/native-codecs.ts",
  "apps/loom/src/core/extensions/native-timestamp-codecs.ts",
  "apps/loom/src/core/extensions/nested-query-private.ts",
  "apps/loom/src/core/extensions/nested-query.ts",
  "apps/loom/src/core/extensions/pgcrypto-pgp-admission.ts",
  "apps/loom/src/core/extensions/primitive-number-codecs.ts",
  "apps/loom/src/core/extensions/registry.ts",
  "apps/loom/src/core/extensions/sql.ts",
  "apps/loom/src/core/extensions/triggers.ts",
  "apps/loom/src/core/extensions/values.ts",
  "apps/loom/src/core/schema/compile.ts",
  "apps/loom/src/core/schema/define-schema.ts",
  "apps/loom/src/core/schema/fields.ts",
  "apps/loom/src/core/schema/system-fields.ts",
  "apps/loom/src/core/schema/table.ts",
  "apps/loom/src/core/search/compiler.ts",
  "apps/loom/src/core/search/contract.ts",
  "apps/loom/src/core/search/cursor.ts",
  "apps/loom/src/core/search/executor.ts",
  "apps/loom/src/core/search/json-schema.ts",
  "apps/loom/src/core/search/metadata.ts",
  "apps/loom/src/core/search/ordering.ts",
  "apps/loom/src/core/search/pagination.ts",
  "apps/loom/src/core/search/public.ts",
  "apps/loom/src/core/search/timestamp.ts",
  "apps/loom/src/core/server/activation.ts",
  "apps/loom/src/core/server/application/definition.ts",
  "apps/loom/src/core/server/application/environment.ts",
  "apps/loom/src/core/server/auth/config.ts",
  "apps/loom/src/core/server/auth/configuration.ts",
  "apps/loom/src/core/server/auth/context.ts",
  "apps/loom/src/core/server/auth/policy.ts",
  "apps/loom/src/core/server/auth/rpc-definition.ts",
  "apps/loom/src/core/server/auth/tickets.ts",
  "apps/loom/src/core/server/auth/verify.ts",
  "apps/loom/src/core/server/components/callers.ts",
  "apps/loom/src/core/server/components/definition.ts",
  "apps/loom/src/core/server/components/environment.ts",
  "apps/loom/src/core/server/components/graph.ts",
  "apps/loom/src/core/server/components/http.ts",
  "apps/loom/src/core/server/components/package.ts",
  "apps/loom/src/core/server/components/services.ts",
  "apps/loom/src/core/server/config.ts",
  "apps/loom/src/core/server/cookie-session.ts",
  "apps/loom/src/core/server/database/cancel.ts",
  "apps/loom/src/core/server/database/connection.ts",
  "apps/loom/src/core/server/database/context.ts",
  "apps/loom/src/core/server/database/pool.ts",
  "apps/loom/src/core/server/database/relations.ts",
  "apps/loom/src/core/server/effect/runtime.ts",
  "apps/loom/src/core/server/effect/services.ts",
  "apps/loom/src/core/server/idempotency.ts",
  "apps/loom/src/core/server/index.ts",
  "apps/loom/src/core/server/ingress.ts",
  "apps/loom/src/core/server/jobs/contracts.ts",
  "apps/loom/src/core/server/jobs/durable-crons.ts",
  "apps/loom/src/core/server/jobs/durable-queue.ts",
  "apps/loom/src/core/server/jobs/durable-worker.ts",
  "apps/loom/src/core/server/jobs/rpc-contracts.ts",
  "apps/loom/src/core/server/jobs/rpc-crons.ts",
  "apps/loom/src/core/server/jobs/rpc-migrations.ts",
  "apps/loom/src/core/server/jobs/rpc-queue.ts",
  "apps/loom/src/core/server/jobs/rpc-scheduler.ts",
  "apps/loom/src/core/server/jobs/rpc-service.ts",
  "apps/loom/src/core/server/jobs/rpc-worker.ts",
  "apps/loom/src/core/server/observability.ts",
  "apps/loom/src/core/server/realtime/coordinator.ts",
  "apps/loom/src/core/server/realtime/notifications.ts",
  "apps/loom/src/core/server/realtime/revisions.ts",
  "apps/loom/src/core/server/rpc-runtime.ts",
  "apps/loom/src/core/server/rpc/capabilities.ts",
  "apps/loom/src/core/server/rpc/database.ts",
  "apps/loom/src/core/server/rpc/error-status.ts",
  "apps/loom/src/core/server/rpc/live-context.ts",
  "apps/loom/src/core/server/rpc/openapi.ts",
  "apps/loom/src/core/server/rpc/procedure.ts",
  "apps/loom/src/core/server/rpc/replay.ts",
  "apps/loom/src/core/server/rpc/runtime-graph.ts",
  "apps/loom/src/core/server/rpc/serialization.ts",
  "apps/loom/src/core/server/rpc/snapshot-stream.ts",
  "apps/loom/src/core/server/rpc/snapshot.ts",
  "apps/loom/src/core/server/rpc/stream-lifetime.ts",
  "apps/loom/src/core/server/rpc/stream.ts",
  "apps/loom/src/core/server/storage/cleanup.ts",
  "apps/loom/src/core/server/storage/component-runtime.ts",
  "apps/loom/src/core/server/storage/contracts.ts",
  "apps/loom/src/core/server/storage/durable-events.ts",
  "apps/loom/src/core/server/storage/intents.ts",
  "apps/loom/src/core/server/storage/invocation.ts",
  "apps/loom/src/core/server/storage/keys.ts",
  "apps/loom/src/core/server/storage/rpc-events.ts",
  "apps/loom/src/core/server/transactions.ts",
  "apps/loom/src/core/validation/canonical.ts",
  "apps/loom/src/core/validation/derive.ts",
  "apps/loom/src/core/validation/encoding.ts",
  "apps/loom/src/core/validation/storage.ts",
  "apps/loom/src/tooling/codegen/extensions.ts",
  "apps/loom/src/tooling/config/extensions.ts",
  "apps/loom/src/tooling/extensions/annotations/address-standardizer-data-us.ts",
  "apps/loom/src/tooling/extensions/annotations/address-standardizer.ts",
  "apps/loom/src/tooling/extensions/annotations/anon.ts",
  "apps/loom/src/tooling/extensions/annotations/autoinc.ts",
  "apps/loom/src/tooling/extensions/annotations/bloom.ts",
  "apps/loom/src/tooling/extensions/annotations/btree_gin.ts",
  "apps/loom/src/tooling/extensions/annotations/btree_gist.ts",
  "apps/loom/src/tooling/extensions/annotations/citext.ts",
  "apps/loom/src/tooling/extensions/annotations/cube.ts",
  "apps/loom/src/tooling/extensions/annotations/dblink.ts",
  "apps/loom/src/tooling/extensions/annotations/dict_int.ts",
  "apps/loom/src/tooling/extensions/annotations/earthdistance.ts",
  "apps/loom/src/tooling/extensions/annotations/fuzzystrmatch.ts",
  "apps/loom/src/tooling/extensions/annotations/h3-postgis.ts",
  "apps/loom/src/tooling/extensions/annotations/h3.ts",
  "apps/loom/src/tooling/extensions/annotations/hll.ts",
  "apps/loom/src/tooling/extensions/annotations/hstore.ts",
  "apps/loom/src/tooling/extensions/annotations/hypopg.ts",
  "apps/loom/src/tooling/extensions/annotations/insert-username.ts",
  "apps/loom/src/tooling/extensions/annotations/intagg.ts",
  "apps/loom/src/tooling/extensions/annotations/intarray.ts",
  "apps/loom/src/tooling/extensions/annotations/ip4r.ts",
  "apps/loom/src/tooling/extensions/annotations/isn.ts",
  "apps/loom/src/tooling/extensions/annotations/lakebase-text.ts",
  "apps/loom/src/tooling/extensions/annotations/lakebase-vector.ts",
  "apps/loom/src/tooling/extensions/annotations/lakebase_tokenizer.ts",
  "apps/loom/src/tooling/extensions/annotations/lo.ts",
  "apps/loom/src/tooling/extensions/annotations/ltree.ts",
  "apps/loom/src/tooling/extensions/annotations/moddatetime.ts",
  "apps/loom/src/tooling/extensions/annotations/neon.ts",
  "apps/loom/src/tooling/extensions/annotations/neon_utils.ts",
  "apps/loom/src/tooling/extensions/annotations/pg-hashids.ts",
  "apps/loom/src/tooling/extensions/annotations/pg-jsonschema.ts",
  "apps/loom/src/tooling/extensions/annotations/pg-tiktoken.ts",
  "apps/loom/src/tooling/extensions/annotations/pg-trgm.ts",
  "apps/loom/src/tooling/extensions/annotations/pg-uuidv7.ts",
  "apps/loom/src/tooling/extensions/annotations/pg_cron.ts",
  "apps/loom/src/tooling/extensions/annotations/pg_graphql.ts",
  "apps/loom/src/tooling/extensions/annotations/pg_hint_plan.ts",
  "apps/loom/src/tooling/extensions/annotations/pg_partman.ts",
  "apps/loom/src/tooling/extensions/annotations/pg_prewarm.ts",
  "apps/loom/src/tooling/extensions/annotations/pg_repack.ts",
  "apps/loom/src/tooling/extensions/annotations/pg_session_jwt.ts",
  "apps/loom/src/tooling/extensions/annotations/pg_stat_statements.ts",
  "apps/loom/src/tooling/extensions/annotations/pgcrypto.ts",
  "apps/loom/src/tooling/extensions/annotations/pgjwt.ts",
  "apps/loom/src/tooling/extensions/annotations/pgrouting.ts",
  "apps/loom/src/tooling/extensions/annotations/pgrowlocks.ts",
  "apps/loom/src/tooling/extensions/annotations/pgstattuple.ts",
  "apps/loom/src/tooling/extensions/annotations/pgtap.ts",
  "apps/loom/src/tooling/extensions/annotations/pgx-ulid.ts",
  "apps/loom/src/tooling/extensions/annotations/plpgsql_check.ts",
  "apps/loom/src/tooling/extensions/annotations/postgis-topology.ts",
  "apps/loom/src/tooling/extensions/annotations/postgis.ts",
  "apps/loom/src/tooling/extensions/annotations/postgis_raster.ts",
  "apps/loom/src/tooling/extensions/annotations/postgis_sfcgal.ts",
  "apps/loom/src/tooling/extensions/annotations/postgis_tiger_geocoder.ts",
  "apps/loom/src/tooling/extensions/annotations/postgres_fdw.ts",
  "apps/loom/src/tooling/extensions/annotations/prefix.ts",
  "apps/loom/src/tooling/extensions/annotations/rdkit.ts",
  "apps/loom/src/tooling/extensions/annotations/refint.ts",
  "apps/loom/src/tooling/extensions/annotations/roaringbitmap.ts",
  "apps/loom/src/tooling/extensions/annotations/seg.ts",
  "apps/loom/src/tooling/extensions/annotations/semver.ts",
  "apps/loom/src/tooling/extensions/annotations/tablefunc.ts",
  "apps/loom/src/tooling/extensions/annotations/tcn.ts",
  "apps/loom/src/tooling/extensions/annotations/timescaledb.ts",
  "apps/loom/src/tooling/extensions/annotations/tsm-system-rows.ts",
  "apps/loom/src/tooling/extensions/annotations/tsm-system-time.ts",
  "apps/loom/src/tooling/extensions/annotations/unaccent.ts",
  "apps/loom/src/tooling/extensions/annotations/uuid-ossp.ts",
  "apps/loom/src/tooling/extensions/annotations/xml2.ts",
  "apps/loom/src/tooling/extensions/capture.ts",
  "apps/loom/src/tooling/extensions/manifests/address_standardizer.json",
  "apps/loom/src/tooling/extensions/manifests/address_standardizer_data_us.json",
  "apps/loom/src/tooling/extensions/manifests/anon.json",
  "apps/loom/src/tooling/extensions/manifests/autoinc.json",
  "apps/loom/src/tooling/extensions/manifests/bloom.json",
  "apps/loom/src/tooling/extensions/manifests/btree_gin.json",
  "apps/loom/src/tooling/extensions/manifests/btree_gist.json",
  "apps/loom/src/tooling/extensions/manifests/citext.json",
  "apps/loom/src/tooling/extensions/manifests/cube.json",
  "apps/loom/src/tooling/extensions/manifests/dblink.json",
  "apps/loom/src/tooling/extensions/manifests/dict_int.json",
  "apps/loom/src/tooling/extensions/manifests/earthdistance.json",
  "apps/loom/src/tooling/extensions/manifests/fuzzystrmatch.json",
  "apps/loom/src/tooling/extensions/manifests/h3.json",
  "apps/loom/src/tooling/extensions/manifests/h3_postgis.json",
  "apps/loom/src/tooling/extensions/manifests/hll.json",
  "apps/loom/src/tooling/extensions/manifests/hstore.json",
  "apps/loom/src/tooling/extensions/manifests/hypopg.json",
  "apps/loom/src/tooling/extensions/manifests/insert_username.json",
  "apps/loom/src/tooling/extensions/manifests/intagg.json",
  "apps/loom/src/tooling/extensions/manifests/intarray.json",
  "apps/loom/src/tooling/extensions/manifests/ip4r.json",
  "apps/loom/src/tooling/extensions/manifests/isn.json",
  "apps/loom/src/tooling/extensions/manifests/lakebase_text.json",
  "apps/loom/src/tooling/extensions/manifests/lakebase_tokenizer.json",
  "apps/loom/src/tooling/extensions/manifests/lakebase_vector.json",
  "apps/loom/src/tooling/extensions/manifests/lo.json",
  "apps/loom/src/tooling/extensions/manifests/ltree.json",
  "apps/loom/src/tooling/extensions/manifests/moddatetime.json",
  "apps/loom/src/tooling/extensions/manifests/neon.json",
  "apps/loom/src/tooling/extensions/manifests/neon_utils.json",
  "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
  "apps/loom/src/tooling/extensions/manifests/pg_graphql.json",
  "apps/loom/src/tooling/extensions/manifests/pg_hashids.json",
  "apps/loom/src/tooling/extensions/manifests/pg_hint_plan.json",
  "apps/loom/src/tooling/extensions/manifests/pg_jsonschema.json",
  "apps/loom/src/tooling/extensions/manifests/pg_partman.json",
  "apps/loom/src/tooling/extensions/manifests/pg_prewarm.json",
  "apps/loom/src/tooling/extensions/manifests/pg_repack.json",
  "apps/loom/src/tooling/extensions/manifests/pg_session_jwt.json",
  "apps/loom/src/tooling/extensions/manifests/pg_stat_statements.json",
  "apps/loom/src/tooling/extensions/manifests/pg_tiktoken.json",
  "apps/loom/src/tooling/extensions/manifests/pg_trgm.json",
  "apps/loom/src/tooling/extensions/manifests/pg_uuidv7.json",
  "apps/loom/src/tooling/extensions/manifests/pgcrypto.json",
  "apps/loom/src/tooling/extensions/manifests/pgjwt.json",
  "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
  "apps/loom/src/tooling/extensions/manifests/pgrowlocks.json",
  "apps/loom/src/tooling/extensions/manifests/pgstattuple.json",
  "apps/loom/src/tooling/extensions/manifests/pgtap.json",
  "apps/loom/src/tooling/extensions/manifests/pgx_ulid.json",
  "apps/loom/src/tooling/extensions/manifests/plpgsql_check.json",
  "apps/loom/src/tooling/extensions/manifests/postgis.json",
  "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
  "apps/loom/src/tooling/extensions/manifests/postgis_sfcgal.json",
  "apps/loom/src/tooling/extensions/manifests/postgis_tiger_geocoder.json",
  "apps/loom/src/tooling/extensions/manifests/postgis_topology.json",
  "apps/loom/src/tooling/extensions/manifests/postgres_fdw.json",
  "apps/loom/src/tooling/extensions/manifests/prefix.json",
  "apps/loom/src/tooling/extensions/manifests/rdkit.json",
  "apps/loom/src/tooling/extensions/manifests/refint.json",
  "apps/loom/src/tooling/extensions/manifests/roaringbitmap.json",
  "apps/loom/src/tooling/extensions/manifests/seg.json",
  "apps/loom/src/tooling/extensions/manifests/semver.json",
  "apps/loom/src/tooling/extensions/manifests/tablefunc.json",
  "apps/loom/src/tooling/extensions/manifests/tcn.json",
  "apps/loom/src/tooling/extensions/manifests/timescaledb.json",
  "apps/loom/src/tooling/extensions/manifests/tsm_system_rows.json",
  "apps/loom/src/tooling/extensions/manifests/tsm_system_time.json",
  "apps/loom/src/tooling/extensions/manifests/unaccent.json",
  "apps/loom/src/tooling/extensions/manifests/uuid-ossp.json",
  "apps/loom/src/tooling/extensions/manifests/vector.json",
  "apps/loom/src/tooling/extensions/manifests/xml2.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "apps/loom/src/tooling/extensions/subscript-capture.ts",
  "apps/loom/src/tooling/extensions/text-search-capture.ts",
  "apps/loom/src/tooling/extensions/text-search-contracts/dict_int.json",
  "apps/loom/src/tooling/extensions/text-search-contracts/unaccent.json",
  "apps/loom/src/tooling/extensions/verify.ts",
  "apps/loom/src/tooling/migrations/adapter.ts",
  "apps/loom/src/tooling/migrations/connection.ts",
  "apps/loom/src/tooling/migrations/expressions.ts",
  "apps/loom/src/tooling/migrations/extension-compatibility.ts",
  "apps/loom/src/tooling/migrations/extension-membership.ts",
  "apps/loom/src/tooling/migrations/extensions.ts",
  "apps/loom/src/tooling/migrations/required-api-verification.ts",
  "apps/loom/src/tooling/migrations/required-api.ts",
  "apps/loom/src/tooling/migrations/snapshot.ts",
  "apps/loom/src/tooling/extensions/catalogue.json",
  "packages/e2e/fixtures/bloom-proof-cases.ts",
  "packages/e2e/fixtures/bloom-proof-sources.json",
  "packages/e2e/fixtures/bloom-semantic-proof.ts",
  "packages/e2e/fixtures/extension-proof.ts",
  "packages/e2e/scripts/run-bloom-unit-types-proof.ts",
  "packages/tests/unit/extensions-bloom.test.ts",
];
const reviewedTypesSources: readonly string[] = [
  "apps/loom/dist/bindings-BqHqrfkr.d.ts",
  "apps/loom/dist/bindings-cM3hyHEU.js",
  "apps/loom/dist/codecs-9pSmQAje.d.ts",
  "apps/loom/dist/core/extensions/adapters/bloom.d.ts",
  "apps/loom/dist/core/extensions/adapters/bloom.js",
  "apps/loom/dist/core/server/index.d.ts",
  "apps/loom/dist/fields-8Q6rzw1z.d.ts",
  "apps/loom/dist/index-CScwMZ0X.d.ts",
  "apps/loom/dist/nested-query-Dg2wGwsv.d.ts",
  "apps/loom/dist/procedure-BcX-ze4K.d.ts",
  "apps/loom/dist/search-types-9gkWtZrw.d.ts",
  "apps/loom/src/core/adapters/neon/abortable.ts",
  "apps/loom/src/core/adapters/neon/auth-http.ts",
  "apps/loom/src/core/adapters/neon/auth.ts",
  "apps/loom/src/core/adapters/neon/neon-auth-http.ts",
  "apps/loom/src/core/adapters/neon/request-bytes.ts",
  "apps/loom/src/core/better-auth/database.ts",
  "apps/loom/src/core/better-auth/definition.ts",
  "apps/loom/src/core/better-auth/resolve.ts",
  "apps/loom/src/core/better-auth/runtime.ts",
  "apps/loom/src/core/better-auth/schema.ts",
  "apps/loom/src/core/better-auth/state.ts",
  "apps/loom/src/core/better-auth/trust.ts",
  "apps/loom/src/core/client/search-types.ts",
  "apps/loom/src/core/contract/index.ts",
  "apps/loom/src/core/extensions/adapters/bloom.ts",
  "apps/loom/src/core/extensions/bindings.ts",
  "apps/loom/src/core/extensions/codecs.ts",
  "apps/loom/src/core/extensions/contracts.ts",
  "apps/loom/src/core/extensions/fields.ts",
  "apps/loom/src/core/extensions/json-transport.ts",
  "apps/loom/src/core/extensions/nested-query-private.ts",
  "apps/loom/src/core/extensions/nested-query.ts",
  "apps/loom/src/core/extensions/pgcrypto-pgp-admission.ts",
  "apps/loom/src/core/extensions/registry.ts",
  "apps/loom/src/core/extensions/sql.ts",
  "apps/loom/src/core/extensions/triggers.ts",
  "apps/loom/src/core/extensions/values.ts",
  "apps/loom/src/core/schema/compile.ts",
  "apps/loom/src/core/schema/define-schema.ts",
  "apps/loom/src/core/schema/fields.ts",
  "apps/loom/src/core/schema/system-fields.ts",
  "apps/loom/src/core/schema/table.ts",
  "apps/loom/src/core/search/compiler.ts",
  "apps/loom/src/core/search/contract.ts",
  "apps/loom/src/core/search/cursor.ts",
  "apps/loom/src/core/search/errors.ts",
  "apps/loom/src/core/search/executor.ts",
  "apps/loom/src/core/search/json-schema.ts",
  "apps/loom/src/core/search/metadata.ts",
  "apps/loom/src/core/search/ordering.ts",
  "apps/loom/src/core/search/pagination.ts",
  "apps/loom/src/core/search/public.ts",
  "apps/loom/src/core/search/timestamp.ts",
  "apps/loom/src/core/search/types.ts",
  "apps/loom/src/core/server/activation.ts",
  "apps/loom/src/core/server/application/definition.ts",
  "apps/loom/src/core/server/application/environment.ts",
  "apps/loom/src/core/server/auth/config.ts",
  "apps/loom/src/core/server/auth/configuration.ts",
  "apps/loom/src/core/server/auth/context.ts",
  "apps/loom/src/core/server/auth/policy.ts",
  "apps/loom/src/core/server/auth/rpc-definition.ts",
  "apps/loom/src/core/server/auth/tickets.ts",
  "apps/loom/src/core/server/auth/verify.ts",
  "apps/loom/src/core/server/components/callers.ts",
  "apps/loom/src/core/server/components/definition.ts",
  "apps/loom/src/core/server/components/environment.ts",
  "apps/loom/src/core/server/components/graph.ts",
  "apps/loom/src/core/server/components/http.ts",
  "apps/loom/src/core/server/components/package.ts",
  "apps/loom/src/core/server/components/services.ts",
  "apps/loom/src/core/server/config.ts",
  "apps/loom/src/core/server/cookie-session.ts",
  "apps/loom/src/core/server/database/cancel.ts",
  "apps/loom/src/core/server/database/connection.ts",
  "apps/loom/src/core/server/database/context.ts",
  "apps/loom/src/core/server/database/pool.ts",
  "apps/loom/src/core/server/database/relations.ts",
  "apps/loom/src/core/server/effect/runtime.ts",
  "apps/loom/src/core/server/effect/services.ts",
  "apps/loom/src/core/server/idempotency.ts",
  "apps/loom/src/core/server/index.ts",
  "apps/loom/src/core/server/ingress.ts",
  "apps/loom/src/core/server/jobs/contracts.ts",
  "apps/loom/src/core/server/jobs/durable-crons.ts",
  "apps/loom/src/core/server/jobs/durable-queue.ts",
  "apps/loom/src/core/server/jobs/durable-worker.ts",
  "apps/loom/src/core/server/jobs/rpc-contracts.ts",
  "apps/loom/src/core/server/jobs/rpc-crons.ts",
  "apps/loom/src/core/server/jobs/rpc-migrations.ts",
  "apps/loom/src/core/server/jobs/rpc-queue.ts",
  "apps/loom/src/core/server/jobs/rpc-scheduler.ts",
  "apps/loom/src/core/server/jobs/rpc-service.ts",
  "apps/loom/src/core/server/jobs/rpc-worker.ts",
  "apps/loom/src/core/server/observability.ts",
  "apps/loom/src/core/server/realtime/coordinator.ts",
  "apps/loom/src/core/server/realtime/notifications.ts",
  "apps/loom/src/core/server/realtime/revisions.ts",
  "apps/loom/src/core/server/rpc-runtime.ts",
  "apps/loom/src/core/server/rpc/capabilities.ts",
  "apps/loom/src/core/server/rpc/database.ts",
  "apps/loom/src/core/server/rpc/error-status.ts",
  "apps/loom/src/core/server/rpc/live-context.ts",
  "apps/loom/src/core/server/rpc/openapi.ts",
  "apps/loom/src/core/server/rpc/procedure.ts",
  "apps/loom/src/core/server/rpc/replay.ts",
  "apps/loom/src/core/server/rpc/runtime-graph.ts",
  "apps/loom/src/core/server/rpc/serialization.ts",
  "apps/loom/src/core/server/rpc/snapshot-stream.ts",
  "apps/loom/src/core/server/rpc/snapshot.ts",
  "apps/loom/src/core/server/rpc/stream-lifetime.ts",
  "apps/loom/src/core/server/rpc/stream.ts",
  "apps/loom/src/core/server/runtime-contracts.ts",
  "apps/loom/src/core/server/storage/cleanup.ts",
  "apps/loom/src/core/server/storage/component-runtime.ts",
  "apps/loom/src/core/server/storage/contracts.ts",
  "apps/loom/src/core/server/storage/durable-events.ts",
  "apps/loom/src/core/server/storage/intents.ts",
  "apps/loom/src/core/server/storage/invocation.ts",
  "apps/loom/src/core/server/storage/keys.ts",
  "apps/loom/src/core/server/storage/rpc-events.ts",
  "apps/loom/src/core/server/transactions.ts",
  "apps/loom/src/core/validation/canonical.ts",
  "apps/loom/src/core/validation/derive.ts",
  "apps/loom/src/core/validation/encoding.ts",
  "apps/loom/src/core/validation/storage.ts",
  "apps/loom/src/core/validation/types.ts",
  "apps/loom/src/tooling/codegen/extensions.ts",
  "apps/loom/src/tooling/extensions/annotations/bloom.ts",
  "apps/loom/src/tooling/extensions/manifests/address_standardizer.json",
  "apps/loom/src/tooling/extensions/manifests/address_standardizer_data_us.json",
  "apps/loom/src/tooling/extensions/manifests/anon.json",
  "apps/loom/src/tooling/extensions/manifests/autoinc.json",
  "apps/loom/src/tooling/extensions/manifests/bloom.json",
  "apps/loom/src/tooling/extensions/manifests/btree_gin.json",
  "apps/loom/src/tooling/extensions/manifests/btree_gist.json",
  "apps/loom/src/tooling/extensions/manifests/citext.json",
  "apps/loom/src/tooling/extensions/manifests/cube.json",
  "apps/loom/src/tooling/extensions/manifests/dblink.json",
  "apps/loom/src/tooling/extensions/manifests/dict_int.json",
  "apps/loom/src/tooling/extensions/manifests/earthdistance.json",
  "apps/loom/src/tooling/extensions/manifests/fuzzystrmatch.json",
  "apps/loom/src/tooling/extensions/manifests/h3.json",
  "apps/loom/src/tooling/extensions/manifests/h3_postgis.json",
  "apps/loom/src/tooling/extensions/manifests/hll.json",
  "apps/loom/src/tooling/extensions/manifests/hstore.json",
  "apps/loom/src/tooling/extensions/manifests/hypopg.json",
  "apps/loom/src/tooling/extensions/manifests/insert_username.json",
  "apps/loom/src/tooling/extensions/manifests/intagg.json",
  "apps/loom/src/tooling/extensions/manifests/intarray.json",
  "apps/loom/src/tooling/extensions/manifests/ip4r.json",
  "apps/loom/src/tooling/extensions/manifests/isn.json",
  "apps/loom/src/tooling/extensions/manifests/lakebase_text.json",
  "apps/loom/src/tooling/extensions/manifests/lakebase_tokenizer.json",
  "apps/loom/src/tooling/extensions/manifests/lakebase_vector.json",
  "apps/loom/src/tooling/extensions/manifests/lo.json",
  "apps/loom/src/tooling/extensions/manifests/ltree.json",
  "apps/loom/src/tooling/extensions/manifests/moddatetime.json",
  "apps/loom/src/tooling/extensions/manifests/neon.json",
  "apps/loom/src/tooling/extensions/manifests/neon_utils.json",
  "apps/loom/src/tooling/extensions/manifests/pg_cron.json",
  "apps/loom/src/tooling/extensions/manifests/pg_graphql.json",
  "apps/loom/src/tooling/extensions/manifests/pg_hashids.json",
  "apps/loom/src/tooling/extensions/manifests/pg_hint_plan.json",
  "apps/loom/src/tooling/extensions/manifests/pg_jsonschema.json",
  "apps/loom/src/tooling/extensions/manifests/pg_partman.json",
  "apps/loom/src/tooling/extensions/manifests/pg_prewarm.json",
  "apps/loom/src/tooling/extensions/manifests/pg_repack.json",
  "apps/loom/src/tooling/extensions/manifests/pg_session_jwt.json",
  "apps/loom/src/tooling/extensions/manifests/pg_stat_statements.json",
  "apps/loom/src/tooling/extensions/manifests/pg_tiktoken.json",
  "apps/loom/src/tooling/extensions/manifests/pg_trgm.json",
  "apps/loom/src/tooling/extensions/manifests/pg_uuidv7.json",
  "apps/loom/src/tooling/extensions/manifests/pgcrypto.json",
  "apps/loom/src/tooling/extensions/manifests/pgjwt.json",
  "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
  "apps/loom/src/tooling/extensions/manifests/pgrowlocks.json",
  "apps/loom/src/tooling/extensions/manifests/pgstattuple.json",
  "apps/loom/src/tooling/extensions/manifests/pgtap.json",
  "apps/loom/src/tooling/extensions/manifests/pgx_ulid.json",
  "apps/loom/src/tooling/extensions/manifests/plpgsql_check.json",
  "apps/loom/src/tooling/extensions/manifests/postgis.json",
  "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
  "apps/loom/src/tooling/extensions/manifests/postgis_sfcgal.json",
  "apps/loom/src/tooling/extensions/manifests/postgis_tiger_geocoder.json",
  "apps/loom/src/tooling/extensions/manifests/postgis_topology.json",
  "apps/loom/src/tooling/extensions/manifests/postgres_fdw.json",
  "apps/loom/src/tooling/extensions/manifests/prefix.json",
  "apps/loom/src/tooling/extensions/manifests/rdkit.json",
  "apps/loom/src/tooling/extensions/manifests/refint.json",
  "apps/loom/src/tooling/extensions/manifests/roaringbitmap.json",
  "apps/loom/src/tooling/extensions/manifests/seg.json",
  "apps/loom/src/tooling/extensions/manifests/semver.json",
  "apps/loom/src/tooling/extensions/manifests/tablefunc.json",
  "apps/loom/src/tooling/extensions/manifests/tcn.json",
  "apps/loom/src/tooling/extensions/manifests/timescaledb.json",
  "apps/loom/src/tooling/extensions/manifests/tsm_system_rows.json",
  "apps/loom/src/tooling/extensions/manifests/tsm_system_time.json",
  "apps/loom/src/tooling/extensions/manifests/unaccent.json",
  "apps/loom/src/tooling/extensions/manifests/uuid-ossp.json",
  "apps/loom/src/tooling/extensions/manifests/vector.json",
  "apps/loom/src/tooling/extensions/manifests/xml2.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "apps/loom/src/tooling/extensions/subscript-capture.ts",
  "apps/loom/src/tooling/extensions/text-search-capture.ts",
  "apps/loom/src/tooling/extensions/text-search-contracts/dict_int.json",
  "apps/loom/src/tooling/extensions/text-search-contracts/unaccent.json",
  "apps/loom/src/tooling/migrations/extension-membership.ts",
  "apps/loom/src/tooling/extensions/catalogue.json",
  "packages/e2e/fixtures/bloom-proof-cases.ts",
  "packages/e2e/fixtures/bloom-proof-sources.json",
  "packages/e2e/fixtures/bloom-semantic-proof.ts",
  "packages/e2e/fixtures/extension-proof.ts",
  "packages/e2e/scripts/run-bloom-unit-types-proof.ts",
  "packages/tests/types/extensions-bloom.test-d.ts",
];
// This host retains actual run receipts in scratch; retention into repository evidence is a separate verified step.
const root = realpathSync(fileURLToPath(new URL("../../../", import.meta.url)));
const { build }: Pick<typeof import("../../../apps/loom/node_modules/esbuild/lib/main.js"), "build"> = createRequire(
  join(root, "apps/loom/package.json"),
)("esbuild");
const driver = "packages/e2e/scripts/run-bloom-unit-types-proof.ts";
assert.equal(realpathSync(join(root, driver)), realpathSync(fileURLToPath(import.meta.url)));
const gate = process.argv[2];
assert(gate === "unit" || gate === "types", "Usage: bun packages/e2e/scripts/run-bloom-unit-types-proof.ts unit|types");
const definition = gate === "unit" ? bloomUnitProofCase : bloomTypesProofCase;
const runId = `bloom.${gate}.${randomUUID()}`;
const directory = realpathSync(mkdtempSync(join(tmpdir(), `loom-bloom-${gate}-proof-`)));
const eventsFile = join(directory, "cases.jsonl");
const tests = [bloomUnitProofCase.file];

function sourcePath(path: string) {
  const physical = realpathSync(path);
  assert(physical.startsWith(root + sep), `Proof source escapes checkout: ${path}`);
  return relative(root, physical).split(sep).join("/");
}
function runnerPackageSources(packageRoot: string): string[] {
  const files: string[] = [];
  function visit(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory() && entry.name !== "node_modules") visit(path);
      else if (
        entry.isFile() &&
        (/\.(?:[cm]?js|json|node)$/.test(entry.name) || directory === join(packageRoot, "bin"))
      )
        files.push(sourcePath(path));
    }
  }
  visit(packageRoot);
  return files;
}
function execute(command: string[], cwd = root, env: NodeJS.ProcessEnv = process.env) {
  const child = spawnSync(command[0]!, command.slice(1), { cwd, env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (child.error) throw child.error;
  return child;
}
function requireSuccess(child: ReturnType<typeof execute>, label: string) {
  writeFileSync(join(directory, `${label}.log`), child.stdout + child.stderr, { mode: 0o600 });
  assert.equal(child.status, 0, `${label} failed; diagnostic retained in ${directory}`);
  assert.equal(child.signal, null, `${label} was terminated`);
}
const capturing = process.env.LOOM_CAPTURE_ROSTER === "1";
const reviewed: readonly string[] = gate === "unit" ? reviewedUnitSources : reviewedTypesSources;
assert(capturing || reviewed.includes(driver), "Reviewed roster must include this host");
// This matches the existing host's packages-external repository graph capture. Public JS
// entries are explicit roots, so the package export boundary is not hidden by externalization.
const graph = await build({
  absWorkingDir: root,
  entryPoints: [...(gate === "unit" ? tests : []), driver, "apps/loom/dist/core/extensions/adapters/bloom.js"],
  bundle: true,
  write: false,
  metafile: true,
  platform: "node",
  format: "esm",
  packages: "external",
  target: "esnext",
  external: ["bun:test"],
  outdir: join(directory, "unused-graph-output"),
});
const graphSources = Object.keys(graph.metafile!.inputs).map((file) => sourcePath(resolve(root, file)));
if (!capturing)
  assert(
    graphSources.every((file) => reviewed.includes(file)),
    `Reviewed source roster omits repository imports: ${graphSources.filter((file) => !reviewed.includes(file)).join(", ")}`,
  );
// Bind the generator and reviewed repository inputs before emitting the derived type probes.
// Compiler input discovery adds third-party declarations later without moving this boundary.
const repositorySourcesBefore = [
  ...new Set([...(capturing ? [] : reviewed), ...graphSources, ...bloomGateProofSources[gate]]),
]
  .sort()
  .map((file) => ({
    file,
    sha256: createHash("sha256")
      .update(readFileSync(join(root, file)))
      .digest("hex"),
  }));
let command: string[];
let runnerVersion: string;
let derived: { file: string; sha256: string }[] = [];
let compilerInputs: string[] = [];
const capturedCompilerSources: string[] = [];
const extraSources: string[] = [sourcePath(join(root, "apps/loom/node_modules/esbuild/lib/main.js"))];
const compiler = join(root, "packages/tests/node_modules/.bin/tsc");
if (gate === "types") {
  const compilerRoot = dirname(dirname(realpathSync(compiler)));
  extraSources.push(...runnerPackageSources(compilerRoot));
  // TypeScript 7's launcher delegates to a real platform binary. Bind that executable,
  // not merely the tiny launcher. Resolution mirrors the inspected installed getExePath.
  const platformPackage = createRequire(realpathSync(compiler)).resolve(
    `@typescript/typescript-${process.platform}-${process.arch}/package.json`,
  );
  extraSources.push(
    sourcePath(platformPackage),
    sourcePath(join(dirname(platformPackage), "lib", process.platform === "win32" ? "tsc.exe" : "tsc")),
  );
  // These are actual production-emitted files, not manually supplied expected bindings.
  // The temporary consumer uses the same physical published package/declaration installation.
  symlinkSync(join(root, "packages/tests/node_modules"), join(directory, "node_modules"), "dir");
  const selections = {
    standard: { bloom: { version: "1.0", schema: "extensions" } },
    custom: { bloom: { version: "1.0", schema: 'typed"bloom' } },
    absent: undefined,
    empty: {},
    future: { bloom: { version: "future", schema: "extensions" } },
  } as const;
  for (const [name, selection] of Object.entries(selections))
    writeFileSync(join(directory, `${name}.ts`), extensionBindingsSource(selection));
  writeFileSync(
    join(directory, "generated-contracts.test-d.ts"),
    `
import { defineSchema, defineTable } from "kello/server";
import { extensions as standard } from "./standard";
import { extensions as custom } from "./custom";
import { extensions as absent } from "./absent";
import { extensions as empty } from "./empty";
import { extensions as future } from "./future";
const api = custom.bloom;
const placement: 'typed"bloom' = api.schema;
const defaultSchema: "extensions" = standard.bloom.schema;
const version: "1.0" = api.version;
const unique: false = api.accessMethod.unique;
const strategies: readonly ["="] = api.accessMethod.strategies;
const int4: { readonly method: string; readonly opclass: string; readonly member: string } = api.indexes.int4();
const text: { readonly method: string; readonly opclass: string; readonly member: string } = api.indexes.text();
const storage: Readonly<Record<string, number>> = api.storage({ length: 80, bits: [2, 4] });
defineSchema(
  (fields) => ({
    entries: defineTable(
      { code: fields.integer(), label: fields.text(), region: fields.text() },
      {
        indexes: [
          { fields: ["code"], extension: api.indexes.int4(), with: api.storage({ length: 80, bits: [3] }) },
          { fields: ["label", "region"], extension: api.indexes.text(), with: storage },
        ],
      },
    ),
  }),
  { namespace: "app" },
);
const missing: undefined = absent;
const noSelection: undefined = empty;
// @ts-expect-error Only the captured int4 and text classes exist.
api.indexes.int8();
// @ts-expect-error fillfactor is not a bloom storage parameter.
api.storage({ fillfactor: 50 });
// @ts-expect-error Signature bits are numbers, not bigint.
api.storage({ bits: [1n] });
// @ts-expect-error The access method has no scalar SQL helpers.
void api.sql;
// @ts-expect-error Unselected families remain absent.
void custom.unaccent;
// @ts-expect-error Future versions expose descriptors only.
void future.bloom.indexes;
void [placement, defaultSchema, version, unique, strategies, int4, text, missing, noSelection];
`,
  );
  const config = join(directory, "tsconfig.json");
  writeFileSync(
    config,
    JSON.stringify(
      {
        extends: join(root, "packages/tests/tsconfig.json"),
        compilerOptions: { noEmit: true, incremental: false },
        include: [],
        files: [join(root, bloomTypesProofCase.file), join(directory, "generated-contracts.test-d.ts")],
      },
      null,
      2,
    ) + "\n",
  );
  command = [compiler, "-p", config, "--pretty", "false", "--noEmit", "--listFiles"];
  const version = execute([compiler, "--version"]);
  requireSuccess(version, "compiler-version");
  runnerVersion = /^Version\s+(\S+)/m.exec(version.stdout)?.[1] ?? "";
  assert(runnerVersion, "Compiler did not identify its actual version");
  const discovery = execute([compiler, "-p", config, "--pretty", "false", "--listFilesOnly"]);
  requireSuccess(discovery, "compiler-input-discovery");
  compilerInputs = discovery.stdout
    .split(/\r?\n/)
    .filter((line) => isAbsolute(line.trim()))
    .map((line) => realpathSync(line.trim()))
    .sort();
  assert(
    compilerInputs.includes(realpathSync(join(root, definition.file))),
    "Registered type file was not a compiler input",
  );
  assert(
    compilerInputs.includes(realpathSync(join(directory, "generated-contracts.test-d.ts"))),
    "Generated probe was not a compiler input",
  );
  for (const path of compilerInputs) {
    if (path.startsWith(directory + sep)) continue;
    const file = sourcePath(path);
    // The compiler itself supplies the installed declaration closure. Repository files
    // require reviewed registration; lock-bound third-party inputs are byte-hashed too.
    if (capturing && !file.startsWith("node_modules/")) capturedCompilerSources.push(file);
    else
      assert(
        file.startsWith("node_modules/") || reviewed.includes(file),
        `Unreviewed compiler repository input: ${file}`,
      );
    extraSources.push(file);
  }
  derived = [
    "standard.ts",
    "custom.ts",
    "absent.ts",
    "empty.ts",
    "future.ts",
    "generated-contracts.test-d.ts",
    "tsconfig.json",
  ].map((file) => ({
    file,
    sha256: createHash("sha256")
      .update(readFileSync(join(directory, file)))
      .digest("hex"),
  }));
  extraSources.push(sourcePath(compiler));
} else {
  command = [
    join(root, "packages/tests/node_modules/.bin/vp"),
    "test",
    "run",
    ...tests.map((file) => relative(join(root, "packages/tests"), join(root, file))),
    "--reporter=default",
    "--reporter=json",
    `--outputFile.json=${join(directory, "vitest.json")}`,
  ];
  extraSources.push(sourcePath(command[0]!));
  const runnerRoot = dirname(dirname(realpathSync(command[0]!)));
  extraSources.push(...runnerPackageSources(runnerRoot));
  // vp test resolves its bundled Vitest first, matching vite-plus/test. Bind its real JS
  // implementation and manifest independently of the runner banner used in the receipt.
  const vitestPackage = createRequire(join(runnerRoot, "package.json")).resolve("vitest/package.json");
  extraSources.push(...runnerPackageSources(dirname(vitestPackage)));
  runnerVersion = ""; // Captured from the actual run banner, never a hard-coded package version.
}
// Capture prints the actual reached repository closure for review; it never produces a receipt.
if (capturing) {
  console.log(
    JSON.stringify({ gate, reached: [...new Set([...graphSources, ...capturedCompilerSources])].sort() }, null, 2),
  );
  process.exit(0);
}
const sourceFiles = [
  ...new Set([...reviewed, ...graphSources, ...bloomGateProofSources[gate], ...extraSources]),
].sort();
function hashSources() {
  return sourceFiles.map((file) => ({
    file,
    sha256: createHash("sha256")
      .update(readFileSync(join(root, sourcePath(join(root, file)))))
      .digest("hex"),
  }));
}
const sourcesBefore = hashSources();
for (const source of repositorySourcesBefore)
  assert.equal(
    sourcesBefore.find((entry) => entry.file === source.file)?.sha256,
    source.sha256,
    "Repository source changed during generation or compiler input discovery",
  );
writeFileSync(
  join(directory, "host-before.json"),
  JSON.stringify({ runId, command, sourcesBefore, derived, compilerInputs }, null, 2) + "\n",
  { mode: 0o600 },
);
function record(event: ExtensionProofEvent) {
  appendFileSync(eventsFile, JSON.stringify(event) + "\n", { mode: 0o600 });
}
// For type gates, the host owns the actual compiler invocation and its observed terminal.
// There is no executed declaration callback and no success event before compiler exit zero.
if (gate === "types") {
  record({ runId, kind: "registered", definition });
  record({ runId, kind: "started", caseId: definition.id });
}
const child = execute(command, gate === "unit" ? join(root, "packages/tests") : root, {
  ...process.env,
  CI: "1",
  NO_COLOR: "1",
  LOOM_EXTENSION_PROOF_RUN_ID: runId,
  LOOM_EXTENSION_PROOF_OUTPUT: eventsFile,
});
if (gate === "types")
  record({
    runId,
    kind: "terminal",
    caseId: definition.id,
    status: child.status === 0 && child.signal === null ? "passed" : "failed",
    witnessFailures: 0,
  });
requireSuccess(child, "runner");
if (gate === "unit") {
  const output = (child.stdout + child.stderr).replace(new RegExp(String.fromCharCode(27) + "\\[[0-9;]*m", "g"), "");
  runnerVersion = /\bRUN\s+v([^\s]+)/.exec(output)?.[1] ?? "";
  assert(runnerVersion, "Vitest did not identify its actual run version");
  const report = JSON.parse(readFileSync(join(directory, "vitest.json"), "utf8"));
  assert.equal(report.success, true);
  assert.equal(report.numFailedTests, 0);
  assert.equal(report.numPendingTests, 0);
  assert.equal(report.numTodoTests, 0);
  assert.equal(report.numPassedTests, report.numTotalTests);
  assert.equal(report.testResults.length, tests.length);
  for (const file of tests) {
    const suites = report.testResults.filter(
      (suite: { name: string }) => realpathSync(suite.name) === realpathSync(join(root, file)),
    );
    assert.equal(suites.length, 1, `Missing or duplicate actual test file: ${file}`);
    const suite = suites[0];
    assert.equal(suite.status, "passed");
    assert(suite.assertionResults.length > 0, "Empty unit suite cannot prove a gate");
    assert(
      suite.assertionResults.every((test: { status: string }) => test.status === "passed"),
      "Skipped, todo or failed unit case",
    );
  }
  const registered = report.testResults.flatMap(
    (suite: { name: string; assertionResults: { title: string; status: string }[] }) =>
      suite.assertionResults
        .filter((test) => test.title === definition.title)
        .map((test) => ({ file: realpathSync(suite.name), ...test })),
  );
  assert.equal(registered.length, 1, "Registered unit proof case was missing or duplicated");
  assert.equal(registered[0].file, realpathSync(join(root, definition.file)));
  assert.equal(registered[0].status, "passed");
} else {
  const actualInputs = child.stdout
    .split(/\r?\n/)
    .filter((line) => isAbsolute(line.trim()))
    .map((line) => realpathSync(line.trim()))
    .sort();
  assert.deepEqual(actualInputs, compilerInputs, "Compiler input closure changed during execution");
  for (const source of derived)
    assert.equal(
      createHash("sha256")
        .update(readFileSync(join(directory, source.file)))
        .digest("hex"),
      source.sha256,
      "Derived compiler input changed during execution",
    );
}
const sourcesAfter = hashSources();
assert.equal(
  extensionProofSourcesDigest(sourcesBefore),
  extensionProofSourcesDigest(sourcesAfter),
  "Proof sources changed during execution",
);
const cases = collectExtensionProofCases({
  runId,
  expected: [definition],
  exitCode: child.status,
  events: readFileSync(eventsFile, "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line)),
});
const receipt: ExtensionProofReceipt = {
  format: 2,
  runId,
  finalizedBy: "host",
  runner: { name: gate === "unit" ? "vitest" : "tsc", version: runnerVersion },
  command,
  gate,
  exitCode: child.status!,
  sourcesBefore,
  sourcesAfter,
  definitionsDigest: extensionProofCasesDigest([definition]),
  cases,
  totals: { passed: cases.length, failed: 0, skipped: 0, todo: 0, incomplete: 0 },
};
const receiptDigest = extensionProofReceiptDigest(receipt);
writeFileSync(join(directory, "host-receipt.json"), JSON.stringify(receipt, null, 2) + "\n", { mode: 0o600 });
const runnerArtifacts = [
  "runner.log",
  "cases.jsonl",
  ...(gate === "unit" ? ["vitest.json"] : ["compiler-version.log", "compiler-input-discovery.log"]),
].map((file) => ({
  file,
  sha256: createHash("sha256")
    .update(readFileSync(join(directory, file)))
    .digest("hex"),
}));
writeFileSync(
  join(directory, "host-summary.json"),
  JSON.stringify(
    {
      runId,
      gate,
      receiptDigest,
      sourceCount: sourcesBefore.length,
      repositoryGraph: graphSources,
      derived,
      compilerInputs,
      runnerArtifacts,
      hostDriverSha256: sourcesBefore.find((source) => source.file === driver)?.sha256,
      fullFamilyAcceptance: false,
    },
    null,
    2,
  ) + "\n",
  { mode: 0o600 },
);
console.log(`Observed bloom ${gate} gate receipt retained at ${directory}; full family acceptance remains pending.`);
