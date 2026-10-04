import { defineApplication, defineComponent } from "kello";
import { z } from "zod";
import * as v from "valibot";

const app = defineApplication({ rpc: ({ os }) => ({ os }) });
const required = defineComponent({
  name: "mailer",
  env: { TOKEN: z.string() },
  options: z.object({ retries: z.number() }),
  services: ({ env, options }) => ({
    send: (to: string) => `${env.TOKEN}:${options.retries}:${to}`,
  }),
});
app.use(required, { options: { retries: 3 } });
// @ts-expect-error Required options cannot be omitted.
app.use(required);
// @ts-expect-error Invalid component options are rejected.
app.use(required, { options: { retries: "three" } });
// @ts-expect-error Required option fields cannot be omitted.
app.use(required, { options: {} });
const defaulted = defineComponent({ name: "optional", options: v.optional(v.number(), 3) });
app.use(defaulted);
app.use(defaulted, { options: 5 });
const sdk = defineComponent({ name: "sdk", services: () => ({ hello: () => "hello" }) });
app.use(sdk);
// @ts-expect-error Undeclared component options cannot be supplied.
app.use(sdk, { options: { unknown: true } });

const configured = defineApplication({
  env: { TOKEN: z.string(), COUNT: v.pipe(v.string(), v.transform(Number)) },
  rpc: ({ os }) => ({ os }),
});
configured.use(required, { options: { retries: 2 }, env: { TOKEN: configured.env.TOKEN } });
// @ts-expect-error Bindings use the parent's validated output type.
configured.use(required, { options: { retries: 2 }, env: { TOKEN: configured.env.COUNT } });
// @ts-expect-error Undeclared parent keys are unavailable.
void configured.env.MISSING;
// @ts-expect-error Env references are not runtime secret values.
const token: string = configured.env.TOKEN;
void token;
