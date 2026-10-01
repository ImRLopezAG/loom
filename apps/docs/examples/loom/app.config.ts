import { defineApplication } from "loom/server";
import health from "./components/health/setup";

const app = defineApplication({ rpc: ({ os }) => ({ os }) });
app.use(health);
export default app;
