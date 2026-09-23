import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { test } from "bun:test";
import { S3Client } from "@aws-sdk/client-s3";
import { createNeonObjectStorage, StorageVerificationError } from "@loom/core/neon";

function fixture() {
  const objects = new Map<string, { body: Buffer; headers: Record<string, string> }>();
  const requests: Array<{ method: string; path: string }> = [];
  const server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    async fetch(request) {
      const path = decodeURIComponent(new URL(request.url).pathname);
      requests.push({ method: request.method, path });
      if (request.method === "PUT") {
        const headers = Object.fromEntries(
          [...request.headers].filter(([key]) => key === "content-type" || key.startsWith("x-amz-meta-")),
        );
        objects.set(path, { body: Buffer.from(await request.arrayBuffer()), headers });
        return new Response(null, { headers: { etag: '"fixture"' } });
      }
      if (request.method === "DELETE") {
        objects.delete(path);
        return new Response(null, { status: 204 });
      }
      const object = objects.get(path);
      if (!object) return new Response("<Error><Code>NoSuchKey</Code></Error>", { status: 404 });
      return new Response(request.method === "HEAD" ? null : new Uint8Array(object.body), {
        headers: { ...object.headers, "content-length": String(object.body.length), etag: '"fixture"' },
      });
    },
  });
  const credentials = { accessKeyId: "fixture-access", secretAccessKey: "fixture-secret" };
  const client = new S3Client({
    region: "us-east-2",
    endpoint: server.url.toString(),
    forcePathStyle: true,
    credentials,
    requestChecksumCalculation: "WHEN_REQUIRED",
    maxAttempts: 1,
  });
  const storage = createNeonObjectStorage(
    {
      projectId: "project",
      branchId: "br-preview",
      endpoint: "https://br-preview.storage.c-1.us-east-2.aws.neon.tech",
      region: "us-east-2",
      credentials,
    },
    client,
  );
  const body = Buffer.from("verified upload");
  const intent = {
    id: randomUUID(),
    bucket: "uploads",
    size: body.length,
    contentType: "text/plain",
    sha256: createHash("sha256").update(body).digest("hex"),
  };
  return {
    storage,
    objects,
    requests,
    body,
    intent,
    async cleanup() {
      storage.close();
      await server.stop(true);
    },
  };
}

test("storage signs bounded uploads and seals verified bytes outside the client-writable key", async () => {
  const f = fixture();
  try {
    const upload = await f.storage.signUpload(f.intent, 120);
    const url = new URL(upload.url);
    assert.equal(url.searchParams.get("X-Amz-Expires"), "120");
    assert.ok(url.searchParams.get("X-Amz-SignedHeaders")?.includes("content-length"));
    assert.ok(url.searchParams.get("X-Amz-SignedHeaders")?.includes("content-type"));
    assert.equal(upload.method, "PUT");
    assert.equal(upload.headers["content-type"], "text/plain");
    assert.equal(
      (await fetch(upload.url, { method: upload.method, headers: upload.headers, body: f.body })).status,
      200,
    );
    const sealed = await f.storage.sealUpload(f.intent);
    assert.notEqual(sealed.key, upload.key);
    assert.ok(sealed.key.includes("/ready/"));
    const ready = f.objects.get(`/uploads/${sealed.key}`);
    assert.deepEqual(ready?.body, f.body);
    // A still-live upload URL can only change staging, never the verified object.
    await fetch(upload.url, { method: "PUT", headers: upload.headers, body: Buffer.from("changed upload!") });
    // SQL may have failed after the ready object was written. Recover that write, without rereading staging.
    assert.deepEqual(await f.storage.sealUpload(f.intent), sealed);
    const download = await f.storage.signDownload(f.intent, 60);
    assert.deepEqual(Buffer.from(await (await fetch(download.url)).arrayBuffer()), f.body);
    await f.storage.remove(f.intent, "pending");
    assert.equal(f.objects.has(`/uploads/${upload.key}`), false);
    assert.equal(f.objects.has(`/uploads/${sealed.key}`), true);
    await f.storage.remove(f.intent, "ready");
    assert.equal(f.objects.size, 0);
  } finally {
    await f.cleanup();
  }
});

test("storage refuses unverified, mismatched and missing objects without publishing ready bytes", async () => {
  const f = fixture();
  try {
    await assert.rejects(f.storage.signDownload(f.intent, 60), /Storage operation failed/);
    const upload = await f.storage.signUpload(f.intent, 120);
    const path = new URL(upload.url).pathname;
    const headers = { ...upload.headers };
    f.objects.set(path, { body: f.body, headers: { ...headers, "x-amz-meta-loom-intent": randomUUID() } });
    await assert.rejects(f.storage.sealUpload(f.intent), StorageVerificationError);
    f.objects.set(path, { body: Buffer.from("tampered upload"), headers });
    await assert.rejects(f.storage.sealUpload(f.intent), StorageVerificationError);
    f.objects.set(path, { body: Buffer.alloc(f.intent.size + 1), headers });
    await assert.rejects(f.storage.sealUpload(f.intent), StorageVerificationError);
    assert.equal(
      f.requests.some((request) => request.method === "PUT"),
      false,
    );
  } finally {
    await f.cleanup();
  }
});

test("storage refuses another branch endpoint, invalid bounds and canceled work", async () => {
  assert.throws(() =>
    createNeonObjectStorage({
      projectId: "project",
      branchId: "br-preview",
      endpoint: "https://br-production.storage.c-1.us-east-2.aws.neon.tech",
      region: "us-east-2",
      credentials: { accessKeyId: "fixture", secretAccessKey: "fixture" },
    }),
  );
  const f = fixture();
  try {
    await assert.rejects(f.storage.signUpload({ ...f.intent, size: 10 * 1024 * 1024 + 1 }, 120));
    await assert.rejects(f.storage.signUpload(f.intent, 3600));
    await assert.rejects(f.storage.signUpload({ ...f.intent, bucket: "../other" }, 120));
    await assert.rejects(f.storage.sealUpload(f.intent, AbortSignal.abort()));
    assert.equal(f.requests.length, 0);
  } finally {
    await f.cleanup();
  }
});
