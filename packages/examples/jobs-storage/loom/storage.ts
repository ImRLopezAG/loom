import { defineStorage, onObjectCreated, StorageIntentError, maximumUploadBytes } from "@loom/core/server";
import { internal } from "./_generated/internal";

const handler = onObjectCreated(internal["files:created"], { maxAttempts: 3 });
export default defineStorage({
  buckets: {
    uploads: { onObjectCreated: handler },
    "retry-demo": { onObjectCreated: handler },
    "failure-demo": { onObjectCreated: handler },
  },
  authorize: ({ identity, upload }) => {
    if (!identity || upload.size > maximumUploadBytes) throw new StorageIntentError("FORBIDDEN");
  },
});
