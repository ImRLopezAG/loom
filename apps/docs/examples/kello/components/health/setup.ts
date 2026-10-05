import { defineComponent } from "./_generated/setup";

export default defineComponent({
  name: "health",
  http: [
    {
      method: "GET",
      path: "/ready",
      access: { kind: "anonymous" },
      handle: () => Response.json({ ok: true }),
    },
  ],
});
