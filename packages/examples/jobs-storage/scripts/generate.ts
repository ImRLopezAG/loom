import { fileURLToPath } from "node:url";
import { generateProject } from "@loom/tooling";

await generateProject(fileURLToPath(new URL("../", import.meta.url)));
