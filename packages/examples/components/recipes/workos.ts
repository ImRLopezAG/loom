import { WorkOS } from "@workos-inc/node";
import { defineComponent } from "loom";
import { z } from "zod";

export default defineComponent({
  name: "workos",
  env: { WORKOS_API_KEY: z.string().min(1) },
  services: ({ env }) => new WorkOS(env.WORKOS_API_KEY, { maxRetries: 0 }),
});
