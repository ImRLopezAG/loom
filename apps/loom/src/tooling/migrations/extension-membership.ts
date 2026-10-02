/** Only extension membership and subordinate ownership edges exclude objects from application DDL.
 * Ordinary dependencies on extension types or functions remain application-owned. */
export const extensionMembershipCte = `roots(extension,classid,objid,objsubid) AS (
  SELECT e.extname,d.classid,d.objid,d.objsubid FROM pg_depend d JOIN pg_extension e ON e.oid=d.refobjid
    WHERE d.refclassid='pg_extension'::regclass AND d.deptype='e'
  UNION
  SELECT e.extname,d.classid,d.objid,a.attnum FROM pg_depend d JOIN pg_extension e ON e.oid=d.refobjid
    JOIN pg_attribute a ON a.attrelid=d.objid AND a.attnum>0 AND NOT a.attisdropped
    WHERE d.refclassid='pg_extension'::regclass AND d.deptype='e' AND d.classid='pg_class'::regclass
), members(extension,classid,objid,objsubid) AS (
  SELECT * FROM roots
  UNION
  SELECT m.extension,d.classid,d.objid,d.objsubid FROM members m JOIN pg_depend d
    ON d.refclassid=m.classid AND d.refobjid=m.objid AND (m.objsubid=0 OR d.refobjsubid=m.objsubid)
    WHERE d.deptype IN ('a','i','P','S')
)`;

export const extensionSnapshotExclusions = `WITH RECURSIVE ${extensionMembershipCte}
  SELECT CASE c.relkind WHEN 'S' THEN 'sequences' WHEN 'v' THEN 'views' WHEN 'm' THEN 'views'
      WHEN 'i' THEN 'indexes' WHEN 'I' THEN 'indexes' ELSE 'tables' END AS "entityType",
    n.nspname AS schema,c.relname AS name,t.relname AS "table"
    FROM members m JOIN pg_class c ON m.classid='pg_class'::regclass AND m.objid=c.oid AND m.objsubid=0
    JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_index i ON i.indexrelid=c.oid
    LEFT JOIN pg_class t ON t.oid=i.indrelid WHERE c.relkind IN ('r','p','f','S','v','m','i','I')
  UNION
  SELECT 'columns',n.nspname,a.attname,c.relname FROM members m
    JOIN pg_attribute a ON m.classid='pg_class'::regclass AND m.objid=a.attrelid AND m.objsubid=a.attnum AND m.objsubid>0
    JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace
  UNION
  SELECT CASE c.contype WHEN 'p' THEN 'pks' WHEN 'f' THEN 'fks' WHEN 'u' THEN 'uniques' ELSE 'checks' END,
    n.nspname,c.conname,t.relname FROM members m
    JOIN pg_constraint c ON m.classid='pg_constraint'::regclass AND m.objid=c.oid
    JOIN pg_namespace n ON n.oid=c.connamespace JOIN pg_class t ON t.oid=c.conrelid
    WHERE c.contype IN ('p','f','u','c')
  UNION
  SELECT 'enums',n.nspname,t.typname,NULL FROM members m
    JOIN pg_type t ON m.classid='pg_type'::regclass AND m.objid=t.oid AND t.typtype='e'
    JOIN pg_namespace n ON n.oid=t.typnamespace
  UNION
  SELECT 'policies',n.nspname,p.polname,c.relname FROM members m
    JOIN pg_policy p ON m.classid='pg_policy'::regclass AND m.objid=p.oid
    JOIN pg_class c ON c.oid=p.polrelid JOIN pg_namespace n ON n.oid=c.relnamespace`;
