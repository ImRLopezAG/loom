import { ManagementClient } from "auth0";
import { defineComponent } from "loom";
import { z } from "zod";

export default defineComponent({
  name: "auth0",
  env: {
    AUTH0_DOMAIN: z.string().min(1),
    AUTH0_CLIENT_ID: z.string().min(1),
    AUTH0_CLIENT_SECRET: z.string().min(1),
  },
  services: ({ env }) =>
    new ManagementClient({
      domain: env.AUTH0_DOMAIN,
      clientId: env.AUTH0_CLIENT_ID,
      clientSecret: env.AUTH0_CLIENT_SECRET,
    }),
});
