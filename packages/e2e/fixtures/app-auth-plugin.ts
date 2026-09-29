import type { BetterAuthPlugin } from "better-auth";
import { createAuthEndpoint, sessionMiddleware } from "better-auth/api";
import { z } from "zod";

/** An application-owned plugin: no Loom-specific endpoint or schema API. */
export function appPreferences(options: { modelName?: string; maxLength?: number } = {}) {
  return {
    id: "app-preferences",
    schema: {
      appPreference: {
        modelName: options.modelName ?? "appPreference",
        fields: {
          userId: { type: "string", required: true, unique: true, references: { model: "user", field: "id" } },
          value: { type: "string", required: true },
        },
      },
    },
    endpoints: {
      setAppPreference: createAuthEndpoint(
        "/app-preferences/set",
        {
          method: "POST",
          body: z
            .object({
              value: z
                .string()
                .min(1)
                .max(options.maxLength ?? 80),
            })
            .strict(),
          use: [sessionMiddleware],
        },
        async (ctx) => {
          const userId = ctx.context.session.user.id;
          const where = [{ field: "userId", value: userId }];
          const existing = await ctx.context.adapter.findOne({ model: "appPreference", where });
          if (existing) {
            await ctx.context.adapter.update({ model: "appPreference", where, update: { value: ctx.body.value } });
          } else {
            await ctx.context.adapter.create({ model: "appPreference", data: { userId, value: ctx.body.value } });
          }
          return ctx.json({ value: ctx.body.value });
        },
      ),
      getAppPreference: createAuthEndpoint(
        "/app-preferences/get",
        { method: "GET", use: [sessionMiddleware] },
        async (ctx) => {
          const row = await ctx.context.adapter.findOne<{ value: string }>({
            model: "appPreference",
            where: [{ field: "userId", value: ctx.context.session.user.id }],
          });
          return ctx.json({ value: row?.value ?? null });
        },
      ),
    },
  } satisfies BetterAuthPlugin;
}
