import {
  defineProcedureStorage,
  procedureObjectCreated,
  StorageIntentError,
  maximumUploadBytes,
} from "@loom/core/server";
import files from "./internal/files";

const handler = procedureObjectCreated(files.created, { maxAttempts: 3 });
export default defineProcedureStorage({
  buckets: {
    uploads: { onObjectCreated: handler },
    "retry-demo": { onObjectCreated: handler },
    "failure-demo": { onObjectCreated: handler },
  },
  authorize: ({ identity, upload }) => {
    if (!identity || upload.size > maximumUploadBytes) throw new StorageIntentError("FORBIDDEN");
  },
});
