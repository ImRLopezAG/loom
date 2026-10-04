import * as v from "valibot";
import pg from "pg";
import { createRoaringbitmap_1_2 } from "../../../core/extensions/adapters/roaringbitmap";
import {
  boundedInt8Codec,
  createRoaringBitmap64Codec,
  createRoaringBitmapCodec,
  type RoaringBitmap,
  type RoaringBitmap64,
} from "../../../core/extensions/adapters/roaringbitmap-codecs";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { booleanCodec, nullableCodec, type ExtensionCodec } from "../../../core/extensions/codecs";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { int4Codec } from "../../../core/extensions/native-codecs";
import { acquireExtensionLock } from "../../migrations/connection";
import { withExtensionOperation } from "../operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "../verify";
import source from "../manifests/roaringbitmap.json";

type Descriptor = ExtensionDescriptor<"roaringbitmap", { readonly version: "1.2"; readonly schema: string }>;
type Call<Left, Right, Result> = (left: Left | null, right: Right | null) => Promise<Result | null>;
interface Width<Bitmap, Element> {
  readonly add: { readonly elementBitmap: Call<Element, Bitmap, Bitmap> };
  readonly containedby: { readonly element: Call<Element, Bitmap, boolean> };
  readonly shiftleft: Call<Bitmap, bigint, Bitmap>;
  readonly operators: {
    readonly addReverse: Call<Element, Bitmap, Bitmap>;
    readonly elementContainedBy: Call<Element, Bitmap, boolean>;
    readonly shiftLeft: Call<Bitmap, bigint, Bitmap>;
  };
}
export interface RoaringbitmapSession {
  /** The search_path this backend's transaction observes; the operation sets it transaction-locally. */
  readonly searchPath: () => Promise<string>;
  readonly functions: {
    /** routine:$extension:roaringbitmap.rb_add(pg_catalog.int4,$extension:roaringbitmap.roaringbitmap) */
    readonly rb_add: Width<RoaringBitmap, number>["add"];
    /** routine:$extension:roaringbitmap.rb_containedby(pg_catalog.int4,$extension:roaringbitmap.roaringbitmap) */
    readonly rb_containedby: Width<RoaringBitmap, number>["containedby"];
    /** routine:$extension:roaringbitmap.rb_shiftleft($extension:roaringbitmap.roaringbitmap,pg_catalog.int8) */
    readonly rb_shiftleft: Width<RoaringBitmap, number>["shiftleft"];
    /** routine:$extension:roaringbitmap.rb64_add(pg_catalog.int8,$extension:roaringbitmap.roaringbitmap64) */
    readonly rb64_add: Width<RoaringBitmap64, bigint>["add"];
    /** routine:$extension:roaringbitmap.rb64_containedby(pg_catalog.int8,$extension:roaringbitmap.roaringbitmap64) */
    readonly rb64_containedby: Width<RoaringBitmap64, bigint>["containedby"];
    /** routine:$extension:roaringbitmap.rb64_shiftleft($extension:roaringbitmap.roaringbitmap64,pg_catalog.int8) */
    readonly rb64_shiftleft: Width<RoaringBitmap64, bigint>["shiftleft"];
  };
  /** The |, <@ and << operators whose procedures are the SQL-language routines above. */
  readonly operators: {
    readonly roaringbitmap: Width<RoaringBitmap, number>["operators"];
    readonly roaringbitmap64: Width<RoaringBitmap64, bigint>["operators"];
  };
}
/** Same-backend observations; the setting is transaction-scoped, so `after` is read once the transaction ended. */
export interface RoaringbitmapSearchPathEffect {
  readonly scope: "transaction";
  readonly before: string;
  readonly during: string;
  readonly after: string;
}

/**
 * roaringbitmap 1.2 defines rb_add(element, bitmap), rb_containedby(element, bitmap) and rb_shiftleft in both widths,
 * and the |, <@ and << operators over them, as SQL-language bodies calling unqualified helpers. They resolve only when
 * the extension schema is on search_path, so they run here on an owned direct backend whose transaction sets
 * search_path to exactly that schema and pg_catalog.
 */
export async function withRoaringbitmapSession<Result>(
  directOperatorUrl: string,
  descriptor: Descriptor,
  callback: (session: RoaringbitmapSession) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{
  readonly completion: "committed";
  readonly value: Result;
  readonly searchPath: RoaringbitmapSearchPathEffect;
}> {
  createRoaringbitmap_1_2(descriptor);
  const namespace = pg.escapeIdentifier(
    v.parse(
      v.pipe(
        v.string(),
        v.minLength(1),
        v.check((value) => !value.includes("\0")),
      ),
      descriptor.schema,
    ),
  );
  const path = `${namespace}, pg_catalog`;
  const requirement = validateExtensionApiRequirement({
    schema: descriptor.schema,
    manifest: v.parse(extensionManifestValidator, source),
  });
  const bitmap = nullableCodec(createRoaringBitmapCodec(descriptor.schema)),
    bitmap64 = nullableCodec(createRoaringBitmap64Codec(descriptor.schema)),
    bool = nullableCodec(booleanCodec),
    int4 = nullableCodec(int4Codec),
    int8 = nullableCodec(boundedInt8Codec);
  const row = v.tuple([v.strictObject({ value: v.unknown() })]);
  let before: string | undefined;
  let during: string | undefined;
  let after: string | undefined;
  async function observe(client: pg.Client) {
    const result = await client.query("SELECT pg_catalog.current_setting('search_path') AS value");
    return v.parse(v.tuple([v.strictObject({ value: v.string() })]), result.rows)[0].value;
  }
  const result = await withExtensionOperation(
    directOperatorUrl,
    async (context) => {
      await acquireExtensionLock(context.client, signal);
      await verifyExtensionApiContracts(context.client, [requirement]);
      before = await observe(context.client);
      await context.client.query("SELECT pg_catalog.set_config('search_path', $1, true)", [path]);
      during = await observe(context.client);
      /** One exact captured member: both operands are encoded by their paired codecs and bound with their SQL types. */
      function call<LeftInput, LeftOutput, RightInput, RightOutput, OutputInput, Output>(
        left: ExtensionCodec<LeftInput, LeftOutput>,
        right: ExtensionCodec<RightInput, RightOutput>,
        output: ExtensionCodec<OutputInput, Output>,
        expression: (left: string, right: string) => string,
      ): (first: LeftInput, second: RightInput) => Promise<Output> {
        const type = ({ sqlType }: Pick<ExtensionCodec<unknown, unknown>, "sqlType">) => {
          if (!sqlType) throw new Error("roaringbitmap session codec lacks its SQL type");
          return `${pg.escapeIdentifier(sqlType.schema)}.${pg.escapeIdentifier(sqlType.name)}`;
        };
        const text = `SELECT ${expression(`$1::${type(left)}`, `$2::${type(right)}`)} AS value`;
        return (first, second) =>
          context.run(async () => {
            const parameters = [left.encode(first), right.encode(second)];
            const selected = await context.client.query(text, parameters);
            return output.decode(v.parse(row, selected.rows)[0].value);
          });
      }
      const routine = (name: string) => (left: string, right: string) =>
        `${namespace}.${pg.escapeIdentifier(name)}(${left}, ${right})`;
      const operator = (name: string) => (left: string, right: string) =>
        `(${left} OPERATOR(${namespace}.${name}) ${right})`;
      function width<BitmapInput, Bitmap, ElementInput, Element>(
        prefix: "rb" | "rb64",
        set: ExtensionCodec<BitmapInput, Bitmap>,
        element: ExtensionCodec<ElementInput, Element>,
      ) {
        return {
          add: Object.freeze({ elementBitmap: call(element, set, set, routine(`${prefix}_add`)) }),
          containedby: Object.freeze({ element: call(element, set, bool, routine(`${prefix}_containedby`)) }),
          shiftleft: call(set, int8, set, routine(`${prefix}_shiftleft`)),
          operators: Object.freeze({
            addReverse: call(element, set, set, operator("|")),
            elementContainedBy: call(element, set, bool, operator("<@")),
            shiftLeft: call(set, int8, set, operator("<<")),
          }),
        };
      }
      const narrow = width("rb", bitmap, int4),
        wide = width("rb64", bitmap64, int8);
      return Object.freeze({
        searchPath: () => context.run(() => observe(context.client)),
        functions: Object.freeze({
          rb_add: narrow.add,
          rb_containedby: narrow.containedby,
          rb_shiftleft: narrow.shiftleft,
          rb64_add: wide.add,
          rb64_containedby: wide.containedby,
          rb64_shiftleft: wide.shiftleft,
        }),
        operators: Object.freeze({ roaringbitmap: narrow.operators, roaringbitmap64: wide.operators }),
      } satisfies RoaringbitmapSession);
    },
    callback,
    signal,
    async (context) => {
      after = await observe(context.client);
    },
  );
  if (before === undefined || during === undefined || after === undefined)
    throw new Error("roaringbitmap search_path was not observed");
  return { ...result, searchPath: Object.freeze({ scope: "transaction", before, during, after }) };
}
