import { defineContract, oc } from "../../_generated/contract";
import * as v from "valibot";
export default defineContract({
  normalize: oc.input(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(200))).output(v.string()),
});
