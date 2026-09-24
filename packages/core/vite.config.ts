import { defineConfig } from "vite-plus";

export default defineConfig({
  pack: {
    outExtensions: () => ({ js: ".js", dts: ".d.ts" }),
    report: false,
    entry: [
      "src/server/index.ts",
      "src/client/index.ts",
      "src/query/index.ts",
      "src/react/index.ts",
      "src/adapters/neon/index.ts",
    ],
    root: "src",
    unbundle: true,
    format: "esm",
    platform: "node",
    target: "es2023",
    dts: true,
    sourcemap: true,
    deps: {
      neverBundle: true,
    },
  },
});
