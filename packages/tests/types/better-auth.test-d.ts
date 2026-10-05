import { defineApplication, defineComponent } from "kello";
import { defineBetterAuth } from "kello/better-auth";
import { betterAuth } from "better-auth";
import { jwt, organization, twoFactor } from "better-auth/plugins";
import { createAuthClient } from "better-auth/client";
import { jwtClient, organizationClient, twoFactorClient, inferAdditionalFields } from "better-auth/client/plugins";
import { Effect } from "effect";
import { z } from "zod";
import * as v from "valibot";

const identity = defineBetterAuth({
  name: "identity",
  env: { AUTH_SECRET: z.string(), AUTH_URL: v.string() },
  create: ({ env, database }) =>
    betterAuth({
      secret: env.AUTH_SECRET,
      baseURL: env.AUTH_URL,
      database,
      plugins: [jwt(), organization({ teams: { enabled: true } }), twoFactor()],
      user: { additionalFields: { department: { type: "string", required: false } } },
    }),
});
const app = defineApplication({ rpc: ({ os }) => ({ os }) });
app.use(identity);
type Auth = ReturnType<NonNullable<typeof identity.services>>["auth"];
const client = createAuthClient({
  plugins: [
    jwtClient(),
    organizationClient({ teams: { enabled: true } }),
    twoFactorClient(),
    inferAdditionalFields<Auth>(),
  ],
});
void client.token();
void client.organization.createTeam({ name: "Support" });
void client.twoFactor.verifyTotp({ code: "123456" });
// @ts-expect-error Native plugin argument validation must be preserved.
void client.twoFactor.verifyTotp({ code: 123456 });
// @ts-expect-error Undeclared plugins do not manufacture endpoints.
void client.admin.listUsers();
function effectService(auth: Auth) {
  return defineComponent({ name: "consumer", services: () => Effect.succeed({ auth }) });
}
const service = effectService;
void service;
async function inferSession(auth: Auth) {
  const session = await auth.api.getSession({ headers: new Headers() });
  const department: string | null | undefined = session?.user.department;
  void department;
  // @ts-expect-error Extra fields are not widened to an arbitrary record.
  void session?.user.undeclared;
}
void inferSession;
