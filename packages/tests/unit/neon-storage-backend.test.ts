import { expect, test, vi } from "vite-plus/test";
import { createNeonStorageBackend } from "@loom/core/neon";

const environment = {
  AWS_ACCESS_KEY_ID: "fixture-access",
  AWS_SECRET_ACCESS_KEY: "fixture-secret",
  AWS_ENDPOINT_URL_S3: "https://br-preview.storage.c-1.us-east-2.aws.neon.tech",
  AWS_REGION: "us-east-2",
};
const intent = {
  id: "01953492-851b-7000-8000-000000000001",
  bucket: "uploads",
  size: 1,
  contentType: "text/plain",
  sha256: "a".repeat(64),
};

test("explicit storage connections capture credentials and create independently owned adapters", async () => {
  const connection = {
    endpoint: environment.AWS_ENDPOINT_URL_S3,
    region: environment.AWS_REGION,
    credentials: { accessKeyId: "captured-access", secretAccessKey: "captured-secret" },
  };
  const target = { projectId: "project", branchId: "br-preview" };
  const backend = createNeonStorageBackend(target, connection);
  connection.credentials.accessKeyId = "mutated-access";
  connection.endpoint = "https://example.test";
  target.branchId = "br-other";
  const first = backend.connect();
  const second = backend.connect();
  try {
    first.close();
    const signed = new URL((await second.signUpload(intent, 30)).url);
    expect(signed.hostname).toBe("br-preview.storage.c-1.us-east-2.aws.neon.tech");
    expect(signed.searchParams.get("X-Amz-Credential")).toContain("captured-access/");
    expect(() => createNeonStorageBackend(target, connection)).toThrow("Storage endpoint");
    expect(() =>
      createNeonStorageBackend(target, { ...connection, credentials: { accessKeyId: "", secretAccessKey: "secret" } }),
    ).toThrow("Invalid storage configuration");
  } finally {
    first.close();
    second.close();
  }
});

test("Neon storage backend reads injected credentials at connection time and captures each connection", async () => {
  for (const name of Object.keys(environment)) vi.stubEnv(name, undefined);
  const target = { projectId: "project", branchId: "br-preview" };
  const backend = createNeonStorageBackend(target);
  target.branchId = "br-other";
  try {
    expect(() => backend.connect()).toThrow("Storage environment unavailable");
    for (const [name, value] of Object.entries(environment)) vi.stubEnv(name, value);
    const first = backend.connect();
    vi.stubEnv("AWS_ACCESS_KEY_ID", "rotated-access");
    const second = backend.connect();
    try {
      expect(first.target).toEqual({ projectId: "project", branchId: "br-preview" });
      const signed = new URL((await first.signUpload(intent, 30)).url);
      expect(signed.hostname).toBe("br-preview.storage.c-1.us-east-2.aws.neon.tech");
      expect(signed.searchParams.get("X-Amz-Credential")).toContain("fixture-access/");
      expect(new URL((await second.signUpload(intent, 30)).url).searchParams.get("X-Amz-Credential")).toContain(
        "rotated-access/",
      );
    } finally {
      first.close();
      second.close();
    }
    for (const [name, value] of Object.entries(environment)) {
      vi.stubEnv(name, undefined);
      expect(() => backend.connect()).toThrow("Storage environment unavailable");
      vi.stubEnv(name, value);
    }
    vi.stubEnv("AWS_ENDPOINT_URL_S3", "https://br-other.storage.c-1.us-east-2.aws.neon.tech");
    expect(() => backend.connect()).toThrow("Storage environment unavailable");
    vi.stubEnv("AWS_ENDPOINT_URL_S3", "https://secret:password@example.test/");
    expect(() => backend.connect()).toThrow("Storage environment unavailable");
  } finally {
    vi.unstubAllEnvs();
  }
});
