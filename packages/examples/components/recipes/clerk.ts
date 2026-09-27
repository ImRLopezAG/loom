import { createClerkClient } from "@clerk/backend";
import { defineComponent } from "loom";
import * as v from "valibot";

export default defineComponent({
  name: "clerk",
  env: { CLERK_SECRET_KEY: v.pipe(v.string(), v.minLength(1)) },
  services: ({ env }) => ({
    sdk: createClerkClient({ secretKey: env.CLERK_SECRET_KEY }),
  }),
});
