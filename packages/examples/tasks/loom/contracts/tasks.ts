import { defineContract, oc, eventIterator } from "@loom/core/contract";
import * as v from "valibot";
const base = oc.errors({ UNAUTHORIZED: {}, FORBIDDEN: {} });
export default defineContract(({ validators }) => {
  const task = v.strictObject({
    _id: validators.id("tasks"),
    projectId: validators.id("projects"),
    title: v.string(),
    done: v.boolean(),
  });
  return {
    list: base.input(v.strictObject({ projectId: validators.id("projects") })).output(eventIterator(v.array(task))),
    create: base.input(validators.tables.tasks.insert).output(task),
    setDone: base.input(v.strictObject({ id: validators.id("tasks"), done: v.boolean() })).output(task),
  };
});
