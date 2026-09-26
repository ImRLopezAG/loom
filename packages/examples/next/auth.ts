import { createLoomNeonNext } from "loom/next/server";
import { createServerClient } from "./loom/_generated/api";
export const { handler, withSession } = createLoomNeonNext(createServerClient);
