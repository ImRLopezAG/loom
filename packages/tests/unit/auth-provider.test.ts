import { expect, test } from "vite-plus/test";
import { createTokenAuth } from "loom/client";
import { defineBetterAuth } from "loom/better-auth";
import { parseApplicationEnvironment } from "loom/server";
import { z } from "zod";
import * as v from "valibot";
import { betterAuth } from "better-auth";

test("external token bridge gates loading and signed-out states and forwards refresh intent", async () => {
  let state = { isLoading: true, isAuthenticated: true };
  const requests: boolean[] = [];
  const auth = createTokenAuth({
    getState: () => state,
    getToken: async ({ forceRefresh }) => {
      requests.push(forceRefresh);
      return "signed-token";
    },
  });
  expect(await auth.getToken()).toBeNull();
  state = { isLoading: false, isAuthenticated: false };
  expect(await auth.getToken()).toBeNull();
  state = { isLoading: false, isAuthenticated: true };
  expect(await auth.getToken()).toBe("signed-token");
  expect(await auth.getToken({ forceRefresh: true })).toBe("signed-token");
  expect(requests).toEqual([false, true]);
});

test("provider notification invalidates an in-flight token before an account switch resolves", async () => {
  let notify: (() => void) | undefined;
  let resolve!: (token: string) => void;
  const auth = createTokenAuth({
    getState: () => ({ isLoading: false, isAuthenticated: true }),
    getToken: () =>
      new Promise<string>((done) => {
        resolve = done;
      }),
    subscribe(listener) {
      notify = listener;
      return () => {
        notify = undefined;
      };
    },
  });
  let changes = 0;
  const unsubscribe = auth.subscribe!(() => {
    changes++;
  });
  const pending = auth.getToken();
  notify!();
  resolve("old-user-token");
  expect(await pending).toBeNull();
  expect(changes).toBe(1);
  unsubscribe();
  expect(notify).toBeUndefined();
});

test("validated component environments support Zod and Valibot without disclosing invalid secrets", async () => {
  const declaration = defineBetterAuth({
    name: "identity",
    env: { SECRET: z.string().min(32), URL: v.pipe(v.string(), v.url()) },
    create: ({ env, database }) => betterAuth({ secret: env.SECRET, baseURL: env.URL, database }),
  });
  const values = { SECRET: "a".repeat(32), URL: "https://auth.example.test" };
  expect(await parseApplicationEnvironment(declaration.environmentSchema, values)).toEqual(values);
  await expect(
    parseApplicationEnvironment(declaration.environmentSchema, { ...values, SECRET: "private" }),
  ).rejects.toThrow("Invalid application environment variable: SECRET");
  await expect(parseApplicationEnvironment(declaration.environmentSchema, {})).rejects.toThrow("SECRET");
});
