import * as v from "valibot";
export const intentArgs = v.strictObject({ intentId: v.pipe(v.string(), v.uuid()) });
export const jobStatus = v.strictObject({
  state: v.picklist(["pending", "running", "succeeded", "failed", "cancelled"]),
  attempts: v.number(),
});
