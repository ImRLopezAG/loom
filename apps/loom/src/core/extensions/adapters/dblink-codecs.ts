import * as v from "valibot";
import { arrayCodec, compositeCodec, nullableCodec, textCodec, withCodecSqlType } from "../codecs";
import { int4Codec } from "../native-codecs";

export type { RelationInput, RelationName } from "./pgstattuple-codecs";
export { qualifiedRelationName, relationDependency, resolveRelationName } from "./pgstattuple-codecs";

/** PK attnums as native int2vector text, e.g. "1" or "1 2". */
export const dblinkInt2vectorCodec = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "int2vector" });
export const dblinkTextArrayCodec = arrayCodec(textCodec);

/** OUT columns of dblink_pkey_results, in captured catalogue order. */
export const dblinkPkeyFields = {
  position: nullableCodec(int4Codec),
  colname: nullableCodec(textCodec),
} as const;

export const dblinkPkeyCodec = compositeCodec("dblink_pkey_results", dblinkPkeyFields);
export const dblinkPkeyArrayCodec = arrayCodec(dblinkPkeyCodec);

/** OUT columns of dblink_get_notify, in captured catalogue order. */
export const dblinkNotifyFields = {
  notify_name: textCodec,
  be_pid: int4Codec,
  extra: textCodec,
} as const;

export const dblinkNotifyCodec = compositeCodec("dblink_get_notify", dblinkNotifyFields);

export type DblinkPkeyResult = {
  readonly position: number | null;
  readonly colname: string | null;
};

export type DblinkNotify = {
  readonly notify_name: string;
  readonly be_pid: number;
  readonly extra: string;
};

export { int4Codec, nullableCodec, textCodec };
