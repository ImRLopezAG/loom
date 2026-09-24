import { FunctionAccessDenied } from "@loom/core/server";
import type { InvocationIdentity } from "@loom/core/server";
import { and, eq } from "drizzle-orm";
import schema from "./schema";

export function requireIdentity(identity: InvocationIdentity | null) {
  if (!identity) throw new FunctionAccessDenied();
  return identity;
}

export function ownedProjects(identity: InvocationIdentity | null) {
  const owner = requireIdentity(identity);
  return and(eq(schema.tables.projects.ownerIssuer, owner.issuer), eq(schema.tables.projects.ownerId, owner.subject));
}
