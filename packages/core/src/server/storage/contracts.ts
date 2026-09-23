import * as v from "valibot";

/** Initial single-object limit also bounds the memory used while verifying an upload. */
export const maximumUploadBytes = 10 * 1024 * 1024;
export const storageIntentValidator = v.strictObject({
  id: v.pipe(v.string(), v.uuid()),
  bucket: v.pipe(v.string(), v.regex(/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/)),
  size: v.pipe(v.number(), v.safeInteger(), v.minValue(1), v.maxValue(maximumUploadBytes)),
  contentType: v.pipe(
    v.string(),
    v.maxLength(128),
    v.regex(/^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/),
  ),
  sha256: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)),
});
export type StorageIntent = v.InferOutput<typeof storageIntentValidator>;
export const storageUploadValidator = v.omit(storageIntentValidator, ["id"]);
export type StorageUpload = v.InferOutput<typeof storageUploadValidator>;

export interface ObjectStorageBackend {
  readonly target: { readonly projectId: string; readonly branchId: string };
  signUpload(
    intent: StorageIntent,
    expiresIn: number,
  ): Promise<{
    readonly key: string;
    readonly url: string;
    readonly method: "PUT";
    readonly headers: Readonly<Record<string, string>>;
  }>;
  sealUpload(
    intent: StorageIntent,
    signal?: AbortSignal,
  ): Promise<{
    readonly key: string;
    readonly sha256: string;
    readonly size: number;
  }>;
  signDownload(
    intent: StorageIntent,
    expiresIn: number,
    signal?: AbortSignal,
  ): Promise<{
    readonly url: string;
    readonly method: "GET";
  }>;
}

export class StorageVerificationError extends Error {
  constructor() {
    super("Storage verification failed");
  }
}
