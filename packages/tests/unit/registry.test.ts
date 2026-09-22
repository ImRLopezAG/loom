import { expect, test } from "bun:test";
import { internalMutation, query } from "@loom/core/server";
import { discoverFunctions } from "@loom/tooling";
import { z } from "zod";

test("discovery includes registered exports only, with deterministic routes and visibility", () => {
  const list = query({ args: z.object({}), returns: z.array(z.string()), handler: () => [] });
  const cleanup = internalMutation({ args: z.object({}), returns: z.null(), handler: () => null });
  const entries = discoverFunctions([
    { path: "tasks.ts", exports: { list, helper: () => "private", cleanup } },
    { path: "_generated/ignored.ts", exports: { list } },
  ]);
  expect(entries.map((entry) => [entry.name, entry.definition.visibility])).toEqual([["tasks:cleanup", "internal"], ["tasks:list", "public"]]);
  expect(() => discoverFunctions([{ path: "tasks.ts", exports: { list } }, { path: "tasks.js", exports: { list } }])).toThrow("Duplicate");
});
