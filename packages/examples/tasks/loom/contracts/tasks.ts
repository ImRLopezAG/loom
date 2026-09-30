import { defineContract, oc, eventIterator, searchErrors } from "loom/contract";
import { taskSearchPolicy } from "../search";
import * as v from "valibot";
const base = oc.errors({ UNAUTHORIZED: {}, FORBIDDEN: {} });
export default defineContract(({ validators }) => {
  const search = validators.tables.tasks.search(taskSearchPolicy);
  const live = validators.tables.tasks.liveSearch(taskSearchPolicy);
  const searchBase = base.errors(searchErrors);
  const task = v.strictObject({
    _id: validators.id("tasks"),
    projectId: validators.id("projects"),
    title: v.string(),
    done: v.boolean(),
  });
  return {
    search: searchBase.input(search.input).output(search.output),
    watchSearch: searchBase.input(live.input).output(live.output),
    list: base.input(v.strictObject({ projectId: validators.id("projects") })).output(eventIterator(v.array(task))),
    create: base.input(validators.tables.tasks.insert).output(task),
    setDone: base.input(v.strictObject({ id: validators.id("tasks"), done: v.boolean() })).output(task),
  };
});
