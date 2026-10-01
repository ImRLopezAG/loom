import { describe, expect, test } from "vite-plus/test";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { z } from "zod";
import * as v from "valibot";
import { type } from "arktype";
import { Schema } from "effect";

const validators = [
  ["Zod", z.string()],
  ["Valibot", v.string()],
  ["ArkType", type("string")],
  ["Effect", Schema.toStandardSchemaV1(Schema.String)],
] satisfies [string, StandardSchemaV1<string, string>][];

describe("Standard Schema v1 compatibility", () => {
  for (const [name, validator] of validators) {
    test(`${name} accepts strings and rejects numbers through the standard interface`, async () => {
      expect(validator["~standard"].version).toBe(1);
      expect(await validator["~standard"].validate("Loom")).toMatchObject({ value: "Loom" });
      const invalid = await validator["~standard"].validate(42);
      expect(invalid.issues?.length).toBeGreaterThan(0);
    });
  }
});
