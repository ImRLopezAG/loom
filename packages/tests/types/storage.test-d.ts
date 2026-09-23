import type { FunctionReference } from "@loom/core/client";
import { onObjectCreated } from "@loom/core/server";
import type { StorageObjectCreatedEvent } from "@loom/core/server";

declare const created: FunctionReference<"mutation", "internal", StorageObjectCreatedEvent, null>;
declare const extra: FunctionReference<"mutation", "internal", StorageObjectCreatedEvent & { required: string }, null>;
declare const publicHandler: FunctionReference<"mutation", "public", StorageObjectCreatedEvent, null>;
onObjectCreated(created);
// @ts-expect-error storage events cannot supply handler-specific required arguments
onObjectCreated(extra);
// @ts-expect-error provider events may invoke only internal handlers
onObjectCreated(publicHandler);
