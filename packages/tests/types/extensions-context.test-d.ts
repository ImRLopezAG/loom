import { defineConfig, type KelloConfigInput } from "kello/tooling";
import {
  createExtensionBindings,
  createProjectContext,
  createProjectProcedures,
  createProjectServices,
  createDatabaseMiddleware,
  defineSchema,
  componentDefinitionFor,
} from "kello/server";
import { defineRelations } from "drizzle-orm";
import { Effect } from "effect";
import type { ProjectService } from "kello/server";
import { oc } from "kello/contract";
import * as v from "valibot";

const absent = defineConfig({});
const absentDatabase = defineConfig({ database: { namespace: "example" } });
const empty = defineConfig({ database: { extensions: {} } });
const absentSelection: undefined = absent.database.extensions;
const absentDatabaseSelection: undefined = absentDatabase.database.extensions;
const emptySelection: undefined = empty.database.extensions;
const explicitEmptyBinding: undefined = createExtensionBindings({});
const undefinedEntryBinding: undefined = createExtensionBindings({ pg_trgm: undefined });
const undefinedEntryConfig: undefined = defineConfig({ database: { extensions: { pg_trgm: undefined } } }).database
  .extensions;
const emptyBinding: undefined = createExtensionBindings(empty.database.extensions);
const selectedConfig = defineConfig({ database: { extensions: { pg_trgm: { version: "unverified" } } } });
const version: "unverified" = selectedConfig.database.extensions.pg_trgm.version;
const placement: "extensions" = selectedConfig.database.extensions.pg_trgm.schema;
// @ts-expect-error Config literals contain only selected keys.
void selectedConfig.database.extensions.vector;
const selected = createExtensionBindings(selectedConfig.database.extensions);
const schema = defineSchema(() => ({}));
const relations = defineRelations(schema.tables);
// @ts-expect-error A selected generic requires its runtime binding.
createProjectContext<typeof schema, typeof relations, typeof selected>(schema, relations);
// @ts-expect-error A selected native procedure generic requires its runtime binding.
createProjectProcedures<typeof schema, typeof relations, typeof selected>(schema, relations);
// @ts-expect-error A selected database middleware generic requires its runtime binding.
createDatabaseMiddleware<typeof relations, typeof schema, typeof selected>(relations, "read", schema);
const context = createProjectContext(schema, relations, selected);
const descriptorVersion: "unverified" = context.extensions.pg_trgm.version;
// @ts-expect-error Unconfigured extension keys cannot appear in context.
void context.extensions.vector;
// @ts-expect-error Unverified versions expose descriptors without invented SQL helpers.
void context.extensions.pg_trgm.similarity;
const noExtensions: undefined = createProjectContext(schema, relations).extensions;
createProjectProcedures(schema, relations, selected).procedure.handler(({ context }) => {
  const version: "unverified" = context.extensions.pg_trgm.version;
  // @ts-expect-error Configured native RPC context rejects undeclared keys.
  void context.extensions.vector;
  return version;
});
createProjectProcedures(schema).procedure.handler(({ context }) => {
  const extensions: undefined = context.extensions;
  return extensions;
});
// @ts-expect-error Selected services require their owning schema for matching runtime identities.
createProjectServices<typeof schema, typeof relations, typeof selected>();
const services = createProjectServices<typeof schema, typeof relations, typeof selected>(schema);
const extensionsEffect: Effect.Effect<
  typeof selected,
  never,
  ProjectService<"kello/Extensions", typeof selected>
> = services.Extensions;
// @ts-expect-error Database service cannot fulfill Extensions even for an empty schema.
const wrongEffect: typeof extensionsEffect = services.Database;
// @ts-expect-error Extensions cannot fulfill another project's different selected binding contract.
const wrongSelection: Effect.Effect<{ readonly vector: object }, never, unknown> = services.Extensions;
const contract = { describe: oc.output(v.string()) };
const defineComponent = componentDefinitionFor<{
  readonly schema: typeof schema;
  readonly relations: typeof relations;
  readonly contract: typeof contract;
  readonly components: {};
  readonly extensions: typeof selected;
}>();
const component = defineComponent({
  name: "selected",
  extensions: { pg_trgm: { versions: ["unverified"] } },
  rpc: ({ os }) => ({
    os: os.use(({ context, next }) => {
      const version: "unverified" = context.extensions.pg_trgm.version;
      // @ts-expect-error Components receive only their declared selected subset.
      void context.extensions.vector;
      return next({ context: { version } });
    }),
  }),
});
function optionalInput(input: { database: { extensions: { pg_trgm?: { version: string; schema?: "custom" } } } }) {
  const config = defineConfig(input);
  const selected = createExtensionBindings(config.database.extensions);
  // @ts-expect-error An optional declaration can normalize to undefined.
  const alwaysPresent: object = selected;
  const schema: "custom" | "extensions" | undefined = selected?.pg_trgm?.schema;
  return [schema, alwaysPresent];
}
function broadConfig(input: KelloConfigInput) {
  const selection = defineConfig(input).database.extensions;
  // @ts-expect-error Broad operational input can contain configured extensions.
  const absent: undefined = selection;
  return absent;
}
function optionalDatabase(input: { database?: { extensions: { pg_trgm: { version: "1.6" } } } }) {
  const selection = defineConfig(input).database.extensions;
  const version: "1.6" | undefined = selection?.pg_trgm.version;
  // @ts-expect-error An omitted database yields no selected extensions.
  const alwaysPresent: object = selection;
  // @ts-expect-error Optional database retains exact selected keys.
  void selection?.vector;
  return [version, alwaysPresent];
}
function unionDatabase(input: {} | { database: { extensions: { pg_trgm: { version: "1.6" } } } }) {
  const selection = defineConfig(input).database.extensions;
  const version: "1.6" | undefined = selection?.pg_trgm.version;
  // @ts-expect-error The empty member yields undefined.
  const alwaysPresent: object = selection;
  // @ts-expect-error Union members retain exact selected keys.
  void selection?.vector;
  return [version, alwaysPresent];
}
void [optionalDatabase, unionDatabase];
function possibleEntry(entry: { version: "1.6" } | undefined) {
  const selection = createExtensionBindings({ pg_trgm: entry });
  // @ts-expect-error A required property may still contain an absent declaration.
  const alwaysPresent: object = selection;
  const version: "1.6" | undefined = selection?.pg_trgm?.version;
  const withRequired = createExtensionBindings({ pg_trgm: entry, vector: { version: "0.8.2" } });
  const vectorVersion: "0.8.2" = withRequired.vector.version;
  // @ts-expect-error A definitely selected sibling does not make the optional entry present.
  const trgmVersion: "1.6" = withRequired.pg_trgm.version;
  return [alwaysPresent, version, vectorVersion, trgmVersion];
}
function optionalPlacement(entry: { version: "1.6"; schema?: "custom" }) {
  const selected = createExtensionBindings({ pg_trgm: entry });
  // @ts-expect-error Omitted placement still defaults to extensions.
  const customOnly: "custom" = selected.pg_trgm.schema;
  return customOnly;
}
void optionalPlacement;
void possibleEntry;
const broadInput: KelloConfigInput = { database: { extensions: { pg_trgm: { version: "1.6" } } } };
defineConfig(broadInput);
const fixed = defineConfig({ database: { extensions: { pg_cron: { version: "1.6", schema: "pg_catalog" } } } });
const fixedVersion: "1.6" = fixed.database.extensions.pg_cron.version;
const fixedSchema: "pg_catalog" = fixed.database.extensions.pg_cron.schema;
void [
  optionalInput,
  broadConfig,
  explicitEmptyBinding,
  undefinedEntryBinding,
  undefinedEntryConfig,
  absentSelection,
  absentDatabaseSelection,
  emptySelection,
  emptyBinding,
  version,
  placement,
  descriptorVersion,
  noExtensions,
  extensionsEffect,
  wrongEffect,
  wrongSelection,
  component,
  fixedVersion,
  fixedSchema,
];
