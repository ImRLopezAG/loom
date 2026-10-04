import {
  arrayCodec,
  compositeCodec,
  floatCodec,
  integerCodec,
  nullableCodec,
  textCodec,
  withCodecSqlType,
  type CompositeOutput,
} from "../codecs";
import { int4Codec } from "../native-codecs";
import { loOidCodec } from "./lo-codecs";

// RETURNS TABLE columns are nullable SQL outputs. reg* identities stay PostgreSQL's search_path-relative text.
const int4 = nullableCodec(int4Codec);
const int8 = nullableCodec(integerCodec);
const float8 = nullableCodec(floatCodec);
const text = nullableCodec(textCodec);
const regproc = nullableCodec(withCodecSqlType(textCodec, { schema: "pg_catalog", name: "regproc" }));
const regprocedure = nullableCodec(withCodecSqlType(textCodec, { schema: "pg_catalog", name: "regprocedure" }));

/** Exact plpgsql_check 2.8 plpgsql_check_function_tb OUT order. */
export const plpgsqlCheckIssueFields = Object.freeze({
  functionid: regproc,
  lineno: int4,
  statement: text,
  sqlstate: text,
  message: text,
  detail: text,
  hint: text,
  level: text,
  position: int4,
  query: text,
  context: text,
});
/** Exact plpgsql_show_dependency_tb / __plpgsql_show_dependency_tb OUT order. */
export const plpgsqlCheckDependencyFields = Object.freeze({
  type: text,
  oid: nullableCodec(loOidCodec),
  schema: text,
  name: text,
  params: text,
});
/** Exact plpgsql_profiler_function_tb OUT order, retaining native array dimensions and NULL elements. */
export const plpgsqlCheckProfileLineFields = Object.freeze({
  lineno: int4,
  stmt_lineno: int4,
  queryids: nullableCodec(arrayCodec(integerCodec)),
  cmds_on_row: int4,
  exec_stmts: int8,
  exec_stmts_err: int8,
  total_time: float8,
  avg_time: float8,
  max_time: nullableCodec(arrayCodec(floatCodec)),
  processed_rows: nullableCodec(arrayCodec(integerCodec)),
  source: text,
});
/** Exact plpgsql_profiler_function_statements_tb OUT order. */
export const plpgsqlCheckProfileStatementFields = Object.freeze({
  stmtid: int4,
  parent_stmtid: int4,
  parent_note: text,
  block_num: int4,
  lineno: int4,
  queryid: int8,
  exec_stmts: int8,
  exec_stmts_err: int8,
  total_time: float8,
  avg_time: float8,
  max_time: float8,
  processed_rows: int8,
  stmtname: text,
});
/** Exact plpgsql_profiler_functions_all OUT order. */
export const plpgsqlCheckProfiledFunctionFields = Object.freeze({
  funcoid: regprocedure,
  exec_count: int8,
  exec_stmts_err: int8,
  total_time: float8,
  avg_time: float8,
  stddev_time: float8,
  min_time: float8,
  max_time: float8,
});
export const plpgsqlCheckIssueCodec = compositeCodec("plpgsql_check:2.8:issue", plpgsqlCheckIssueFields);
export const plpgsqlCheckDependencyCodec = compositeCodec("plpgsql_check:2.8:dependency", plpgsqlCheckDependencyFields);
export const plpgsqlCheckProfileLineCodec = compositeCodec(
  "plpgsql_check:2.8:profile-line",
  plpgsqlCheckProfileLineFields,
);
export const plpgsqlCheckProfileStatementCodec = compositeCodec(
  "plpgsql_check:2.8:profile-statement",
  plpgsqlCheckProfileStatementFields,
);
export const plpgsqlCheckProfiledFunctionCodec = compositeCodec(
  "plpgsql_check:2.8:profiled-function",
  plpgsqlCheckProfiledFunctionFields,
);
export type PlpgsqlCheckIssue = CompositeOutput<typeof plpgsqlCheckIssueFields>;
export type PlpgsqlCheckDependency = CompositeOutput<typeof plpgsqlCheckDependencyFields>;
export type PlpgsqlCheckProfileLine = CompositeOutput<typeof plpgsqlCheckProfileLineFields>;
export type PlpgsqlCheckProfileStatement = CompositeOutput<typeof plpgsqlCheckProfileStatementFields>;
export type PlpgsqlCheckProfiledFunction = CompositeOutput<typeof plpgsqlCheckProfiledFunctionFields>;
