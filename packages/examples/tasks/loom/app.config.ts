import titles from "./components/titles/setup";
import { defineApplication } from "loom/server";
import * as v from "valibot";
const app = defineApplication({
  env: { APP_ORIGINS: v.optional(v.string(), "http://localhost:5173") },
  rpc: ({ os }) => ({ os }),
});

app.use(titles);
export default app;
