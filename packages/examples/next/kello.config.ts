import { defineConfig } from "kello/tooling";

export default defineConfig({
  database: {
    migrations: "kello/migrations",
    namespace: "next_app",
    metadataNamespace: "loom_next",
  },
});
