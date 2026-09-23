import * as v from "valibot";
import { storageUploadValidator } from "./contracts";
import { storageHandlerValidator } from "./events";
import type { StorageAuthorization } from "./intents";

const bucketValidator = v.strictObject({
  onObjectCreated: v.optional(storageHandlerValidator),
});
type StorageBucket = v.InferOutput<typeof bucketValidator>;
export interface StorageOptions {
  readonly buckets: Readonly<Record<string, StorageBucket>>;
  readonly authorize?: (context: StorageAuthorization) => void | Promise<void>;
}
export interface StorageDefinition {
  readonly buckets: Readonly<Record<string, StorageBucket>>;
  readonly authorize: (context: StorageAuthorization) => Promise<void>;
}
const definitions = new WeakSet<object>();
export function isStorageDefinition(value: unknown): value is StorageDefinition {
  return value instanceof Object && definitions.has(value);
}

/** Returning from the policy permits access; missing policies deny all access. */
export function defineStorage(options: StorageOptions = { buckets: {} }): StorageDefinition {
  const buckets = v.parse(v.record(storageUploadValidator.entries.bucket, bucketValidator), options.buckets);
  for (const bucket of Object.values(buckets)) {
    if (bucket.onObjectCreated) {
      Object.freeze(bucket.onObjectCreated.call);
      Object.freeze(bucket.onObjectCreated);
    }
    Object.freeze(bucket);
  }
  const authorize =
    options.authorize ??
    (() => {
      throw new Error("Storage access denied");
    });
  v.parse(v.function(), authorize);
  const definition = Object.freeze({
    buckets: Object.freeze(buckets),
    async authorize(context: StorageAuthorization): Promise<void> {
      await authorize(context);
    },
  });
  definitions.add(definition);
  return definition;
}
