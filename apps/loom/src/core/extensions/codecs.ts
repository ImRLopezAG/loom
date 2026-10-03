import * as v from "valibot";
import { failInvocationDecoding } from "../server/database/connection";

export interface ExtensionSqlType {
  readonly schema: string;
  readonly name: string;
  readonly array?: boolean;
}
export interface ExtensionCodec<Input, Output> {
  readonly sqlType?: ExtensionSqlType | undefined;
  readonly id: string;
  /** Text projection preserves custom OIDs and PostgreSQL array bounds. */
  readonly transport: "native" | "text";
  // oxlint-disable-next-line anti-slop/no-unknown-returns -- A codec encodes a driver parameter; the codec owns validation and SQL binding consumes it.
  readonly encode: (value: Input) => unknown;
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- PostgreSQL driver values are untrusted; each decoder validates before returning Output.
  readonly decode: (value: unknown) => Output;
}
export type CodecInput<Codec> = Codec extends ExtensionCodec<infer Input, unknown> ? Input : never;
export type CodecOutput<Codec> = Codec extends ExtensionCodec<never, infer Output> ? Output : never;

/** An output validator is required; callers cannot assert a SQL result generic. */
export function createExtensionCodec<
  InputSchema extends v.GenericSchema,
  OutputSchema extends v.GenericSchema,
>(options: {
  readonly id: string;
  readonly sqlType?: ExtensionSqlType | undefined;
  readonly input: InputSchema;
  readonly output: OutputSchema;
  readonly transport: "native" | "text";
  // oxlint-disable-next-line anti-slop/no-unknown-returns -- Validated input is encoded for the driver, whose parameter representations vary by SQL type.
  readonly encode: (value: v.InferOutput<InputSchema>) => unknown;
  // oxlint-disable-next-line anti-slop/no-unknown-parameters, anti-slop/no-unknown-returns -- Raw driver input and decoder output are both validated by the required output schema below.
  readonly decode: (value: unknown) => unknown;
}): ExtensionCodec<v.InferInput<InputSchema>, v.InferOutput<OutputSchema>> {
  const codec: ExtensionCodec<v.InferInput<InputSchema>, v.InferOutput<OutputSchema>> = {
    id: options.id,
    sqlType: options.sqlType && Object.freeze({ ...options.sqlType }),
    transport: options.transport,
    encode: (value: v.InferInput<InputSchema>) => options.encode(v.parse(options.input, value)),
    decode(value) {
      return decodeFailure(() => v.parse(options.output, options.decode(value)));
    },
  };
  return Object.freeze(codec);
}

export const textCodec = createExtensionCodec({
  id: "pg:text:1",
  sqlType: { schema: "pg_catalog", name: "text" },
  input: v.string(),
  output: v.string(),
  transport: "native",
  encode: (value) => value,
  decode: (value) => value,
});
export const booleanCodec = createExtensionCodec({
  id: "pg:bool:1",
  sqlType: { schema: "pg_catalog", name: "bool" },
  input: v.boolean(),
  output: v.boolean(),
  transport: "native",
  encode: (value) => value,
  decode: (value) => (value === "t" ? true : value === "f" ? false : value),
});
export const integerCodec = createExtensionCodec({
  id: "pg:int8:1",
  sqlType: { schema: "pg_catalog", name: "int8" },
  input: v.bigint(),
  output: v.bigint(),
  transport: "text",
  encode: (value) => value.toString(),
  decode(value) {
    return BigInt(v.parse(v.pipe(v.string(), v.regex(/^-?\d+$/)), value));
  },
});
const finiteNumber = v.pipe(v.number(), v.finite());
const nonfinite = v.object({ nonfinite: v.picklist(["NaN", "Infinity", "-Infinity"]) });
export type NonfiniteNumber = v.InferOutput<typeof nonfinite>;
const floatingValue = v.union([finiteNumber, nonfinite]);
export const floatCodec = createExtensionCodec({
  id: "pg:float8:1",
  sqlType: { schema: "pg_catalog", name: "float8" },
  input: floatingValue,
  output: floatingValue,
  transport: "native",
  encode: (value) => (v.is(finiteNumber, value) ? value : value.nonfinite),
  decode(value) {
    const representation = v.parse(
      v.union([
        v.number(),
        v.nan(),
        v.pipe(v.string(), v.regex(/^(?:NaN|-?Infinity|[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?)$/)),
      ]),
      value,
    );
    const parsed = Number(representation);
    return Number.isFinite(parsed)
      ? parsed
      : { nonfinite: Number.isNaN(parsed) ? "NaN" : parsed > 0 ? "Infinity" : "-Infinity" };
  },
});
const decimal = v.pipe(v.string(), v.regex(/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/));
const numericValue = v.union([decimal, nonfinite]);
export const numericCodec = createExtensionCodec({
  id: "pg:numeric:1",
  sqlType: { schema: "pg_catalog", name: "numeric" },
  input: numericValue,
  output: numericValue,
  transport: "text",
  encode: (value) => (v.is(decimal, value) ? value : value.nonfinite),
  decode: (value) => (v.is(v.picklist(["NaN", "Infinity", "-Infinity"]), value) ? { nonfinite: value } : value),
});
const binaryValue = v.object({ hex: v.pipe(v.string(), v.regex(/^(?:[a-f0-9]{2})*$/)) });
export const binaryCodec = createExtensionCodec({
  id: "pg:bytea:hex:1",
  sqlType: { schema: "pg_catalog", name: "bytea" },
  input: binaryValue,
  output: binaryValue,
  transport: "text",
  encode: (value) => `\\x${value.hex}`,
  decode(value) {
    if (value instanceof Uint8Array)
      return { hex: Array.from(value, (byte) => byte.toString(16).padStart(2, "0")).join("") };
    const source = v.parse(v.string(), value);
    if (source.startsWith("\\x")) {
      if (!/^\\x(?:[a-fA-F0-9]{2})*$/.test(source)) throw new Error("Invalid PostgreSQL bytea hex");
      return { hex: source.slice(2).toLowerCase() };
    }
    let hex = "";
    for (let cursor = 0; cursor < source.length; cursor++) {
      let byte = source.charCodeAt(cursor);
      if (source[cursor] === "\\") {
        if (source[cursor + 1] === "\\") {
          byte = 92;
          cursor++;
        } else {
          const octal = source.slice(cursor + 1, cursor + 4);
          if (!/^[0-3][0-7]{2}$/.test(octal)) throw new Error("Invalid PostgreSQL bytea escape");
          byte = Number.parseInt(octal, 8);
          cursor += 3;
        }
      } else if (byte < 32 || byte > 126) throw new Error("Invalid PostgreSQL bytea escape");
      hex += byte.toString(16).padStart(2, "0");
    }
    return { hex };
  },
});
export function nullableCodec<Input, Output>(
  codec: ExtensionCodec<Input, Output>,
): ExtensionCodec<Input | null, Output | null> {
  const nullable: ExtensionCodec<Input | null, Output | null> = {
    id: `${codec.id}:nullable`,
    sqlType: codec.sqlType,
    transport: codec.transport,
    encode: (value: Input | null) => (value === null ? null : codec.encode(value)),
    decode: (value) => (value === null ? null : codec.decode(value)),
  };
  return Object.freeze(nullable);
}

/** PostgreSQL quoted scalar grammar, shared by arrays, ranges, and records. */
function quotedToken(source: string, position: number) {
  let value = "";
  for (let cursor = position + 1; cursor < source.length; cursor++) {
    const character = source[cursor]!;
    if (character === "\\") {
      if (++cursor >= source.length) throw new Error("Invalid PostgreSQL escape");
      value += source[cursor];
    } else if (character === '"') {
      if (source[cursor + 1] === '"') {
        value += '"';
        cursor++;
      } else return { value, end: cursor + 1 };
    } else value += character;
  }
  throw new Error("Unterminated PostgreSQL value");
}
function quoteValue<Value>(value: Value): string {
  const scalar = v.parse(v.union([v.string(), v.number(), v.nan(), v.bigint(), v.boolean()]), value);
  return `"${String(scalar).replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}
export function decodeFailure<Result>(operation: () => Result): Result {
  try {
    return operation();
  } catch (cause) {
    failInvocationDecoding(cause);
    throw cause;
  }
}
export type ArrayValues<Value> = readonly (Value | null | ArrayValues<Value>)[];
export interface PostgreSqlArray<Value> {
  readonly dimensions: readonly { readonly lowerBound: number; readonly length: number }[];
  readonly values: ArrayValues<Value>;
}
function arrayDimensionLengths(values: readonly unknown[], depth: number): number[] {
  if (depth <= 1) return [values.length];
  const nested = v.parse(v.array(v.array(v.unknown())), values);
  const lengths = arrayDimensionLengths(nested[0] ?? [], depth - 1);
  if (nested.some((entry) => JSON.stringify(arrayDimensionLengths(entry, depth - 1)) !== JSON.stringify(lengths)))
    throw new Error("Ragged PostgreSQL array");
  return [values.length, ...lengths];
}
function checkDimensions(dimensions: PostgreSqlArray<unknown>["dimensions"], lengths: readonly number[]) {
  if (lengths.some((length) => length === 0)) {
    if (dimensions.length) throw new Error("Empty PostgreSQL arrays cannot retain dimension bounds");
    return;
  }
  if (
    dimensions.length !== lengths.length ||
    dimensions.some(
      (dimension, index) =>
        !Number.isSafeInteger(dimension.lowerBound) ||
        !Number.isSafeInteger(dimension.length) ||
        dimension.length !== lengths[index],
    )
  )
    throw new Error("Invalid PostgreSQL array dimensions");
}
const driverArrayText = new WeakMap<unknown[], string>();
/** Retain exact driver text without altering the driver's ordinary array representation. */
export function preservingArrayParser<Value>(parser: (value: string) => Value): (value: string) => Value {
  return (value) => {
    const parsed = parser(value);
    if (Array.isArray(parsed)) driverArrayText.set(parsed, value);
    return parsed;
  };
}
export function arrayCodec<Input, Output>(
  element: ExtensionCodec<Input, Output>,
  delimiter = ",",
): ExtensionCodec<PostgreSqlArray<Input>, PostgreSqlArray<Output>> {
  if (delimiter.length !== 1 || /[{}[\]"\\\s]/.test(delimiter)) throw new Error("Invalid PostgreSQL array delimiter");
  const codec: ExtensionCodec<PostgreSqlArray<Input>, PostgreSqlArray<Output>> = {
    id: `pg:array:1:${delimiter}:${element.id}`,
    sqlType: element.sqlType && { ...element.sqlType, array: true },
    transport: "text",
    encode(value: PostgreSqlArray<Input>) {
      checkDimensions(value.dimensions, arrayDimensionLengths(value.values, value.dimensions.length));
      const encodeValues = (entries: ArrayValues<Input>, depth: number): string => {
        const encoded = entries.map((entry) => {
          if (depth > 1) {
            // SAFETY: dimension validation above establishes the declared PostgreSQL nesting depth.
            return encodeValues(entry as ArrayValues<Input>, depth - 1);
          }
          if (entry === null) return "NULL";
          // SAFETY: declared depth identifies scalar input, including scalar codecs whose inputs are arrays.
          return quoteValue(element.encode(entry as Input));
        });
        return `{${encoded.join(delimiter)}}`;
      };
      if (!value.values.length) return "{}";
      return `${value.dimensions.map(({ lowerBound, length }) => `[${lowerBound}:${lowerBound + length - 1}]`).join("")}=${encodeValues(value.values, value.dimensions.length)}`;
    },
    decode(value) {
      return decodeFailure(() => {
        const source = v.parse(v.string(), Array.isArray(value) ? driverArrayText.get(value) : value);
        let cursor = 0;
        const dimensions: { lowerBound: number; length: number }[] = [];
        while (source[cursor] === "[") {
          const bounds = /^\[(-?\d+):(-?\d+)\]/.exec(source.slice(cursor));
          if (!bounds) throw new Error("Invalid PostgreSQL array bounds");
          const lowerBound = Number(bounds[1]);
          dimensions.push({ lowerBound, length: Number(bounds[2]) - lowerBound + 1 });
          cursor += bounds[0].length;
        }
        if (dimensions.length && source[cursor++] !== "=") throw new Error("Invalid PostgreSQL array bounds");
        const parsedDimensions = new WeakMap<object, number[]>();
        const parseValues = (): ArrayValues<Output> => {
          if (source[cursor++] !== "{") throw new Error("Invalid PostgreSQL array");
          const entries: (Output | null | ArrayValues<Output>)[] = [];
          const children: (number[] | undefined)[] = [];
          const finish = () => {
            const lengths = children[0];
            if (children.some((child) => JSON.stringify(child) !== JSON.stringify(lengths)))
              throw new Error("Ragged PostgreSQL array");
            parsedDimensions.set(entries, [entries.length, ...(lengths ?? [])]);
            return entries;
          };
          if (source[cursor] === "}") {
            cursor++;
            return finish();
          }
          while (cursor < source.length) {
            if (source[cursor] === "{") {
              const nested = parseValues();
              entries.push(nested);
              children.push(parsedDimensions.get(nested));
            } else if (source[cursor] === '"') {
              const token = quotedToken(source, cursor);
              cursor = token.end;
              entries.push(element.decode(token.value));
              children.push(undefined);
            } else {
              let token = "";
              while (cursor < source.length && ![delimiter, "}"].includes(source[cursor]!)) {
                if (source[cursor] === "\\") {
                  cursor++;
                  if (cursor === source.length) throw new Error("Invalid PostgreSQL array escape");
                }
                token += source[cursor++];
              }
              if (!token) throw new Error("Empty PostgreSQL array element");
              entries.push(token === "NULL" ? null : element.decode(token));
              children.push(undefined);
            }
            const separator = source[cursor++];
            if (separator === "}") return finish();
            if (separator !== delimiter) throw new Error("Invalid PostgreSQL array delimiter");
          }
          throw new Error("Unterminated PostgreSQL array");
        };
        const values = parseValues();
        if (cursor !== source.length) throw new Error("Trailing PostgreSQL array input");
        const lengths = parsedDimensions.get(values)!;
        if (!dimensions.length && values.length)
          dimensions.push(...lengths.map((length) => ({ lowerBound: 1, length })));
        checkDimensions(dimensions, lengths);
        return { dimensions, values };
      });
    },
  };
  return Object.freeze(codec);
}
function delimitedValues(value: string, opening: string, closing: readonly string[]): (string | null)[] {
  if (!opening.includes(value[0]!) || !closing.includes(value.at(-1)!))
    throw new Error("Invalid PostgreSQL record or range");
  const entries: (string | null)[] = [];
  let cursor = 1;
  while (cursor < value.length) {
    if (value[cursor] === '"') {
      const token = quotedToken(value, cursor);
      entries.push(token.value);
      cursor = token.end;
    } else {
      let token = "";
      while (cursor < value.length - 1 && value[cursor] !== ",") {
        if (value[cursor] === "\\") cursor++;
        token += value[cursor++];
      }
      entries.push(token === "" ? null : token);
    }
    if (cursor === value.length - 1) return entries;
    if (value[cursor++] !== ",") throw new Error("Invalid PostgreSQL delimiter");
  }
  throw new Error("Unterminated PostgreSQL record or range");
}
export type PostgreSqlRange<Value> =
  | { readonly empty: true }
  | {
      readonly empty: false;
      readonly lower: Value | null;
      readonly upper: Value | null;
      readonly lowerInclusive: boolean;
      readonly upperInclusive: boolean;
    };
export function rangeCodec<Input, Output>(
  element: ExtensionCodec<Input, Output>,
): ExtensionCodec<PostgreSqlRange<Input>, PostgreSqlRange<Output>> {
  const codec: ExtensionCodec<PostgreSqlRange<Input>, PostgreSqlRange<Output>> = {
    id: `pg:range:1:${element.id}`,
    transport: "text",
    encode(value: PostgreSqlRange<Input>) {
      if (value.empty) return "empty";
      if ((value.lower === null && value.lowerInclusive) || (value.upper === null && value.upperInclusive))
        throw new Error("Infinite PostgreSQL bounds must be exclusive");
      return `${value.lowerInclusive ? "[" : "("}${value.lower === null ? "" : quoteValue(element.encode(value.lower))},${value.upper === null ? "" : quoteValue(element.encode(value.upper))}${value.upperInclusive ? "]" : ")"}`;
    },
    decode(value) {
      return decodeFailure(() => {
        if (value === "empty") return { empty: true as const };
        const source = v.parse(v.string(), value);
        const entries = delimitedValues(source, "[(", ["]", ")"]);
        if (entries.length !== 2) throw new Error("Invalid PostgreSQL range");
        const lowerInclusive = source[0] === "[",
          upperInclusive = source.at(-1) === "]";
        if ((entries[0] === null && lowerInclusive) || (entries[1] === null && upperInclusive))
          throw new Error("Invalid infinite PostgreSQL bound");
        return {
          empty: false as const,
          lower: entries[0] === null ? null : element.decode(entries[0]),
          upper: entries[1] === null ? null : element.decode(entries[1]),
          lowerInclusive,
          upperInclusive,
        };
      });
    },
  };
  return Object.freeze(codec);
}
type AnyCodec = ExtensionCodec<never, unknown>;
export type CompositeInput<Fields extends Readonly<Record<string, AnyCodec>>> = {
  readonly [Key in keyof Fields]: CodecInput<Fields[Key]>;
};
export type CompositeOutput<Fields extends Readonly<Record<string, AnyCodec>>> = {
  readonly [Key in keyof Fields]: CodecOutput<Fields[Key]>;
};
export function compositeCodec<const Fields extends Readonly<Record<string, AnyCodec>>>(
  id: string,
  fields: Fields,
): ExtensionCodec<CompositeInput<Fields>, CompositeOutput<Fields>> {
  fields = Object.freeze({ ...fields });
  const names = Object.keys(fields);
  const codec: ExtensionCodec<CompositeInput<Fields>, CompositeOutput<Fields>> = {
    id: `pg:composite:1:${id}:${names.map((name) => `${name}:${fields[name]!.id}`).join(";")}`,
    transport: "text",
    encode(value: CompositeInput<Fields>) {
      return `(${names
        .map((name) => {
          // SAFETY: fields and value share the same mapped key; the matching codec validates each input.
          const encoded = fields[name]!.encode(value[name] as never);
          return encoded === null ? "" : quoteValue(encoded);
        })
        .join(",")})`;
    },
    decode(value) {
      return decodeFailure(() => {
        const entries = delimitedValues(v.parse(v.string(), value), "(", [")"]);
        if (entries.length !== names.length) throw new Error("Invalid PostgreSQL composite field count");
        // SAFETY: each field is decoded by its own checked codec, in declared PostgreSQL order.
        return Object.fromEntries(
          names.map((name, index) => [name, fields[name]!.decode(entries[index])]),
        ) as CompositeOutput<Fields>;
      });
    },
  };
  return Object.freeze(codec);
}

/** Resolve an exact overload using a qualified captured SQL type, without changing decoding. */
export function withCodecSqlType<Input, Output>(
  codec: ExtensionCodec<Input, Output>,
  sqlType: ExtensionSqlType,
): ExtensionCodec<Input, Output> {
  return Object.freeze({ ...codec, sqlType: Object.freeze({ ...sqlType }) });
}
