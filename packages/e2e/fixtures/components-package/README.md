# Compiled component package fixtures

`packed-components.test.ts` builds these fixtures with the pinned Vite+ packer,
packs only `dist`, and installs the tarballs outside the workspace. The consumer
uses a local `components/store.setup.ts` re-export and explicit `app.use(store)`.
It never writes generated files into an installed package.

The initial package format is `defineComponentPackage(definition, descriptor)`.
The descriptor lists published ESM entry points, logical contract/procedure
paths, and the generated facade entry points that the consumer must rebind per
mount. `formatVersion` identifies the Kello descriptor format;
`definitionVersion` identifies the package definition release. Every descriptor
entry belongs to the same package. A mounted transitive dependency supplies its
own descriptor and is resolved from its parent's installed package.

Package authors generate local component bindings before building. Use
`vp pack` with `unbundle: true`, declarations enabled, and public exports for the
listed entries. This preserves generated facade modules so Kello can replace
schema/RPC bindings separately for each mounted instance. Bundling those facades
into a procedure captures its original schema and is not a supported package
build. The descriptor is a small explicit build manifest in this first version;
there is no automatic manifest-generation command.

`stateful` exercises a schema, contract, native RPC handler, package self-reference,
and a transitive SDK component. `sdk` preserves the native service object and has
an unlisted private helper to test complete published-artifact hashing. Generated
declarations remain local module declarations; packages do not augment global
application registration. SDK/provider credentials are not included.
