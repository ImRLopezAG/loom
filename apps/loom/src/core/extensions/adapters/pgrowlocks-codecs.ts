import * as v from "valibot";
import { createExtensionCodec } from "../codecs";

const uint32 = v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(4294967295));
const tid = v.strictObject({
  block: uint32,
  offset: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(65535)),
});
export type Tid = v.InferOutput<typeof tid>;

/** Physical row position; valid only while the row version is not moved by update or VACUUM FULL. */
export const tidCodec = createExtensionCodec({
  id: "pg:tid:1",
  sqlType: { schema: "pg_catalog", name: "tid" },
  input: tid,
  output: tid,
  transport: "text",
  encode: (value) => `(${value.block},${value.offset})`,
  decode(value) {
    const [, block, offset] = v
      .parse(v.pipe(v.string(), v.regex(/^\((\d+),(\d+)\)$/)), value)
      .match(/^\((\d+),(\d+)\)$/)!;
    return { block: Number(block), offset: Number(offset) };
  },
});

/** 32-bit wrapping transaction ID; ordering is modular, so no numeric comparison is implied. */
export const xidCodec = createExtensionCodec({
  id: "pg:xid:1",
  sqlType: { schema: "pg_catalog", name: "xid" },
  input: uint32,
  output: uint32,
  transport: "text",
  encode: (value) => String(value),
  decode: (value) => Number(v.parse(v.pipe(v.string(), v.regex(/^\d{1,10}$/)), value)),
});
