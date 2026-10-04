import { chmod, mkdir, writeFile } from "node:fs/promises";

const directory = new URL("../bin/", import.meta.url);
const launcher = new URL("kello.js", directory);
await mkdir(directory, { recursive: true });
await writeFile(
  launcher,
  '#!/usr/bin/env bun\nimport { runCli } from "../dist/cli.js";\n\nprocess.exitCode = await runCli(process.argv.slice(2));\n',
);
await chmod(launcher, 0o755);
