import { extensionProofTest } from "../fixtures/extension-proof";
import { lakebaseTextConsumerProofCase } from "../fixtures/lakebase-text-proof-cases";
import { runLakebaseTextPreparedGeneration } from "./extensions-lakebase-text-generated.test";

extensionProofTest(
  lakebaseTextConsumerProofCase,
  async () => {
    await runLakebaseTextPreparedGeneration(true);
  },
  360000,
);
