import { expect, test } from "vite-plus/test";
import * as v from "valibot";
import { z } from "zod";
import { parseApplicationEnvironment } from "@loom/core/server";

test("application environment accepts mixed Standard Schema vendors and transformed outputs", async () => {
  const env = await parseApplicationEnvironment(
    {
      TOKEN: z.string().min(1),
      PORT: v.pipe(v.string(), v.transform(Number), v.number(), v.integer()),
      OPTIONAL: z.string().default("fallback"),
    },
    { TOKEN: "private", PORT: "3000", DATABASE_URL: "not-exposed" },
  );
  expect(env).toEqual({ TOKEN: "private", PORT: 3000, OPTIONAL: "fallback" });
  expect(Object.isFrozen(env)).toBe(true);
});

test("environment validation awaits asynchronous schemas", async () => {
  const env = await parseApplicationEnvironment(
    { TOKEN: z.string().transform(async (value) => value.length) },
    { TOKEN: "private" },
  );
  expect(env.TOKEN).toBe(7);
});

test("environment failures identify only the key and never expose values or validator errors", async () => {
  for (const validator of [
    z.string().refine(() => false, "secret-validator-message"),
    z.string().transform(() => {
      throw new Error("secret-validator-message");
    }),
  ]) {
    const error = await parseApplicationEnvironment({ TOKEN: validator }, { TOKEN: "secret-value" }).catch(
      (cause: unknown) => cause,
    );
    expect(error).toBeInstanceOf(Error);
    expect(String(error)).toBe("Error: Invalid application environment variable: TOKEN");
    expect(error).not.toHaveProperty("cause");
  }
});

test("environment permits only own source properties and defines special keys safely", async () => {
  const inherited = Object.create({ TOKEN: "inherited" });
  await expect(parseApplicationEnvironment({ TOKEN: z.string() }, inherited)).rejects.toThrow("TOKEN");
  const declaration = { ["__proto__"]: z.string(), constructor: z.string() };
  const result = await parseApplicationEnvironment(declaration, {
    ["__proto__"]: "value",
    constructor: "another",
  });
  expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
  expect(Object.hasOwn(result, "__proto__")).toBe(true);
  expect(result.__proto__).toBe("value");
});
