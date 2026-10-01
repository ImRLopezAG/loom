import { createHash } from "node:crypto";
import { EncryptJWT, jwtDecrypt } from "jose";
import { ORPCError } from "@orpc/server";
import * as v from "valibot";
import type { InvocationIdentity } from "../server/auth/context";
import { storageParser, systemParsers } from "../validation/encoding";
import type { StorageValue } from "../validation/encoding";
import type { SearchRuntimeDescriptor } from "./metadata";
import type { SearchPublicSelection } from "./public";
import { validSearchSelection } from "./public";
import { searchOrdering } from "./ordering";
import type { SearchDirection } from "./ordering";
import { exactSearchTimestamp } from "./timestamp";

export interface SearchCursorContext {
  readonly branchId: string;
  readonly namespace: string;
  readonly contract: string;
  readonly identity: InvocationIdentity | null;
}
export function invalidSearchCursor(): ORPCError<"INVALID_CURSOR", { restart: true }> {
  return new ORPCError("INVALID_CURSOR", { message: "Restart this search", data: { restart: true } });
}
/** A dedicated 256-bit branch secret. Never accept deployment credentials as a substitute. */
export function readSearchCursorKey(value: string | undefined): Uint8Array {
  if (!v.is(v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)), value))
    throw new Error("Missing or invalid search cursor key");
  return Buffer.from(value, "hex");
}
type BindingValue = StorageValue | undefined | readonly BindingValue[] | { readonly [name: string]: BindingValue };
function canonical(value: BindingValue): string {
  if (value === undefined) return "undefined";
  if (value instanceof Date) return JSON.stringify({ date: value.toISOString() });
  if (v.is(v.bigint(), value)) return JSON.stringify({ bigint: value.toString() });
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value !== null && v.is(v.object({}), value)) {
    return `{${Object.entries(value)
      .filter(([, value]) => value !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, value]) => `${JSON.stringify(key)}:${canonical(value)}`)
      .join(",")}}`;
  }
  return JSON.stringify(v.parse(v.union([v.null(), v.boolean(), v.number(), v.string()]), value));
}
function selectionBinding(input: SearchPublicSelection): BindingValue {
  return {
    columns: input.columns,
    with: input.with
      ? Object.fromEntries(Object.entries(input.with).map(([name, child]) => [name, selectionBinding(child)]))
      : undefined,
    where: input.where,
    orderBy: input.orderBy?.map(({ field, direction, nulls }) => ({ field, direction, nulls })),
    limit: input.limit,
  };
}
/** Object key order is irrelevant; ordered tuples, identity and projection remain bound. */
export function searchCursorBinding(
  descriptor: SearchRuntimeDescriptor,
  input: SearchPublicSelection,
  context: SearchCursorContext,
): string {
  if (!validSearchSelection(descriptor.node.public, input)) throw new ORPCError("INVALID_SELECTION");
  const {
    limit: _limit,
    loadedPages: _loadedPages,
    cursor: _cursor,
    anchor: _anchor,
    direction: _direction,
    count: _count,
    ...selection
  } = input;
  return createHash("sha256")
    .update(
      canonical({
        branch: context.branchId,
        namespace: context.namespace,
        contract: context.contract,
        policy: descriptor.fingerprint,
        entity: descriptor.entity,
        mode: descriptor.mode,
        identity: context.identity
          ? {
              issuer: context.identity.issuer,
              subject: context.identity.subject,
              tenantId: context.identity.tenantId ?? null,
            }
          : null,
        query: selectionBinding({ ...selection, orderBy: searchOrdering(descriptor, input) }),
      }),
    )
    .digest("hex");
}
const encodedKey = v.variant("kind", [
  v.strictObject({ kind: v.literal("null") }),
  v.strictObject({ kind: v.literal("number"), value: v.pipe(v.number(), v.finite()) }),
  v.strictObject({ kind: v.literal("string"), value: v.string() }),
  v.strictObject({ kind: v.literal("date"), value: v.string() }),
  v.strictObject({ kind: v.literal("timestamp"), value: v.string() }),
  v.strictObject({ kind: v.literal("bigint"), value: v.pipe(v.string(), v.regex(/^(0|-?[1-9]\d*)$/)) }),
]);
const payloadSchema = v.strictObject({
  v: v.literal(1),
  binding: v.string(),
  direction: v.picklist(["forward", "backward"]),
  keys: v.array(encodedKey),
  iat: v.pipe(v.number(), v.safeInteger()),
  exp: v.pipe(v.number(), v.safeInteger()),
});
function encodeKey(value: StorageValue): v.InferOutput<typeof encodedKey> {
  if (value === null) return { kind: "null" };
  if (value instanceof Date) return { kind: "date", value: value.toISOString() };
  if (v.is(exactSearchTimestamp, value)) return { kind: "timestamp", value: value.timestamp };
  if (v.is(v.bigint(), value)) return { kind: "bigint", value: value.toString() };
  if (v.is(v.number(), value)) return { kind: "number", value };
  return { kind: "string", value: v.parse(v.string(), value) };
}
function decodeKey(key: v.InferOutput<typeof encodedKey>): StorageValue {
  switch (key.kind) {
    case "null":
      return null;
    case "number":
    case "string":
      return key.value;
    case "bigint":
      return BigInt(key.value);
    case "timestamp":
      return v.parse(exactSearchTimestamp, { timestamp: key.value });
    case "date": {
      const date = new Date(key.value);
      if (!Number.isFinite(date.getTime()) || date.toISOString() !== key.value) throw invalidSearchCursor();
      return date;
    }
  }
}
/** Codec lifetime is one request; the key and binding come from trusted runtime ownership. */
export function createSearchCursor(
  value: string | undefined,
  descriptor: SearchRuntimeDescriptor,
  input: SearchPublicSelection,
  context: SearchCursorContext,
  clock: () => Date = () => new Date(),
) {
  const key = readSearchCursorKey(value);
  const binding = searchCursorBinding(descriptor, input, context);
  const order = searchOrdering(descriptor, input);
  function validate(values: readonly StorageValue[]): StorageValue[] {
    if (values.length !== order.length) throw invalidSearchCursor();
    return order.map((entry, index) => {
      const field = descriptor.node.public.fields?.[entry.field] ?? descriptor.node.public.columns[entry.field];
      const parser =
        entry.field === "_id" || entry.field === "_createdAt"
          ? systemParsers[entry.field]
          : field && field !== "_id" && field !== "_createdAt"
            ? storageParser(field)
            : undefined;
      if (!parser) throw invalidSearchCursor();
      if (
        field &&
        field !== "_id" &&
        field !== "_createdAt" &&
        field.kind === "timestamp" &&
        v.is(exactSearchTimestamp, values[index])
      )
        return values[index]!;
      const parsed = v.safeParse(parser, values[index]);
      if (!parsed.success || (entry.field === "_createdAt" && v.parse(v.number(), parsed.output) < 0))
        throw invalidSearchCursor();
      return parsed.output;
    });
  }
  return Object.freeze({
    async issue(values: readonly StorageValue[], direction: SearchDirection): Promise<string> {
      try {
        const keys = validate(values).map(encodeKey);
        const now = Math.floor(clock().getTime() / 1000);
        const token = await new EncryptJWT({ v: 1, binding, direction, keys })
          .setProtectedHeader({ alg: "dir", enc: "A256GCM", typ: "loom.search.cursor.v1" })
          .setIssuedAt(now)
          .setExpirationTime(now + descriptor.budgets.cursorSeconds)
          .encrypt(key);
        if (token.length > 8192) throw invalidSearchCursor();
        return token;
      } catch {
        throw invalidSearchCursor();
      }
    },
    async read(token: string, direction: SearchDirection): Promise<StorageValue[]> {
      try {
        if (
          !token ||
          token.length > 8192 ||
          !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)
        )
          throw invalidSearchCursor();
        const { payload } = await jwtDecrypt(token, key, {
          keyManagementAlgorithms: ["dir"],
          contentEncryptionAlgorithms: ["A256GCM"],
          typ: "loom.search.cursor.v1",
          currentDate: clock(),
          maxTokenAge: descriptor.budgets.cursorSeconds,
        });
        const parsed = v.parse(payloadSchema, payload);
        if (
          parsed.binding !== binding ||
          parsed.direction !== direction ||
          parsed.exp - parsed.iat !== descriptor.budgets.cursorSeconds
        )
          throw invalidSearchCursor();
        const values = validate(parsed.keys.map(decodeKey));
        if (values.some((value, index) => encodeKey(value).kind !== parsed.keys[index]?.kind))
          throw invalidSearchCursor();
        return values;
      } catch {
        throw invalidSearchCursor();
      }
    },
  });
}
