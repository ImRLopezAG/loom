import type { SQL } from "drizzle-orm";
import { expectTypeOf } from "vite-plus/test";
import {
  createHypopg_1_4_3,
  type HypopgIndex,
  type HypopgListedIndex,
  type HypopgHiddenIndex,
} from "../../../apps/loom/src/core/extensions/adapters/hypopg";
import type { HypopgSession, HypopgEffect } from "../../../apps/loom/src/tooling/extensions/operations/hypopg";
import { withHypopg } from "../../../apps/loom/src/tooling/extensions/operations/hypopg";
import { hypopgDescriptor } from "../../e2e/fixtures/hypopg";
import type { JsonDocument } from "../../../apps/loom/src/core/extensions/native-json-codecs";

const api = createHypopg_1_4_3(hypopgDescriptor);
expectTypeOf(api.version).toEqualTypeOf<"1.4.3">();
expectTypeOf(api.schema).toEqualTypeOf<'hypo "session"'>();
expectTypeOf(api.indexes()).toExtend<SQL<HypopgIndex>>();
expectTypeOf(api.hiddenIndexes()).toExtend<SQL<number>>();
expectTypeOf(api.getIndexdef(null)).toExtend<SQL<string | null>>();
expectTypeOf(api.relationSize(42)).toExtend<SQL<bigint | null>>();
expectTypeOf(api.listCodec.decode("(,,,,)")).toEqualTypeOf<HypopgListedIndex>();
expectTypeOf(api.hiddenCodec.decode("(,,,,,)")).toEqualTypeOf<HypopgHiddenIndex>();
expectTypeOf(api.indexRows("i").columns.indkey).toEqualTypeOf<SQL<string>>();
expectTypeOf(api.indexRows("i").columns.indoption).toEqualTypeOf<SQL<string | null>>();
expectTypeOf(api.hiddenView("h").columns.is_hypo).toEqualTypeOf<SQL<boolean | null>>();
expectTypeOf<HypopgSession["explain"]>().returns.toEqualTypeOf<Promise<JsonDocument>>();
expectTypeOf<HypopgSession["relationSize"]>().returns.toEqualTypeOf<Promise<bigint | null>>();
expectTypeOf<HypopgSession>().not.toHaveProperty("client");
expectTypeOf<HypopgSession>().not.toHaveProperty("query");
expectTypeOf<HypopgEffect["rollback"]>().toEqualTypeOf<"not-transactional">();
function compileOnly() {
  // @ts-expect-error Wrong SQL input type.
  api.relationSize("42");
  // @ts-expect-error Session mutations are metadata, not callable application SQL.
  api.createIndex("CREATE INDEX ON items(id)");
  // @ts-expect-error Stateful members are absent from canonical query functions.
  void api.sql.functions.hypopg_hide_index;
  // @ts-expect-error Exact version only.
  createHypopg_1_4_3({ ...hypopgDescriptor, version: "1.4.2" });
  void withHypopg("postgresql://operator@localhost/fixture", hypopgDescriptor, async (session) => {
    expectTypeOf(await session.createIndex(null)).toExtend<readonly { indexrelid: number; indexname: string }[]>();
    expectTypeOf(await session.hideIndex(null)).toEqualTypeOf<boolean | null>();
    expectTypeOf(await session.dropIndex(null)).toEqualTypeOf<boolean | null>();
    expectTypeOf(await session.unhideIndex(null)).toEqualTypeOf<boolean | null>();
    // @ts-expect-error OIDs are unsigned numeric identifiers, not bigint.
    await session.dropIndex(42n);
    // @ts-expect-error EXPLAIN has a fixed native document result, no caller-chosen generic.
    await session.explain<string>(api.getIndexdef(42));
  });
}
void compileOnly;
