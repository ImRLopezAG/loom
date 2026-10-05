import { jsonbCodec, jsonbDocument, type JsonbDocument } from "../native-json-codecs";

export { jsonbDocument, jsonbValue } from "../native-json-codecs";
export type { JsonbDocument } from "../native-json-codecs";

/**
 * pg_graphql 1.5.12 resolve/comment_directive values are PostgreSQL jsonb.
 * Text projection keeps GraphQL BigInt/numeric JSON strings intact; this is not a JS GraphQL parser.
 */
export const graphqlJsonbCodec = jsonbCodec;
export const graphqlVariablesCodec = jsonbCodec;
export const graphqlResponseCodec = jsonbCodec;

export function graphqlJsonbDocument(text: string): JsonbDocument {
  return jsonbDocument(text);
}
