import * as v from "valibot";
import {
  createProjectProcedures,
  defineSchema,
  procedureObjectCreated,
  storageObjectCreatedValidator,
} from "@loom/core/server";

const { procedure } = createProjectProcedures(defineSchema(() => ({})));
const created = procedure.input(storageObjectCreatedValidator).handler(() => null);
const extra = procedure
  .input(v.object({ ...storageObjectCreatedValidator.entries, required: v.string() }))
  .handler(() => null);
procedureObjectCreated(created);
// @ts-expect-error storage events cannot supply handler-specific required arguments
procedureObjectCreated(extra);
// Visibility belongs to the generated graph; rpc-capabilities.test.ts verifies public targets are rejected at compilation.
