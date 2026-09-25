import { expect, test } from "vite-plus/test";
import {
  defineProcedureStorage,
  isProcedureStorage,
  procedureObjectCreated,
  createProjectProcedures,
  defineSchema,
  storageObjectCreatedValidator,
} from "@loom/core/server";

test("storage declarations capture bucket handlers and policy while defaulting to denial", async () => {
  const { procedure } = createProjectProcedures(defineSchema(() => ({})));
  const reference = procedure.input(storageObjectCreatedValidator).handler(() => null);
  const buckets = { uploads: { onObjectCreated: procedureObjectCreated(reference) } };
  const options = { buckets, authorize: () => {} };
  const declared = defineProcedureStorage(options);
  options.authorize = () => {
    throw new Error("changed");
  };
  buckets.uploads.onObjectCreated = procedureObjectCreated(
    procedure.input(storageObjectCreatedValidator).handler(() => null),
  );
  expect(declared.buckets.uploads?.onObjectCreated?.procedure).toBe(reference);
  expect(Object.isFrozen(declared.buckets.uploads?.onObjectCreated)).toBe(true);
  expect(isProcedureStorage(declared)).toBe(true);
  expect(isProcedureStorage({ ...declared })).toBe(false);
  const context = {
    identity: { issuer: "issuer", subject: "alice" },
    operation: "upload" as const,
    upload: { bucket: "uploads", size: 1, contentType: "text/plain", sha256: "a".repeat(64) },
    signal: new AbortController().signal,
  };
  await declared.authorize(context);
  await expect(defineProcedureStorage({ buckets: { uploads: {} } }).authorize(context)).rejects.toThrow(
    "Storage access denied",
  );
  expect(() => defineProcedureStorage({ buckets: { "../bad": {} } })).toThrow();
});
