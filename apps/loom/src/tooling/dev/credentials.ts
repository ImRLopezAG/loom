import type { NeonApi } from "@neon/config-runtime";
import type { DevelopmentTarget } from "./target";
import type { DevelopmentDatabaseIdentity } from "./connection";

function validateConnection(
  uri: string,
  target: DevelopmentTarget,
  databaseName: string,
  roleName: string,
): DevelopmentDatabaseIdentity {
  try {
    const address = new URL(uri);
    if (
      !["postgres:", "postgresql:"].includes(address.protocol) ||
      decodeURIComponent(address.username) !== roleName ||
      decodeURIComponent(address.pathname.slice(1)) !== databaseName ||
      address.hostname.split(".")[0] !== target.endpointId ||
      address.hostname.includes("-pooler.")
    )
      throw new Error("Connection refused");
    // pg also accepts identity overrides in the query string. Refuse ambiguous connection identities.
    for (const key of [
      "host",
      "hostaddr",
      "port",
      "user",
      "password",
      "database",
      "dbname",
      "options",
      "connectionString",
    ])
      if (address.searchParams.has(key)) throw new Error("Connection refused");
    return Object.freeze({ endpointHost: address.hostname, databaseName, port: address.port || "5432" });
  } catch {
    throw new Error("Provider connection does not match the development target");
  }
}

/** Internal credential resolution; callers must validate identifiers and independently inspect the runtime role. */
export async function resolveDevelopmentCredentials(
  api: Pick<NeonApi, "getConnectionUri">,
  target: DevelopmentTarget,
  databaseName: string,
  roleName: string,
) {
  const credentials = await api
    .getConnectionUri(target.projectId, {
      branchId: target.branchId,
      endpointId: target.endpointId,
      databaseName,
      roleName,
      pooled: false,
    })
    .catch(() => {
      throw new Error("Could not resolve development connection");
    });
  const database = validateConnection(credentials.uri, target, databaseName, roleName);
  return { connectionString: credentials.uri, database };
}
