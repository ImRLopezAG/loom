/** Provider defaults must not be replaced by application variables or retained deployment overrides. */
export const neonInjectedVariables = [
  "DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "NEON_BRANCH",
  "NEON_AUTH_BASE_URL",
  "NEON_AUTH_JWKS_URL",
  "NEON_DATA_API_URL",
  "NEON_AI_GATEWAY_TOKEN",
  "NEON_AI_GATEWAY_BASE_URL",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_ENDPOINT_URL_S3",
  "AWS_REGION",
] as const;

const injected = new Set<string>(neonInjectedVariables);

/** Provider-injected values are validated at runtime, never copied from the deployer's environment. */
export function applicationEnvironmentSources(declaration: ApplicationEnvironment = {}) {
  return Object.fromEntries(
    Object.keys(declaration)
      .filter((name) => !injected.has(name))
      .map((name) => [name, name]),
  );
}

export async function resolveReleaseEnvironment(
  sources: Readonly<Record<string, string>>,
  declaration: ApplicationEnvironment | undefined,
  environment: Readonly<Record<string, string | undefined>>,
): Promise<Readonly<Record<string, string>>> {
  const application = Object.fromEntries(Object.entries(declaration ?? {}).filter(([name]) => !injected.has(name)));
  const variables = new Map<string, string>();
  for (const [name, source] of Object.entries(sources)) {
    const value = Object.hasOwn(environment, source) ? environment[source] : undefined;
    if (!Object.hasOwn(application, name) && !value) throw new Error("Missing release environment value");
    // Neon interprets an empty value as deletion. Explicit deletion also removes
    // an optional value retained by a previous deployment's merged environment.
    variables.set(name, value ?? "");
  }
  const values = Object.fromEntries(variables);
  await parseApplicationEnvironment(
    application,
    Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value || undefined])),
  );
  return values;
}
import { parseApplicationEnvironment } from "@loom/core/server";
import type { ApplicationEnvironment } from "@loom/core/server";
