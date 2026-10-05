import { is, SQL, sql, type SQLWrapper } from "drizzle-orm";
import * as v from "valibot";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { booleanCodec, binaryCodec, floatCodec, integerCodec, numericCodec, nullableCodec, textCodec, type CodecInput, type ExtensionCodec } from "../codecs";
import { int4Codec } from "../native-codecs";
import { createBitCodec, createVarbitCodec } from "../bit-codec";
import { createExtensionField, createExtensionIndex } from "../fields";
import { checkedExtensionExpression, createSqlFunction, createSqlOperator, createSqlRows, extensionSqlType, type ExtensionSqlInput } from "../sql";
import { createIp4rCodec, createIp4rArrayCodec, ip4rValue, ip4rWireValue, ip4rArrayWireValue, inetCodec, cidrCodec } from "./ip4r-codecs";
export { ip4rValue, ip4rKinds, inet, cidr } from "./ip4r-codecs";
export type { Ip4rKind, Ip4rValue, PgInet, PgCidr } from "./ip4r-codecs";
export type { PostgreSqlArray } from "../codecs";
export type { BitStringValue } from "../bit-codec";
const digest = "477396650c5a07dc747e68b59df1af6c2bd6a8de1f2b7aff640fd717e2eebca9";
type Descriptor = ExtensionDescriptor<"ip4r", { readonly version: "2.4"; readonly schema: string }>;
const sqlWrapper = v.custom<SQLWrapper>((value) => v.is(v.object({ getSQL: v.function() }), value));
function cast<Input, Source, TargetInput, Target>(source: ExtensionCodec<Input, Source>, target: ExtensionCodec<TargetInput, Target>, member: string) {
  return (value: ExtensionSqlInput<typeof source>) => {
    const expression = is(value, SQL.Aliased) && !v.is(v.object({ isSelectionField: v.literal(true) }), value) ? value.sql : value;
    // SAFETY: SQLWrapper is checked first; every other typed argument is codec input and encode validates it before binding.
    const native = v.is(sqlWrapper, expression) ? sql`${expression}` : sql`${sql.param(source.encode(value as CodecInput<typeof source>))}`;
    const sourceType = source.sqlType!, targetType = target.sqlType!;
    return checkedExtensionExpression(sql`((${native})::${extensionSqlType(sourceType.schema, sourceType.name)})::${extensionSqlType(targetType.schema, targetType.name)}`, target, [], undefined, member);
  };
}
/** Exact captured ip4r 2.4 overloads. Native address and range semantics stay in PostgreSQL. */
export function createIp4r_2_4<const Selected extends Descriptor>(descriptor: Selected) {
  if (descriptor.name !== "ip4r" || descriptor.version !== "2.4" || descriptor.apiSupport.status !== "verified" || descriptor.apiSupport.digest !== digest)
    throw new Error("ip4r 2.4 requires its exact verified contract");
  const base = { schema: descriptor.schema, dependencies: [], observability: "tables", authority: "query" } as const;
  const bool = nullableCodec(booleanCodec), int4 = nullableCodec(int4Codec), int8 = nullableCodec(integerCodec), float8 = nullableCodec(floatCodec), numeric = nullableCodec(numericCodec), text = nullableCodec(textCodec), bytes = nullableCodec(binaryCodec), inet = nullableCodec(inetCodec), cidr = nullableCodec(cidrCodec), bit = nullableCodec(createBitCodec()), varbit = nullableCodec(createVarbitCodec());
  const ip4Codec = createIp4rCodec(descriptor.schema, "ip4"), ip4Array = createIp4rArrayCodec(descriptor.schema, "ip4"), ip4 = nullableCodec(ip4Codec);
  const ip4rCodec = createIp4rCodec(descriptor.schema, "ip4r"), ip4rArray = createIp4rArrayCodec(descriptor.schema, "ip4r"), ip4r = nullableCodec(ip4rCodec);
  const ip6Codec = createIp4rCodec(descriptor.schema, "ip6"), ip6Array = createIp4rArrayCodec(descriptor.schema, "ip6"), ip6 = nullableCodec(ip6Codec);
  const ip6rCodec = createIp4rCodec(descriptor.schema, "ip6r"), ip6rArray = createIp4rArrayCodec(descriptor.schema, "ip6r"), ip6r = nullableCodec(ip6rCodec);
  const ipaddressCodec = createIp4rCodec(descriptor.schema, "ipaddress"), ipaddressArray = createIp4rArrayCodec(descriptor.schema, "ipaddress"), ipaddress = nullableCodec(ipaddressCodec);
  const iprangeCodec = createIp4rCodec(descriptor.schema, "iprange"), iprangeArray = createIp4rArrayCodec(descriptor.schema, "iprange"), iprange = nullableCodec(iprangeCodec);
  const member0 = createSqlOperator({ ...base, name: "-", member: "operator:$extension:ip4r.-($extension:ip4r.ip4,$extension:ip4r.ip4)", left: ip4, right: ip4, result: int8 });
  const member1 = createSqlOperator({ ...base, name: "-", member: "operator:$extension:ip4r.-($extension:ip4r.ip4,pg_catalog.int4)", left: ip4, right: int4, result: ip4 });
  const member2 = createSqlOperator({ ...base, name: "-", member: "operator:$extension:ip4r.-($extension:ip4r.ip4,pg_catalog.int8)", left: ip4, right: int8, result: ip4 });
  const member3 = createSqlOperator({ ...base, name: "-", member: "operator:$extension:ip4r.-($extension:ip4r.ip4,pg_catalog.numeric)", left: ip4, right: numeric, result: ip4 });
  const member4 = createSqlOperator({ ...base, name: "-", member: "operator:$extension:ip4r.-($extension:ip4r.ip6,$extension:ip4r.ip6)", left: ip6, right: ip6, result: numeric });
  const member5 = createSqlOperator({ ...base, name: "-", member: "operator:$extension:ip4r.-($extension:ip4r.ip6,pg_catalog.int4)", left: ip6, right: int4, result: ip6 });
  const member6 = createSqlOperator({ ...base, name: "-", member: "operator:$extension:ip4r.-($extension:ip4r.ip6,pg_catalog.int8)", left: ip6, right: int8, result: ip6 });
  const member7 = createSqlOperator({ ...base, name: "-", member: "operator:$extension:ip4r.-($extension:ip4r.ip6,pg_catalog.numeric)", left: ip6, right: numeric, result: ip6 });
  const member8 = createSqlOperator({ ...base, name: "-", member: "operator:$extension:ip4r.-($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", left: ipaddress, right: ipaddress, result: numeric });
  const member9 = createSqlOperator({ ...base, name: "-", member: "operator:$extension:ip4r.-($extension:ip4r.ipaddress,pg_catalog.int4)", left: ipaddress, right: int4, result: ipaddress });
  const member10 = createSqlOperator({ ...base, name: "-", member: "operator:$extension:ip4r.-($extension:ip4r.ipaddress,pg_catalog.int8)", left: ipaddress, right: int8, result: ipaddress });
  const member11 = createSqlOperator({ ...base, name: "-", member: "operator:$extension:ip4r.-($extension:ip4r.ipaddress,pg_catalog.numeric)", left: ipaddress, right: numeric, result: ipaddress });
  const member12 = createSqlOperator({ ...base, name: "@", member: "operator:$extension:ip4r.@(,$extension:ip4r.ip4r)", left: undefined, right: ip4r, result: float8 });
  const member13 = createSqlOperator({ ...base, name: "@", member: "operator:$extension:ip4r.@(,$extension:ip4r.ip6r)", left: undefined, right: ip6r, result: float8 });
  const member14 = createSqlOperator({ ...base, name: "@", member: "operator:$extension:ip4r.@(,$extension:ip4r.iprange)", left: undefined, right: iprange, result: float8 });
  const member15 = createSqlOperator({ ...base, name: "@@", member: "operator:$extension:ip4r.@@(,$extension:ip4r.ip4r)", left: undefined, right: ip4r, result: numeric });
  const member16 = createSqlOperator({ ...base, name: "@@", member: "operator:$extension:ip4r.@@(,$extension:ip4r.ip6r)", left: undefined, right: ip6r, result: numeric });
  const member17 = createSqlOperator({ ...base, name: "@@", member: "operator:$extension:ip4r.@@(,$extension:ip4r.iprange)", left: undefined, right: iprange, result: numeric });
  const member18 = createSqlOperator({ ...base, name: "/", member: "operator:$extension:ip4r./($extension:ip4r.ip4,$extension:ip4r.ip4)", left: ip4, right: ip4, result: ip4r });
  const member19 = createSqlOperator({ ...base, name: "/", member: "operator:$extension:ip4r./($extension:ip4r.ip4,pg_catalog.int4)", left: ip4, right: int4, result: ip4r });
  const member20 = createSqlOperator({ ...base, name: "/", member: "operator:$extension:ip4r./($extension:ip4r.ip6,$extension:ip4r.ip6)", left: ip6, right: ip6, result: ip6r });
  const member21 = createSqlOperator({ ...base, name: "/", member: "operator:$extension:ip4r./($extension:ip4r.ip6,pg_catalog.int4)", left: ip6, right: int4, result: ip6r });
  const member22 = createSqlOperator({ ...base, name: "/", member: "operator:$extension:ip4r./($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", left: ipaddress, right: ipaddress, result: iprange });
  const member23 = createSqlOperator({ ...base, name: "/", member: "operator:$extension:ip4r./($extension:ip4r.ipaddress,pg_catalog.int4)", left: ipaddress, right: int4, result: iprange });
  const member24 = createSqlOperator({ ...base, name: "&", member: "operator:$extension:ip4r.&($extension:ip4r.ip4,$extension:ip4r.ip4)", left: ip4, right: ip4, result: ip4 });
  const member25 = createSqlOperator({ ...base, name: "&", member: "operator:$extension:ip4r.&($extension:ip4r.ip6,$extension:ip4r.ip6)", left: ip6, right: ip6, result: ip6 });
  const member26 = createSqlOperator({ ...base, name: "&", member: "operator:$extension:ip4r.&($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", left: ipaddress, right: ipaddress, result: ipaddress });
  const member27 = createSqlOperator({ ...base, name: "&&", member: "operator:$extension:ip4r.&&($extension:ip4r.ip4r,$extension:ip4r.ip4r)", left: ip4r, right: ip4r, result: bool });
  const member28 = createSqlOperator({ ...base, name: "&&", member: "operator:$extension:ip4r.&&($extension:ip4r.ip6r,$extension:ip4r.ip6r)", left: ip6r, right: ip6r, result: bool });
  const member29 = createSqlOperator({ ...base, name: "&&", member: "operator:$extension:ip4r.&&($extension:ip4r.iprange,$extension:ip4r.iprange)", left: iprange, right: iprange, result: bool });
  const member30 = createSqlOperator({ ...base, name: "#", member: "operator:$extension:ip4r.#($extension:ip4r.ip4,$extension:ip4r.ip4)", left: ip4, right: ip4, result: ip4 });
  const member31 = createSqlOperator({ ...base, name: "#", member: "operator:$extension:ip4r.#($extension:ip4r.ip6,$extension:ip4r.ip6)", left: ip6, right: ip6, result: ip6 });
  const member32 = createSqlOperator({ ...base, name: "#", member: "operator:$extension:ip4r.#($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", left: ipaddress, right: ipaddress, result: ipaddress });
  const member33 = createSqlOperator({ ...base, name: "+", member: "operator:$extension:ip4r.+($extension:ip4r.ip4,pg_catalog.int4)", left: ip4, right: int4, result: ip4 });
  const member34 = createSqlOperator({ ...base, name: "+", member: "operator:$extension:ip4r.+($extension:ip4r.ip4,pg_catalog.int8)", left: ip4, right: int8, result: ip4 });
  const member35 = createSqlOperator({ ...base, name: "+", member: "operator:$extension:ip4r.+($extension:ip4r.ip4,pg_catalog.numeric)", left: ip4, right: numeric, result: ip4 });
  const member36 = createSqlOperator({ ...base, name: "+", member: "operator:$extension:ip4r.+($extension:ip4r.ip6,pg_catalog.int4)", left: ip6, right: int4, result: ip6 });
  const member37 = createSqlOperator({ ...base, name: "+", member: "operator:$extension:ip4r.+($extension:ip4r.ip6,pg_catalog.int8)", left: ip6, right: int8, result: ip6 });
  const member38 = createSqlOperator({ ...base, name: "+", member: "operator:$extension:ip4r.+($extension:ip4r.ip6,pg_catalog.numeric)", left: ip6, right: numeric, result: ip6 });
  const member39 = createSqlOperator({ ...base, name: "+", member: "operator:$extension:ip4r.+($extension:ip4r.ipaddress,pg_catalog.int4)", left: ipaddress, right: int4, result: ipaddress });
  const member40 = createSqlOperator({ ...base, name: "+", member: "operator:$extension:ip4r.+($extension:ip4r.ipaddress,pg_catalog.int8)", left: ipaddress, right: int8, result: ipaddress });
  const member41 = createSqlOperator({ ...base, name: "+", member: "operator:$extension:ip4r.+($extension:ip4r.ipaddress,pg_catalog.numeric)", left: ipaddress, right: numeric, result: ipaddress });
  const member42 = createSqlOperator({ ...base, name: "<", member: "operator:$extension:ip4r.<($extension:ip4r.ip4,$extension:ip4r.ip4)", left: ip4, right: ip4, result: bool });
  const member43 = createSqlOperator({ ...base, name: "<", member: "operator:$extension:ip4r.<($extension:ip4r.ip4r,$extension:ip4r.ip4r)", left: ip4r, right: ip4r, result: bool });
  const member44 = createSqlOperator({ ...base, name: "<", member: "operator:$extension:ip4r.<($extension:ip4r.ip6,$extension:ip4r.ip6)", left: ip6, right: ip6, result: bool });
  const member45 = createSqlOperator({ ...base, name: "<", member: "operator:$extension:ip4r.<($extension:ip4r.ip6r,$extension:ip4r.ip6r)", left: ip6r, right: ip6r, result: bool });
  const member46 = createSqlOperator({ ...base, name: "<", member: "operator:$extension:ip4r.<($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", left: ipaddress, right: ipaddress, result: bool });
  const member47 = createSqlOperator({ ...base, name: "<", member: "operator:$extension:ip4r.<($extension:ip4r.iprange,$extension:ip4r.iprange)", left: iprange, right: iprange, result: bool });
  const member48 = createSqlOperator({ ...base, name: "<<", member: "operator:$extension:ip4r.<<($extension:ip4r.ip4r,$extension:ip4r.ip4r)", left: ip4r, right: ip4r, result: bool });
  const member49 = createSqlOperator({ ...base, name: "<<", member: "operator:$extension:ip4r.<<($extension:ip4r.ip6r,$extension:ip4r.ip6r)", left: ip6r, right: ip6r, result: bool });
  const member50 = createSqlOperator({ ...base, name: "<<", member: "operator:$extension:ip4r.<<($extension:ip4r.iprange,$extension:ip4r.iprange)", left: iprange, right: iprange, result: bool });
  const member51 = createSqlOperator({ ...base, name: "<<=", member: "operator:$extension:ip4r.<<=($extension:ip4r.ip4r,$extension:ip4r.ip4r)", left: ip4r, right: ip4r, result: bool });
  const member52 = createSqlOperator({ ...base, name: "<<=", member: "operator:$extension:ip4r.<<=($extension:ip4r.ip6r,$extension:ip4r.ip6r)", left: ip6r, right: ip6r, result: bool });
  const member53 = createSqlOperator({ ...base, name: "<<=", member: "operator:$extension:ip4r.<<=($extension:ip4r.iprange,$extension:ip4r.iprange)", left: iprange, right: iprange, result: bool });
  const member54 = createSqlOperator({ ...base, name: "<=", member: "operator:$extension:ip4r.<=($extension:ip4r.ip4,$extension:ip4r.ip4)", left: ip4, right: ip4, result: bool });
  const member55 = createSqlOperator({ ...base, name: "<=", member: "operator:$extension:ip4r.<=($extension:ip4r.ip4r,$extension:ip4r.ip4r)", left: ip4r, right: ip4r, result: bool });
  const member56 = createSqlOperator({ ...base, name: "<=", member: "operator:$extension:ip4r.<=($extension:ip4r.ip6,$extension:ip4r.ip6)", left: ip6, right: ip6, result: bool });
  const member57 = createSqlOperator({ ...base, name: "<=", member: "operator:$extension:ip4r.<=($extension:ip4r.ip6r,$extension:ip4r.ip6r)", left: ip6r, right: ip6r, result: bool });
  const member58 = createSqlOperator({ ...base, name: "<=", member: "operator:$extension:ip4r.<=($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", left: ipaddress, right: ipaddress, result: bool });
  const member59 = createSqlOperator({ ...base, name: "<=", member: "operator:$extension:ip4r.<=($extension:ip4r.iprange,$extension:ip4r.iprange)", left: iprange, right: iprange, result: bool });
  const member60 = createSqlOperator({ ...base, name: "<>", member: "operator:$extension:ip4r.<>($extension:ip4r.ip4,$extension:ip4r.ip4)", left: ip4, right: ip4, result: bool });
  const member61 = createSqlOperator({ ...base, name: "<>", member: "operator:$extension:ip4r.<>($extension:ip4r.ip4r,$extension:ip4r.ip4r)", left: ip4r, right: ip4r, result: bool });
  const member62 = createSqlOperator({ ...base, name: "<>", member: "operator:$extension:ip4r.<>($extension:ip4r.ip6,$extension:ip4r.ip6)", left: ip6, right: ip6, result: bool });
  const member63 = createSqlOperator({ ...base, name: "<>", member: "operator:$extension:ip4r.<>($extension:ip4r.ip6r,$extension:ip4r.ip6r)", left: ip6r, right: ip6r, result: bool });
  const member64 = createSqlOperator({ ...base, name: "<>", member: "operator:$extension:ip4r.<>($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", left: ipaddress, right: ipaddress, result: bool });
  const member65 = createSqlOperator({ ...base, name: "<>", member: "operator:$extension:ip4r.<>($extension:ip4r.iprange,$extension:ip4r.iprange)", left: iprange, right: iprange, result: bool });
  const member66 = createSqlOperator({ ...base, name: "=", member: "operator:$extension:ip4r.=($extension:ip4r.ip4,$extension:ip4r.ip4)", left: ip4, right: ip4, result: bool });
  const member67 = createSqlOperator({ ...base, name: "=", member: "operator:$extension:ip4r.=($extension:ip4r.ip4r,$extension:ip4r.ip4r)", left: ip4r, right: ip4r, result: bool });
  const member68 = createSqlOperator({ ...base, name: "=", member: "operator:$extension:ip4r.=($extension:ip4r.ip6,$extension:ip4r.ip6)", left: ip6, right: ip6, result: bool });
  const member69 = createSqlOperator({ ...base, name: "=", member: "operator:$extension:ip4r.=($extension:ip4r.ip6r,$extension:ip4r.ip6r)", left: ip6r, right: ip6r, result: bool });
  const member70 = createSqlOperator({ ...base, name: "=", member: "operator:$extension:ip4r.=($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", left: ipaddress, right: ipaddress, result: bool });
  const member71 = createSqlOperator({ ...base, name: "=", member: "operator:$extension:ip4r.=($extension:ip4r.iprange,$extension:ip4r.iprange)", left: iprange, right: iprange, result: bool });
  const member72 = createSqlOperator({ ...base, name: ">", member: "operator:$extension:ip4r.>($extension:ip4r.ip4,$extension:ip4r.ip4)", left: ip4, right: ip4, result: bool });
  const member73 = createSqlOperator({ ...base, name: ">", member: "operator:$extension:ip4r.>($extension:ip4r.ip4r,$extension:ip4r.ip4r)", left: ip4r, right: ip4r, result: bool });
  const member74 = createSqlOperator({ ...base, name: ">", member: "operator:$extension:ip4r.>($extension:ip4r.ip6,$extension:ip4r.ip6)", left: ip6, right: ip6, result: bool });
  const member75 = createSqlOperator({ ...base, name: ">", member: "operator:$extension:ip4r.>($extension:ip4r.ip6r,$extension:ip4r.ip6r)", left: ip6r, right: ip6r, result: bool });
  const member76 = createSqlOperator({ ...base, name: ">", member: "operator:$extension:ip4r.>($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", left: ipaddress, right: ipaddress, result: bool });
  const member77 = createSqlOperator({ ...base, name: ">", member: "operator:$extension:ip4r.>($extension:ip4r.iprange,$extension:ip4r.iprange)", left: iprange, right: iprange, result: bool });
  const member78 = createSqlOperator({ ...base, name: ">=", member: "operator:$extension:ip4r.>=($extension:ip4r.ip4,$extension:ip4r.ip4)", left: ip4, right: ip4, result: bool });
  const member79 = createSqlOperator({ ...base, name: ">=", member: "operator:$extension:ip4r.>=($extension:ip4r.ip4r,$extension:ip4r.ip4r)", left: ip4r, right: ip4r, result: bool });
  const member80 = createSqlOperator({ ...base, name: ">=", member: "operator:$extension:ip4r.>=($extension:ip4r.ip6,$extension:ip4r.ip6)", left: ip6, right: ip6, result: bool });
  const member81 = createSqlOperator({ ...base, name: ">=", member: "operator:$extension:ip4r.>=($extension:ip4r.ip6r,$extension:ip4r.ip6r)", left: ip6r, right: ip6r, result: bool });
  const member82 = createSqlOperator({ ...base, name: ">=", member: "operator:$extension:ip4r.>=($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", left: ipaddress, right: ipaddress, result: bool });
  const member83 = createSqlOperator({ ...base, name: ">=", member: "operator:$extension:ip4r.>=($extension:ip4r.iprange,$extension:ip4r.iprange)", left: iprange, right: iprange, result: bool });
  const member84 = createSqlOperator({ ...base, name: ">>", member: "operator:$extension:ip4r.>>($extension:ip4r.ip4r,$extension:ip4r.ip4r)", left: ip4r, right: ip4r, result: bool });
  const member85 = createSqlOperator({ ...base, name: ">>", member: "operator:$extension:ip4r.>>($extension:ip4r.ip6r,$extension:ip4r.ip6r)", left: ip6r, right: ip6r, result: bool });
  const member86 = createSqlOperator({ ...base, name: ">>", member: "operator:$extension:ip4r.>>($extension:ip4r.iprange,$extension:ip4r.iprange)", left: iprange, right: iprange, result: bool });
  const member87 = createSqlOperator({ ...base, name: ">>=", member: "operator:$extension:ip4r.>>=($extension:ip4r.ip4r,$extension:ip4r.ip4r)", left: ip4r, right: ip4r, result: bool });
  const member88 = createSqlOperator({ ...base, name: ">>=", member: "operator:$extension:ip4r.>>=($extension:ip4r.ip6r,$extension:ip4r.ip6r)", left: ip6r, right: ip6r, result: bool });
  const member89 = createSqlOperator({ ...base, name: ">>=", member: "operator:$extension:ip4r.>>=($extension:ip4r.iprange,$extension:ip4r.iprange)", left: iprange, right: iprange, result: bool });
  const member90 = createSqlOperator({ ...base, name: "|", member: "operator:$extension:ip4r.|($extension:ip4r.ip4,$extension:ip4r.ip4)", left: ip4, right: ip4, result: ip4 });
  const member91 = createSqlOperator({ ...base, name: "|", member: "operator:$extension:ip4r.|($extension:ip4r.ip6,$extension:ip4r.ip6)", left: ip6, right: ip6, result: ip6 });
  const member92 = createSqlOperator({ ...base, name: "|", member: "operator:$extension:ip4r.|($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", left: ipaddress, right: ipaddress, result: ipaddress });
  const member93 = createSqlOperator({ ...base, name: "~", member: "operator:$extension:ip4r.~(,$extension:ip4r.ip4)", left: undefined, right: ip4, result: ip4 });
  const member94 = createSqlOperator({ ...base, name: "~", member: "operator:$extension:ip4r.~(,$extension:ip4r.ip6)", left: undefined, right: ip6, result: ip6 });
  const member95 = createSqlOperator({ ...base, name: "~", member: "operator:$extension:ip4r.~(,$extension:ip4r.ipaddress)", left: undefined, right: ipaddress, result: ipaddress });
  const member96 = createSqlRows({ ...base, name: "cidr_split", member: "routine:$extension:ip4r.cidr_split($extension:ip4r.ip4r)", arguments: [ip4r] as const, result: ip4r });
  const member97 = createSqlRows({ ...base, name: "cidr_split", member: "routine:$extension:ip4r.cidr_split($extension:ip4r.ip6r)", arguments: [ip6r] as const, result: ip6r });
  const member98 = createSqlRows({ ...base, name: "cidr_split", member: "routine:$extension:ip4r.cidr_split($extension:ip4r.iprange)", arguments: [iprange] as const, result: iprange });
  const member99 = createSqlFunction({ ...base, name: "cidr", member: "routine:$extension:ip4r.cidr($extension:ip4r.ip4)", arguments: [ip4] as const, result: cidr });
  const member100 = createSqlFunction({ ...base, name: "cidr", member: "routine:$extension:ip4r.cidr($extension:ip4r.ip4r)", arguments: [ip4r] as const, result: cidr });
  const member101 = createSqlFunction({ ...base, name: "cidr", member: "routine:$extension:ip4r.cidr($extension:ip4r.ip6)", arguments: [ip6] as const, result: cidr });
  const member102 = createSqlFunction({ ...base, name: "cidr", member: "routine:$extension:ip4r.cidr($extension:ip4r.ip6r)", arguments: [ip6r] as const, result: cidr });
  const member103 = createSqlFunction({ ...base, name: "cidr", member: "routine:$extension:ip4r.cidr($extension:ip4r.ipaddress)", arguments: [ipaddress] as const, result: cidr });
  const member104 = createSqlFunction({ ...base, name: "cidr", member: "routine:$extension:ip4r.cidr($extension:ip4r.iprange)", arguments: [iprange] as const, result: cidr });
  const member105 = createSqlFunction({ ...base, name: "family", member: "routine:$extension:ip4r.family($extension:ip4r.ip4)", arguments: [ip4] as const, result: int4 });
  const member106 = createSqlFunction({ ...base, name: "family", member: "routine:$extension:ip4r.family($extension:ip4r.ip4r)", arguments: [ip4r] as const, result: int4 });
  const member107 = createSqlFunction({ ...base, name: "family", member: "routine:$extension:ip4r.family($extension:ip4r.ip6)", arguments: [ip6] as const, result: int4 });
  const member108 = createSqlFunction({ ...base, name: "family", member: "routine:$extension:ip4r.family($extension:ip4r.ip6r)", arguments: [ip6r] as const, result: int4 });
  const member109 = createSqlFunction({ ...base, name: "family", member: "routine:$extension:ip4r.family($extension:ip4r.ipaddress)", arguments: [ipaddress] as const, result: int4 });
  const member110 = createSqlFunction({ ...base, name: "family", member: "routine:$extension:ip4r.family($extension:ip4r.iprange)", arguments: [iprange] as const, result: int4 });
  const member111 = createSqlFunction({ ...base, name: "in_range", member: "routine:$extension:ip4r.in_range($extension:ip4r.ip4,$extension:ip4r.ip4,$extension:ip4r.ip4,pg_catalog.bool,pg_catalog.bool)", arguments: [ip4, ip4, ip4, bool, bool] as const, result: bool });
  const member112 = createSqlFunction({ ...base, name: "in_range", member: "routine:$extension:ip4r.in_range($extension:ip4r.ip4,$extension:ip4r.ip4,pg_catalog.int8,pg_catalog.bool,pg_catalog.bool)", arguments: [ip4, ip4, int8, bool, bool] as const, result: bool });
  const member113 = createSqlFunction({ ...base, name: "in_range", member: "routine:$extension:ip4r.in_range($extension:ip4r.ip6,$extension:ip4r.ip6,$extension:ip4r.ip6,pg_catalog.bool,pg_catalog.bool)", arguments: [ip6, ip6, ip6, bool, bool] as const, result: bool });
  const member114 = createSqlFunction({ ...base, name: "in_range", member: "routine:$extension:ip4r.in_range($extension:ip4r.ip6,$extension:ip4r.ip6,pg_catalog.int8,pg_catalog.bool,pg_catalog.bool)", arguments: [ip6, ip6, int8, bool, bool] as const, result: bool });
  const member115 = createSqlFunction({ ...base, name: "ip4_and", member: "routine:$extension:ip4r.ip4_and($extension:ip4r.ip4,$extension:ip4r.ip4)", arguments: [ip4, ip4] as const, result: ip4 });
  const member116 = createSqlFunction({ ...base, name: "ip4_cmp", member: "routine:$extension:ip4r.ip4_cmp($extension:ip4r.ip4,$extension:ip4r.ip4)", arguments: [ip4, ip4] as const, result: int4 });
  const member117 = createSqlFunction({ ...base, name: "ip4_contained_by", member: "routine:$extension:ip4r.ip4_contained_by($extension:ip4r.ip4,$extension:ip4r.ip4r)", arguments: [ip4, ip4r] as const, result: bool });
  const member118 = createSqlFunction({ ...base, name: "ip4_contained_by", member: "routine:$extension:ip4r.ip4_contained_by($extension:ip4r.ip4,$extension:ip4r.iprange)", arguments: [ip4, iprange] as const, result: bool });
  const member119 = createSqlFunction({ ...base, name: "ip4_contains", member: "routine:$extension:ip4r.ip4_contains($extension:ip4r.ip4r,$extension:ip4r.ip4)", arguments: [ip4r, ip4] as const, result: bool });
  const member120 = createSqlFunction({ ...base, name: "ip4_contains", member: "routine:$extension:ip4r.ip4_contains($extension:ip4r.iprange,$extension:ip4r.ip4)", arguments: [iprange, ip4] as const, result: bool });
  const member121 = createSqlFunction({ ...base, name: "ip4_eq", member: "routine:$extension:ip4r.ip4_eq($extension:ip4r.ip4,$extension:ip4r.ip4)", arguments: [ip4, ip4] as const, result: bool });
  const member122 = createSqlFunction({ ...base, name: "ip4_ge", member: "routine:$extension:ip4r.ip4_ge($extension:ip4r.ip4,$extension:ip4r.ip4)", arguments: [ip4, ip4] as const, result: bool });
  const member123 = createSqlFunction({ ...base, name: "ip4_gt", member: "routine:$extension:ip4r.ip4_gt($extension:ip4r.ip4,$extension:ip4r.ip4)", arguments: [ip4, ip4] as const, result: bool });
  const member124 = createSqlFunction({ ...base, name: "ip4_hash_extended", member: "routine:$extension:ip4r.ip4_hash_extended($extension:ip4r.ip4,pg_catalog.int8)", arguments: [ip4, int8] as const, result: int8 });
  const member125 = createSqlFunction({ ...base, name: "ip4_le", member: "routine:$extension:ip4r.ip4_le($extension:ip4r.ip4,$extension:ip4r.ip4)", arguments: [ip4, ip4] as const, result: bool });
  const member126 = createSqlFunction({ ...base, name: "ip4_lt", member: "routine:$extension:ip4r.ip4_lt($extension:ip4r.ip4,$extension:ip4r.ip4)", arguments: [ip4, ip4] as const, result: bool });
  const member127 = createSqlFunction({ ...base, name: "ip4_minus_bigint", member: "routine:$extension:ip4r.ip4_minus_bigint($extension:ip4r.ip4,pg_catalog.int8)", arguments: [ip4, int8] as const, result: ip4 });
  const member128 = createSqlFunction({ ...base, name: "ip4_minus_int", member: "routine:$extension:ip4r.ip4_minus_int($extension:ip4r.ip4,pg_catalog.int4)", arguments: [ip4, int4] as const, result: ip4 });
  const member129 = createSqlFunction({ ...base, name: "ip4_minus_ip4", member: "routine:$extension:ip4r.ip4_minus_ip4($extension:ip4r.ip4,$extension:ip4r.ip4)", arguments: [ip4, ip4] as const, result: int8 });
  const member130 = createSqlFunction({ ...base, name: "ip4_minus_numeric", member: "routine:$extension:ip4r.ip4_minus_numeric($extension:ip4r.ip4,pg_catalog.numeric)", arguments: [ip4, numeric] as const, result: ip4 });
  const member131 = createSqlFunction({ ...base, name: "ip4_neq", member: "routine:$extension:ip4r.ip4_neq($extension:ip4r.ip4,$extension:ip4r.ip4)", arguments: [ip4, ip4] as const, result: bool });
  const member132 = createSqlFunction({ ...base, name: "ip4_net_lower", member: "routine:$extension:ip4r.ip4_net_lower($extension:ip4r.ip4,pg_catalog.int4)", arguments: [ip4, int4] as const, result: ip4 });
  const member133 = createSqlFunction({ ...base, name: "ip4_net_upper", member: "routine:$extension:ip4r.ip4_net_upper($extension:ip4r.ip4,pg_catalog.int4)", arguments: [ip4, int4] as const, result: ip4 });
  const member134 = createSqlFunction({ ...base, name: "ip4_netmask", member: "routine:$extension:ip4r.ip4_netmask(pg_catalog.int4)", arguments: [int4] as const, result: ip4 });
  const member135 = createSqlFunction({ ...base, name: "ip4_not", member: "routine:$extension:ip4r.ip4_not($extension:ip4r.ip4)", arguments: [ip4] as const, result: ip4 });
  const member136 = createSqlFunction({ ...base, name: "ip4_or", member: "routine:$extension:ip4r.ip4_or($extension:ip4r.ip4,$extension:ip4r.ip4)", arguments: [ip4, ip4] as const, result: ip4 });
  const member137 = createSqlFunction({ ...base, name: "ip4_plus_bigint", member: "routine:$extension:ip4r.ip4_plus_bigint($extension:ip4r.ip4,pg_catalog.int8)", arguments: [ip4, int8] as const, result: ip4 });
  const member138 = createSqlFunction({ ...base, name: "ip4_plus_int", member: "routine:$extension:ip4r.ip4_plus_int($extension:ip4r.ip4,pg_catalog.int4)", arguments: [ip4, int4] as const, result: ip4 });
  const member139 = createSqlFunction({ ...base, name: "ip4_plus_numeric", member: "routine:$extension:ip4r.ip4_plus_numeric($extension:ip4r.ip4,pg_catalog.numeric)", arguments: [ip4, numeric] as const, result: ip4 });
  const member140 = createSqlFunction({ ...base, name: "ip4_send", member: "routine:$extension:ip4r.ip4_send($extension:ip4r.ip4)", arguments: [ip4] as const, result: bytes });
  const member141 = createSqlFunction({ ...base, name: "ip4_xor", member: "routine:$extension:ip4r.ip4_xor($extension:ip4r.ip4,$extension:ip4r.ip4)", arguments: [ip4, ip4] as const, result: ip4 });
  const member142 = createSqlFunction({ ...base, name: "ip4", member: "routine:$extension:ip4r.ip4($extension:ip4r.ipaddress)", arguments: [ipaddress] as const, result: ip4 });
  const member143 = createSqlFunction({ ...base, name: "ip4", member: "routine:$extension:ip4r.ip4(pg_catalog.bit)", arguments: [bit] as const, result: ip4 });
  const member144 = createSqlFunction({ ...base, name: "ip4", member: "routine:$extension:ip4r.ip4(pg_catalog.bytea)", arguments: [bytes] as const, result: ip4 });
  const member145 = createSqlFunction({ ...base, name: "ip4", member: "routine:$extension:ip4r.ip4(pg_catalog.float8)", arguments: [float8] as const, result: ip4 });
  const member146 = createSqlFunction({ ...base, name: "ip4", member: "routine:$extension:ip4r.ip4(pg_catalog.inet)", arguments: [inet] as const, result: ip4 });
  const member147 = createSqlFunction({ ...base, name: "ip4", member: "routine:$extension:ip4r.ip4(pg_catalog.int8)", arguments: [int8] as const, result: ip4 });
  const member148 = createSqlFunction({ ...base, name: "ip4", member: "routine:$extension:ip4r.ip4(pg_catalog.numeric)", arguments: [numeric] as const, result: ip4 });
  const member149 = createSqlFunction({ ...base, name: "ip4", member: "routine:$extension:ip4r.ip4(pg_catalog.text)", arguments: [text] as const, result: ip4 });
  const member150 = createSqlFunction({ ...base, name: "ip4", member: "routine:$extension:ip4r.ip4(pg_catalog.varbit)", arguments: [varbit] as const, result: ip4 });
  const member151 = createSqlFunction({ ...base, name: "ip4hash", member: "routine:$extension:ip4r.ip4hash($extension:ip4r.ip4)", arguments: [ip4] as const, result: int4 });
  const member152 = createSqlFunction({ ...base, name: "ip4r_cmp", member: "routine:$extension:ip4r.ip4r_cmp($extension:ip4r.ip4r,$extension:ip4r.ip4r)", arguments: [ip4r, ip4r] as const, result: int4 });
  const member153 = createSqlFunction({ ...base, name: "ip4r_contained_by_strict", member: "routine:$extension:ip4r.ip4r_contained_by_strict($extension:ip4r.ip4r,$extension:ip4r.ip4r)", arguments: [ip4r, ip4r] as const, result: bool });
  const member154 = createSqlFunction({ ...base, name: "ip4r_contained_by", member: "routine:$extension:ip4r.ip4r_contained_by($extension:ip4r.ip4r,$extension:ip4r.ip4r)", arguments: [ip4r, ip4r] as const, result: bool });
  const member155 = createSqlFunction({ ...base, name: "ip4r_contains_strict", member: "routine:$extension:ip4r.ip4r_contains_strict($extension:ip4r.ip4r,$extension:ip4r.ip4r)", arguments: [ip4r, ip4r] as const, result: bool });
  const member156 = createSqlFunction({ ...base, name: "ip4r_contains", member: "routine:$extension:ip4r.ip4r_contains($extension:ip4r.ip4r,$extension:ip4r.ip4r)", arguments: [ip4r, ip4r] as const, result: bool });
  const member157 = createSqlFunction({ ...base, name: "ip4r_eq", member: "routine:$extension:ip4r.ip4r_eq($extension:ip4r.ip4r,$extension:ip4r.ip4r)", arguments: [ip4r, ip4r] as const, result: bool });
  const member158 = createSqlFunction({ ...base, name: "ip4r_ge", member: "routine:$extension:ip4r.ip4r_ge($extension:ip4r.ip4r,$extension:ip4r.ip4r)", arguments: [ip4r, ip4r] as const, result: bool });
  const member159 = createSqlFunction({ ...base, name: "ip4r_gt", member: "routine:$extension:ip4r.ip4r_gt($extension:ip4r.ip4r,$extension:ip4r.ip4r)", arguments: [ip4r, ip4r] as const, result: bool });
  const member160 = createSqlFunction({ ...base, name: "ip4r_hash_extended", member: "routine:$extension:ip4r.ip4r_hash_extended($extension:ip4r.ip4r,pg_catalog.int8)", arguments: [ip4r, int8] as const, result: int8 });
  const member161 = createSqlFunction({ ...base, name: "ip4r_inter", member: "routine:$extension:ip4r.ip4r_inter($extension:ip4r.ip4r,$extension:ip4r.ip4r)", arguments: [ip4r, ip4r] as const, result: ip4r });
  const member162 = createSqlFunction({ ...base, name: "ip4r_le", member: "routine:$extension:ip4r.ip4r_le($extension:ip4r.ip4r,$extension:ip4r.ip4r)", arguments: [ip4r, ip4r] as const, result: bool });
  const member163 = createSqlFunction({ ...base, name: "ip4r_lt", member: "routine:$extension:ip4r.ip4r_lt($extension:ip4r.ip4r,$extension:ip4r.ip4r)", arguments: [ip4r, ip4r] as const, result: bool });
  const member164 = createSqlFunction({ ...base, name: "ip4r_neq", member: "routine:$extension:ip4r.ip4r_neq($extension:ip4r.ip4r,$extension:ip4r.ip4r)", arguments: [ip4r, ip4r] as const, result: bool });
  const member165 = createSqlFunction({ ...base, name: "ip4r_net_mask", member: "routine:$extension:ip4r.ip4r_net_mask($extension:ip4r.ip4,$extension:ip4r.ip4)", arguments: [ip4, ip4] as const, result: ip4r });
  const member166 = createSqlFunction({ ...base, name: "ip4r_net_prefix", member: "routine:$extension:ip4r.ip4r_net_prefix($extension:ip4r.ip4,pg_catalog.int4)", arguments: [ip4, int4] as const, result: ip4r });
  const member167 = createSqlFunction({ ...base, name: "ip4r_overlaps", member: "routine:$extension:ip4r.ip4r_overlaps($extension:ip4r.ip4r,$extension:ip4r.ip4r)", arguments: [ip4r, ip4r] as const, result: bool });
  const member168 = createSqlFunction({ ...base, name: "ip4r_send", member: "routine:$extension:ip4r.ip4r_send($extension:ip4r.ip4r)", arguments: [ip4r] as const, result: bytes });
  const member169 = createSqlFunction({ ...base, name: "ip4r_size_exact", member: "routine:$extension:ip4r.ip4r_size_exact($extension:ip4r.ip4r)", arguments: [ip4r] as const, result: numeric });
  const member170 = createSqlFunction({ ...base, name: "ip4r_size", member: "routine:$extension:ip4r.ip4r_size($extension:ip4r.ip4r)", arguments: [ip4r] as const, result: float8 });
  const member171 = createSqlFunction({ ...base, name: "ip4r_union", member: "routine:$extension:ip4r.ip4r_union($extension:ip4r.ip4r,$extension:ip4r.ip4r)", arguments: [ip4r, ip4r] as const, result: ip4r });
  const member172 = createSqlFunction({ ...base, name: "ip4r", member: "routine:$extension:ip4r.ip4r($extension:ip4r.ip4,$extension:ip4r.ip4)", arguments: [ip4, ip4] as const, result: ip4r });
  const member173 = createSqlFunction({ ...base, name: "ip4r", member: "routine:$extension:ip4r.ip4r($extension:ip4r.ip4)", arguments: [ip4] as const, result: ip4r });
  const member174 = createSqlFunction({ ...base, name: "ip4r", member: "routine:$extension:ip4r.ip4r($extension:ip4r.iprange)", arguments: [iprange] as const, result: ip4r });
  const member175 = createSqlFunction({ ...base, name: "ip4r", member: "routine:$extension:ip4r.ip4r(pg_catalog.cidr)", arguments: [cidr] as const, result: ip4r });
  const member176 = createSqlFunction({ ...base, name: "ip4r", member: "routine:$extension:ip4r.ip4r(pg_catalog.text)", arguments: [text] as const, result: ip4r });
  const member177 = createSqlFunction({ ...base, name: "ip4r", member: "routine:$extension:ip4r.ip4r(pg_catalog.varbit)", arguments: [varbit] as const, result: ip4r });
  const member178 = createSqlFunction({ ...base, name: "ip4rhash", member: "routine:$extension:ip4r.ip4rhash($extension:ip4r.ip4r)", arguments: [ip4r] as const, result: int4 });
  const member179 = createSqlFunction({ ...base, name: "ip6_and", member: "routine:$extension:ip4r.ip6_and($extension:ip4r.ip6,$extension:ip4r.ip6)", arguments: [ip6, ip6] as const, result: ip6 });
  const member180 = createSqlFunction({ ...base, name: "ip6_cmp", member: "routine:$extension:ip4r.ip6_cmp($extension:ip4r.ip6,$extension:ip4r.ip6)", arguments: [ip6, ip6] as const, result: int4 });
  const member181 = createSqlFunction({ ...base, name: "ip6_contained_by", member: "routine:$extension:ip4r.ip6_contained_by($extension:ip4r.ip6,$extension:ip4r.ip6r)", arguments: [ip6, ip6r] as const, result: bool });
  const member182 = createSqlFunction({ ...base, name: "ip6_contained_by", member: "routine:$extension:ip4r.ip6_contained_by($extension:ip4r.ip6,$extension:ip4r.iprange)", arguments: [ip6, iprange] as const, result: bool });
  const member183 = createSqlFunction({ ...base, name: "ip6_contains", member: "routine:$extension:ip4r.ip6_contains($extension:ip4r.ip6r,$extension:ip4r.ip6)", arguments: [ip6r, ip6] as const, result: bool });
  const member184 = createSqlFunction({ ...base, name: "ip6_contains", member: "routine:$extension:ip4r.ip6_contains($extension:ip4r.iprange,$extension:ip4r.ip6)", arguments: [iprange, ip6] as const, result: bool });
  const member185 = createSqlFunction({ ...base, name: "ip6_eq", member: "routine:$extension:ip4r.ip6_eq($extension:ip4r.ip6,$extension:ip4r.ip6)", arguments: [ip6, ip6] as const, result: bool });
  const member186 = createSqlFunction({ ...base, name: "ip6_ge", member: "routine:$extension:ip4r.ip6_ge($extension:ip4r.ip6,$extension:ip4r.ip6)", arguments: [ip6, ip6] as const, result: bool });
  const member187 = createSqlFunction({ ...base, name: "ip6_gt", member: "routine:$extension:ip4r.ip6_gt($extension:ip4r.ip6,$extension:ip4r.ip6)", arguments: [ip6, ip6] as const, result: bool });
  const member188 = createSqlFunction({ ...base, name: "ip6_hash_extended", member: "routine:$extension:ip4r.ip6_hash_extended($extension:ip4r.ip6,pg_catalog.int8)", arguments: [ip6, int8] as const, result: int8 });
  const member189 = createSqlFunction({ ...base, name: "ip6_le", member: "routine:$extension:ip4r.ip6_le($extension:ip4r.ip6,$extension:ip4r.ip6)", arguments: [ip6, ip6] as const, result: bool });
  const member190 = createSqlFunction({ ...base, name: "ip6_lt", member: "routine:$extension:ip4r.ip6_lt($extension:ip4r.ip6,$extension:ip4r.ip6)", arguments: [ip6, ip6] as const, result: bool });
  const member191 = createSqlFunction({ ...base, name: "ip6_minus_bigint", member: "routine:$extension:ip4r.ip6_minus_bigint($extension:ip4r.ip6,pg_catalog.int8)", arguments: [ip6, int8] as const, result: ip6 });
  const member192 = createSqlFunction({ ...base, name: "ip6_minus_int", member: "routine:$extension:ip4r.ip6_minus_int($extension:ip4r.ip6,pg_catalog.int4)", arguments: [ip6, int4] as const, result: ip6 });
  const member193 = createSqlFunction({ ...base, name: "ip6_minus_ip6", member: "routine:$extension:ip4r.ip6_minus_ip6($extension:ip4r.ip6,$extension:ip4r.ip6)", arguments: [ip6, ip6] as const, result: numeric });
  const member194 = createSqlFunction({ ...base, name: "ip6_minus_numeric", member: "routine:$extension:ip4r.ip6_minus_numeric($extension:ip4r.ip6,pg_catalog.numeric)", arguments: [ip6, numeric] as const, result: ip6 });
  const member195 = createSqlFunction({ ...base, name: "ip6_neq", member: "routine:$extension:ip4r.ip6_neq($extension:ip4r.ip6,$extension:ip4r.ip6)", arguments: [ip6, ip6] as const, result: bool });
  const member196 = createSqlFunction({ ...base, name: "ip6_net_lower", member: "routine:$extension:ip4r.ip6_net_lower($extension:ip4r.ip6,pg_catalog.int4)", arguments: [ip6, int4] as const, result: ip6 });
  const member197 = createSqlFunction({ ...base, name: "ip6_net_upper", member: "routine:$extension:ip4r.ip6_net_upper($extension:ip4r.ip6,pg_catalog.int4)", arguments: [ip6, int4] as const, result: ip6 });
  const member198 = createSqlFunction({ ...base, name: "ip6_netmask", member: "routine:$extension:ip4r.ip6_netmask(pg_catalog.int4)", arguments: [int4] as const, result: ip6 });
  const member199 = createSqlFunction({ ...base, name: "ip6_not", member: "routine:$extension:ip4r.ip6_not($extension:ip4r.ip6)", arguments: [ip6] as const, result: ip6 });
  const member200 = createSqlFunction({ ...base, name: "ip6_or", member: "routine:$extension:ip4r.ip6_or($extension:ip4r.ip6,$extension:ip4r.ip6)", arguments: [ip6, ip6] as const, result: ip6 });
  const member201 = createSqlFunction({ ...base, name: "ip6_plus_bigint", member: "routine:$extension:ip4r.ip6_plus_bigint($extension:ip4r.ip6,pg_catalog.int8)", arguments: [ip6, int8] as const, result: ip6 });
  const member202 = createSqlFunction({ ...base, name: "ip6_plus_int", member: "routine:$extension:ip4r.ip6_plus_int($extension:ip4r.ip6,pg_catalog.int4)", arguments: [ip6, int4] as const, result: ip6 });
  const member203 = createSqlFunction({ ...base, name: "ip6_plus_numeric", member: "routine:$extension:ip4r.ip6_plus_numeric($extension:ip4r.ip6,pg_catalog.numeric)", arguments: [ip6, numeric] as const, result: ip6 });
  const member204 = createSqlFunction({ ...base, name: "ip6_send", member: "routine:$extension:ip4r.ip6_send($extension:ip4r.ip6)", arguments: [ip6] as const, result: bytes });
  const member205 = createSqlFunction({ ...base, name: "ip6_xor", member: "routine:$extension:ip4r.ip6_xor($extension:ip4r.ip6,$extension:ip4r.ip6)", arguments: [ip6, ip6] as const, result: ip6 });
  const member206 = createSqlFunction({ ...base, name: "ip6", member: "routine:$extension:ip4r.ip6($extension:ip4r.ipaddress)", arguments: [ipaddress] as const, result: ip6 });
  const member207 = createSqlFunction({ ...base, name: "ip6", member: "routine:$extension:ip4r.ip6(pg_catalog.bit)", arguments: [bit] as const, result: ip6 });
  const member208 = createSqlFunction({ ...base, name: "ip6", member: "routine:$extension:ip4r.ip6(pg_catalog.bytea)", arguments: [bytes] as const, result: ip6 });
  const member209 = createSqlFunction({ ...base, name: "ip6", member: "routine:$extension:ip4r.ip6(pg_catalog.inet)", arguments: [inet] as const, result: ip6 });
  const member210 = createSqlFunction({ ...base, name: "ip6", member: "routine:$extension:ip4r.ip6(pg_catalog.numeric)", arguments: [numeric] as const, result: ip6 });
  const member211 = createSqlFunction({ ...base, name: "ip6", member: "routine:$extension:ip4r.ip6(pg_catalog.text)", arguments: [text] as const, result: ip6 });
  const member212 = createSqlFunction({ ...base, name: "ip6", member: "routine:$extension:ip4r.ip6(pg_catalog.varbit)", arguments: [varbit] as const, result: ip6 });
  const member213 = createSqlFunction({ ...base, name: "ip6hash", member: "routine:$extension:ip4r.ip6hash($extension:ip4r.ip6)", arguments: [ip6] as const, result: int4 });
  const member214 = createSqlFunction({ ...base, name: "ip6r_cmp", member: "routine:$extension:ip4r.ip6r_cmp($extension:ip4r.ip6r,$extension:ip4r.ip6r)", arguments: [ip6r, ip6r] as const, result: int4 });
  const member215 = createSqlFunction({ ...base, name: "ip6r_contained_by_strict", member: "routine:$extension:ip4r.ip6r_contained_by_strict($extension:ip4r.ip6r,$extension:ip4r.ip6r)", arguments: [ip6r, ip6r] as const, result: bool });
  const member216 = createSqlFunction({ ...base, name: "ip6r_contained_by", member: "routine:$extension:ip4r.ip6r_contained_by($extension:ip4r.ip6r,$extension:ip4r.ip6r)", arguments: [ip6r, ip6r] as const, result: bool });
  const member217 = createSqlFunction({ ...base, name: "ip6r_contains_strict", member: "routine:$extension:ip4r.ip6r_contains_strict($extension:ip4r.ip6r,$extension:ip4r.ip6r)", arguments: [ip6r, ip6r] as const, result: bool });
  const member218 = createSqlFunction({ ...base, name: "ip6r_contains", member: "routine:$extension:ip4r.ip6r_contains($extension:ip4r.ip6r,$extension:ip4r.ip6r)", arguments: [ip6r, ip6r] as const, result: bool });
  const member219 = createSqlFunction({ ...base, name: "ip6r_eq", member: "routine:$extension:ip4r.ip6r_eq($extension:ip4r.ip6r,$extension:ip4r.ip6r)", arguments: [ip6r, ip6r] as const, result: bool });
  const member220 = createSqlFunction({ ...base, name: "ip6r_ge", member: "routine:$extension:ip4r.ip6r_ge($extension:ip4r.ip6r,$extension:ip4r.ip6r)", arguments: [ip6r, ip6r] as const, result: bool });
  const member221 = createSqlFunction({ ...base, name: "ip6r_gt", member: "routine:$extension:ip4r.ip6r_gt($extension:ip4r.ip6r,$extension:ip4r.ip6r)", arguments: [ip6r, ip6r] as const, result: bool });
  const member222 = createSqlFunction({ ...base, name: "ip6r_hash_extended", member: "routine:$extension:ip4r.ip6r_hash_extended($extension:ip4r.ip6r,pg_catalog.int8)", arguments: [ip6r, int8] as const, result: int8 });
  const member223 = createSqlFunction({ ...base, name: "ip6r_inter", member: "routine:$extension:ip4r.ip6r_inter($extension:ip4r.ip6r,$extension:ip4r.ip6r)", arguments: [ip6r, ip6r] as const, result: ip6r });
  const member224 = createSqlFunction({ ...base, name: "ip6r_le", member: "routine:$extension:ip4r.ip6r_le($extension:ip4r.ip6r,$extension:ip4r.ip6r)", arguments: [ip6r, ip6r] as const, result: bool });
  const member225 = createSqlFunction({ ...base, name: "ip6r_lt", member: "routine:$extension:ip4r.ip6r_lt($extension:ip4r.ip6r,$extension:ip4r.ip6r)", arguments: [ip6r, ip6r] as const, result: bool });
  const member226 = createSqlFunction({ ...base, name: "ip6r_neq", member: "routine:$extension:ip4r.ip6r_neq($extension:ip4r.ip6r,$extension:ip4r.ip6r)", arguments: [ip6r, ip6r] as const, result: bool });
  const member227 = createSqlFunction({ ...base, name: "ip6r_net_mask", member: "routine:$extension:ip4r.ip6r_net_mask($extension:ip4r.ip6,$extension:ip4r.ip6)", arguments: [ip6, ip6] as const, result: ip6r });
  const member228 = createSqlFunction({ ...base, name: "ip6r_net_prefix", member: "routine:$extension:ip4r.ip6r_net_prefix($extension:ip4r.ip6,pg_catalog.int4)", arguments: [ip6, int4] as const, result: ip6r });
  const member229 = createSqlFunction({ ...base, name: "ip6r_overlaps", member: "routine:$extension:ip4r.ip6r_overlaps($extension:ip4r.ip6r,$extension:ip4r.ip6r)", arguments: [ip6r, ip6r] as const, result: bool });
  const member230 = createSqlFunction({ ...base, name: "ip6r_send", member: "routine:$extension:ip4r.ip6r_send($extension:ip4r.ip6r)", arguments: [ip6r] as const, result: bytes });
  const member231 = createSqlFunction({ ...base, name: "ip6r_size_exact", member: "routine:$extension:ip4r.ip6r_size_exact($extension:ip4r.ip6r)", arguments: [ip6r] as const, result: numeric });
  const member232 = createSqlFunction({ ...base, name: "ip6r_size", member: "routine:$extension:ip4r.ip6r_size($extension:ip4r.ip6r)", arguments: [ip6r] as const, result: float8 });
  const member233 = createSqlFunction({ ...base, name: "ip6r_union", member: "routine:$extension:ip4r.ip6r_union($extension:ip4r.ip6r,$extension:ip4r.ip6r)", arguments: [ip6r, ip6r] as const, result: ip6r });
  const member234 = createSqlFunction({ ...base, name: "ip6r", member: "routine:$extension:ip4r.ip6r($extension:ip4r.ip6,$extension:ip4r.ip6)", arguments: [ip6, ip6] as const, result: ip6r });
  const member235 = createSqlFunction({ ...base, name: "ip6r", member: "routine:$extension:ip4r.ip6r($extension:ip4r.ip6)", arguments: [ip6] as const, result: ip6r });
  const member236 = createSqlFunction({ ...base, name: "ip6r", member: "routine:$extension:ip4r.ip6r($extension:ip4r.iprange)", arguments: [iprange] as const, result: ip6r });
  const member237 = createSqlFunction({ ...base, name: "ip6r", member: "routine:$extension:ip4r.ip6r(pg_catalog.cidr)", arguments: [cidr] as const, result: ip6r });
  const member238 = createSqlFunction({ ...base, name: "ip6r", member: "routine:$extension:ip4r.ip6r(pg_catalog.text)", arguments: [text] as const, result: ip6r });
  const member239 = createSqlFunction({ ...base, name: "ip6r", member: "routine:$extension:ip4r.ip6r(pg_catalog.varbit)", arguments: [varbit] as const, result: ip6r });
  const member240 = createSqlFunction({ ...base, name: "ip6rhash", member: "routine:$extension:ip4r.ip6rhash($extension:ip4r.ip6r)", arguments: [ip6r] as const, result: int4 });
  const member241 = createSqlFunction({ ...base, name: "ipaddress_and", member: "routine:$extension:ip4r.ipaddress_and($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", arguments: [ipaddress, ipaddress] as const, result: ipaddress });
  const member242 = createSqlFunction({ ...base, name: "ipaddress_cmp", member: "routine:$extension:ip4r.ipaddress_cmp($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", arguments: [ipaddress, ipaddress] as const, result: int4 });
  const member243 = createSqlFunction({ ...base, name: "ipaddress_contained_by", member: "routine:$extension:ip4r.ipaddress_contained_by($extension:ip4r.ipaddress,$extension:ip4r.iprange)", arguments: [ipaddress, iprange] as const, result: bool });
  const member244 = createSqlFunction({ ...base, name: "ipaddress_contains", member: "routine:$extension:ip4r.ipaddress_contains($extension:ip4r.iprange,$extension:ip4r.ipaddress)", arguments: [iprange, ipaddress] as const, result: bool });
  const member245 = createSqlFunction({ ...base, name: "ipaddress_eq", member: "routine:$extension:ip4r.ipaddress_eq($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", arguments: [ipaddress, ipaddress] as const, result: bool });
  const member246 = createSqlFunction({ ...base, name: "ipaddress_ge", member: "routine:$extension:ip4r.ipaddress_ge($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", arguments: [ipaddress, ipaddress] as const, result: bool });
  const member247 = createSqlFunction({ ...base, name: "ipaddress_gt", member: "routine:$extension:ip4r.ipaddress_gt($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", arguments: [ipaddress, ipaddress] as const, result: bool });
  const member248 = createSqlFunction({ ...base, name: "ipaddress_hash_extended", member: "routine:$extension:ip4r.ipaddress_hash_extended($extension:ip4r.ipaddress,pg_catalog.int8)", arguments: [ipaddress, int8] as const, result: int8 });
  const member249 = createSqlFunction({ ...base, name: "ipaddress_le", member: "routine:$extension:ip4r.ipaddress_le($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", arguments: [ipaddress, ipaddress] as const, result: bool });
  const member250 = createSqlFunction({ ...base, name: "ipaddress_lt", member: "routine:$extension:ip4r.ipaddress_lt($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", arguments: [ipaddress, ipaddress] as const, result: bool });
  const member251 = createSqlFunction({ ...base, name: "ipaddress_minus_bigint", member: "routine:$extension:ip4r.ipaddress_minus_bigint($extension:ip4r.ipaddress,pg_catalog.int8)", arguments: [ipaddress, int8] as const, result: ipaddress });
  const member252 = createSqlFunction({ ...base, name: "ipaddress_minus_int", member: "routine:$extension:ip4r.ipaddress_minus_int($extension:ip4r.ipaddress,pg_catalog.int4)", arguments: [ipaddress, int4] as const, result: ipaddress });
  const member253 = createSqlFunction({ ...base, name: "ipaddress_minus_ipaddress", member: "routine:$extension:ip4r.ipaddress_minus_ipaddress($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", arguments: [ipaddress, ipaddress] as const, result: numeric });
  const member254 = createSqlFunction({ ...base, name: "ipaddress_minus_numeric", member: "routine:$extension:ip4r.ipaddress_minus_numeric($extension:ip4r.ipaddress,pg_catalog.numeric)", arguments: [ipaddress, numeric] as const, result: ipaddress });
  const member255 = createSqlFunction({ ...base, name: "ipaddress_neq", member: "routine:$extension:ip4r.ipaddress_neq($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", arguments: [ipaddress, ipaddress] as const, result: bool });
  const member256 = createSqlFunction({ ...base, name: "ipaddress_net_lower", member: "routine:$extension:ip4r.ipaddress_net_lower($extension:ip4r.ipaddress,pg_catalog.int4)", arguments: [ipaddress, int4] as const, result: ipaddress });
  const member257 = createSqlFunction({ ...base, name: "ipaddress_net_upper", member: "routine:$extension:ip4r.ipaddress_net_upper($extension:ip4r.ipaddress,pg_catalog.int4)", arguments: [ipaddress, int4] as const, result: ipaddress });
  const member258 = createSqlFunction({ ...base, name: "ipaddress_not", member: "routine:$extension:ip4r.ipaddress_not($extension:ip4r.ipaddress)", arguments: [ipaddress] as const, result: ipaddress });
  const member259 = createSqlFunction({ ...base, name: "ipaddress_or", member: "routine:$extension:ip4r.ipaddress_or($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", arguments: [ipaddress, ipaddress] as const, result: ipaddress });
  const member260 = createSqlFunction({ ...base, name: "ipaddress_plus_bigint", member: "routine:$extension:ip4r.ipaddress_plus_bigint($extension:ip4r.ipaddress,pg_catalog.int8)", arguments: [ipaddress, int8] as const, result: ipaddress });
  const member261 = createSqlFunction({ ...base, name: "ipaddress_plus_int", member: "routine:$extension:ip4r.ipaddress_plus_int($extension:ip4r.ipaddress,pg_catalog.int4)", arguments: [ipaddress, int4] as const, result: ipaddress });
  const member262 = createSqlFunction({ ...base, name: "ipaddress_plus_numeric", member: "routine:$extension:ip4r.ipaddress_plus_numeric($extension:ip4r.ipaddress,pg_catalog.numeric)", arguments: [ipaddress, numeric] as const, result: ipaddress });
  const member263 = createSqlFunction({ ...base, name: "ipaddress_send", member: "routine:$extension:ip4r.ipaddress_send($extension:ip4r.ipaddress)", arguments: [ipaddress] as const, result: bytes });
  const member264 = createSqlFunction({ ...base, name: "ipaddress_xor", member: "routine:$extension:ip4r.ipaddress_xor($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", arguments: [ipaddress, ipaddress] as const, result: ipaddress });
  const member265 = createSqlFunction({ ...base, name: "ipaddress", member: "routine:$extension:ip4r.ipaddress($extension:ip4r.ip4)", arguments: [ip4] as const, result: ipaddress });
  const member266 = createSqlFunction({ ...base, name: "ipaddress", member: "routine:$extension:ip4r.ipaddress($extension:ip4r.ip6)", arguments: [ip6] as const, result: ipaddress });
  const member267 = createSqlFunction({ ...base, name: "ipaddress", member: "routine:$extension:ip4r.ipaddress(pg_catalog.bit)", arguments: [bit] as const, result: ipaddress });
  const member268 = createSqlFunction({ ...base, name: "ipaddress", member: "routine:$extension:ip4r.ipaddress(pg_catalog.bytea)", arguments: [bytes] as const, result: ipaddress });
  const member269 = createSqlFunction({ ...base, name: "ipaddress", member: "routine:$extension:ip4r.ipaddress(pg_catalog.inet)", arguments: [inet] as const, result: ipaddress });
  const member270 = createSqlFunction({ ...base, name: "ipaddress", member: "routine:$extension:ip4r.ipaddress(pg_catalog.text)", arguments: [text] as const, result: ipaddress });
  const member271 = createSqlFunction({ ...base, name: "ipaddress", member: "routine:$extension:ip4r.ipaddress(pg_catalog.varbit)", arguments: [varbit] as const, result: ipaddress });
  const member272 = createSqlFunction({ ...base, name: "ipaddresshash", member: "routine:$extension:ip4r.ipaddresshash($extension:ip4r.ipaddress)", arguments: [ipaddress] as const, result: int4 });
  const member273 = createSqlFunction({ ...base, name: "iprange_cmp", member: "routine:$extension:ip4r.iprange_cmp($extension:ip4r.iprange,$extension:ip4r.iprange)", arguments: [iprange, iprange] as const, result: int4 });
  const member274 = createSqlFunction({ ...base, name: "iprange_contained_by_strict", member: "routine:$extension:ip4r.iprange_contained_by_strict($extension:ip4r.iprange,$extension:ip4r.iprange)", arguments: [iprange, iprange] as const, result: bool });
  const member275 = createSqlFunction({ ...base, name: "iprange_contained_by", member: "routine:$extension:ip4r.iprange_contained_by($extension:ip4r.iprange,$extension:ip4r.iprange)", arguments: [iprange, iprange] as const, result: bool });
  const member276 = createSqlFunction({ ...base, name: "iprange_contains_strict", member: "routine:$extension:ip4r.iprange_contains_strict($extension:ip4r.iprange,$extension:ip4r.iprange)", arguments: [iprange, iprange] as const, result: bool });
  const member277 = createSqlFunction({ ...base, name: "iprange_contains", member: "routine:$extension:ip4r.iprange_contains($extension:ip4r.iprange,$extension:ip4r.iprange)", arguments: [iprange, iprange] as const, result: bool });
  const member278 = createSqlFunction({ ...base, name: "iprange_eq", member: "routine:$extension:ip4r.iprange_eq($extension:ip4r.iprange,$extension:ip4r.iprange)", arguments: [iprange, iprange] as const, result: bool });
  const member279 = createSqlFunction({ ...base, name: "iprange_ge", member: "routine:$extension:ip4r.iprange_ge($extension:ip4r.iprange,$extension:ip4r.iprange)", arguments: [iprange, iprange] as const, result: bool });
  const member280 = createSqlFunction({ ...base, name: "iprange_gt", member: "routine:$extension:ip4r.iprange_gt($extension:ip4r.iprange,$extension:ip4r.iprange)", arguments: [iprange, iprange] as const, result: bool });
  const member281 = createSqlFunction({ ...base, name: "iprange_hash_extended", member: "routine:$extension:ip4r.iprange_hash_extended($extension:ip4r.iprange,pg_catalog.int8)", arguments: [iprange, int8] as const, result: int8 });
  const member282 = createSqlFunction({ ...base, name: "iprange_hash", member: "routine:$extension:ip4r.iprange_hash($extension:ip4r.iprange)", arguments: [iprange] as const, result: int4 });
  const member283 = createSqlFunction({ ...base, name: "iprange_inter", member: "routine:$extension:ip4r.iprange_inter($extension:ip4r.iprange,$extension:ip4r.iprange)", arguments: [iprange, iprange] as const, result: iprange });
  const member284 = createSqlFunction({ ...base, name: "iprange_le", member: "routine:$extension:ip4r.iprange_le($extension:ip4r.iprange,$extension:ip4r.iprange)", arguments: [iprange, iprange] as const, result: bool });
  const member285 = createSqlFunction({ ...base, name: "iprange_lt", member: "routine:$extension:ip4r.iprange_lt($extension:ip4r.iprange,$extension:ip4r.iprange)", arguments: [iprange, iprange] as const, result: bool });
  const member286 = createSqlFunction({ ...base, name: "iprange_neq", member: "routine:$extension:ip4r.iprange_neq($extension:ip4r.iprange,$extension:ip4r.iprange)", arguments: [iprange, iprange] as const, result: bool });
  const member287 = createSqlFunction({ ...base, name: "iprange_net_mask", member: "routine:$extension:ip4r.iprange_net_mask($extension:ip4r.ip4,$extension:ip4r.ip4)", arguments: [ip4, ip4] as const, result: iprange });
  const member288 = createSqlFunction({ ...base, name: "iprange_net_mask", member: "routine:$extension:ip4r.iprange_net_mask($extension:ip4r.ip6,$extension:ip4r.ip6)", arguments: [ip6, ip6] as const, result: iprange });
  const member289 = createSqlFunction({ ...base, name: "iprange_net_mask", member: "routine:$extension:ip4r.iprange_net_mask($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", arguments: [ipaddress, ipaddress] as const, result: iprange });
  const member290 = createSqlFunction({ ...base, name: "iprange_net_prefix", member: "routine:$extension:ip4r.iprange_net_prefix($extension:ip4r.ip4,pg_catalog.int4)", arguments: [ip4, int4] as const, result: iprange });
  const member291 = createSqlFunction({ ...base, name: "iprange_net_prefix", member: "routine:$extension:ip4r.iprange_net_prefix($extension:ip4r.ip6,pg_catalog.int4)", arguments: [ip6, int4] as const, result: iprange });
  const member292 = createSqlFunction({ ...base, name: "iprange_net_prefix", member: "routine:$extension:ip4r.iprange_net_prefix($extension:ip4r.ipaddress,pg_catalog.int4)", arguments: [ipaddress, int4] as const, result: iprange });
  const member293 = createSqlFunction({ ...base, name: "iprange_overlaps", member: "routine:$extension:ip4r.iprange_overlaps($extension:ip4r.iprange,$extension:ip4r.iprange)", arguments: [iprange, iprange] as const, result: bool });
  const member294 = createSqlFunction({ ...base, name: "iprange_send", member: "routine:$extension:ip4r.iprange_send($extension:ip4r.iprange)", arguments: [iprange] as const, result: bytes });
  const member295 = createSqlFunction({ ...base, name: "iprange_size_exact", member: "routine:$extension:ip4r.iprange_size_exact($extension:ip4r.iprange)", arguments: [iprange] as const, result: numeric });
  const member296 = createSqlFunction({ ...base, name: "iprange_size", member: "routine:$extension:ip4r.iprange_size($extension:ip4r.iprange)", arguments: [iprange] as const, result: float8 });
  const member297 = createSqlFunction({ ...base, name: "iprange_union", member: "routine:$extension:ip4r.iprange_union($extension:ip4r.iprange,$extension:ip4r.iprange)", arguments: [iprange, iprange] as const, result: iprange });
  const member298 = createSqlFunction({ ...base, name: "iprange", member: "routine:$extension:ip4r.iprange($extension:ip4r.ip4,$extension:ip4r.ip4)", arguments: [ip4, ip4] as const, result: iprange });
  const member299 = createSqlFunction({ ...base, name: "iprange", member: "routine:$extension:ip4r.iprange($extension:ip4r.ip4)", arguments: [ip4] as const, result: iprange });
  const member300 = createSqlFunction({ ...base, name: "iprange", member: "routine:$extension:ip4r.iprange($extension:ip4r.ip4r)", arguments: [ip4r] as const, result: iprange });
  const member301 = createSqlFunction({ ...base, name: "iprange", member: "routine:$extension:ip4r.iprange($extension:ip4r.ip6,$extension:ip4r.ip6)", arguments: [ip6, ip6] as const, result: iprange });
  const member302 = createSqlFunction({ ...base, name: "iprange", member: "routine:$extension:ip4r.iprange($extension:ip4r.ip6)", arguments: [ip6] as const, result: iprange });
  const member303 = createSqlFunction({ ...base, name: "iprange", member: "routine:$extension:ip4r.iprange($extension:ip4r.ip6r)", arguments: [ip6r] as const, result: iprange });
  const member304 = createSqlFunction({ ...base, name: "iprange", member: "routine:$extension:ip4r.iprange($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)", arguments: [ipaddress, ipaddress] as const, result: iprange });
  const member305 = createSqlFunction({ ...base, name: "iprange", member: "routine:$extension:ip4r.iprange($extension:ip4r.ipaddress)", arguments: [ipaddress] as const, result: iprange });
  const member306 = createSqlFunction({ ...base, name: "iprange", member: "routine:$extension:ip4r.iprange(pg_catalog.cidr)", arguments: [cidr] as const, result: iprange });
  const member307 = createSqlFunction({ ...base, name: "iprange", member: "routine:$extension:ip4r.iprange(pg_catalog.text)", arguments: [text] as const, result: iprange });
  const member308 = createSqlFunction({ ...base, name: "iprangehash", member: "routine:$extension:ip4r.iprangehash($extension:ip4r.iprange)", arguments: [iprange] as const, result: int4 });
  const member309 = createSqlFunction({ ...base, name: "is_cidr", member: "routine:$extension:ip4r.is_cidr($extension:ip4r.ip4r)", arguments: [ip4r] as const, result: bool });
  const member310 = createSqlFunction({ ...base, name: "is_cidr", member: "routine:$extension:ip4r.is_cidr($extension:ip4r.ip6r)", arguments: [ip6r] as const, result: bool });
  const member311 = createSqlFunction({ ...base, name: "is_cidr", member: "routine:$extension:ip4r.is_cidr($extension:ip4r.iprange)", arguments: [iprange] as const, result: bool });
  const member312 = createSqlFunction({ ...base, name: "lower", member: "routine:$extension:ip4r.lower($extension:ip4r.ip4r)", arguments: [ip4r] as const, result: ip4 });
  const member313 = createSqlFunction({ ...base, name: "lower", member: "routine:$extension:ip4r.lower($extension:ip4r.ip6r)", arguments: [ip6r] as const, result: ip6 });
  const member314 = createSqlFunction({ ...base, name: "lower", member: "routine:$extension:ip4r.lower($extension:ip4r.iprange)", arguments: [iprange] as const, result: ipaddress });
  const member315 = createSqlFunction({ ...base, name: "masklen", member: "routine:$extension:ip4r.masklen($extension:ip4r.ip4r)", arguments: [ip4r] as const, result: int4 });
  const member316 = createSqlFunction({ ...base, name: "masklen", member: "routine:$extension:ip4r.masklen($extension:ip4r.ip6r)", arguments: [ip6r] as const, result: int4 });
  const member317 = createSqlFunction({ ...base, name: "masklen", member: "routine:$extension:ip4r.masklen($extension:ip4r.iprange)", arguments: [iprange] as const, result: int4 });
  const member318 = createSqlFunction({ ...base, name: "text", member: "routine:$extension:ip4r.text($extension:ip4r.ip4)", arguments: [ip4] as const, result: text });
  const member319 = createSqlFunction({ ...base, name: "text", member: "routine:$extension:ip4r.text($extension:ip4r.ip4r)", arguments: [ip4r] as const, result: text });
  const member320 = createSqlFunction({ ...base, name: "text", member: "routine:$extension:ip4r.text($extension:ip4r.ip6)", arguments: [ip6] as const, result: text });
  const member321 = createSqlFunction({ ...base, name: "text", member: "routine:$extension:ip4r.text($extension:ip4r.ip6r)", arguments: [ip6r] as const, result: text });
  const member322 = createSqlFunction({ ...base, name: "text", member: "routine:$extension:ip4r.text($extension:ip4r.ipaddress)", arguments: [ipaddress] as const, result: text });
  const member323 = createSqlFunction({ ...base, name: "text", member: "routine:$extension:ip4r.text($extension:ip4r.iprange)", arguments: [iprange] as const, result: text });
  const member324 = createSqlFunction({ ...base, name: "to_bigint", member: "routine:$extension:ip4r.to_bigint($extension:ip4r.ip4)", arguments: [ip4] as const, result: int8 });
  const member325 = createSqlFunction({ ...base, name: "to_bit", member: "routine:$extension:ip4r.to_bit($extension:ip4r.ip4)", arguments: [ip4] as const, result: varbit });
  const member326 = createSqlFunction({ ...base, name: "to_bit", member: "routine:$extension:ip4r.to_bit($extension:ip4r.ip4r)", arguments: [ip4r] as const, result: varbit });
  const member327 = createSqlFunction({ ...base, name: "to_bit", member: "routine:$extension:ip4r.to_bit($extension:ip4r.ip6)", arguments: [ip6] as const, result: varbit });
  const member328 = createSqlFunction({ ...base, name: "to_bit", member: "routine:$extension:ip4r.to_bit($extension:ip4r.ip6r)", arguments: [ip6r] as const, result: varbit });
  const member329 = createSqlFunction({ ...base, name: "to_bit", member: "routine:$extension:ip4r.to_bit($extension:ip4r.ipaddress)", arguments: [ipaddress] as const, result: varbit });
  const member330 = createSqlFunction({ ...base, name: "to_bit", member: "routine:$extension:ip4r.to_bit($extension:ip4r.iprange)", arguments: [iprange] as const, result: varbit });
  const member331 = createSqlFunction({ ...base, name: "to_bytea", member: "routine:$extension:ip4r.to_bytea($extension:ip4r.ip4)", arguments: [ip4] as const, result: bytes });
  const member332 = createSqlFunction({ ...base, name: "to_bytea", member: "routine:$extension:ip4r.to_bytea($extension:ip4r.ip6)", arguments: [ip6] as const, result: bytes });
  const member333 = createSqlFunction({ ...base, name: "to_bytea", member: "routine:$extension:ip4r.to_bytea($extension:ip4r.ipaddress)", arguments: [ipaddress] as const, result: bytes });
  const member334 = createSqlFunction({ ...base, name: "to_double", member: "routine:$extension:ip4r.to_double($extension:ip4r.ip4)", arguments: [ip4] as const, result: float8 });
  const member335 = createSqlFunction({ ...base, name: "to_numeric", member: "routine:$extension:ip4r.to_numeric($extension:ip4r.ip4)", arguments: [ip4] as const, result: numeric });
  const member336 = createSqlFunction({ ...base, name: "to_numeric", member: "routine:$extension:ip4r.to_numeric($extension:ip4r.ip6)", arguments: [ip6] as const, result: numeric });
  const member337 = createSqlFunction({ ...base, name: "to_numeric", member: "routine:$extension:ip4r.to_numeric($extension:ip4r.ipaddress)", arguments: [ipaddress] as const, result: numeric });
  const member338 = createSqlFunction({ ...base, name: "upper", member: "routine:$extension:ip4r.upper($extension:ip4r.ip4r)", arguments: [ip4r] as const, result: ip4 });
  const member339 = createSqlFunction({ ...base, name: "upper", member: "routine:$extension:ip4r.upper($extension:ip4r.ip6r)", arguments: [ip6r] as const, result: ip6 });
  const member340 = createSqlFunction({ ...base, name: "upper", member: "routine:$extension:ip4r.upper($extension:ip4r.iprange)", arguments: [iprange] as const, result: ipaddress });
  const functions = Object.freeze({
    "cidr_split": Object.freeze({ "ip4r": member96, "ip6r": member97, "iprange": member98 }),
    "cidr": Object.freeze({ "ip4": member99, "ip4r": member100, "ip6": member101, "ip6r": member102, "ipaddress": member103, "iprange": member104 }),
    "family": Object.freeze({ "ip4": member105, "ip4r": member106, "ip6": member107, "ip6r": member108, "ipaddress": member109, "iprange": member110 }),
    "in_range": Object.freeze({ "ip4_ip4_ip4_bool_bool": member111, "ip4_ip4_int8_bool_bool": member112, "ip6_ip6_ip6_bool_bool": member113, "ip6_ip6_int8_bool_bool": member114 }),
    "ip4_and": Object.freeze({ "ip4_ip4": member115 }),
    "ip4_cmp": Object.freeze({ "ip4_ip4": member116 }),
    "ip4_contained_by": Object.freeze({ "ip4_ip4r": member117, "ip4_iprange": member118 }),
    "ip4_contains": Object.freeze({ "ip4r_ip4": member119, "iprange_ip4": member120 }),
    "ip4_eq": Object.freeze({ "ip4_ip4": member121 }),
    "ip4_ge": Object.freeze({ "ip4_ip4": member122 }),
    "ip4_gt": Object.freeze({ "ip4_ip4": member123 }),
    "ip4_hash_extended": Object.freeze({ "ip4_int8": member124 }),
    "ip4_le": Object.freeze({ "ip4_ip4": member125 }),
    "ip4_lt": Object.freeze({ "ip4_ip4": member126 }),
    "ip4_minus_bigint": Object.freeze({ "ip4_int8": member127 }),
    "ip4_minus_int": Object.freeze({ "ip4_int4": member128 }),
    "ip4_minus_ip4": Object.freeze({ "ip4_ip4": member129 }),
    "ip4_minus_numeric": Object.freeze({ "ip4_numeric": member130 }),
    "ip4_neq": Object.freeze({ "ip4_ip4": member131 }),
    "ip4_net_lower": Object.freeze({ "ip4_int4": member132 }),
    "ip4_net_upper": Object.freeze({ "ip4_int4": member133 }),
    "ip4_netmask": Object.freeze({ "int4": member134 }),
    "ip4_not": Object.freeze({ "ip4": member135 }),
    "ip4_or": Object.freeze({ "ip4_ip4": member136 }),
    "ip4_plus_bigint": Object.freeze({ "ip4_int8": member137 }),
    "ip4_plus_int": Object.freeze({ "ip4_int4": member138 }),
    "ip4_plus_numeric": Object.freeze({ "ip4_numeric": member139 }),
    "ip4_send": Object.freeze({ "ip4": member140 }),
    "ip4_xor": Object.freeze({ "ip4_ip4": member141 }),
    "ip4": Object.freeze({ "ipaddress": member142, "bit": member143, "bytea": member144, "float8": member145, "inet": member146, "int8": member147, "numeric": member148, "text": member149, "varbit": member150 }),
    "ip4hash": Object.freeze({ "ip4": member151 }),
    "ip4r_cmp": Object.freeze({ "ip4r_ip4r": member152 }),
    "ip4r_contained_by_strict": Object.freeze({ "ip4r_ip4r": member153 }),
    "ip4r_contained_by": Object.freeze({ "ip4r_ip4r": member154 }),
    "ip4r_contains_strict": Object.freeze({ "ip4r_ip4r": member155 }),
    "ip4r_contains": Object.freeze({ "ip4r_ip4r": member156 }),
    "ip4r_eq": Object.freeze({ "ip4r_ip4r": member157 }),
    "ip4r_ge": Object.freeze({ "ip4r_ip4r": member158 }),
    "ip4r_gt": Object.freeze({ "ip4r_ip4r": member159 }),
    "ip4r_hash_extended": Object.freeze({ "ip4r_int8": member160 }),
    "ip4r_inter": Object.freeze({ "ip4r_ip4r": member161 }),
    "ip4r_le": Object.freeze({ "ip4r_ip4r": member162 }),
    "ip4r_lt": Object.freeze({ "ip4r_ip4r": member163 }),
    "ip4r_neq": Object.freeze({ "ip4r_ip4r": member164 }),
    "ip4r_net_mask": Object.freeze({ "ip4_ip4": member165 }),
    "ip4r_net_prefix": Object.freeze({ "ip4_int4": member166 }),
    "ip4r_overlaps": Object.freeze({ "ip4r_ip4r": member167 }),
    "ip4r_send": Object.freeze({ "ip4r": member168 }),
    "ip4r_size_exact": Object.freeze({ "ip4r": member169 }),
    "ip4r_size": Object.freeze({ "ip4r": member170 }),
    "ip4r_union": Object.freeze({ "ip4r_ip4r": member171 }),
    "ip4r": Object.freeze({ "ip4_ip4": member172, "ip4": member173, "iprange": member174, "cidr": member175, "text": member176, "varbit": member177 }),
    "ip4rhash": Object.freeze({ "ip4r": member178 }),
    "ip6_and": Object.freeze({ "ip6_ip6": member179 }),
    "ip6_cmp": Object.freeze({ "ip6_ip6": member180 }),
    "ip6_contained_by": Object.freeze({ "ip6_ip6r": member181, "ip6_iprange": member182 }),
    "ip6_contains": Object.freeze({ "ip6r_ip6": member183, "iprange_ip6": member184 }),
    "ip6_eq": Object.freeze({ "ip6_ip6": member185 }),
    "ip6_ge": Object.freeze({ "ip6_ip6": member186 }),
    "ip6_gt": Object.freeze({ "ip6_ip6": member187 }),
    "ip6_hash_extended": Object.freeze({ "ip6_int8": member188 }),
    "ip6_le": Object.freeze({ "ip6_ip6": member189 }),
    "ip6_lt": Object.freeze({ "ip6_ip6": member190 }),
    "ip6_minus_bigint": Object.freeze({ "ip6_int8": member191 }),
    "ip6_minus_int": Object.freeze({ "ip6_int4": member192 }),
    "ip6_minus_ip6": Object.freeze({ "ip6_ip6": member193 }),
    "ip6_minus_numeric": Object.freeze({ "ip6_numeric": member194 }),
    "ip6_neq": Object.freeze({ "ip6_ip6": member195 }),
    "ip6_net_lower": Object.freeze({ "ip6_int4": member196 }),
    "ip6_net_upper": Object.freeze({ "ip6_int4": member197 }),
    "ip6_netmask": Object.freeze({ "int4": member198 }),
    "ip6_not": Object.freeze({ "ip6": member199 }),
    "ip6_or": Object.freeze({ "ip6_ip6": member200 }),
    "ip6_plus_bigint": Object.freeze({ "ip6_int8": member201 }),
    "ip6_plus_int": Object.freeze({ "ip6_int4": member202 }),
    "ip6_plus_numeric": Object.freeze({ "ip6_numeric": member203 }),
    "ip6_send": Object.freeze({ "ip6": member204 }),
    "ip6_xor": Object.freeze({ "ip6_ip6": member205 }),
    "ip6": Object.freeze({ "ipaddress": member206, "bit": member207, "bytea": member208, "inet": member209, "numeric": member210, "text": member211, "varbit": member212 }),
    "ip6hash": Object.freeze({ "ip6": member213 }),
    "ip6r_cmp": Object.freeze({ "ip6r_ip6r": member214 }),
    "ip6r_contained_by_strict": Object.freeze({ "ip6r_ip6r": member215 }),
    "ip6r_contained_by": Object.freeze({ "ip6r_ip6r": member216 }),
    "ip6r_contains_strict": Object.freeze({ "ip6r_ip6r": member217 }),
    "ip6r_contains": Object.freeze({ "ip6r_ip6r": member218 }),
    "ip6r_eq": Object.freeze({ "ip6r_ip6r": member219 }),
    "ip6r_ge": Object.freeze({ "ip6r_ip6r": member220 }),
    "ip6r_gt": Object.freeze({ "ip6r_ip6r": member221 }),
    "ip6r_hash_extended": Object.freeze({ "ip6r_int8": member222 }),
    "ip6r_inter": Object.freeze({ "ip6r_ip6r": member223 }),
    "ip6r_le": Object.freeze({ "ip6r_ip6r": member224 }),
    "ip6r_lt": Object.freeze({ "ip6r_ip6r": member225 }),
    "ip6r_neq": Object.freeze({ "ip6r_ip6r": member226 }),
    "ip6r_net_mask": Object.freeze({ "ip6_ip6": member227 }),
    "ip6r_net_prefix": Object.freeze({ "ip6_int4": member228 }),
    "ip6r_overlaps": Object.freeze({ "ip6r_ip6r": member229 }),
    "ip6r_send": Object.freeze({ "ip6r": member230 }),
    "ip6r_size_exact": Object.freeze({ "ip6r": member231 }),
    "ip6r_size": Object.freeze({ "ip6r": member232 }),
    "ip6r_union": Object.freeze({ "ip6r_ip6r": member233 }),
    "ip6r": Object.freeze({ "ip6_ip6": member234, "ip6": member235, "iprange": member236, "cidr": member237, "text": member238, "varbit": member239 }),
    "ip6rhash": Object.freeze({ "ip6r": member240 }),
    "ipaddress_and": Object.freeze({ "ipaddress_ipaddress": member241 }),
    "ipaddress_cmp": Object.freeze({ "ipaddress_ipaddress": member242 }),
    "ipaddress_contained_by": Object.freeze({ "ipaddress_iprange": member243 }),
    "ipaddress_contains": Object.freeze({ "iprange_ipaddress": member244 }),
    "ipaddress_eq": Object.freeze({ "ipaddress_ipaddress": member245 }),
    "ipaddress_ge": Object.freeze({ "ipaddress_ipaddress": member246 }),
    "ipaddress_gt": Object.freeze({ "ipaddress_ipaddress": member247 }),
    "ipaddress_hash_extended": Object.freeze({ "ipaddress_int8": member248 }),
    "ipaddress_le": Object.freeze({ "ipaddress_ipaddress": member249 }),
    "ipaddress_lt": Object.freeze({ "ipaddress_ipaddress": member250 }),
    "ipaddress_minus_bigint": Object.freeze({ "ipaddress_int8": member251 }),
    "ipaddress_minus_int": Object.freeze({ "ipaddress_int4": member252 }),
    "ipaddress_minus_ipaddress": Object.freeze({ "ipaddress_ipaddress": member253 }),
    "ipaddress_minus_numeric": Object.freeze({ "ipaddress_numeric": member254 }),
    "ipaddress_neq": Object.freeze({ "ipaddress_ipaddress": member255 }),
    "ipaddress_net_lower": Object.freeze({ "ipaddress_int4": member256 }),
    "ipaddress_net_upper": Object.freeze({ "ipaddress_int4": member257 }),
    "ipaddress_not": Object.freeze({ "ipaddress": member258 }),
    "ipaddress_or": Object.freeze({ "ipaddress_ipaddress": member259 }),
    "ipaddress_plus_bigint": Object.freeze({ "ipaddress_int8": member260 }),
    "ipaddress_plus_int": Object.freeze({ "ipaddress_int4": member261 }),
    "ipaddress_plus_numeric": Object.freeze({ "ipaddress_numeric": member262 }),
    "ipaddress_send": Object.freeze({ "ipaddress": member263 }),
    "ipaddress_xor": Object.freeze({ "ipaddress_ipaddress": member264 }),
    "ipaddress": Object.freeze({ "ip4": member265, "ip6": member266, "bit": member267, "bytea": member268, "inet": member269, "text": member270, "varbit": member271 }),
    "ipaddresshash": Object.freeze({ "ipaddress": member272 }),
    "iprange_cmp": Object.freeze({ "iprange_iprange": member273 }),
    "iprange_contained_by_strict": Object.freeze({ "iprange_iprange": member274 }),
    "iprange_contained_by": Object.freeze({ "iprange_iprange": member275 }),
    "iprange_contains_strict": Object.freeze({ "iprange_iprange": member276 }),
    "iprange_contains": Object.freeze({ "iprange_iprange": member277 }),
    "iprange_eq": Object.freeze({ "iprange_iprange": member278 }),
    "iprange_ge": Object.freeze({ "iprange_iprange": member279 }),
    "iprange_gt": Object.freeze({ "iprange_iprange": member280 }),
    "iprange_hash_extended": Object.freeze({ "iprange_int8": member281 }),
    "iprange_hash": Object.freeze({ "iprange": member282 }),
    "iprange_inter": Object.freeze({ "iprange_iprange": member283 }),
    "iprange_le": Object.freeze({ "iprange_iprange": member284 }),
    "iprange_lt": Object.freeze({ "iprange_iprange": member285 }),
    "iprange_neq": Object.freeze({ "iprange_iprange": member286 }),
    "iprange_net_mask": Object.freeze({ "ip4_ip4": member287, "ip6_ip6": member288, "ipaddress_ipaddress": member289 }),
    "iprange_net_prefix": Object.freeze({ "ip4_int4": member290, "ip6_int4": member291, "ipaddress_int4": member292 }),
    "iprange_overlaps": Object.freeze({ "iprange_iprange": member293 }),
    "iprange_send": Object.freeze({ "iprange": member294 }),
    "iprange_size_exact": Object.freeze({ "iprange": member295 }),
    "iprange_size": Object.freeze({ "iprange": member296 }),
    "iprange_union": Object.freeze({ "iprange_iprange": member297 }),
    "iprange": Object.freeze({ "ip4_ip4": member298, "ip4": member299, "ip4r": member300, "ip6_ip6": member301, "ip6": member302, "ip6r": member303, "ipaddress_ipaddress": member304, "ipaddress": member305, "cidr": member306, "text": member307 }),
    "iprangehash": Object.freeze({ "iprange": member308 }),
    "is_cidr": Object.freeze({ "ip4r": member309, "ip6r": member310, "iprange": member311 }),
    "lower": Object.freeze({ "ip4r": member312, "ip6r": member313, "iprange": member314 }),
    "masklen": Object.freeze({ "ip4r": member315, "ip6r": member316, "iprange": member317 }),
    "text": Object.freeze({ "ip4": member318, "ip4r": member319, "ip6": member320, "ip6r": member321, "ipaddress": member322, "iprange": member323 }),
    "to_bigint": Object.freeze({ "ip4": member324 }),
    "to_bit": Object.freeze({ "ip4": member325, "ip4r": member326, "ip6": member327, "ip6r": member328, "ipaddress": member329, "iprange": member330 }),
    "to_bytea": Object.freeze({ "ip4": member331, "ip6": member332, "ipaddress": member333 }),
    "to_double": Object.freeze({ "ip4": member334 }),
    "to_numeric": Object.freeze({ "ip4": member335, "ip6": member336, "ipaddress": member337 }),
    "upper": Object.freeze({ "ip4r": member338, "ip6r": member339, "iprange": member340 }),
  });
  const operators = Object.freeze({
    "-": Object.freeze({ "ip4_ip4": member0, "ip4_int4": member1, "ip4_int8": member2, "ip4_numeric": member3, "ip6_ip6": member4, "ip6_int4": member5, "ip6_int8": member6, "ip6_numeric": member7, "ipaddress_ipaddress": member8, "ipaddress_int4": member9, "ipaddress_int8": member10, "ipaddress_numeric": member11 }),
    "@": Object.freeze({ "ip4r": member12, "ip6r": member13, "iprange": member14 }),
    "@@": Object.freeze({ "ip4r": member15, "ip6r": member16, "iprange": member17 }),
    "/": Object.freeze({ "ip4_ip4": member18, "ip4_int4": member19, "ip6_ip6": member20, "ip6_int4": member21, "ipaddress_ipaddress": member22, "ipaddress_int4": member23 }),
    "&": Object.freeze({ "ip4_ip4": member24, "ip6_ip6": member25, "ipaddress_ipaddress": member26 }),
    "&&": Object.freeze({ "ip4r_ip4r": member27, "ip6r_ip6r": member28, "iprange_iprange": member29 }),
    "#": Object.freeze({ "ip4_ip4": member30, "ip6_ip6": member31, "ipaddress_ipaddress": member32 }),
    "+": Object.freeze({ "ip4_int4": member33, "ip4_int8": member34, "ip4_numeric": member35, "ip6_int4": member36, "ip6_int8": member37, "ip6_numeric": member38, "ipaddress_int4": member39, "ipaddress_int8": member40, "ipaddress_numeric": member41 }),
    "<": Object.freeze({ "ip4_ip4": member42, "ip4r_ip4r": member43, "ip6_ip6": member44, "ip6r_ip6r": member45, "ipaddress_ipaddress": member46, "iprange_iprange": member47 }),
    "<<": Object.freeze({ "ip4r_ip4r": member48, "ip6r_ip6r": member49, "iprange_iprange": member50 }),
    "<<=": Object.freeze({ "ip4r_ip4r": member51, "ip6r_ip6r": member52, "iprange_iprange": member53 }),
    "<=": Object.freeze({ "ip4_ip4": member54, "ip4r_ip4r": member55, "ip6_ip6": member56, "ip6r_ip6r": member57, "ipaddress_ipaddress": member58, "iprange_iprange": member59 }),
    "<>": Object.freeze({ "ip4_ip4": member60, "ip4r_ip4r": member61, "ip6_ip6": member62, "ip6r_ip6r": member63, "ipaddress_ipaddress": member64, "iprange_iprange": member65 }),
    "=": Object.freeze({ "ip4_ip4": member66, "ip4r_ip4r": member67, "ip6_ip6": member68, "ip6r_ip6r": member69, "ipaddress_ipaddress": member70, "iprange_iprange": member71 }),
    ">": Object.freeze({ "ip4_ip4": member72, "ip4r_ip4r": member73, "ip6_ip6": member74, "ip6r_ip6r": member75, "ipaddress_ipaddress": member76, "iprange_iprange": member77 }),
    ">=": Object.freeze({ "ip4_ip4": member78, "ip4r_ip4r": member79, "ip6_ip6": member80, "ip6r_ip6r": member81, "ipaddress_ipaddress": member82, "iprange_iprange": member83 }),
    ">>": Object.freeze({ "ip4r_ip4r": member84, "ip6r_ip6r": member85, "iprange_iprange": member86 }),
    ">>=": Object.freeze({ "ip4r_ip4r": member87, "ip6r_ip6r": member88, "iprange_iprange": member89 }),
    "|": Object.freeze({ "ip4_ip4": member90, "ip6_ip6": member91, "ipaddress_ipaddress": member92 }),
    "~": Object.freeze({ "ip4": member93, "ip6": member94, "ipaddress": member95 }),
  });
  const casts = Object.freeze({
    "cast:$extension:ip4r.ip4->$extension:ip4r.ip4r": cast(ip4, ip4r, "cast:$extension:ip4r.ip4->$extension:ip4r.ip4r"),
    "cast:$extension:ip4r.ip4->$extension:ip4r.ipaddress": cast(ip4, ipaddress, "cast:$extension:ip4r.ip4->$extension:ip4r.ipaddress"),
    "cast:$extension:ip4r.ip4->$extension:ip4r.iprange": cast(ip4, iprange, "cast:$extension:ip4r.ip4->$extension:ip4r.iprange"),
    "cast:$extension:ip4r.ip4->pg_catalog.bytea": cast(ip4, bytes, "cast:$extension:ip4r.ip4->pg_catalog.bytea"),
    "cast:$extension:ip4r.ip4->pg_catalog.cidr": cast(ip4, cidr, "cast:$extension:ip4r.ip4->pg_catalog.cidr"),
    "cast:$extension:ip4r.ip4->pg_catalog.float8": cast(ip4, float8, "cast:$extension:ip4r.ip4->pg_catalog.float8"),
    "cast:$extension:ip4r.ip4->pg_catalog.int8": cast(ip4, int8, "cast:$extension:ip4r.ip4->pg_catalog.int8"),
    "cast:$extension:ip4r.ip4->pg_catalog.numeric": cast(ip4, numeric, "cast:$extension:ip4r.ip4->pg_catalog.numeric"),
    "cast:$extension:ip4r.ip4->pg_catalog.text": cast(ip4, text, "cast:$extension:ip4r.ip4->pg_catalog.text"),
    "cast:$extension:ip4r.ip4->pg_catalog.varbit": cast(ip4, varbit, "cast:$extension:ip4r.ip4->pg_catalog.varbit"),
    "cast:$extension:ip4r.ip4r->$extension:ip4r.iprange": cast(ip4r, iprange, "cast:$extension:ip4r.ip4r->$extension:ip4r.iprange"),
    "cast:$extension:ip4r.ip4r->pg_catalog.cidr": cast(ip4r, cidr, "cast:$extension:ip4r.ip4r->pg_catalog.cidr"),
    "cast:$extension:ip4r.ip4r->pg_catalog.text": cast(ip4r, text, "cast:$extension:ip4r.ip4r->pg_catalog.text"),
    "cast:$extension:ip4r.ip4r->pg_catalog.varbit": cast(ip4r, varbit, "cast:$extension:ip4r.ip4r->pg_catalog.varbit"),
    "cast:$extension:ip4r.ip6->$extension:ip4r.ip6r": cast(ip6, ip6r, "cast:$extension:ip4r.ip6->$extension:ip4r.ip6r"),
    "cast:$extension:ip4r.ip6->$extension:ip4r.ipaddress": cast(ip6, ipaddress, "cast:$extension:ip4r.ip6->$extension:ip4r.ipaddress"),
    "cast:$extension:ip4r.ip6->$extension:ip4r.iprange": cast(ip6, iprange, "cast:$extension:ip4r.ip6->$extension:ip4r.iprange"),
    "cast:$extension:ip4r.ip6->pg_catalog.bytea": cast(ip6, bytes, "cast:$extension:ip4r.ip6->pg_catalog.bytea"),
    "cast:$extension:ip4r.ip6->pg_catalog.cidr": cast(ip6, cidr, "cast:$extension:ip4r.ip6->pg_catalog.cidr"),
    "cast:$extension:ip4r.ip6->pg_catalog.numeric": cast(ip6, numeric, "cast:$extension:ip4r.ip6->pg_catalog.numeric"),
    "cast:$extension:ip4r.ip6->pg_catalog.text": cast(ip6, text, "cast:$extension:ip4r.ip6->pg_catalog.text"),
    "cast:$extension:ip4r.ip6->pg_catalog.varbit": cast(ip6, varbit, "cast:$extension:ip4r.ip6->pg_catalog.varbit"),
    "cast:$extension:ip4r.ip6r->$extension:ip4r.iprange": cast(ip6r, iprange, "cast:$extension:ip4r.ip6r->$extension:ip4r.iprange"),
    "cast:$extension:ip4r.ip6r->pg_catalog.cidr": cast(ip6r, cidr, "cast:$extension:ip4r.ip6r->pg_catalog.cidr"),
    "cast:$extension:ip4r.ip6r->pg_catalog.text": cast(ip6r, text, "cast:$extension:ip4r.ip6r->pg_catalog.text"),
    "cast:$extension:ip4r.ip6r->pg_catalog.varbit": cast(ip6r, varbit, "cast:$extension:ip4r.ip6r->pg_catalog.varbit"),
    "cast:$extension:ip4r.ipaddress->$extension:ip4r.ip4": cast(ipaddress, ip4, "cast:$extension:ip4r.ipaddress->$extension:ip4r.ip4"),
    "cast:$extension:ip4r.ipaddress->$extension:ip4r.ip6": cast(ipaddress, ip6, "cast:$extension:ip4r.ipaddress->$extension:ip4r.ip6"),
    "cast:$extension:ip4r.ipaddress->$extension:ip4r.iprange": cast(ipaddress, iprange, "cast:$extension:ip4r.ipaddress->$extension:ip4r.iprange"),
    "cast:$extension:ip4r.ipaddress->pg_catalog.bytea": cast(ipaddress, bytes, "cast:$extension:ip4r.ipaddress->pg_catalog.bytea"),
    "cast:$extension:ip4r.ipaddress->pg_catalog.cidr": cast(ipaddress, cidr, "cast:$extension:ip4r.ipaddress->pg_catalog.cidr"),
    "cast:$extension:ip4r.ipaddress->pg_catalog.numeric": cast(ipaddress, numeric, "cast:$extension:ip4r.ipaddress->pg_catalog.numeric"),
    "cast:$extension:ip4r.ipaddress->pg_catalog.text": cast(ipaddress, text, "cast:$extension:ip4r.ipaddress->pg_catalog.text"),
    "cast:$extension:ip4r.ipaddress->pg_catalog.varbit": cast(ipaddress, varbit, "cast:$extension:ip4r.ipaddress->pg_catalog.varbit"),
    "cast:$extension:ip4r.iprange->$extension:ip4r.ip4r": cast(iprange, ip4r, "cast:$extension:ip4r.iprange->$extension:ip4r.ip4r"),
    "cast:$extension:ip4r.iprange->$extension:ip4r.ip6r": cast(iprange, ip6r, "cast:$extension:ip4r.iprange->$extension:ip4r.ip6r"),
    "cast:$extension:ip4r.iprange->pg_catalog.cidr": cast(iprange, cidr, "cast:$extension:ip4r.iprange->pg_catalog.cidr"),
    "cast:$extension:ip4r.iprange->pg_catalog.text": cast(iprange, text, "cast:$extension:ip4r.iprange->pg_catalog.text"),
    "cast:$extension:ip4r.iprange->pg_catalog.varbit": cast(iprange, varbit, "cast:$extension:ip4r.iprange->pg_catalog.varbit"),
    "cast:pg_catalog.bit->$extension:ip4r.ip4": cast(bit, ip4, "cast:pg_catalog.bit->$extension:ip4r.ip4"),
    "cast:pg_catalog.bit->$extension:ip4r.ip6": cast(bit, ip6, "cast:pg_catalog.bit->$extension:ip4r.ip6"),
    "cast:pg_catalog.bit->$extension:ip4r.ipaddress": cast(bit, ipaddress, "cast:pg_catalog.bit->$extension:ip4r.ipaddress"),
    "cast:pg_catalog.bytea->$extension:ip4r.ip4": cast(bytes, ip4, "cast:pg_catalog.bytea->$extension:ip4r.ip4"),
    "cast:pg_catalog.bytea->$extension:ip4r.ip6": cast(bytes, ip6, "cast:pg_catalog.bytea->$extension:ip4r.ip6"),
    "cast:pg_catalog.bytea->$extension:ip4r.ipaddress": cast(bytes, ipaddress, "cast:pg_catalog.bytea->$extension:ip4r.ipaddress"),
    "cast:pg_catalog.cidr->$extension:ip4r.ip4r": cast(cidr, ip4r, "cast:pg_catalog.cidr->$extension:ip4r.ip4r"),
    "cast:pg_catalog.cidr->$extension:ip4r.ip6r": cast(cidr, ip6r, "cast:pg_catalog.cidr->$extension:ip4r.ip6r"),
    "cast:pg_catalog.cidr->$extension:ip4r.iprange": cast(cidr, iprange, "cast:pg_catalog.cidr->$extension:ip4r.iprange"),
    "cast:pg_catalog.float8->$extension:ip4r.ip4": cast(float8, ip4, "cast:pg_catalog.float8->$extension:ip4r.ip4"),
    "cast:pg_catalog.inet->$extension:ip4r.ip4": cast(inet, ip4, "cast:pg_catalog.inet->$extension:ip4r.ip4"),
    "cast:pg_catalog.inet->$extension:ip4r.ip6": cast(inet, ip6, "cast:pg_catalog.inet->$extension:ip4r.ip6"),
    "cast:pg_catalog.inet->$extension:ip4r.ipaddress": cast(inet, ipaddress, "cast:pg_catalog.inet->$extension:ip4r.ipaddress"),
    "cast:pg_catalog.int8->$extension:ip4r.ip4": cast(int8, ip4, "cast:pg_catalog.int8->$extension:ip4r.ip4"),
    "cast:pg_catalog.numeric->$extension:ip4r.ip4": cast(numeric, ip4, "cast:pg_catalog.numeric->$extension:ip4r.ip4"),
    "cast:pg_catalog.numeric->$extension:ip4r.ip6": cast(numeric, ip6, "cast:pg_catalog.numeric->$extension:ip4r.ip6"),
    "cast:pg_catalog.text->$extension:ip4r.ip4": cast(text, ip4, "cast:pg_catalog.text->$extension:ip4r.ip4"),
    "cast:pg_catalog.text->$extension:ip4r.ip4r": cast(text, ip4r, "cast:pg_catalog.text->$extension:ip4r.ip4r"),
    "cast:pg_catalog.text->$extension:ip4r.ip6": cast(text, ip6, "cast:pg_catalog.text->$extension:ip4r.ip6"),
    "cast:pg_catalog.text->$extension:ip4r.ip6r": cast(text, ip6r, "cast:pg_catalog.text->$extension:ip4r.ip6r"),
    "cast:pg_catalog.text->$extension:ip4r.ipaddress": cast(text, ipaddress, "cast:pg_catalog.text->$extension:ip4r.ipaddress"),
    "cast:pg_catalog.text->$extension:ip4r.iprange": cast(text, iprange, "cast:pg_catalog.text->$extension:ip4r.iprange"),
    "cast:pg_catalog.varbit->$extension:ip4r.ip4": cast(varbit, ip4, "cast:pg_catalog.varbit->$extension:ip4r.ip4"),
    "cast:pg_catalog.varbit->$extension:ip4r.ip4r": cast(varbit, ip4r, "cast:pg_catalog.varbit->$extension:ip4r.ip4r"),
    "cast:pg_catalog.varbit->$extension:ip4r.ip6": cast(varbit, ip6, "cast:pg_catalog.varbit->$extension:ip4r.ip6"),
    "cast:pg_catalog.varbit->$extension:ip4r.ip6r": cast(varbit, ip6r, "cast:pg_catalog.varbit->$extension:ip4r.ip6r"),
    "cast:pg_catalog.varbit->$extension:ip4r.ipaddress": cast(varbit, ipaddress, "cast:pg_catalog.varbit->$extension:ip4r.ipaddress"),
  });
  const overloads = Object.freeze({
    "operator:$extension:ip4r.-($extension:ip4r.ip4,$extension:ip4r.ip4)": member0,
    "operator:$extension:ip4r.-($extension:ip4r.ip4,pg_catalog.int4)": member1,
    "operator:$extension:ip4r.-($extension:ip4r.ip4,pg_catalog.int8)": member2,
    "operator:$extension:ip4r.-($extension:ip4r.ip4,pg_catalog.numeric)": member3,
    "operator:$extension:ip4r.-($extension:ip4r.ip6,$extension:ip4r.ip6)": member4,
    "operator:$extension:ip4r.-($extension:ip4r.ip6,pg_catalog.int4)": member5,
    "operator:$extension:ip4r.-($extension:ip4r.ip6,pg_catalog.int8)": member6,
    "operator:$extension:ip4r.-($extension:ip4r.ip6,pg_catalog.numeric)": member7,
    "operator:$extension:ip4r.-($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member8,
    "operator:$extension:ip4r.-($extension:ip4r.ipaddress,pg_catalog.int4)": member9,
    "operator:$extension:ip4r.-($extension:ip4r.ipaddress,pg_catalog.int8)": member10,
    "operator:$extension:ip4r.-($extension:ip4r.ipaddress,pg_catalog.numeric)": member11,
    "operator:$extension:ip4r.@(,$extension:ip4r.ip4r)": member12,
    "operator:$extension:ip4r.@(,$extension:ip4r.ip6r)": member13,
    "operator:$extension:ip4r.@(,$extension:ip4r.iprange)": member14,
    "operator:$extension:ip4r.@@(,$extension:ip4r.ip4r)": member15,
    "operator:$extension:ip4r.@@(,$extension:ip4r.ip6r)": member16,
    "operator:$extension:ip4r.@@(,$extension:ip4r.iprange)": member17,
    "operator:$extension:ip4r./($extension:ip4r.ip4,$extension:ip4r.ip4)": member18,
    "operator:$extension:ip4r./($extension:ip4r.ip4,pg_catalog.int4)": member19,
    "operator:$extension:ip4r./($extension:ip4r.ip6,$extension:ip4r.ip6)": member20,
    "operator:$extension:ip4r./($extension:ip4r.ip6,pg_catalog.int4)": member21,
    "operator:$extension:ip4r./($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member22,
    "operator:$extension:ip4r./($extension:ip4r.ipaddress,pg_catalog.int4)": member23,
    "operator:$extension:ip4r.&($extension:ip4r.ip4,$extension:ip4r.ip4)": member24,
    "operator:$extension:ip4r.&($extension:ip4r.ip6,$extension:ip4r.ip6)": member25,
    "operator:$extension:ip4r.&($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member26,
    "operator:$extension:ip4r.&&($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member27,
    "operator:$extension:ip4r.&&($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member28,
    "operator:$extension:ip4r.&&($extension:ip4r.iprange,$extension:ip4r.iprange)": member29,
    "operator:$extension:ip4r.#($extension:ip4r.ip4,$extension:ip4r.ip4)": member30,
    "operator:$extension:ip4r.#($extension:ip4r.ip6,$extension:ip4r.ip6)": member31,
    "operator:$extension:ip4r.#($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member32,
    "operator:$extension:ip4r.+($extension:ip4r.ip4,pg_catalog.int4)": member33,
    "operator:$extension:ip4r.+($extension:ip4r.ip4,pg_catalog.int8)": member34,
    "operator:$extension:ip4r.+($extension:ip4r.ip4,pg_catalog.numeric)": member35,
    "operator:$extension:ip4r.+($extension:ip4r.ip6,pg_catalog.int4)": member36,
    "operator:$extension:ip4r.+($extension:ip4r.ip6,pg_catalog.int8)": member37,
    "operator:$extension:ip4r.+($extension:ip4r.ip6,pg_catalog.numeric)": member38,
    "operator:$extension:ip4r.+($extension:ip4r.ipaddress,pg_catalog.int4)": member39,
    "operator:$extension:ip4r.+($extension:ip4r.ipaddress,pg_catalog.int8)": member40,
    "operator:$extension:ip4r.+($extension:ip4r.ipaddress,pg_catalog.numeric)": member41,
    "operator:$extension:ip4r.<($extension:ip4r.ip4,$extension:ip4r.ip4)": member42,
    "operator:$extension:ip4r.<($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member43,
    "operator:$extension:ip4r.<($extension:ip4r.ip6,$extension:ip4r.ip6)": member44,
    "operator:$extension:ip4r.<($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member45,
    "operator:$extension:ip4r.<($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member46,
    "operator:$extension:ip4r.<($extension:ip4r.iprange,$extension:ip4r.iprange)": member47,
    "operator:$extension:ip4r.<<($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member48,
    "operator:$extension:ip4r.<<($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member49,
    "operator:$extension:ip4r.<<($extension:ip4r.iprange,$extension:ip4r.iprange)": member50,
    "operator:$extension:ip4r.<<=($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member51,
    "operator:$extension:ip4r.<<=($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member52,
    "operator:$extension:ip4r.<<=($extension:ip4r.iprange,$extension:ip4r.iprange)": member53,
    "operator:$extension:ip4r.<=($extension:ip4r.ip4,$extension:ip4r.ip4)": member54,
    "operator:$extension:ip4r.<=($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member55,
    "operator:$extension:ip4r.<=($extension:ip4r.ip6,$extension:ip4r.ip6)": member56,
    "operator:$extension:ip4r.<=($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member57,
    "operator:$extension:ip4r.<=($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member58,
    "operator:$extension:ip4r.<=($extension:ip4r.iprange,$extension:ip4r.iprange)": member59,
    "operator:$extension:ip4r.<>($extension:ip4r.ip4,$extension:ip4r.ip4)": member60,
    "operator:$extension:ip4r.<>($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member61,
    "operator:$extension:ip4r.<>($extension:ip4r.ip6,$extension:ip4r.ip6)": member62,
    "operator:$extension:ip4r.<>($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member63,
    "operator:$extension:ip4r.<>($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member64,
    "operator:$extension:ip4r.<>($extension:ip4r.iprange,$extension:ip4r.iprange)": member65,
    "operator:$extension:ip4r.=($extension:ip4r.ip4,$extension:ip4r.ip4)": member66,
    "operator:$extension:ip4r.=($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member67,
    "operator:$extension:ip4r.=($extension:ip4r.ip6,$extension:ip4r.ip6)": member68,
    "operator:$extension:ip4r.=($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member69,
    "operator:$extension:ip4r.=($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member70,
    "operator:$extension:ip4r.=($extension:ip4r.iprange,$extension:ip4r.iprange)": member71,
    "operator:$extension:ip4r.>($extension:ip4r.ip4,$extension:ip4r.ip4)": member72,
    "operator:$extension:ip4r.>($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member73,
    "operator:$extension:ip4r.>($extension:ip4r.ip6,$extension:ip4r.ip6)": member74,
    "operator:$extension:ip4r.>($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member75,
    "operator:$extension:ip4r.>($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member76,
    "operator:$extension:ip4r.>($extension:ip4r.iprange,$extension:ip4r.iprange)": member77,
    "operator:$extension:ip4r.>=($extension:ip4r.ip4,$extension:ip4r.ip4)": member78,
    "operator:$extension:ip4r.>=($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member79,
    "operator:$extension:ip4r.>=($extension:ip4r.ip6,$extension:ip4r.ip6)": member80,
    "operator:$extension:ip4r.>=($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member81,
    "operator:$extension:ip4r.>=($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member82,
    "operator:$extension:ip4r.>=($extension:ip4r.iprange,$extension:ip4r.iprange)": member83,
    "operator:$extension:ip4r.>>($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member84,
    "operator:$extension:ip4r.>>($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member85,
    "operator:$extension:ip4r.>>($extension:ip4r.iprange,$extension:ip4r.iprange)": member86,
    "operator:$extension:ip4r.>>=($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member87,
    "operator:$extension:ip4r.>>=($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member88,
    "operator:$extension:ip4r.>>=($extension:ip4r.iprange,$extension:ip4r.iprange)": member89,
    "operator:$extension:ip4r.|($extension:ip4r.ip4,$extension:ip4r.ip4)": member90,
    "operator:$extension:ip4r.|($extension:ip4r.ip6,$extension:ip4r.ip6)": member91,
    "operator:$extension:ip4r.|($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member92,
    "operator:$extension:ip4r.~(,$extension:ip4r.ip4)": member93,
    "operator:$extension:ip4r.~(,$extension:ip4r.ip6)": member94,
    "operator:$extension:ip4r.~(,$extension:ip4r.ipaddress)": member95,
    "routine:$extension:ip4r.cidr_split($extension:ip4r.ip4r)": member96,
    "routine:$extension:ip4r.cidr_split($extension:ip4r.ip6r)": member97,
    "routine:$extension:ip4r.cidr_split($extension:ip4r.iprange)": member98,
    "routine:$extension:ip4r.cidr($extension:ip4r.ip4)": member99,
    "routine:$extension:ip4r.cidr($extension:ip4r.ip4r)": member100,
    "routine:$extension:ip4r.cidr($extension:ip4r.ip6)": member101,
    "routine:$extension:ip4r.cidr($extension:ip4r.ip6r)": member102,
    "routine:$extension:ip4r.cidr($extension:ip4r.ipaddress)": member103,
    "routine:$extension:ip4r.cidr($extension:ip4r.iprange)": member104,
    "routine:$extension:ip4r.family($extension:ip4r.ip4)": member105,
    "routine:$extension:ip4r.family($extension:ip4r.ip4r)": member106,
    "routine:$extension:ip4r.family($extension:ip4r.ip6)": member107,
    "routine:$extension:ip4r.family($extension:ip4r.ip6r)": member108,
    "routine:$extension:ip4r.family($extension:ip4r.ipaddress)": member109,
    "routine:$extension:ip4r.family($extension:ip4r.iprange)": member110,
    "routine:$extension:ip4r.in_range($extension:ip4r.ip4,$extension:ip4r.ip4,$extension:ip4r.ip4,pg_catalog.bool,pg_catalog.bool)": member111,
    "routine:$extension:ip4r.in_range($extension:ip4r.ip4,$extension:ip4r.ip4,pg_catalog.int8,pg_catalog.bool,pg_catalog.bool)": member112,
    "routine:$extension:ip4r.in_range($extension:ip4r.ip6,$extension:ip4r.ip6,$extension:ip4r.ip6,pg_catalog.bool,pg_catalog.bool)": member113,
    "routine:$extension:ip4r.in_range($extension:ip4r.ip6,$extension:ip4r.ip6,pg_catalog.int8,pg_catalog.bool,pg_catalog.bool)": member114,
    "routine:$extension:ip4r.ip4_and($extension:ip4r.ip4,$extension:ip4r.ip4)": member115,
    "routine:$extension:ip4r.ip4_cmp($extension:ip4r.ip4,$extension:ip4r.ip4)": member116,
    "routine:$extension:ip4r.ip4_contained_by($extension:ip4r.ip4,$extension:ip4r.ip4r)": member117,
    "routine:$extension:ip4r.ip4_contained_by($extension:ip4r.ip4,$extension:ip4r.iprange)": member118,
    "routine:$extension:ip4r.ip4_contains($extension:ip4r.ip4r,$extension:ip4r.ip4)": member119,
    "routine:$extension:ip4r.ip4_contains($extension:ip4r.iprange,$extension:ip4r.ip4)": member120,
    "routine:$extension:ip4r.ip4_eq($extension:ip4r.ip4,$extension:ip4r.ip4)": member121,
    "routine:$extension:ip4r.ip4_ge($extension:ip4r.ip4,$extension:ip4r.ip4)": member122,
    "routine:$extension:ip4r.ip4_gt($extension:ip4r.ip4,$extension:ip4r.ip4)": member123,
    "routine:$extension:ip4r.ip4_hash_extended($extension:ip4r.ip4,pg_catalog.int8)": member124,
    "routine:$extension:ip4r.ip4_le($extension:ip4r.ip4,$extension:ip4r.ip4)": member125,
    "routine:$extension:ip4r.ip4_lt($extension:ip4r.ip4,$extension:ip4r.ip4)": member126,
    "routine:$extension:ip4r.ip4_minus_bigint($extension:ip4r.ip4,pg_catalog.int8)": member127,
    "routine:$extension:ip4r.ip4_minus_int($extension:ip4r.ip4,pg_catalog.int4)": member128,
    "routine:$extension:ip4r.ip4_minus_ip4($extension:ip4r.ip4,$extension:ip4r.ip4)": member129,
    "routine:$extension:ip4r.ip4_minus_numeric($extension:ip4r.ip4,pg_catalog.numeric)": member130,
    "routine:$extension:ip4r.ip4_neq($extension:ip4r.ip4,$extension:ip4r.ip4)": member131,
    "routine:$extension:ip4r.ip4_net_lower($extension:ip4r.ip4,pg_catalog.int4)": member132,
    "routine:$extension:ip4r.ip4_net_upper($extension:ip4r.ip4,pg_catalog.int4)": member133,
    "routine:$extension:ip4r.ip4_netmask(pg_catalog.int4)": member134,
    "routine:$extension:ip4r.ip4_not($extension:ip4r.ip4)": member135,
    "routine:$extension:ip4r.ip4_or($extension:ip4r.ip4,$extension:ip4r.ip4)": member136,
    "routine:$extension:ip4r.ip4_plus_bigint($extension:ip4r.ip4,pg_catalog.int8)": member137,
    "routine:$extension:ip4r.ip4_plus_int($extension:ip4r.ip4,pg_catalog.int4)": member138,
    "routine:$extension:ip4r.ip4_plus_numeric($extension:ip4r.ip4,pg_catalog.numeric)": member139,
    "routine:$extension:ip4r.ip4_send($extension:ip4r.ip4)": member140,
    "routine:$extension:ip4r.ip4_xor($extension:ip4r.ip4,$extension:ip4r.ip4)": member141,
    "routine:$extension:ip4r.ip4($extension:ip4r.ipaddress)": member142,
    "routine:$extension:ip4r.ip4(pg_catalog.bit)": member143,
    "routine:$extension:ip4r.ip4(pg_catalog.bytea)": member144,
    "routine:$extension:ip4r.ip4(pg_catalog.float8)": member145,
    "routine:$extension:ip4r.ip4(pg_catalog.inet)": member146,
    "routine:$extension:ip4r.ip4(pg_catalog.int8)": member147,
    "routine:$extension:ip4r.ip4(pg_catalog.numeric)": member148,
    "routine:$extension:ip4r.ip4(pg_catalog.text)": member149,
    "routine:$extension:ip4r.ip4(pg_catalog.varbit)": member150,
    "routine:$extension:ip4r.ip4hash($extension:ip4r.ip4)": member151,
    "routine:$extension:ip4r.ip4r_cmp($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member152,
    "routine:$extension:ip4r.ip4r_contained_by_strict($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member153,
    "routine:$extension:ip4r.ip4r_contained_by($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member154,
    "routine:$extension:ip4r.ip4r_contains_strict($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member155,
    "routine:$extension:ip4r.ip4r_contains($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member156,
    "routine:$extension:ip4r.ip4r_eq($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member157,
    "routine:$extension:ip4r.ip4r_ge($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member158,
    "routine:$extension:ip4r.ip4r_gt($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member159,
    "routine:$extension:ip4r.ip4r_hash_extended($extension:ip4r.ip4r,pg_catalog.int8)": member160,
    "routine:$extension:ip4r.ip4r_inter($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member161,
    "routine:$extension:ip4r.ip4r_le($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member162,
    "routine:$extension:ip4r.ip4r_lt($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member163,
    "routine:$extension:ip4r.ip4r_neq($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member164,
    "routine:$extension:ip4r.ip4r_net_mask($extension:ip4r.ip4,$extension:ip4r.ip4)": member165,
    "routine:$extension:ip4r.ip4r_net_prefix($extension:ip4r.ip4,pg_catalog.int4)": member166,
    "routine:$extension:ip4r.ip4r_overlaps($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member167,
    "routine:$extension:ip4r.ip4r_send($extension:ip4r.ip4r)": member168,
    "routine:$extension:ip4r.ip4r_size_exact($extension:ip4r.ip4r)": member169,
    "routine:$extension:ip4r.ip4r_size($extension:ip4r.ip4r)": member170,
    "routine:$extension:ip4r.ip4r_union($extension:ip4r.ip4r,$extension:ip4r.ip4r)": member171,
    "routine:$extension:ip4r.ip4r($extension:ip4r.ip4,$extension:ip4r.ip4)": member172,
    "routine:$extension:ip4r.ip4r($extension:ip4r.ip4)": member173,
    "routine:$extension:ip4r.ip4r($extension:ip4r.iprange)": member174,
    "routine:$extension:ip4r.ip4r(pg_catalog.cidr)": member175,
    "routine:$extension:ip4r.ip4r(pg_catalog.text)": member176,
    "routine:$extension:ip4r.ip4r(pg_catalog.varbit)": member177,
    "routine:$extension:ip4r.ip4rhash($extension:ip4r.ip4r)": member178,
    "routine:$extension:ip4r.ip6_and($extension:ip4r.ip6,$extension:ip4r.ip6)": member179,
    "routine:$extension:ip4r.ip6_cmp($extension:ip4r.ip6,$extension:ip4r.ip6)": member180,
    "routine:$extension:ip4r.ip6_contained_by($extension:ip4r.ip6,$extension:ip4r.ip6r)": member181,
    "routine:$extension:ip4r.ip6_contained_by($extension:ip4r.ip6,$extension:ip4r.iprange)": member182,
    "routine:$extension:ip4r.ip6_contains($extension:ip4r.ip6r,$extension:ip4r.ip6)": member183,
    "routine:$extension:ip4r.ip6_contains($extension:ip4r.iprange,$extension:ip4r.ip6)": member184,
    "routine:$extension:ip4r.ip6_eq($extension:ip4r.ip6,$extension:ip4r.ip6)": member185,
    "routine:$extension:ip4r.ip6_ge($extension:ip4r.ip6,$extension:ip4r.ip6)": member186,
    "routine:$extension:ip4r.ip6_gt($extension:ip4r.ip6,$extension:ip4r.ip6)": member187,
    "routine:$extension:ip4r.ip6_hash_extended($extension:ip4r.ip6,pg_catalog.int8)": member188,
    "routine:$extension:ip4r.ip6_le($extension:ip4r.ip6,$extension:ip4r.ip6)": member189,
    "routine:$extension:ip4r.ip6_lt($extension:ip4r.ip6,$extension:ip4r.ip6)": member190,
    "routine:$extension:ip4r.ip6_minus_bigint($extension:ip4r.ip6,pg_catalog.int8)": member191,
    "routine:$extension:ip4r.ip6_minus_int($extension:ip4r.ip6,pg_catalog.int4)": member192,
    "routine:$extension:ip4r.ip6_minus_ip6($extension:ip4r.ip6,$extension:ip4r.ip6)": member193,
    "routine:$extension:ip4r.ip6_minus_numeric($extension:ip4r.ip6,pg_catalog.numeric)": member194,
    "routine:$extension:ip4r.ip6_neq($extension:ip4r.ip6,$extension:ip4r.ip6)": member195,
    "routine:$extension:ip4r.ip6_net_lower($extension:ip4r.ip6,pg_catalog.int4)": member196,
    "routine:$extension:ip4r.ip6_net_upper($extension:ip4r.ip6,pg_catalog.int4)": member197,
    "routine:$extension:ip4r.ip6_netmask(pg_catalog.int4)": member198,
    "routine:$extension:ip4r.ip6_not($extension:ip4r.ip6)": member199,
    "routine:$extension:ip4r.ip6_or($extension:ip4r.ip6,$extension:ip4r.ip6)": member200,
    "routine:$extension:ip4r.ip6_plus_bigint($extension:ip4r.ip6,pg_catalog.int8)": member201,
    "routine:$extension:ip4r.ip6_plus_int($extension:ip4r.ip6,pg_catalog.int4)": member202,
    "routine:$extension:ip4r.ip6_plus_numeric($extension:ip4r.ip6,pg_catalog.numeric)": member203,
    "routine:$extension:ip4r.ip6_send($extension:ip4r.ip6)": member204,
    "routine:$extension:ip4r.ip6_xor($extension:ip4r.ip6,$extension:ip4r.ip6)": member205,
    "routine:$extension:ip4r.ip6($extension:ip4r.ipaddress)": member206,
    "routine:$extension:ip4r.ip6(pg_catalog.bit)": member207,
    "routine:$extension:ip4r.ip6(pg_catalog.bytea)": member208,
    "routine:$extension:ip4r.ip6(pg_catalog.inet)": member209,
    "routine:$extension:ip4r.ip6(pg_catalog.numeric)": member210,
    "routine:$extension:ip4r.ip6(pg_catalog.text)": member211,
    "routine:$extension:ip4r.ip6(pg_catalog.varbit)": member212,
    "routine:$extension:ip4r.ip6hash($extension:ip4r.ip6)": member213,
    "routine:$extension:ip4r.ip6r_cmp($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member214,
    "routine:$extension:ip4r.ip6r_contained_by_strict($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member215,
    "routine:$extension:ip4r.ip6r_contained_by($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member216,
    "routine:$extension:ip4r.ip6r_contains_strict($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member217,
    "routine:$extension:ip4r.ip6r_contains($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member218,
    "routine:$extension:ip4r.ip6r_eq($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member219,
    "routine:$extension:ip4r.ip6r_ge($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member220,
    "routine:$extension:ip4r.ip6r_gt($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member221,
    "routine:$extension:ip4r.ip6r_hash_extended($extension:ip4r.ip6r,pg_catalog.int8)": member222,
    "routine:$extension:ip4r.ip6r_inter($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member223,
    "routine:$extension:ip4r.ip6r_le($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member224,
    "routine:$extension:ip4r.ip6r_lt($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member225,
    "routine:$extension:ip4r.ip6r_neq($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member226,
    "routine:$extension:ip4r.ip6r_net_mask($extension:ip4r.ip6,$extension:ip4r.ip6)": member227,
    "routine:$extension:ip4r.ip6r_net_prefix($extension:ip4r.ip6,pg_catalog.int4)": member228,
    "routine:$extension:ip4r.ip6r_overlaps($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member229,
    "routine:$extension:ip4r.ip6r_send($extension:ip4r.ip6r)": member230,
    "routine:$extension:ip4r.ip6r_size_exact($extension:ip4r.ip6r)": member231,
    "routine:$extension:ip4r.ip6r_size($extension:ip4r.ip6r)": member232,
    "routine:$extension:ip4r.ip6r_union($extension:ip4r.ip6r,$extension:ip4r.ip6r)": member233,
    "routine:$extension:ip4r.ip6r($extension:ip4r.ip6,$extension:ip4r.ip6)": member234,
    "routine:$extension:ip4r.ip6r($extension:ip4r.ip6)": member235,
    "routine:$extension:ip4r.ip6r($extension:ip4r.iprange)": member236,
    "routine:$extension:ip4r.ip6r(pg_catalog.cidr)": member237,
    "routine:$extension:ip4r.ip6r(pg_catalog.text)": member238,
    "routine:$extension:ip4r.ip6r(pg_catalog.varbit)": member239,
    "routine:$extension:ip4r.ip6rhash($extension:ip4r.ip6r)": member240,
    "routine:$extension:ip4r.ipaddress_and($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member241,
    "routine:$extension:ip4r.ipaddress_cmp($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member242,
    "routine:$extension:ip4r.ipaddress_contained_by($extension:ip4r.ipaddress,$extension:ip4r.iprange)": member243,
    "routine:$extension:ip4r.ipaddress_contains($extension:ip4r.iprange,$extension:ip4r.ipaddress)": member244,
    "routine:$extension:ip4r.ipaddress_eq($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member245,
    "routine:$extension:ip4r.ipaddress_ge($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member246,
    "routine:$extension:ip4r.ipaddress_gt($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member247,
    "routine:$extension:ip4r.ipaddress_hash_extended($extension:ip4r.ipaddress,pg_catalog.int8)": member248,
    "routine:$extension:ip4r.ipaddress_le($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member249,
    "routine:$extension:ip4r.ipaddress_lt($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member250,
    "routine:$extension:ip4r.ipaddress_minus_bigint($extension:ip4r.ipaddress,pg_catalog.int8)": member251,
    "routine:$extension:ip4r.ipaddress_minus_int($extension:ip4r.ipaddress,pg_catalog.int4)": member252,
    "routine:$extension:ip4r.ipaddress_minus_ipaddress($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member253,
    "routine:$extension:ip4r.ipaddress_minus_numeric($extension:ip4r.ipaddress,pg_catalog.numeric)": member254,
    "routine:$extension:ip4r.ipaddress_neq($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member255,
    "routine:$extension:ip4r.ipaddress_net_lower($extension:ip4r.ipaddress,pg_catalog.int4)": member256,
    "routine:$extension:ip4r.ipaddress_net_upper($extension:ip4r.ipaddress,pg_catalog.int4)": member257,
    "routine:$extension:ip4r.ipaddress_not($extension:ip4r.ipaddress)": member258,
    "routine:$extension:ip4r.ipaddress_or($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member259,
    "routine:$extension:ip4r.ipaddress_plus_bigint($extension:ip4r.ipaddress,pg_catalog.int8)": member260,
    "routine:$extension:ip4r.ipaddress_plus_int($extension:ip4r.ipaddress,pg_catalog.int4)": member261,
    "routine:$extension:ip4r.ipaddress_plus_numeric($extension:ip4r.ipaddress,pg_catalog.numeric)": member262,
    "routine:$extension:ip4r.ipaddress_send($extension:ip4r.ipaddress)": member263,
    "routine:$extension:ip4r.ipaddress_xor($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member264,
    "routine:$extension:ip4r.ipaddress($extension:ip4r.ip4)": member265,
    "routine:$extension:ip4r.ipaddress($extension:ip4r.ip6)": member266,
    "routine:$extension:ip4r.ipaddress(pg_catalog.bit)": member267,
    "routine:$extension:ip4r.ipaddress(pg_catalog.bytea)": member268,
    "routine:$extension:ip4r.ipaddress(pg_catalog.inet)": member269,
    "routine:$extension:ip4r.ipaddress(pg_catalog.text)": member270,
    "routine:$extension:ip4r.ipaddress(pg_catalog.varbit)": member271,
    "routine:$extension:ip4r.ipaddresshash($extension:ip4r.ipaddress)": member272,
    "routine:$extension:ip4r.iprange_cmp($extension:ip4r.iprange,$extension:ip4r.iprange)": member273,
    "routine:$extension:ip4r.iprange_contained_by_strict($extension:ip4r.iprange,$extension:ip4r.iprange)": member274,
    "routine:$extension:ip4r.iprange_contained_by($extension:ip4r.iprange,$extension:ip4r.iprange)": member275,
    "routine:$extension:ip4r.iprange_contains_strict($extension:ip4r.iprange,$extension:ip4r.iprange)": member276,
    "routine:$extension:ip4r.iprange_contains($extension:ip4r.iprange,$extension:ip4r.iprange)": member277,
    "routine:$extension:ip4r.iprange_eq($extension:ip4r.iprange,$extension:ip4r.iprange)": member278,
    "routine:$extension:ip4r.iprange_ge($extension:ip4r.iprange,$extension:ip4r.iprange)": member279,
    "routine:$extension:ip4r.iprange_gt($extension:ip4r.iprange,$extension:ip4r.iprange)": member280,
    "routine:$extension:ip4r.iprange_hash_extended($extension:ip4r.iprange,pg_catalog.int8)": member281,
    "routine:$extension:ip4r.iprange_hash($extension:ip4r.iprange)": member282,
    "routine:$extension:ip4r.iprange_inter($extension:ip4r.iprange,$extension:ip4r.iprange)": member283,
    "routine:$extension:ip4r.iprange_le($extension:ip4r.iprange,$extension:ip4r.iprange)": member284,
    "routine:$extension:ip4r.iprange_lt($extension:ip4r.iprange,$extension:ip4r.iprange)": member285,
    "routine:$extension:ip4r.iprange_neq($extension:ip4r.iprange,$extension:ip4r.iprange)": member286,
    "routine:$extension:ip4r.iprange_net_mask($extension:ip4r.ip4,$extension:ip4r.ip4)": member287,
    "routine:$extension:ip4r.iprange_net_mask($extension:ip4r.ip6,$extension:ip4r.ip6)": member288,
    "routine:$extension:ip4r.iprange_net_mask($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member289,
    "routine:$extension:ip4r.iprange_net_prefix($extension:ip4r.ip4,pg_catalog.int4)": member290,
    "routine:$extension:ip4r.iprange_net_prefix($extension:ip4r.ip6,pg_catalog.int4)": member291,
    "routine:$extension:ip4r.iprange_net_prefix($extension:ip4r.ipaddress,pg_catalog.int4)": member292,
    "routine:$extension:ip4r.iprange_overlaps($extension:ip4r.iprange,$extension:ip4r.iprange)": member293,
    "routine:$extension:ip4r.iprange_send($extension:ip4r.iprange)": member294,
    "routine:$extension:ip4r.iprange_size_exact($extension:ip4r.iprange)": member295,
    "routine:$extension:ip4r.iprange_size($extension:ip4r.iprange)": member296,
    "routine:$extension:ip4r.iprange_union($extension:ip4r.iprange,$extension:ip4r.iprange)": member297,
    "routine:$extension:ip4r.iprange($extension:ip4r.ip4,$extension:ip4r.ip4)": member298,
    "routine:$extension:ip4r.iprange($extension:ip4r.ip4)": member299,
    "routine:$extension:ip4r.iprange($extension:ip4r.ip4r)": member300,
    "routine:$extension:ip4r.iprange($extension:ip4r.ip6,$extension:ip4r.ip6)": member301,
    "routine:$extension:ip4r.iprange($extension:ip4r.ip6)": member302,
    "routine:$extension:ip4r.iprange($extension:ip4r.ip6r)": member303,
    "routine:$extension:ip4r.iprange($extension:ip4r.ipaddress,$extension:ip4r.ipaddress)": member304,
    "routine:$extension:ip4r.iprange($extension:ip4r.ipaddress)": member305,
    "routine:$extension:ip4r.iprange(pg_catalog.cidr)": member306,
    "routine:$extension:ip4r.iprange(pg_catalog.text)": member307,
    "routine:$extension:ip4r.iprangehash($extension:ip4r.iprange)": member308,
    "routine:$extension:ip4r.is_cidr($extension:ip4r.ip4r)": member309,
    "routine:$extension:ip4r.is_cidr($extension:ip4r.ip6r)": member310,
    "routine:$extension:ip4r.is_cidr($extension:ip4r.iprange)": member311,
    "routine:$extension:ip4r.lower($extension:ip4r.ip4r)": member312,
    "routine:$extension:ip4r.lower($extension:ip4r.ip6r)": member313,
    "routine:$extension:ip4r.lower($extension:ip4r.iprange)": member314,
    "routine:$extension:ip4r.masklen($extension:ip4r.ip4r)": member315,
    "routine:$extension:ip4r.masklen($extension:ip4r.ip6r)": member316,
    "routine:$extension:ip4r.masklen($extension:ip4r.iprange)": member317,
    "routine:$extension:ip4r.text($extension:ip4r.ip4)": member318,
    "routine:$extension:ip4r.text($extension:ip4r.ip4r)": member319,
    "routine:$extension:ip4r.text($extension:ip4r.ip6)": member320,
    "routine:$extension:ip4r.text($extension:ip4r.ip6r)": member321,
    "routine:$extension:ip4r.text($extension:ip4r.ipaddress)": member322,
    "routine:$extension:ip4r.text($extension:ip4r.iprange)": member323,
    "routine:$extension:ip4r.to_bigint($extension:ip4r.ip4)": member324,
    "routine:$extension:ip4r.to_bit($extension:ip4r.ip4)": member325,
    "routine:$extension:ip4r.to_bit($extension:ip4r.ip4r)": member326,
    "routine:$extension:ip4r.to_bit($extension:ip4r.ip6)": member327,
    "routine:$extension:ip4r.to_bit($extension:ip4r.ip6r)": member328,
    "routine:$extension:ip4r.to_bit($extension:ip4r.ipaddress)": member329,
    "routine:$extension:ip4r.to_bit($extension:ip4r.iprange)": member330,
    "routine:$extension:ip4r.to_bytea($extension:ip4r.ip4)": member331,
    "routine:$extension:ip4r.to_bytea($extension:ip4r.ip6)": member332,
    "routine:$extension:ip4r.to_bytea($extension:ip4r.ipaddress)": member333,
    "routine:$extension:ip4r.to_double($extension:ip4r.ip4)": member334,
    "routine:$extension:ip4r.to_numeric($extension:ip4r.ip4)": member335,
    "routine:$extension:ip4r.to_numeric($extension:ip4r.ip6)": member336,
    "routine:$extension:ip4r.to_numeric($extension:ip4r.ipaddress)": member337,
    "routine:$extension:ip4r.upper($extension:ip4r.ip4r)": member338,
    "routine:$extension:ip4r.upper($extension:ip4r.ip6r)": member339,
    "routine:$extension:ip4r.upper($extension:ip4r.iprange)": member340,
  });
  const search = { filter: true, comparison: false, order: false, text: false } as const;
  const eqne = (kind: "ip4" | "ip4r" | "ip6" | "ip6r" | "ipaddress" | "iprange") => ({
    eq: { member: `operator:$extension:ip4r.=($extension:ip4r.${kind},$extension:ip4r.${kind})`, schema: descriptor.schema, name: "=", operand: "field" as const },
    ne: { member: `operator:$extension:ip4r.<>($extension:ip4r.${kind},$extension:ip4r.${kind})`, schema: descriptor.schema, name: "<>", operand: "field" as const },
  });
  const index = (method: "btree" | "gist" | "hash", opclass: string, type: "ip4" | "ip4r" | "ip6" | "ip6r" | "ipaddress" | "iprange", member: string) =>
    Object.freeze({ ...createExtensionIndex({ extension: descriptor, member, method, opclass, type, default: true }), input: Object.freeze({ schema: descriptor.schema, type, dimensions: 0 }) });
  const typeApi = <const Kind extends "ip4" | "ip4r" | "ip6" | "ip6r" | "ipaddress" | "iprange">(kind: Kind, codec: ReturnType<typeof createIp4rCodec<Kind>>, arrayCodec: ReturnType<typeof createIp4rArrayCodec<Kind>>) => Object.freeze({
    value: (text: string) => ip4rValue(kind, text),
    codec, arrayCodec,
    field: () => createExtensionField({ extension: descriptor, member: `type:$extension:ip4r.${kind}`, type: kind, codec, value: ip4rWireValue(kind), search, operators: eqne(kind) }),
    arrayField: () => createExtensionField({ extension: descriptor, member: `type:$extension:ip4r._${kind}`, type: kind, array: true, codec: arrayCodec, value: ip4rArrayWireValue(kind), search: { filter: false, comparison: false, order: false, text: false } as const }),
  });
  return bindExtension(descriptor, {
    ip4: Object.freeze({ ...typeApi("ip4", ip4Codec, ip4Array), equal: operators["="].ip4_ip4, notEqual: operators["<>"].ip4_ip4, indexes: Object.freeze({ btree: () => index("btree", "btree_ip4_ops", "ip4", "opclass:$extension:ip4r.btree_ip4_ops/btree"), hash: () => index("hash", "hash_ip4_ops", "ip4", "opclass:$extension:ip4r.hash_ip4_ops/hash") }) }),
    ip4r: Object.freeze({ ...typeApi("ip4r", ip4rCodec, ip4rArray), equal: operators["="].ip4r_ip4r, notEqual: operators["<>"].ip4r_ip4r, indexes: Object.freeze({ btree: () => index("btree", "btree_ip4r_ops", "ip4r", "opclass:$extension:ip4r.btree_ip4r_ops/btree"), gist: () => index("gist", "gist_ip4r_ops", "ip4r", "opclass:$extension:ip4r.gist_ip4r_ops/gist"), hash: () => index("hash", "hash_ip4r_ops", "ip4r", "opclass:$extension:ip4r.hash_ip4r_ops/hash") }) }),
    ip6: Object.freeze({ ...typeApi("ip6", ip6Codec, ip6Array), equal: operators["="].ip6_ip6, notEqual: operators["<>"].ip6_ip6, indexes: Object.freeze({ btree: () => index("btree", "btree_ip6_ops", "ip6", "opclass:$extension:ip4r.btree_ip6_ops/btree"), hash: () => index("hash", "hash_ip6_ops", "ip6", "opclass:$extension:ip4r.hash_ip6_ops/hash") }) }),
    ip6r: Object.freeze({ ...typeApi("ip6r", ip6rCodec, ip6rArray), equal: operators["="].ip6r_ip6r, notEqual: operators["<>"].ip6r_ip6r, indexes: Object.freeze({ btree: () => index("btree", "btree_ip6r_ops", "ip6r", "opclass:$extension:ip4r.btree_ip6r_ops/btree"), gist: () => index("gist", "gist_ip6r_ops", "ip6r", "opclass:$extension:ip4r.gist_ip6r_ops/gist"), hash: () => index("hash", "hash_ip6r_ops", "ip6r", "opclass:$extension:ip4r.hash_ip6r_ops/hash") }) }),
    ipaddress: Object.freeze({ ...typeApi("ipaddress", ipaddressCodec, ipaddressArray), equal: operators["="].ipaddress_ipaddress, notEqual: operators["<>"].ipaddress_ipaddress, indexes: Object.freeze({ btree: () => index("btree", "btree_ipaddress_ops", "ipaddress", "opclass:$extension:ip4r.btree_ipaddress_ops/btree"), hash: () => index("hash", "hash_ipaddress_ops", "ipaddress", "opclass:$extension:ip4r.hash_ipaddress_ops/hash") }) }),
    iprange: Object.freeze({ ...typeApi("iprange", iprangeCodec, iprangeArray), equal: operators["="].iprange_iprange, notEqual: operators["<>"].iprange_iprange, indexes: Object.freeze({ btree: () => index("btree", "btree_iprange_ops", "iprange", "opclass:$extension:ip4r.btree_iprange_ops/btree"), gist: () => index("gist", "gist_iprange_ops", "iprange", "opclass:$extension:ip4r.gist_iprange_ops/gist"), hash: () => index("hash", "hash_iprange_ops", "iprange", "opclass:$extension:ip4r.hash_iprange_ops/hash") }) }),
    sql: Object.freeze({ functions, operators, casts, overloads }),
  });
}
