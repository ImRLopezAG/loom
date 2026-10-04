import { defineContract, oc } from "../_generated/contract";
import { z } from "zod";
export default defineContract({
  create: oc.input(z.object({ name: z.string().trim().min(1).max(80) })).output(z.string()),
});
