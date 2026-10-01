import type { createClient } from "./loom/_generated/api";

type Storage = ReturnType<typeof createClient>["storage"];

/** Save the returned intent ID before uploading so an interrupted transfer can be inspected. */
export async function createUpload(storage: Storage, file: File, requestKey: string) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()));
  const sha256 = Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return storage.create(
    { bucket: "uploads", size: file.size, contentType: file.type || "application/octet-stream", sha256 },
    { idempotencyKey: requestKey },
  );
}

/** Upload the same file used to create this intent, then inspect the returned state. */
export async function transferUpload(storage: Storage, intentId: string, file: File, signal: AbortSignal) {
  const signed = await storage.signUpload(intentId, { signal });
  const response = await fetch(signed.url, {
    method: signed.method,
    headers: signed.headers,
    body: file,
    signal,
    credentials: "omit",
    redirect: "error",
  });
  if (!response.ok) throw new Error(`Upload failed (${response.status})`);
  return storage.finalize(intentId, { signal });
}
