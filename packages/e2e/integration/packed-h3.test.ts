import { extensionProofTest } from "../fixtures/extension-proof";
import { h3ConsumerProofCase } from "../fixtures/h3-proof-cases";
import { runH3PreparedConsumer } from "../fixtures/h3-prepared-consumer";

extensionProofTest(h3ConsumerProofCase, runH3PreparedConsumer, 360000);
