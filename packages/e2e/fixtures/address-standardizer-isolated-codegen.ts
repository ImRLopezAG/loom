import { ADDRESS_STANDARDIZER_DIGEST } from "./address-standardizer-proof-cases";

/** Family-owned emitter matching the public generator shape. Shared export install remains parent-owned. */
export function addressStandardizerIsolatedBindingsSource(adapterSpecifier: string, schema: string): string {
  return `import { createAddressStandardizer_3_6_4 } from ${JSON.stringify(adapterSpecifier)};
export const selection = { address_standardizer: { version: "3.6.4", schema: ${JSON.stringify(schema)} } } as const;
export const extensions = Object.freeze({
  address_standardizer: createAddressStandardizer_3_6_4({
    name: "address_standardizer",
    version: "3.6.4",
    schema: ${JSON.stringify(schema)},
    apiSupport: { status: "verified", digest: ${JSON.stringify(ADDRESS_STANDARDIZER_DIGEST)} },
  }),
});
`;
}
