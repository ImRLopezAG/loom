import { defineContract, oc } from "@loom/core/contract";
import { storageObjectCreatedValidator } from "@loom/core/server";
import * as v from "valibot";
import { intentArgs } from "../../validation";
const base = oc.errors({ FORBIDDEN: {}, UNAUTHORIZED: {} });
export default defineContract({
  created: base.input(storageObjectCreatedValidator).output(v.null()),
  process: base.input(intentArgs).output(v.null()),
});
