import { generateProject } from "@loom/tooling";
import { fileURLToPath } from "node:url";
await generateProject(fileURLToPath(new URL("../", import.meta.url)));
