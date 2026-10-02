import { createHash } from "node:crypto";
import type pg from "pg";
import { quoteIdentifier } from "./connection";
import { extensionMembershipCte } from "./extension-membership";

/** Evidence of catalog state, not a schema diff engine. Row data and sequence counters are excluded. */
export async function catalogFingerprint(
  client: pg.Client,
  namespace: string,
  excludedIndexes: readonly string[] = [],
  mode: "exact" | "schema-copy" = "exact",
): Promise<string> {
  quoteIdentifier(namespace);
  const result = await client.query<{ definition: string }>(
    `
    WITH RECURSIVE ${extensionMembershipCte}, scope AS (SELECT oid FROM pg_namespace WHERE nspname = $1), relations AS (
      SELECT oid FROM pg_class WHERE relnamespace IN (SELECT oid FROM scope)
        AND NOT (relkind IN ('i', 'I') AND relname = ANY($2::text[]))
        AND NOT EXISTS (SELECT 1 FROM members m WHERE m.classid='pg_class'::regclass AND m.objid=pg_class.oid AND m.objsubid=0)
    ), definitions AS (
      SELECT jsonb_build_array('namespace', n.nspname, pg_get_userbyid(n.nspowner), n.nspacl::text) AS value
        FROM pg_namespace n WHERE n.oid IN (SELECT oid FROM scope)
      UNION ALL
      SELECT jsonb_build_array('relation', c.relname, c.relkind, pg_get_userbyid(c.relowner),
        c.relpersistence, c.relrowsecurity, c.relforcerowsecurity, c.relreplident,
        CASE WHEN $3::boolean THEN COALESCE(c.relacl, acldefault((CASE WHEN c.relkind = 'S' THEN 'S' ELSE 'r' END)::"char", c.relowner))::text
          ELSE c.relacl::text END, c.reloptions)
        FROM pg_class c WHERE c.oid IN (SELECT oid FROM relations)
      UNION ALL
      SELECT jsonb_build_array('column', c.relname, a.attname, a.attnum, format_type(a.atttypid, a.atttypmod),
        a.attnotnull, a.attidentity, a.attgenerated, a.attcollation::regcollation::text, a.attacl::text,
        pg_get_expr(d.adbin, d.adrelid))
        FROM pg_attribute a JOIN pg_class c ON c.oid = a.attrelid
        LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
        WHERE c.oid IN (SELECT oid FROM relations) AND a.attnum > 0 AND NOT a.attisdropped
          AND NOT EXISTS (SELECT 1 FROM members m WHERE m.classid='pg_class'::regclass AND m.objid=a.attrelid AND m.objsubid=a.attnum)
      UNION ALL
      SELECT jsonb_build_array('constraint', c.conname, c.conrelid::regclass::text, c.contypid::regtype::text,
        c.convalidated, pg_get_constraintdef(c.oid, false))
        FROM pg_constraint c WHERE c.connamespace IN (SELECT oid FROM scope)
          AND NOT EXISTS (SELECT 1 FROM members m WHERE m.classid='pg_constraint'::regclass AND m.objid=c.oid)
      UNION ALL
      SELECT jsonb_build_array('index', c.relname, i.indisvalid, i.indisready, i.indisclustered, pg_get_indexdef(i.indexrelid))
        FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid WHERE c.oid IN (SELECT oid FROM relations)
      UNION ALL
      SELECT jsonb_build_array('trigger', c.relname, t.tgname, t.tgenabled, pg_get_triggerdef(t.oid, false))
        FROM pg_trigger t JOIN pg_class c ON c.oid = t.tgrelid
        WHERE c.oid IN (SELECT oid FROM relations) AND NOT t.tgisinternal
          AND NOT EXISTS (SELECT 1 FROM members m WHERE m.classid='pg_trigger'::regclass AND m.objid=t.oid)
      UNION ALL
      SELECT jsonb_build_array('routine', p.proname, pg_get_function_identity_arguments(p.oid),
        pg_get_userbyid(p.proowner), p.proacl::text, pg_get_functiondef(p.oid))
        FROM pg_proc p WHERE p.pronamespace IN (SELECT oid FROM scope) AND p.prokind IN ('f', 'p')
          AND NOT EXISTS (SELECT 1 FROM members m WHERE m.classid='pg_proc'::regclass AND m.objid=p.oid)
      UNION ALL
      SELECT jsonb_build_array('policy', tablename, policyname, permissive, roles, cmd, qual, with_check)
        FROM pg_policies WHERE schemaname = $1
          AND NOT EXISTS (SELECT 1 FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid
            JOIN members m ON (m.classid='pg_policy'::regclass AND m.objid=p.oid) OR
              (m.classid='pg_class'::regclass AND m.objid=c.oid AND m.objsubid=0)
            WHERE p.polname=policyname AND c.relname=tablename AND c.relnamespace IN (SELECT oid FROM scope))
      UNION ALL
      SELECT jsonb_build_array('view', c.relname, pg_get_viewdef(c.oid, false))
        FROM pg_class c WHERE c.oid IN (SELECT oid FROM relations) AND c.relkind IN ('v', 'm')
      UNION ALL
      SELECT jsonb_build_array('sequence', c.relname, s.seqtypid::regtype::text, s.seqstart, s.seqincrement, s.seqmax, s.seqmin, s.seqcache, s.seqcycle)
        FROM pg_sequence s JOIN pg_class c ON c.oid = s.seqrelid WHERE c.oid IN (SELECT oid FROM relations)
      UNION ALL
      SELECT jsonb_build_array('type', t.typname, t.typtype, pg_get_userbyid(t.typowner), t.typacl::text,
        t.typbasetype::regtype::text, t.typtypmod, t.typnotnull, t.typdefault)
        FROM pg_type t WHERE t.typnamespace IN (SELECT oid FROM scope)
          AND NOT EXISTS (SELECT 1 FROM members m WHERE m.classid='pg_type'::regclass AND m.objid=t.oid)
      UNION ALL
      SELECT jsonb_build_array('enum', t.typname, e.enumsortorder, e.enumlabel)
        FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typnamespace IN (SELECT oid FROM scope)
          AND NOT EXISTS (SELECT 1 FROM members m WHERE m.classid='pg_type'::regclass AND m.objid=t.oid)
    ) SELECT value::text AS definition FROM definitions ORDER BY value::text COLLATE "C"
  `,
    [namespace, excludedIndexes, mode === "schema-copy"],
  );
  return createHash("sha256")
    .update(mode === "exact" ? "loom-catalog-v1\0" : "loom-schema-copy-catalog-v1\0")
    .update(JSON.stringify(result.rows.map((row) => row.definition)))
    .digest("hex");
}
