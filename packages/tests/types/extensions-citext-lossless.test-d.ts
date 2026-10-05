import { sql, type SQL } from "drizzle-orm";
import { createCitext_1_8, type Citext, type PostgreSqlArray } from "kello/extensions/citext";
const api = createCitext_1_8({
  name: "citext",
  version: "1.8",
  schema: 'Case"日本',
  apiSupport: { status: "verified", digest: "bf50ef209f828f5cbd517fe1a5f0b1ede7f1bbeac379b75c0b2bc02bf0a8eee3" },
});
const scalar: Citext = api.value("MiXeD 日本 😀");
const nullable: SQL<Citext | null> = api.fromText(sql<string>`'Mixed'`);
const window: SQL<Citext | null> = api.min.over({ orderBy: [api.fromText("a")] }, scalar);
const regexp: SQL<PostgreSqlArray<string> | null> = api.regexpMatch(scalar, "(mixed)");
const nativeArray: PostgreSqlArray<Citext> = { dimensions: [{ lowerBound: -2, length: 2 }], values: [scalar, null] };
const encoded = api.arrayCodec.encode(nativeArray);
// @ts-expect-error Native int8 seeds require bigint.
api.hashExtended(scalar, 1);
// @ts-expect-error Boolean SQL cannot masquerade as citext.
api.equal(sql<boolean>`true`, scalar);
// @ts-expect-error Regex result codecs are fixed by the captured overload.
api.regexpMatch<boolean>(scalar, "a");
void [nullable, window, regexp, encoded];
