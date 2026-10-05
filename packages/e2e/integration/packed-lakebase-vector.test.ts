import { extensionProofTest } from "../fixtures/extension-proof";
import { lakebaseVectorConsumerProofCase } from "../fixtures/lakebase-vector-proof-cases";
import { runLakebaseVectorPreparedGeneration } from "../fixtures/lakebase-vector-prepared-gates";

extensionProofTest(lakebaseVectorConsumerProofCase, () => runLakebaseVectorPreparedGeneration(true), 600000);
