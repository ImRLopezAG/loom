import { createStorageClient } from "@loom/core/client";
const client = createStorageClient({ url: "https://api.example.test" });
const uploaded: Promise<import("@loom/core/client").StorageStatus> = client.create(
  { bucket: "uploads", size: 1, contentType: "text/plain", sha256: "a".repeat(64) },
  { idempotencyKey: "once" },
);
void uploaded;
const download: Promise<import("@loom/core/client").StorageSignedDownload> = client.signDownload("id");
void download;
void client.create({
  bucket: "uploads",
  size: 1,
  contentType: "text/plain",
  sha256: "a".repeat(64),
  // @ts-expect-error Storage creation requires the exact upload descriptor, never a caller identity.
  identity: { subject: "alice" },
});
// @ts-expect-error Only creation accepts a retry key.
void client.signDownload("id", { idempotencyKey: "once" });
