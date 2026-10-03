import type pg from "pg";
import * as v from "valibot";
import { canonical } from "../../core/validation/canonical";
import { json } from "../../core/validation/encoding";
import type { ExtensionMember, ExtensionTypeReference } from "../../core/extensions/contracts";
import { resolveSelectedExtension } from "../codegen/extensions";
import { verifyExtensionApiContracts } from "../extensions/verify";
import { citextAnnotations } from "../extensions/annotations/citext";
import { pgTrgmAnnotations } from "../extensions/annotations/pg-trgm";
import { fuzzystrmatchAnnotations } from "../extensions/annotations/fuzzystrmatch";
import { uuidOsspAnnotations } from "../extensions/annotations/uuid-ossp";
import { pgUuidv7Annotations } from "../extensions/annotations/pg-uuidv7";
import { pgJsonschemaAnnotations } from "../extensions/annotations/pg-jsonschema";
import { pgTiktokenAnnotations } from "../extensions/annotations/pg-tiktoken";
import type { ExtensionMemberCoverage } from "../extensions/coverage";
import { validateRequiredApi } from "./required-api";
import type { RequiredApi } from "./required-api";

const roleName = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => !value.includes("\0") && Buffer.byteLength(value, "utf8") <= 63),
);
const permissionRows = v.pipe(v.array(v.strictObject({ allowed: v.boolean() })), v.length(1));
const reviewed = {
  citext: citextAnnotations,
  pg_trgm: pgTrgmAnnotations,
  fuzzystrmatch: fuzzystrmatchAnnotations,
  "uuid-ossp": uuidOsspAnnotations,
  pg_uuidv7: pgUuidv7Annotations,
  pg_jsonschema: pgJsonschemaAnnotations,
  pg_tiktoken: pgTiktokenAnnotations,
} satisfies Readonly<Record<string, readonly Pick<ExtensionMemberCoverage, "id" | "disposition">[]>>;

function identity(member: ExtensionMember): string {
  // Effective ACLs belong to the named role, while PUBLIC ACL remains part of native structural equality.
  const memberContract = member.kind === "routine" ? { ...member, publicExecute: undefined } : member;
  return canonical(v.parse(json, JSON.parse(JSON.stringify(memberContract))));
}

function publicMembers(payload: RequiredApi) {
  return payload.apis.map((api) => {
    const contract = api.manifest.contract;
    const support = resolveSelectedExtension(contract.extension, { version: contract.version, schema: api.schema });
    const annotations = Object.entries(reviewed).find(([name]) => name === contract.extension)?.[1];
    if (!support.manifest || !annotations)
      throw new Error(`No reviewed runtime API privilege contract: ${contract.extension} ${contract.version}`);
    const accepted = new Map(support.manifest.contract.members.map((member) => [member.id, member]));
    const stored = new Map(contract.members.map((member) => [member.id, member]));
    const members = annotations.flatMap((annotation) => {
      if (annotation.disposition !== "query" && annotation.disposition !== "schema") return [];
      const member = stored.get(annotation.id);
      const expected = accepted.get(annotation.id);
      if (!member || !expected || identity(member) !== identity(expected))
        throw new Error(`Required public member lacks a reviewed matching contract: ${annotation.id}`);
      return [member];
    });
    return { api, members };
  });
}

function quoted(name: string): string {
  return `"${name.replaceAll('"', '""')}"`;
}

// oxlint-disable-next-line anti-slop/no-unknown-parameters -- Strictly parses untrusted persisted target evidence before lifecycle mutation or catalogue I/O.
export function validateRequiredApiForTarget(input: unknown): RequiredApi {
  const payload = validateRequiredApi(input);
  publicMembers(payload);
  return payload;
}

type RequiredPrivilege =
  | { readonly kind: "routine"; readonly id: string; readonly signature: string }
  | { readonly kind: "type"; readonly id: string; readonly signature: string }
  | {
      readonly kind: "operator";
      readonly id: string;
      readonly schema: string;
      readonly name: string;
      readonly left: string | null;
      readonly right: string | null;
    };

/** Catalogue equality and named-role privileges are separate fresh observations on the owned session. */
export async function verifyRequiredApiOnTarget(
  client: Pick<pg.Client, "query">,
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- The owned-session verification boundary strictly parses all target evidence before native I/O.
  input: unknown,
  runtimeRole: string,
): Promise<void> {
  const payload = validateRequiredApi(input);
  const requirements = publicMembers(payload);
  const role = v.parse(roleName, runtimeRole);
  const placements = new Map(payload.apis.map((api) => [api.manifest.contract.extension, api.schema]));
  function namespace(symbol: string | null): string {
    if (!symbol) throw new Error("Missing required native member namespace");
    if (!symbol.startsWith("$extension:")) return symbol;
    const placement = placements.get(symbol.slice("$extension:".length));
    if (!placement) throw new Error(`Missing required symbolic extension placement: ${symbol}`);
    return placement;
  }
  function type(reference: ExtensionTypeReference): string {
    return `${quoted(namespace(reference.namespace))}.${quoted(reference.name)}`;
  }
  // Resolve all symbolic identities before any catalogue I/O.
  const required = requirements.map(({ api, members }) => ({
    schema: api.schema,
    members: members.flatMap<RequiredPrivilege>((member) => {
      if (member.kind === "routine") {
        const argumentsList = member.arguments
          .filter((argument) => argument.mode !== "out" && argument.mode !== "table")
          .map((argument) => type(argument.type));
        return [
          {
            kind: "routine",
            id: member.id,
            signature: `${quoted(namespace(member.namespace))}.${quoted(member.name)}(${argumentsList.join(",")})`,
          },
        ];
      }
      if (member.kind === "operator") {
        return [
          {
            kind: "operator",
            id: member.id,
            schema: namespace(member.namespace),
            name: member.name,
            left: member.left ? type(member.left) : null,
            right: member.right ? type(member.right) : null,
          },
        ];
      }
      if (member.kind === "type")
        return [
          { kind: "type", id: member.id, signature: `${quoted(namespace(member.namespace))}.${quoted(member.name)}` },
        ];
      return [];
    }),
  }));
  await verifyExtensionApiContracts(client, payload.apis);
  async function permission(statement: string, values: readonly (string | null)[], privilege: string, member: string) {
    const observed = v.parse(permissionRows, (await client.query(statement, [...values])).rows);
    if (!observed[0]?.allowed) throw new Error(`Required runtime role ${privilege} denied: ${role} ${member}`);
  }
  for (const scope of required) {
    await permission(
      "SELECT COALESCE((SELECT pg_catalog.has_schema_privilege($1::name,n.oid,'USAGE') FROM pg_catalog.pg_namespace n WHERE n.nspname=$2),false) AS allowed",
      [role, scope.schema],
      "USAGE",
      scope.schema,
    );
    for (const member of scope.members) {
      if (member.kind === "routine")
        await permission(
          "SELECT COALESCE(pg_catalog.has_function_privilege($1::name,pg_catalog.to_regprocedure($2)::oid,'EXECUTE'),false) AS allowed",
          [role, member.signature],
          "EXECUTE",
          member.id,
        );
      else if (member.kind === "type")
        await permission(
          "SELECT COALESCE(pg_catalog.has_type_privilege($1::name,pg_catalog.to_regtype($2)::oid,'USAGE'),false) AS allowed",
          [role, member.signature],
          "USAGE",
          member.id,
        );
      else
        await permission(
          "SELECT COALESCE((SELECT pg_catalog.has_function_privilege($1::name,o.oprcode::oid,'EXECUTE') FROM pg_catalog.pg_operator o JOIN pg_catalog.pg_namespace n ON n.oid=o.oprnamespace WHERE n.nspname=$2 AND o.oprname=$3 AND o.oprleft=COALESCE(pg_catalog.to_regtype($4)::oid,0::oid) AND o.oprright=COALESCE(pg_catalog.to_regtype($5)::oid,0::oid)),false) AS allowed",
          [role, member.schema, member.name, member.left, member.right],
          "EXECUTE",
          member.id,
        );
    }
  }
}
