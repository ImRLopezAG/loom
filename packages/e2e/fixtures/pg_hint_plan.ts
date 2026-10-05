export const pgHintPlanDigest = "925971596ead990ae9ce609d472072d944c6843361a47f0e97652e53f91a94b4";
/** pg_hint_plan 1.8.0 is not relocatable; its control file fixes the installation schema. */
export const pgHintPlanSchema = "hint_plan";
export const pgHintPlanDescriptor = {
  name: "pg_hint_plan",
  version: "1.8.0",
  schema: pgHintPlanSchema,
  apiSupport: { status: "verified", digest: pgHintPlanDigest },
} as const;
export const pgHintPlanInstall = `CREATE EXTENSION pg_hint_plan VERSION '1.8.0';
CREATE TABLE public.hint_items(id integer PRIMARY KEY, label text);
INSERT INTO public.hint_items SELECT n, 'item ' || n FROM generate_series(1, 20000) n;
ANALYZE public.hint_items;`;
