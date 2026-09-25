import * as v from "valibot";
import { wire } from "../validation/encoding";
import { protocolVersion } from "./protocol";
import type { FunctionKind, FunctionReference } from "./reference";
import { createControlPlaneRequest, LoomClientError } from "./control-plane";
import type { ClientOptions, CallOptions } from "./control-plane";
import { createStorageClient } from "./storage";
export { LoomClientError } from "./control-plane";
export type { ClientOptions, ClientAuth, CallOptions } from "./control-plane";
export { createStorageClient } from "./storage";
export type { StorageCallOptions } from "./storage";

export type WireValue<T> = T extends bigint | Date
  ? string
  : T extends string | number | boolean | null | undefined
    ? T
    : T extends object
      ? { [K in keyof T]: WireValue<T[K]> }
      : T;
export interface TicketOptions {
  readonly signal?: AbortSignal;
  readonly identityKey: string;
}
export interface ClientTicket {
  readonly ticket: string;
  /** Unix seconds, including fractional seconds from the server clock. */
  readonly expiresAt: number;
}
const ticketSchema = v.strictObject({
  ticket: v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{43}$/)),
  expiresAt: v.pipe(v.number(), v.finite(), v.minValue(1)),
});
export function createClient(options: ClientOptions) {
  const { request, attempts } = createControlPlaneRequest(options);
  return {
    storage: createStorageClient(options),
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
