import { expect, test } from "vite-plus/test";
import { defineStorage, isStorageDefinition, onObjectCreated } from "@loom/core/server";
import type { FunctionReference } from "@loom/core/client";
import type { StorageObjectCreatedEvent } from "@loom/core/server";

test("storage declarations capture bucket handlers and policy while defaulting to denial", async () => {
  const reference: FunctionReference<"mutation", "internal", StorageObjectCreatedEvent, null> = {
    name: "files:created",
    kind: "mutation",
    visibility: "internal",
    version: "a".repeat(64),
  };
  const buckets = { uploads: { onObjectCreated: onObjectCreated(reference) } };
  const options = { buckets, authorize: () => {} };
  const declared = defineStorage(options);
  options.authorize = () => {
    throw new Error("changed");
  };
  buckets.uploads.onObjectCreated = onObjectCreated({ ...reference, name: "files:other" });
  expect(declared.buckets.uploads?.onObjectCreated?.call.name).toBe("files:created");
  expect(Object.isFrozen(declared.buckets.uploads?.onObjectCreated?.call)).toBe(true);
  expect(isStorageDefinition(declared)).toBe(true);
  expect(isStorageDefinition({ ...declared })).toBe(false);
  const context = {
    identity: { issuer: "issuer", subject: "alice" },
    operation: "upload" as const,
    upload: { bucket: "uploads", size: 1, contentType: "text/plain", sha256: "a".repeat(64) },
    signal: new AbortController().signal,
  };
  await declared.authorize(context);
  await expect(defineStorage({ buckets: { uploads: {} } }).authorize(context)).rejects.toThrow("Storage access denied");
  expect(() => defineStorage({ buckets: { "../bad": {} } })).toThrow();
});
