import { defineContract, oc } from "loom/contract";
import * as v from "valibot";

export default defineContract({
  tasks: oc.errors({ UNAUTHORIZED: {} }).output(v.number()),
});
