import type { ComponentServices } from "loom/server";
import type workos from "./workos";
import type clerk from "./clerk";
import type auth0 from "./auth0";

// Compile-only usage: never invoked by the example or its tests. Real handlers
// authorize the requested provider ID before using these server capabilities.
export function officialSdkTypes(
  services: {
    workos: ComponentServices<typeof workos>;
    clerk: ComponentServices<typeof clerk>;
    auth0: ComponentServices<typeof auth0>;
  },
  id: string,
) {
  const workosUser = services.workos.sdk.userManagement.getUser(id);
  const clerkUser = services.clerk.sdk.users.getUser(id);
  const auth0User = services.auth0.sdk.users.get(id);
  return { workosUser, clerkUser, auth0User };
}
