import { prepareApplicationEnvironment, readComponentEnvironment } from "loom/server";
import type { ApplicationEnvironmentDefinition, ComponentNode } from "loom/server";
import { getBetterAuthFactory } from "../../core/better-auth/definition";
import { componentNamespace } from "./component-namespace";

/** Optional peers load only when the application explicitly mounts custom auth. */
export async function resolveProjectAuth(
  application: ApplicationEnvironmentDefinition,
  nodes: readonly ComponentNode[],
) {
  const mounted = nodes.flatMap((node) => {
    const create = getBetterAuthFactory(node.definition);
    return create ? [{ node, create }] : [];
  });
  if (!mounted.length) return [];
  const environment = await prepareApplicationEnvironment(application, process.env);
  const { resolveBetterAuthSchema } = await import("../../core/better-auth/resolve");
  return Promise.all(
    mounted.map(async ({ node, create }) => {
      const namespace = componentNamespace(node.path);
      const schema = await environment.runComponent(node.path, () =>
        resolveBetterAuthSchema(
          (database) => create({ env: readComponentEnvironment(node.definition), database }),
          namespace,
        ),
      );
      return { mountPath: node.path, namespace, schema, fingerprint: schema.fingerprint };
    }),
  );
}
