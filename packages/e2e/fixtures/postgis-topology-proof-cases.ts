import type {
  ExtensionProofCase,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { postgisTopologyAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/postgis-topology";

export const postgisTopologyProofFamily = {
  extension: "postgis_topology",
  version: "3.6.4",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "a935414ebe37f352b234da7634c9c3be407c13921a574dcef16ddbd52d9e922d",
} as const satisfies ExtensionProofFamily;
const nativeFile = "packages/e2e/integration/extensions-postgis-topology.test.ts";
const make = (
  id: string,
  title: string,
  gate: ExtensionProofCase["gate"],
  file: string,
  claims: ExtensionProofCase["claims"] = [],
): ExtensionProofCase => ({ id, title, gate, file, families: [postgisTopologyProofFamily], claims });
export const postgisTopologyOrdinaryProofCase = make(
  "postgis-topology.native-query",
  "postgis topology exact query overloads, casts and native graph metadata",
  "database",
  nativeFile,
  postgisTopologyAnnotations
    .filter((row) => row.disposition === "query")
    .map((row) => ({
      family: postgisTopologyProofFamily,
      member: row.id,
      scenario: "native-null-oracle-and-graph-reads",
    })),
);
export const postgisTopologySchemaProofCase = make(
  "postgis-topology.native-schema",
  "postgis topology fourteen stored types, array bounds, NULLs and native domain constraints",
  "database",
  nativeFile,
  postgisTopologyAnnotations
    .filter((row) => row.disposition === "schema")
    .map((row) => ({ family: postgisTopologyProofFamily, member: row.id, scenario: "native-stored-type-roundtrip" })),
);
export const postgisTopologyOperatorProofCase = make(
  "postgis-topology.native-operator",
  "postgis topology closed operator routines match native NULL outcomes and edit native graphs",
  "database",
  nativeFile,
  postgisTopologyAnnotations
    .filter((row) => row.disposition === "tooling")
    .map((row) => ({
      family: postgisTopologyProofFamily,
      member: row.id,
      scenario: "native-null-outcome-and-transaction-owner",
    })),
);
export const postgisTopologyPopulatedOperatorProofCase = make(
  "postgis-topology.native-populated-operator",
  "postgis topology all fifty-six operator overloads match populated native graph outcomes",
  "database",
  nativeFile,
  postgisTopologyAnnotations
    .filter((row) => row.disposition === "tooling")
    .map((row) => ({ family: postgisTopologyProofFamily, member: row.id, scenario: "populated-native-graph-oracle" })),
);
export const postgisTopologyGenerationProofCase = make(
  "postgis-topology.generation",
  "postgis topology real first load and disk generation retain exact dependency bindings",
  "generation",
  "packages/e2e/integration/extensions-postgis-topology-generated.test.ts",
);
export const postgisTopologyConsumerProofCase = make(
  "postgis-topology.consumer",
  "postgis topology isolated packed consumer compiles and runs native APIs on Node 24",
  "consumer",
  "packages/e2e/integration/packed-postgis-topology.test.ts",
);
/** Candidate cases only. Registration and local execution confer no provider or five-gate acceptance. */
export const postgisTopologyProofCases = [
  postgisTopologyOrdinaryProofCase,
  postgisTopologySchemaProofCase,
  postgisTopologyOperatorProofCase,
  postgisTopologyPopulatedOperatorProofCase,
  postgisTopologyGenerationProofCase,
  postgisTopologyConsumerProofCase,
];
