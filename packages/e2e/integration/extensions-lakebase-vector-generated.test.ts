import { extensionProofTest } from "../fixtures/extension-proof";
import { lakebaseVectorGenerationProofCase } from "../fixtures/lakebase-vector-proof-cases";
import { runLakebaseVectorPreparedGeneration } from "../fixtures/lakebase-vector-prepared-gates";

extensionProofTest(lakebaseVectorGenerationProofCase, () => runLakebaseVectorPreparedGeneration(false), 240000);
