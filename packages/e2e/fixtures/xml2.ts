export const xml2Digest = "0353f94ca9d2e1f73f4a490e2a210a6412e88dd516028b44e9b81a59ff3fb03c";
export const xml2Descriptor = {
  name: "xml2",
  version: "1.2",
  schema: 'xml"2',
  apiSupport: { status: "verified", digest: xml2Digest },
} as const;
export const xml2Install = `CREATE SCHEMA "xml""2"; CREATE EXTENSION xml2 WITH SCHEMA "xml""2" VERSION '1.2'`;
