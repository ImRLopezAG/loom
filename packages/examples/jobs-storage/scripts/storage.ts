import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import {
  maximumUploadBytes,
  storageUploadValidator,
  storageUploadPrefix,
  StorageVerificationError,
} from "@loom/core/server";
import type { ObjectStorageBackend, StorageIntent } from "@loom/core/server";
import * as v from "valibot";

const storageIntentValidator = v.strictObject({
  id: v.pipe(v.string(), v.uuid(), v.toLowerCase()),
  ...storageUploadValidator.entries,
});

interface StoredObject {
  readonly intent: StorageIntent;
  pending?: Buffer;
  sealed?: Buffer;
  uploading: boolean;
}
const requestParams = v.strictObject({
  expires: v.pipe(v.string(), v.regex(/^[0-9]{1,16}$/)),
  signature: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)),
});

/** An ephemeral loopback object store for the example, with a 64 MiB reservation limit. */
export function createLocalStorage(options: {
  origin: string;
  onUploaded: (intent: StorageIntent, key: string) => Promise<void>;
}): ObjectStorageBackend & { close(): Promise<void> } {
  const target = Object.freeze({ projectId: "local-upload-catalog", branchId: "local" });
  const prefix = storageUploadPrefix(target.projectId, target.branchId);
  const secret = randomBytes(32);
  const objects = new Map<string, StoredObject>();
  let reserved = 0;
  let closed = false;
  const digest = (method: string, id: string, expires: string) =>
    createHmac("sha256", secret)
      .update(JSON.stringify([method, id, expires]))
      .digest();
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    maxRequestBodySize: maximumUploadBytes,
    async fetch(request) {
      const origin = request.headers.get("origin");
      if (origin && origin !== options.origin) return new Response(null, { status: 403 });
      const headers = new Headers({ "cache-control": "no-store", "x-content-type-options": "nosniff" });
      if (origin) headers.set("access-control-allow-origin", options.origin);
      if (request.method === "OPTIONS") {
        headers.set("access-control-allow-methods", "GET, PUT");
        headers.set("access-control-allow-headers", "content-type");
        return new Response(null, { status: 204, headers });
      }
      const url = new URL(request.url);
      const id = url.pathname.slice("/objects/".length);
      const params = v.safeParse(requestParams, Object.fromEntries(url.searchParams));
      if (
        !url.pathname.startsWith("/objects/") ||
        !v.is(storageIntentValidator.entries.id, id) ||
        !params.success ||
        !["GET", "PUT"].includes(request.method)
      )
        return new Response(null, { status: 403, headers });
      const { expires, signature } = params.output;
      if (
        Number(expires) <= Date.now() ||
        !timingSafeEqual(digest(request.method, id, expires), Buffer.from(signature, "hex"))
      )
        return new Response(null, { status: 403, headers });
      const object = objects.get(id);
      if (!object || closed) return new Response(null, { status: 404, headers });
      if (request.method === "GET") {
        if (!object.sealed) return new Response(null, { status: 404, headers });
        headers.set("content-type", object.intent.contentType);
        headers.set("content-disposition", 'attachment; filename="upload"');
        headers.set("content-security-policy", "default-src 'none'; sandbox");
        return new Response(new Uint8Array(object.sealed), { headers });
      }
      if (object.sealed || object.uploading) return new Response(null, { status: 409, headers });
      if (request.headers.get("content-type") !== object.intent.contentType || !request.body)
        return new Response(null, { status: 422, headers });
      object.uploading = true;
      const reader = request.body.getReader();
      try {
        const chunks: Uint8Array[] = [];
        let size = 0;
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          size += chunk.value.byteLength;
          if (size > object.intent.size) {
            await reader.cancel();
            return new Response(null, { status: 413, headers });
          }
          chunks.push(chunk.value);
        }
        const body = Buffer.concat(chunks);
        if (size !== object.intent.size || createHash("sha256").update(body).digest("hex") !== object.intent.sha256)
          return new Response(null, { status: 422, headers });
        if (closed || objects.get(id) !== object) return new Response(null, { status: 404, headers });
        object.pending = body;
        await options.onUploaded(object.intent, `${prefix}${id}`);
        return new Response(null, { status: 204, headers });
      } catch {
        return new Response(null, { status: 503, headers });
      } finally {
        reader.releaseLock();
        object.uploading = false;
      }
    },
  });
  function registered(input: StorageIntent) {
    if (closed) throw new Error("Local storage stopped");
    const intent = v.parse(storageIntentValidator, input);
    const existing = objects.get(intent.id);
    if (existing) {
      if (JSON.stringify(existing.intent) !== JSON.stringify(intent)) throw new StorageVerificationError();
      return existing;
    }
    if (objects.size >= 128 || reserved + intent.size > 64 * 1024 * 1024)
      throw new Error("Local example storage capacity reached");
    const object: StoredObject = { intent, uploading: false };
    objects.set(intent.id, object);
    reserved += intent.size;
    return object;
  }
  function signed(method: "PUT" | "GET", intent: StorageIntent, expiresIn: number) {
    v.parse(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(3600)), expiresIn);
    const expires = String(Date.now() + expiresIn * 1000);
    const url = new URL(`/objects/${intent.id}`, server.url);
    url.searchParams.set("expires", expires);
    url.searchParams.set("signature", digest(method, intent.id, expires).toString("hex"));
    return url.href;
  }
  return {
    target,
    async signUpload(intent, expiresIn) {
      registered(intent);
      return {
        key: `${prefix}${intent.id}`,
        url: signed("PUT", intent, expiresIn),
        method: "PUT",
        headers: { "content-type": intent.contentType },
      };
    },
    async sealUpload(intent, signal) {
      signal?.throwIfAborted();
      const object = registered(intent);
      const body = object.sealed ?? object.pending;
      if (!body) throw new StorageVerificationError();
      object.sealed = body;
      delete object.pending;
      return {
        key: `${prefix.replace("/pending/", "/sealed/")}${intent.id}`,
        size: body.length,
        sha256: createHash("sha256").update(body).digest("hex"),
      };
    },
    async signDownload(intent, expiresIn, signal) {
      signal?.throwIfAborted();
      if (!registered(intent).sealed) throw new StorageVerificationError();
      return { url: signed("GET", intent, expiresIn), method: "GET" };
    },
    async remove(intent, state, signal) {
      signal?.throwIfAborted();
      const object = objects.get(intent.id);
      if (!object) return;
      if (state === "pending") delete object.pending;
      else delete object.sealed;
      if (!object.pending && !object.sealed) {
        objects.delete(intent.id);
        reserved -= object.intent.size;
      }
    },
    async close() {
      closed = true;
      await server.stop(true);
      objects.clear();
      reserved = 0;
    },
  };
}
