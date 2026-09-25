import { parseApplicationEnvironment } from "@loom/core/server";
import * as v from "valibot";
import { z } from "zod";

export async function verifyApplicationEnvironment() {
  const env = await parseApplicationEnvironment(
    {
      TOKEN: z.string(),
      PORT: v.pipe(v.string(), v.transform(Number)),
      OPTIONAL: z.string().optional(),
    },
    {},
  );
  const token: string = env.TOKEN;
  const port: number = env.PORT;
  const optional: string | undefined = env.OPTIONAL;
  // @ts-expect-error Transformed server environment exposes output types.
  const wrong: string = env.PORT;
  // @ts-expect-error Undeclared secrets are not available on the application context.
  void env.DATABASE_URL;
  // @ts-expect-error Validated application environment is immutable.
  env.TOKEN = "changed";
  // @ts-expect-error Environment declarations require Standard Schema validators.
  void parseApplicationEnvironment({ TOKEN: "string" }, {});
  return { token, port, optional, wrong };
}
