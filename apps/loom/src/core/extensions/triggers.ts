import * as v from "valibot";

const identifier = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => !value.includes("\0") && new TextEncoder().encode(value).length <= 63),
);
const placement = v.strictObject({ schema: identifier, name: identifier });
export const extensionTriggerValidator = v.strictObject({
  kind: v.literal("trigger"),
  extension: v.strictObject({
    name: identifier,
    version: v.string(),
    digest: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)),
  }),
  member: v.string(),
  name: identifier,
  timing: v.picklist(["before", "after"]),
  level: v.literal("row"),
  events: v.pipe(v.array(v.picklist(["insert", "update", "delete"])), v.minLength(1)),
  table: placement,
  function: placement,
  arguments: v.array(
    v.pipe(
      v.string(),
      v.check((value) => !value.includes("\0")),
    ),
  ),
  enabled: v.picklist(["origin", "disabled", "always", "replica"]),
});
export type ExtensionTriggerContract = v.InferOutput<typeof extensionTriggerValidator>;
export interface ExtensionTriggerDeclaration {
  readonly kind: "trigger";
  readonly extension: { readonly name: string; readonly version: string; readonly digest: string };
  readonly member: string;
  readonly name: string;
  readonly timing: "before" | "after";
  readonly level: "row";
  readonly events: readonly ("insert" | "update" | "delete")[];
  readonly table: { readonly schema: string; readonly name: string };
  readonly function: { readonly schema: string; readonly name: string };
  readonly arguments: readonly string[];
}

/** Store logical identities, never author-supplied DDL strings. */
export function extensionTriggerContract(declaration: ExtensionTriggerDeclaration): ExtensionTriggerContract {
  const contract = v.parse(extensionTriggerValidator, {
    kind: declaration.kind,
    extension: { ...declaration.extension },
    member: declaration.member,
    name: declaration.name,
    timing: declaration.timing,
    level: declaration.level,
    events: [...declaration.events],
    table: { ...declaration.table },
    function: { ...declaration.function },
    arguments: [...declaration.arguments],
    enabled: "origin",
  });
  contract.events = ["insert", "update", "delete"].filter((event): event is "insert" | "update" | "delete" =>
    contract.events.some((selected) => selected === event),
  );
  Object.freeze(contract.extension);
  Object.freeze(contract.table);
  Object.freeze(contract.function);
  Object.freeze(contract.events);
  Object.freeze(contract.arguments);
  return Object.freeze(contract);
}
export function extensionTriggerIdentity(trigger: ExtensionTriggerContract): string {
  return JSON.stringify([trigger.table.schema, trigger.table.name, trigger.name]);
}
function quoted(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}
export function dropExtensionTrigger(trigger: ExtensionTriggerContract): string {
  return `DROP TRIGGER ${quoted(trigger.name)} ON ${quoted(trigger.table.schema)}.${quoted(trigger.table.name)}`;
}
/** Escape backslashes explicitly so session string settings cannot reinterpret a trigger argument. */
export function triggerArgument(value: string): string {
  if (value.includes("\0")) throw new Error("Invalid PostgreSQL trigger argument");
  return value.includes("\\")
    ? `E'${value.replaceAll("\\", "\\\\").replaceAll("'", "''")}'`
    : `'${value.replaceAll("'", "''")}'`;
}
export function createExtensionTrigger(trigger: ExtensionTriggerContract): readonly string[] {
  const table = `${quoted(trigger.table.schema)}.${quoted(trigger.table.name)}`;
  const create = `CREATE TRIGGER ${quoted(trigger.name)} ${trigger.timing.toUpperCase()} ${trigger.events.map((event) => event.toUpperCase()).join(" OR ")} ON ${table} FOR EACH ROW EXECUTE FUNCTION ${quoted(trigger.function.schema)}.${quoted(trigger.function.name)}(${trigger.arguments.map(triggerArgument).join(", ")})`;
  if (trigger.enabled === "origin") return [create];
  const mode = trigger.enabled === "disabled" ? "DISABLE" : `ENABLE ${trigger.enabled.toUpperCase()}`;
  return [create, `ALTER TABLE ${table} ${mode} TRIGGER ${quoted(trigger.name)}`];
}
