import * as v from "valibot";
import { createNeonObjectStorage } from "./storage";
import type { NeonObjectStorageOptions } from "./storage";

/** Neon injects storage credentials for the deployed branch. Read them only when the runtime connects. */
export function createNeonStorageBackend(input: Pick<NeonObjectStorageOptions, "projectId" | "branchId">) {
  const target = Object.freeze(
    v.parse(
      v.strictObject({
        projectId: v.pipe(v.string(), v.minLength(1), v.maxLength(256)),
        branchId: v.pipe(v.string(), v.regex(/^br-[a-z0-9-]+$/)),
      }),
      input,
    ),
  );
  return Object.freeze({
    ...target,
    connect() {
      try {
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
        const endpoint = process.env.AWS_ENDPOINT_URL_S3;
        const region = process.env.AWS_REGION;
        if (!accessKeyId || !secretAccessKey || !endpoint || !region) throw new Error("Storage environment missing");
        return createNeonObjectStorage({ ...target, endpoint, region, credentials: { accessKeyId, secretAccessKey } });
      } catch {
        throw new Error("Storage environment unavailable");
      }
    },
  });
}
