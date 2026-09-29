import { defineContract, oc } from "loom/contract";
import * as v from "valibot";

export default defineContract(({ validators }) => ({
  createTaskLater: oc
    .errors({ UNAUTHORIZED: {} })
    .input(validators.tables.tasks.command)
    .output(v.strictObject({ jobId: v.string() })),
}));
