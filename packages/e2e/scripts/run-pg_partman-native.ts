import { writeFile } from "node:fs/promises";
import { characterizePgPartman } from "../fixtures/pg_partman-native";
const url = process.env.PG_PARTMAN_LOCAL_URL;
if (!url) throw new Error("PG_PARTMAN_LOCAL_URL must identify the owned local PostgreSQL 18 UUID fixture");
const receipt = await characterizePgPartman(url, process.env.PG_PARTMAN_SOURCE_ROOT);
await writeFile(
  new URL("../fixtures/pg_partman-native-characterization.json", import.meta.url),
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(`native characterized ${receipt.records.length} routines`);
