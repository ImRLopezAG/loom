import { createAuthClient } from "better-auth/client";
import { appPreferencesClient } from "../../e2e/fixtures/app-auth-plugin-client";

const client = createAuthClient({ plugins: [appPreferencesClient()] });
async function inferredPlugin() {
  const written = await client.appPreferences.set({ value: "dark" });
  const value: string | undefined = written.data?.value;
  const read = await client.appPreferences.get();
  const stored: string | null | undefined = read.data?.value;
  void value;
  void stored;
  // @ts-expect-error Plugin input preserves its native string validator.
  await client.appPreferences.set({ value: 123 });
  // @ts-expect-error The authenticated user is resolved by the server, not supplied by the client.
  await client.appPreferences.set({ value: "dark", userId: "another-user" });
  // @ts-expect-error Plugin outputs are not widened into arbitrary records.
  void read.data?.secret;
  // @ts-expect-error An unconfigured client does not expose application plugin methods.
  await createAuthClient().appPreferences.get();
}
void inferredPlugin;
