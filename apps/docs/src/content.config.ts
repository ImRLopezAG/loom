import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

export const collections = {
  docs: defineCollection({
    loader: glob({ pattern: "**/*.{md,mdx}", base: "./content/docs" }),
    schema: z.object({ title: z.string(), description: z.string() }),
  }),
  meta: defineCollection({
    loader: glob({ pattern: "**/meta.json", base: "./content/docs" }),
    schema: z.object({ title: z.string(), pages: z.array(z.string()) }),
  }),
};
