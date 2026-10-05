const digest = "56a138e83f06ff23344a428d6486237eb9c875db35df970ceb4bcb60240a4041";

/** Family-owned emitter. Shared codegen stays unwired until the parent accepts the native safety report. */
export function pgHashidsIsolatedBindingsSource(adapterSpecifier: string, schema: string): string {
  return `import { createPgHashids_1_2_1 } from ${JSON.stringify(adapterSpecifier)};
export const selection = { pg_hashids: { version: "1.2.1", schema: ${JSON.stringify(schema)} } } as const;
export const extensions = Object.freeze({
  pg_hashids: createPgHashids_1_2_1({
    name: "pg_hashids",
    version: "1.2.1",
    schema: ${JSON.stringify(schema)},
    apiSupport: { status: "verified", digest: ${JSON.stringify(digest)} },
  }),
});
`;
}
