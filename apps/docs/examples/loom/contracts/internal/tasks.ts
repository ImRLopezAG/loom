import { defineContract, oc } from "loom/contract";
import * as v from "valibot";

export default defineContract({
  create: oc
    .input(
      v.strictObject({
        title: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(200)),
        ownerId: v.string(),
        ownerIssuer: v.string(),
      }),
    )
    .output(v.null()),
});
