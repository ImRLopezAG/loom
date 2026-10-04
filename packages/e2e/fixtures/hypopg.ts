export const hypopgDigest = "cba16a038628eb85dd40262f5d657ecdb01f755a3bc1314e24098278ea441fff";
export const hypopgSchema = 'hypo "session"';
export const hypopgDescriptor = {
  name: "hypopg",
  version: "1.4.3",
  schema: hypopgSchema,
  apiSupport: { status: "verified", digest: hypopgDigest },
} as const;
export const hypopgInstall = `CREATE SCHEMA "hypo ""session""";
CREATE EXTENSION hypopg WITH SCHEMA "hypo ""session""" VERSION '1.4.3';
CREATE TABLE public.hypopg_items(id integer, label text);
INSERT INTO public.hypopg_items SELECT n, 'item ' || n FROM generate_series(1, 10000) n;
CREATE INDEX hypopg_real_label ON public.hypopg_items(label);
ANALYZE public.hypopg_items;`;
