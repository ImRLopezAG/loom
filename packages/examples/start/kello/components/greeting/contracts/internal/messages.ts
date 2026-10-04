import { defineContract, oc } from "../../_generated/contract";
import * as v from "valibot";
export default defineContract({
  format: oc
    .input(v.object({ name: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(80)) }))
    .output(v.string()),
});
