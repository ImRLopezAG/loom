import * as v from "valibot";
import { createControlPlaneRequest, LoomClientError } from "./control-plane";
import type { ClientOptions, CallOptions } from "./control-plane";
import { protocolVersion } from "./protocol";
import {
  storageRequestValidator,
  storageStatusValidator,
  storageSignedUploadValidator,
  storageSignedDownloadValidator,
} from "../validation/storage";
import type { StorageRequest, StorageUpload } from "../validation/storage";

export type StorageClientOptions = ClientOptions;
export type StorageCallOptions = Pick<CallOptions, "signal" | "identityKey">;

/** Storage intents use their own control plane, independent of procedure transport. */
export function createStorageClient(options: StorageClientOptions) {
  const { request, attempts } = createControlPlaneRequest(options);
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
  return Object.freeze({
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
  });
}
