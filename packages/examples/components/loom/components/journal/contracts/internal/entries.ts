import { defineContract, oc } from "../../_generated/contract";
import * as v from "valibot";
export default defineContract({
  insert: oc
    .errors({ UNAUTHORIZED: {}, REJECTED: {} })
    .input(v.object({ text: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(200)) }))
    .output(v.object({ _id: v.pipe(v.string(), v.uuid()), text: v.string() })),
});
