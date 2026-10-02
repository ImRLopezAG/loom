/** Installation facts carried into application bundles. SQL contracts stay in tooling. */
export interface ExtensionSelectionEntry {
  readonly version: string;
  readonly schema: string;
}
export type ExtensionSelection = Readonly<Record<string, ExtensionSelectionEntry | undefined>> | undefined;
export interface ExtensionApiSupport {
  readonly status: "verified" | "unverified";
  readonly digest?: string;
  readonly reason?: string;
}
export interface ExtensionDescriptor<
  Name extends string = string,
  Entry extends ExtensionSelectionEntry = ExtensionSelectionEntry,
> {
  readonly name: Name;
  readonly version: Entry["version"];
  readonly schema: Entry["schema"];
  readonly apiSupport: ExtensionApiSupport;
}
type ExtensionSchema<Entry> = "schema" extends keyof Entry
  ? Extract<Entry["schema"], string> | (undefined extends Entry["schema"] ? "extensions" : never)
  : "extensions";
type NormalizedExtensionEntry<Entry> =
  NonNullable<Entry> extends { readonly version: infer Version extends string }
    ? { readonly version: Version; readonly schema: ExtensionSchema<NonNullable<Entry>> }
    : never;
type PresentExtensionSelection<Selection> = {
  readonly [Name in keyof Selection as undefined extends Selection[Name] ? never : Name]: NormalizedExtensionEntry<
    Selection[Name]
  >;
} & {
  readonly [
    Name in keyof Selection as NonNullable<Selection[Name]> extends never
      ? never
      : undefined extends Selection[Name]
        ? Name
        : never
  ]?: NormalizedExtensionEntry<Selection[Name]>;
};
export type NormalizeExtensionSelection<Selection> = Selection extends undefined
  ? undefined
  : keyof PresentExtensionSelection<Selection> extends never
    ? undefined
    : {} extends PresentExtensionSelection<Selection>
      ? PresentExtensionSelection<Selection> | undefined
      : PresentExtensionSelection<Selection>;
export type ExtensionBindings<Selection extends ExtensionSelection = undefined> =
  NormalizeExtensionSelection<Selection> extends infer Normalized
    ? Normalized extends ExtensionSelection
      ? Normalized extends Readonly<Record<string, ExtensionSelectionEntry | undefined>>
        ? {
            readonly [Name in keyof Normalized]: ExtensionDescriptor<
              Extract<Name, string>,
              NonNullable<Normalized[Name]>
            >;
          }
        : undefined
      : never
    : never;
/** Configured bindings must be supplied; legacy undefined bindings may be omitted. */
export type ExtensionArguments<Extensions extends object | undefined> = [Extensions] extends [undefined]
  ? [extensions?: Extensions]
  : [extensions: Extensions];
export type ExtensionOptions<Extensions extends object | undefined> = [Extensions] extends [undefined]
  ? { readonly extensions?: Extensions }
  : { readonly extensions: Extensions };

/** The adapter seam adds verified, direct helpers without exposing a registry or database pool. */
export function bindExtension<const Descriptor extends ExtensionDescriptor, const Adapter extends object>(
  descriptor: Descriptor,
  adapter: Adapter,
): Readonly<Descriptor & Adapter> {
  return Object.freeze({ ...adapter, ...descriptor });
}

export function createExtensionBindings<
  const Selection extends
    | Readonly<Record<string, { readonly version: string; readonly schema?: string } | undefined>>
    | undefined,
>(
  selection: Selection,
  support: Readonly<Record<string, ExtensionApiSupport>> = {},
): ExtensionBindings<NormalizeExtensionSelection<Selection>> {
  if (!selection || !Object.values(selection).some((entry) => entry !== undefined)) {
    // SAFETY: absent and empty selections have the conditional undefined contract.
    return undefined as ExtensionBindings<NormalizeExtensionSelection<Selection>>;
  }
  const bindings = Object.fromEntries(
    Object.entries(selection).flatMap(([name, entry]) =>
      entry
        ? [
            [
              name,
              Object.freeze({
                name,
                version: entry.version,
                schema: entry.schema ?? "extensions",
                apiSupport: Object.freeze(
                  support[name] ?? {
                    status: "unverified",
                    reason: "No verified API adapter for the configured extension version and provider",
                  },
                ),
              }),
            ],
          ]
        : [],
    ),
  );
  // SAFETY: entries preserve exactly the selected keys, versions, and normalized schemas.
  return Object.freeze(bindings) as ExtensionBindings<NormalizeExtensionSelection<Selection>>;
}

/** Components require supported versions, and inherit their installation namespace from the host. */
export type ExtensionRequirements = Readonly<Record<string, { readonly versions: readonly string[] }>>;
export function resolveComponentExtensions(
  host: ExtensionSelection,
  requirements: ExtensionRequirements | undefined,
): ExtensionSelection {
  if (!requirements || !Object.keys(requirements).length) return undefined;
  const selected: Record<string, ExtensionSelectionEntry> = {};
  for (const [name, requirement] of Object.entries(requirements)) {
    const entry = host?.[name];
    if (!entry) throw new Error(`Missing component extension requirement: ${name}`);
    if (!requirement.versions.includes(entry.version))
      throw new Error(
        `Incompatible component extension requirement: ${name} ${entry.version}; supported versions: ${requirement.versions.join(", ")}`,
      );
    selected[name] = entry;
  }
  return Object.freeze(selected);
}
