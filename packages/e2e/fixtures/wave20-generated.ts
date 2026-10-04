export const wave20GeneratedSelection = {
  insert_username: { version: "1.0", schema: "callbacks" },
  refint: { version: "1.0", schema: "callbacks" },
  tcn: { version: "1.0", schema: "callbacks" },
  lo: { version: "1.2", schema: "objects" },
  pg_prewarm: { version: "1.2", schema: "cache" },
  pg_stat_statements: { version: "1.12", schema: "statistics" },
  pgcrypto: { version: "1.3", schema: "jwt" },
  pgjwt: { version: "0.2.0", schema: "jwt" },
  pg_session_jwt: { version: "0.5.0", schema: "session_install" },
  cube: { version: "1.5", schema: "cube_types" },
  earthdistance: { version: "1.2", schema: "earth_types" },
  seg: { version: "1.4", schema: "segments" },
} as const;

export const wave20GeneratedSchema = `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
export default defineSchema(f => ({ records: {
  number: f.integer(), username: f.text(), object: extensions.lo.field(),
  segment: extensions.seg.field(), location: extensions.earthdistance.field(),
}, children: { key: f.integer() } }), {
  namespace: "app",
  triggers: tables => [
    extensions.insert_username.trigger({ name: "assign_username", table: tables.records, column: tables.records.username }),
    extensions.lo.trigger({ name: "manage_object", table: tables.records, column: tables.records.object }),
    extensions.tcn.trigger({ name: "notify_change", table: tables.records, events: ["insert", "update", "delete"] }),
    extensions.refint.checkPrimaryKey({ name: "check_parent", table: tables.children, columns: [tables.children.key], references: { table: tables.records, columns: [tables.records.number] } }),
    extensions.refint.checkForeignKey({ name: "cascade_child", table: tables.records, columns: [tables.records.number], references: [{ table: tables.children, columns: [tables.children.key] }], action: "cascade" }),
  ],
});`;

export const wave20GeneratedOutput = `v.strictObject({
  center: v.nullable(v.union([v.number(), v.strictObject({ nonfinite: v.picklist(["NaN", "Infinity", "-Infinity"]) })])),
  distance: v.nullable(v.union([v.number(), v.strictObject({ nonfinite: v.picklist(["NaN", "Infinity", "-Infinity"]) })])),
  encoded: v.nullable(v.string()), parsed: v.nullable(v.union([v.number(), v.strictObject({ nonfinite: v.picklist(["NaN", "Infinity", "-Infinity"]) })])),
  username: v.nullable(v.string()), sessionUserId: v.nullable(v.string()), families: v.array(v.string()),
})`;

export const wave20GeneratedQuery = `
for (const name of ["insert_username", "refint", "tcn", "pg_prewarm"] as const) {
  if (Object.keys(extensions[name].sql.functions).length) throw new Error("Operational or schema callbacks became query helpers");
}
const [scalar] = await db.select({
  center: extensions.seg.center(tables.records.segment),
  distance: extensions.earthdistance.distanceMeters(tables.records.location, extensions.earthdistance.fromDegrees(0, 0)),
  encoded: extensions.pgjwt.urlEncode({ hex: "00ff" }),
  parsed: extensions.pgjwt.tryCastDouble("2.5"), username: tables.records.username,
  sessionUserId: extensions.pg_session_jwt.userId(),
}).from(tables.records).orderBy(tables.records.number).limit(1);
if (!scalar) throw new Error("Missing generated scope fixture");
return { ...scalar, families: Object.keys(extensions).sort() };`;
