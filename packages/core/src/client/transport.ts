import * as v from "valibot";
import type { JsonValue } from "../schema/fields";
import { json, wire } from "../validation/encoding";
import { protocolVersion } from "./protocol";
import type { FunctionKind, FunctionReference } from "./reference";
import {
  storageRequestValidator,
  storageStatusValidator,
  storageSignedUploadValidator,
  storageSignedDownloadValidator,
} from "../validation/storage";
import type { StorageRequest, StorageUpload } from "../validation/storage";

export type WireValue<T> = T extends bigint | Date
  ? string
  : T extends string | number | boolean | null | undefined
    ? T
    : T extends object
      ? { [K in keyof T]: WireValue<T[K]> }
      : T;
export interface ClientAuth {
  readonly token: string;
  /** Stable issuer/user/tenant partition from the auth adapter; never sent as server authority. */
  readonly identityKey: string;
}
export interface ClientOptions {
  readonly url: string;
  readonly getAuth?: (options: {
    readonly forceRefresh: boolean;
    readonly signal: AbortSignal;
  }) => Promise<ClientAuth | null>;
  readonly fetch?: (url: string, init: RequestInit) => Promise<Response>;
  readonly maxAttempts?: number;
  readonly timeoutMs?: number;
  readonly maxResponseBytes?: number;
}
export interface CallOptions {
  readonly signal?: AbortSignal;
  /** Bind a request to the cache/provider's current identity partition. */
  readonly identityKey?: string | null;
  /** Supply the original key when explicitly retrying a mutation after an uncertain response. */
  readonly idempotencyKey?: string;
}
export interface TicketOptions {
  readonly signal?: AbortSignal;
  readonly identityKey: string;
}
export type StorageCallOptions = Pick<CallOptions, "signal" | "identityKey">;
export interface ClientTicket {
  readonly ticket: string;
  /** Unix seconds, including fractional seconds from the server clock. */
  readonly expiresAt: number;
}
const ticketSchema = v.strictObject({
  ticket: v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{43}$/)),
  expiresAt: v.pipe(v.number(), v.finite(), v.minValue(1)),
});
export class LoomClientError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = "LoomClientError";
  }
}
const responseSchema = v.variant("ok", [
  v.strictObject({ protocol: v.number(), ok: v.literal(true), requestId: v.string(), value: json }),
  v.strictObject({
    protocol: v.number(),
    ok: v.literal(false),
    requestId: v.string(),
    error: v.strictObject({ code: v.string(), message: v.string() }),
  }),
]);

async function readResponse(response: Response, limit: number, signal: AbortSignal): Promise<string> {
  if (!response.body) throw new LoomClientError("INVALID_RESPONSE", "The server returned an empty response");
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let text = "";
  const cancel = () => {
    void reader.cancel().catch(() => {});
  };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    for (;;) {
      signal.throwIfAborted();
      const chunk = await reader.read();
      signal.throwIfAborted();
      if (chunk.done) return text + decoder.decode();
      size += chunk.value.byteLength;
      if (size > limit)
        throw new LoomClientError("RESPONSE_TOO_LARGE", "The server response exceeds the configured limit");
      text += decoder.decode(chunk.value, { stream: true });
    }
  } finally {
    signal.removeEventListener("abort", cancel);
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
async function backoff(attempt: number, signal: AbortSignal): Promise<void> {
  signal.throwIfAborted();
  await new Promise<void>((resolve, reject) => {
    const done = () => {
      signal.removeEventListener("abort", abort);
      resolve();
    };
    const timer = setTimeout(done, Math.min(100 * 2 ** attempt, 1000));
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    signal.addEventListener("abort", abort, { once: true });
  });
}

export function createClient(options: ClientOptions) {
  const base = new URL(options.url);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname);
  if (
    (base.protocol !== "https:" && !(base.protocol === "http:" && local)) ||
    base.username ||
    base.password ||
    base.search ||
    base.hash
  )
    throw new Error("Client URL must use HTTPS, except for local development, without credentials, query or fragment");
  const url = `${base.href.replace(/\/$/, "")}/api/loom`;
  const fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
  const getAuth = options.getAuth;
  const attempts = options.maxAttempts ?? 3;
  const timeout = options.timeoutMs ?? 30000;
  const limit = options.maxResponseBytes ?? 1048576;
  if (!Number.isInteger(attempts) || attempts < 1 || attempts > 5) throw new Error("Invalid client attempt limit");
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 120000) throw new Error("Invalid client timeout");
  if (!Number.isInteger(limit) || limit < 1024 || limit > 10485760) throw new Error("Invalid response byte limit");
  async function request(
    endpoint: "call" | "ticket" | "storage",
    prepare: () => { body: string; maximum: number },
    callOptions: Pick<CallOptions, "signal" | "identityKey">,
  ): Promise<JsonValue> {
    const deadline = AbortSignal.timeout(timeout);
    const signal = callOptions.signal ? AbortSignal.any([deadline, callOptions.signal]) : deadline;
    try {
      signal.throwIfAborted();
      const { body, maximum } = prepare();
      let identity: string | null | undefined = callOptions.identityKey;
      let refreshed = false;
      let forceRefresh = false;
      for (let attempt = 0; attempt < maximum; attempt++) {
        signal.throwIfAborted();
        let auth: ClientAuth | null;
        try {
          auth = getAuth ? await getAuth({ forceRefresh, signal }) : null;
          forceRefresh = false;
        } catch {
          throw new LoomClientError("AUTH_ERROR", "Unable to obtain authentication");
        }
        signal.throwIfAborted();
        if (auth && (!auth.identityKey || !/^[\x21-\x7e]+$/.test(auth.token) || auth.token.length > 16384))
          throw new LoomClientError("AUTH_ERROR", "Invalid authentication state");
        const partition = auth?.identityKey ?? null;
        if (identity === undefined) identity = partition;
        else if (identity !== partition)
          throw new LoomClientError("AUTH_CHANGED", "Identity changed during the request; start a new call");
        const headers = new Headers({ "content-type": "application/json" });
        if (auth) headers.set("authorization", `Bearer ${auth.token}`);
        let response: Response;
        let text: string;
        try {
          response = await fetcher(`${url}/${endpoint}`, {
            method: "POST",
            headers,
            body,
            signal,
            credentials: "omit",
            redirect: "error",
            cache: "no-store",
          });
          if (response.status === 401 && getAuth && !refreshed) {
            await response.body?.cancel();
            refreshed = true;
            forceRefresh = true;
            attempt--;
            continue;
          }
          if ([502, 503, 504].includes(response.status) && attempt + 1 < maximum) {
            await response.body?.cancel();
            await backoff(attempt, signal);
            continue;
          }
          text = await readResponse(response, limit, signal);
        } catch (cause) {
          if (cause instanceof LoomClientError || signal.aborted) throw cause;
          if (attempt + 1 >= maximum)
            throw new LoomClientError("TRANSPORT_ERROR", "The request could not be completed");
          await backoff(attempt, signal);
          continue;
        }
        const parsed = v.safeParse(responseSchema, JSON.parse(text));
        if (!parsed.success) throw new LoomClientError("INVALID_RESPONSE", "The server returned an invalid response");
        const result = parsed.output;
        if (result.protocol !== protocolVersion)
          throw new LoomClientError(
            "PROTOCOL_MISMATCH",
            "Client and server protocol versions differ; update the client",
            result.requestId,
          );
        if (!result.ok) throw new LoomClientError(result.error.code, result.error.message, result.requestId);
        if (!response.ok)
          throw new LoomClientError(
            "INVALID_RESPONSE",
            "The server returned an inconsistent response",
            result.requestId,
          );
        return result.value;
      }
      throw new LoomClientError("TRANSPORT_ERROR", "The request could not be completed");
    } catch (cause) {
      if (callOptions.signal?.aborted) throw new LoomClientError("CANCELLED", "The request was cancelled");
      if (deadline.aborted) throw new LoomClientError("TIMEOUT", "The request timed out");
      if (cause instanceof LoomClientError) throw cause;
      throw new LoomClientError("INVALID_RESPONSE", "The request or response could not be encoded");
    }
  }
  async function storageRequest<Schema extends v.GenericSchema>(
    payload: StorageRequest,
    schema: Schema,
    callOptions: StorageCallOptions,
  ): Promise<v.InferOutput<Schema>> {
    const value = await request(
      "storage",
      () => {
        const parsed = v.safeParse(storageRequestValidator, payload);
        if (!parsed.success) throw new LoomClientError("INVALID_ARGUMENTS", "Invalid storage request");
        return { body: JSON.stringify(parsed.output), maximum: attempts };
      },
      callOptions,
    );
    const parsed = v.safeParse(schema, value);
    if (!parsed.success)
      throw new LoomClientError("INVALID_RESPONSE", "The server returned an invalid storage response");
    return parsed.output;
  }
  return {
    storage: Object.freeze({
      create: (upload: StorageUpload, callOptions: CallOptions = {}) =>
        storageRequest(
          {
            protocol: protocolVersion,
            operation: "create",
            upload,
            requestKey: callOptions.idempotencyKey ?? crypto.randomUUID(),
          },
          storageStatusValidator,
          callOptions,
        ),
      status: (id: string, callOptions: StorageCallOptions = {}) =>
        storageRequest({ protocol: protocolVersion, operation: "status", id }, storageStatusValidator, callOptions),
      signUpload: (id: string, callOptions: StorageCallOptions = {}) =>
        storageRequest(
          { protocol: protocolVersion, operation: "signUpload", id },
          storageSignedUploadValidator,
          callOptions,
        ),
      finalize: (id: string, callOptions: StorageCallOptions = {}) =>
        storageRequest({ protocol: protocolVersion, operation: "finalize", id }, storageStatusValidator, callOptions),
      signDownload: (id: string, callOptions: StorageCallOptions = {}) =>
        storageRequest(
          { protocol: protocolVersion, operation: "signDownload", id },
          storageSignedDownloadValidator,
          callOptions,
        ),
    }),
    async ticket(ticketOptions: TicketOptions): Promise<ClientTicket> {
      if (!ticketOptions.identityKey)
        throw new LoomClientError("AUTH_ERROR", "Connection tickets require an identity partition");
      const value = await request(
        "ticket",
        () => ({
          body: JSON.stringify({ protocol: protocolVersion }),
          maximum: attempts,
        }),
        ticketOptions,
      );
      const parsed = v.safeParse(ticketSchema, value);
      if (!parsed.success || parsed.output.expiresAt <= Date.now() / 1000)
        throw new LoomClientError("INVALID_TICKET", "The server returned an invalid or expired connection ticket");
      return parsed.output;
    },
    async call<Kind extends FunctionKind, Input, Output>(
      reference: FunctionReference<Kind, "public", Input, Output>,
      args: NoInfer<Input>,
      callOptions: CallOptions = {},
    ): Promise<WireValue<Output>> {
      const value = await request(
        "call",
        () => {
          if (reference.visibility !== "public" || !/^[a-f0-9]{64}$/.test(reference.version))
            throw new LoomClientError("INVALID_REFERENCE", "Expected a public generated function reference");
          const encoded = v.safeParse(wire, args);
          if (!encoded.success)
            throw new LoomClientError("INVALID_ARGUMENTS", "Arguments must use supported wire values");
          const payload = {
            protocol: protocolVersion,
            name: reference.name,
            kind: reference.kind,
            version: reference.version,
            args: encoded.output,
          };
          let body: string;
          if (reference.kind === "mutation") {
            const idempotencyKey = callOptions.idempotencyKey ?? crypto.randomUUID();
            if (!/^[A-Za-z0-9_-]{1,128}$/.test(idempotencyKey))
              throw new LoomClientError("INVALID_IDEMPOTENCY_KEY", "Invalid mutation idempotency key");
            body = JSON.stringify({ ...payload, idempotencyKey });
          } else {
            if (callOptions.idempotencyKey !== undefined)
              throw new LoomClientError("INVALID_IDEMPOTENCY_KEY", "Only mutations accept an idempotency key");
            body = JSON.stringify(payload);
          }
          return { body, maximum: reference.kind === "action" ? 1 : attempts };
        },
        callOptions,
      );
      // SAFETY: The configured server checks the generated reference's version and output validator;
      // the request helper validates its JSON envelope. WireValue maps bigint/date encoding.
      return value as WireValue<Output>;
    },
  };
}
export type LoomClient = ReturnType<typeof createClient>;
