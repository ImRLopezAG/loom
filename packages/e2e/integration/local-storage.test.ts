import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { test } from "bun:test";
import { createLocalStorage } from "../fixtures/local-storage";

test("local object storage verifies bytes and keeps sealed downloads immutable", async () => {
  const origin = "http://127.0.0.1:5174";
  const deliveries: string[] = [];
  const storage = createLocalStorage({
    origin,
    onUploaded: async (_intent, key) => {
      deliveries.push(key);
    },
  });
  try {
    const body = Buffer.from("local verified object");
    const intent = {
      id: crypto.randomUUID(),
      bucket: "uploads",
      size: body.length,
      contentType: "text/plain",
      sha256: createHash("sha256").update(body).digest("hex"),
    };
    const signed = await storage.signUpload(intent, 60);
    await assert.rejects(storage.signDownload(intent, 60));
    assert.equal((await fetch(signed.url)).status, 403);
    assert.equal(
      (await fetch(signed.url, { method: "PUT", headers: signed.headers, body: Buffer.alloc(body.length + 1) })).status,
      413,
    );
    const forged = new URL(signed.url);
    forged.searchParams.set("signature", "0".repeat(64));
    assert.equal((await fetch(forged, { method: "PUT", body, headers: signed.headers })).status, 403);
    assert.equal(
      (await fetch(signed.url, { method: "PUT", body, headers: { ...signed.headers, origin: "http://evil.test" } }))
        .status,
      403,
    );
    const response = await fetch(signed.url, { method: "PUT", body, headers: { ...signed.headers, origin } });
    assert.equal(response.status, 204);
    assert.equal(response.headers.get("access-control-allow-origin"), origin);
    assert.deepEqual(deliveries, [signed.key]);
    assert.equal((await storage.sealUpload(intent)).sha256, intent.sha256);
    const download = await storage.signDownload(intent, 60);
    assert.equal(await (await fetch(download.url)).text(), body.toString());
    assert.equal((await fetch(signed.url, { method: "PUT", body: "changed", headers: signed.headers })).status, 409);
    await storage.remove(intent, "pending");
    assert.equal(await (await fetch(download.url)).text(), body.toString());
    const expired = await storage.signDownload(intent, 0);
    assert.equal((await fetch(expired.url)).status, 403);
    await storage.remove(intent, "ready");
    assert.equal((await fetch(download.url)).status, 404);

    const corrupt = { ...intent, id: crypto.randomUUID() };
    const upload = await storage.signUpload(corrupt, 60);
    assert.equal(
      (await fetch(upload.url, { method: "PUT", headers: upload.headers, body: Buffer.alloc(body.length) })).status,
      422,
    );
    await assert.rejects(storage.sealUpload(corrupt));
    assert.equal(deliveries.length, 1);
  } finally {
    await storage.close();
  }
});

test("local object storage bounds reservations and releases cancelled intents", async () => {
  const storage = createLocalStorage({ origin: "http://127.0.0.1:5174", onUploaded: async () => {} });
  const intent = {
    id: crypto.randomUUID(),
    bucket: "uploads",
    size: 10 * 1024 * 1024,
    contentType: "application/octet-stream",
    sha256: "0".repeat(64),
  };
  try {
    await storage.signUpload(intent, 60);
    for (let index = 0; index < 5; index += 1) await storage.signUpload({ ...intent, id: crypto.randomUUID() }, 60);
    const next = { ...intent, id: crypto.randomUUID() };
    await assert.rejects(storage.signUpload(next, 60), /capacity/);
    await assert.rejects(storage.signUpload({ ...intent, bucket: "changed" }, 60));
    await storage.remove(intent, "pending");
    await storage.signUpload(next, 60);
  } finally {
    await storage.close();
  }
  await assert.rejects(storage.signUpload(intent, 60), /stopped/);
});
