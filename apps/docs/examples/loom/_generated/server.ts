// Example of the server bindings written by `loom generate`.
import { createFunctionBuilders } from "@loom/core/server";
import relations from "../relations";
import schema from "../schema";
export const { query, mutation, action, internalQuery, internalMutation, internalAction } = createFunctionBuilders(
  relations,
  schema,
);
