import { createHash, randomUUID } from "node:crypto";
import { S3Client } from "@aws-sdk/client-s3";
import { createNeonObjectStorage } from "@loom/core/neon";

export function storageProviderFixture(branchId = "br-preview") {
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
      branchId,
      endpoint: `https://${branchId}.storage.c-1.us-east-2.aws.neon.tech`,
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
