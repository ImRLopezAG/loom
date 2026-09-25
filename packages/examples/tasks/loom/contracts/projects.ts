import { defineContract, oc, eventIterator } from "@loom/core/contract";
import * as v from "valibot";
const base = oc.errors({ UNAUTHORIZED: {}, FORBIDDEN: {} });
export default defineContract(({ validators }) => {
  const project = v.strictObject({ _id: validators.id("projects"), name: v.string() });
  return {
    list: base.input(v.strictObject({})).output(eventIterator(v.array(project))),
    create: base.input(validators.tables.projects.insert).output(project),
  };
});
