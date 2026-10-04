import { sql, type SQL } from "drizzle-orm";
import type { PostgisAdapter } from "../../../apps/loom/src/core/extensions/adapters/postgis";

// Exact captured native signatures; each static invocation is independently checked by TypeScript.
export function postgisNullableWitnesses(
  api: PostgisAdapter & { readonly schema: string },
): readonly { member: string; expression: SQL }[] {
  return [
    {
      member: "cast:$extension:postgis.box2d->$extension:postgis.box3d",
      expression: api.sql.overloads["cast:$extension:postgis.box2d->$extension:postgis.box3d"](null),
    },
    {
      member: "cast:$extension:postgis.box2d->$extension:postgis.geometry",
      expression: api.sql.overloads["cast:$extension:postgis.box2d->$extension:postgis.geometry"](null),
    },
    {
      member: "cast:$extension:postgis.box3d->$extension:postgis.box2d",
      expression: api.sql.overloads["cast:$extension:postgis.box3d->$extension:postgis.box2d"](null),
    },
    {
      member: "cast:$extension:postgis.box3d->$extension:postgis.geometry",
      expression: api.sql.overloads["cast:$extension:postgis.box3d->$extension:postgis.geometry"](null),
    },
    {
      member: "cast:$extension:postgis.box3d->pg_catalog.box",
      expression: api.sql.overloads["cast:$extension:postgis.box3d->pg_catalog.box"](null),
    },
    {
      member: "cast:$extension:postgis.geography->$extension:postgis.geography",
      expression: api.sql.overloads["cast:$extension:postgis.geography->$extension:postgis.geography"](null),
    },
    {
      member: "cast:$extension:postgis.geography->$extension:postgis.geometry",
      expression: api.sql.overloads["cast:$extension:postgis.geography->$extension:postgis.geometry"](null),
    },
    {
      member: "cast:$extension:postgis.geography->pg_catalog.bytea",
      expression: api.sql.overloads["cast:$extension:postgis.geography->pg_catalog.bytea"](null),
    },
    {
      member: "cast:$extension:postgis.geometry->$extension:postgis.box2d",
      expression: api.sql.overloads["cast:$extension:postgis.geometry->$extension:postgis.box2d"](null),
    },
    {
      member: "cast:$extension:postgis.geometry->$extension:postgis.box3d",
      expression: api.sql.overloads["cast:$extension:postgis.geometry->$extension:postgis.box3d"](null),
    },
    {
      member: "cast:$extension:postgis.geometry->$extension:postgis.geography",
      expression: api.sql.overloads["cast:$extension:postgis.geometry->$extension:postgis.geography"](null),
    },
    {
      member: "cast:$extension:postgis.geometry->$extension:postgis.geometry",
      expression: api.sql.overloads["cast:$extension:postgis.geometry->$extension:postgis.geometry"](null),
    },
    {
      member: "cast:$extension:postgis.geometry->pg_catalog.box",
      expression: api.sql.overloads["cast:$extension:postgis.geometry->pg_catalog.box"](null),
    },
    {
      member: "cast:$extension:postgis.geometry->pg_catalog.bytea",
      expression: api.sql.overloads["cast:$extension:postgis.geometry->pg_catalog.bytea"](null),
    },
    {
      member: "cast:$extension:postgis.geometry->pg_catalog.json",
      expression: api.sql.overloads["cast:$extension:postgis.geometry->pg_catalog.json"](null),
    },
    {
      member: "cast:$extension:postgis.geometry->pg_catalog.jsonb",
      expression: api.sql.overloads["cast:$extension:postgis.geometry->pg_catalog.jsonb"](null),
    },
    {
      member: "cast:$extension:postgis.geometry->pg_catalog.path",
      expression: api.sql.overloads["cast:$extension:postgis.geometry->pg_catalog.path"](null),
    },
    {
      member: "cast:$extension:postgis.geometry->pg_catalog.point",
      expression: api.sql.overloads["cast:$extension:postgis.geometry->pg_catalog.point"](null),
    },
    {
      member: "cast:$extension:postgis.geometry->pg_catalog.polygon",
      expression: api.sql.overloads["cast:$extension:postgis.geometry->pg_catalog.polygon"](null),
    },
    {
      member: "cast:$extension:postgis.geometry->pg_catalog.text",
      expression: api.sql.overloads["cast:$extension:postgis.geometry->pg_catalog.text"](null),
    },
    {
      member: "cast:pg_catalog.bytea->$extension:postgis.geography",
      expression: api.sql.overloads["cast:pg_catalog.bytea->$extension:postgis.geography"](null),
    },
    {
      member: "cast:pg_catalog.bytea->$extension:postgis.geometry",
      expression: api.sql.overloads["cast:pg_catalog.bytea->$extension:postgis.geometry"](null),
    },
    {
      member: "cast:pg_catalog.path->$extension:postgis.geometry",
      expression: api.sql.overloads["cast:pg_catalog.path->$extension:postgis.geometry"](null),
    },
    {
      member: "cast:pg_catalog.point->$extension:postgis.geometry",
      expression: api.sql.overloads["cast:pg_catalog.point->$extension:postgis.geometry"](null),
    },
    {
      member: "cast:pg_catalog.polygon->$extension:postgis.geometry",
      expression: api.sql.overloads["cast:pg_catalog.polygon->$extension:postgis.geometry"](null),
    },
    {
      member: "cast:pg_catalog.text->$extension:postgis.geometry",
      expression: api.sql.overloads["cast:pg_catalog.text->$extension:postgis.geometry"](null),
    },
    {
      member: "operator:$extension:postgis.@($extension:postgis.box2df,$extension:postgis.box2df)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.@($extension:postgis.box2df,$extension:postgis.box2df)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.@($extension:postgis.box2df,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.@($extension:postgis.box2df,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.@($extension:postgis.geometry,$extension:postgis.box2df)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.@($extension:postgis.geometry,$extension:postgis.box2df)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.@($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.@($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.@@($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.@@($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.@>>($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.@>>($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.&/&($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.&/&($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.&&($extension:postgis.box2df,$extension:postgis.box2df)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.&&($extension:postgis.box2df,$extension:postgis.box2df)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.&&($extension:postgis.box2df,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.&&($extension:postgis.box2df,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.&&($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.&&($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.&&($extension:postgis.geography,$extension:postgis.gidx)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.&&($extension:postgis.geography,$extension:postgis.gidx)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.&&($extension:postgis.geometry,$extension:postgis.box2df)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.&&($extension:postgis.geometry,$extension:postgis.box2df)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.&&($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.&&($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.&&($extension:postgis.gidx,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.&&($extension:postgis.gidx,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.&&($extension:postgis.gidx,$extension:postgis.gidx)",
      expression: api.sql.overloads["operator:$extension:postgis.&&($extension:postgis.gidx,$extension:postgis.gidx)"](
        null,
        null,
      ),
    },
    {
      member: "operator:$extension:postgis.&&&($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.&&&($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.&&&($extension:postgis.geometry,$extension:postgis.gidx)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.&&&($extension:postgis.geometry,$extension:postgis.gidx)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.&&&($extension:postgis.gidx,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.&&&($extension:postgis.gidx,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.&&&($extension:postgis.gidx,$extension:postgis.gidx)",
      expression: api.sql.overloads["operator:$extension:postgis.&&&($extension:postgis.gidx,$extension:postgis.gidx)"](
        null,
        null,
      ),
    },
    {
      member: "operator:$extension:postgis.&<($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.&<($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.&<|($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.&<|($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.&>($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.&>($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.<->($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.<->($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.<->($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.<->($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.<($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.<($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.<($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.<($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.<#>($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.<#>($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.<<->>($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.<<->>($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.<<($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.<<($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.<<@($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.<<@($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.<<|($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.<<|($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.<=($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.<=($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.<=($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.<=($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.<>($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.<>($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.=($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.=($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.=($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.=($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.>($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.>($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.>($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.>($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.>=($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.>=($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.>=($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.>=($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.>>($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.>>($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.|&>($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.|&>($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.|=|($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.|=|($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.|>>($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.|>>($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.~($extension:postgis.box2df,$extension:postgis.box2df)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.~($extension:postgis.box2df,$extension:postgis.box2df)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.~($extension:postgis.box2df,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.~($extension:postgis.box2df,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.~($extension:postgis.geometry,$extension:postgis.box2df)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.~($extension:postgis.geometry,$extension:postgis.box2df)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.~($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.~($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.~=($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.~=($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.~==($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.~==($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.~~($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.~~($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "operator:$extension:postgis.~~=($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "operator:$extension:postgis.~~=($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis._postgis_deprecate(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._postgis_deprecate(pg_catalog.text,pg_catalog.text,pg_catalog.text)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis._postgis_index_extent(pg_catalog.regclass,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._postgis_index_extent(pg_catalog.regclass,pg_catalog.text)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis._postgis_join_selectivity(pg_catalog.regclass,pg_catalog.text,pg_catalog.regclass,pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._postgis_join_selectivity(pg_catalog.regclass,pg_catalog.text,pg_catalog.regclass,pg_catalog.text,pg_catalog.text)"
      ](null, null, null, null, null),
    },
    {
      member: "routine:$extension:postgis._postgis_pgsql_version()",
      expression: api.sql.overloads["routine:$extension:postgis._postgis_pgsql_version()"](),
    },
    {
      member: "routine:$extension:postgis._postgis_scripts_pgsql_version()",
      expression: api.sql.overloads["routine:$extension:postgis._postgis_scripts_pgsql_version()"](),
    },
    {
      member:
        "routine:$extension:postgis._postgis_selectivity(pg_catalog.regclass,pg_catalog.text,$extension:postgis.geometry,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._postgis_selectivity(pg_catalog.regclass,pg_catalog.text,$extension:postgis.geometry,pg_catalog.text)"
      ](null, null, null, null),
    },
    {
      member: "routine:$extension:postgis._postgis_stats(pg_catalog.regclass,pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._postgis_stats(pg_catalog.regclass,pg_catalog.text,pg_catalog.text)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis._st_3ddfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_3ddfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis._st_3ddwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_3ddwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis._st_3dintersects($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_3dintersects($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis._st_asgml(pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_asgml(pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)"
      ](3, null, null, null, null, null),
    },
    {
      member:
        "routine:$extension:postgis._st_asx3d(pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_asx3d(pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text)"
      ](3, null, null, null, null),
    },
    {
      member: "routine:$extension:postgis._st_bestsrid($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_bestsrid($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis._st_bestsrid($extension:postgis.geography)",
      expression: api.sql.overloads["routine:$extension:postgis._st_bestsrid($extension:postgis.geography)"](null),
    },
    {
      member: "routine:$extension:postgis._st_contains($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_contains($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis._st_containsproperly($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_containsproperly($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis._st_coveredby($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_coveredby($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis._st_coveredby($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_coveredby($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis._st_covers($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_covers($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis._st_covers($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_covers($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis._st_crosses($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_crosses($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis._st_dfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_dfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis._st_distancetree($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_distancetree($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)"
      ](null, null, null, null),
    },
    {
      member: "routine:$extension:postgis._st_distancetree($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_distancetree($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis._st_distanceuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_distanceuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis._st_distanceuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_distanceuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)"
      ](null, null, null, null),
    },
    {
      member:
        "routine:$extension:postgis._st_distanceuncached($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_distanceuncached($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis._st_dwithin($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_dwithin($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)"
      ](null, null, null, null),
    },
    {
      member:
        "routine:$extension:postgis._st_dwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_dwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis._st_dwithinuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_dwithinuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)"
      ](null, null, null, null),
    },
    {
      member:
        "routine:$extension:postgis._st_dwithinuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_dwithinuncached($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis._st_equals($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_equals($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis._st_expand($extension:postgis.geography,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_expand($extension:postgis.geography,pg_catalog.float8)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis._st_geomfromgml(pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis._st_geomfromgml(pg_catalog.text,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis._st_intersects($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_intersects($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis._st_linecrossingdirection($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_linecrossingdirection($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis._st_longestline($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_longestline($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis._st_maxdistance($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_maxdistance($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis._st_orderingequals($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_orderingequals($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis._st_overlaps($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_overlaps($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis._st_pointoutside($extension:postgis.geography)",
      expression: api.sql.overloads["routine:$extension:postgis._st_pointoutside($extension:postgis.geography)"](null),
    },
    {
      member: "routine:$extension:postgis._st_sortablehash($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis._st_sortablehash($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis._st_touches($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_touches($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis._st_voronoi($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_voronoi($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)"
      ](null, null, null, null),
    },
    {
      member: "routine:$extension:postgis._st_within($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis._st_within($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.box($extension:postgis.box3d)",
      expression: api.sql.overloads["routine:$extension:postgis.box($extension:postgis.box3d)"](null),
    },
    {
      member: "routine:$extension:postgis.box($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.box($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.box2d($extension:postgis.box3d)",
      expression: api.sql.overloads["routine:$extension:postgis.box2d($extension:postgis.box3d)"](null),
    },
    {
      member: "routine:$extension:postgis.box2d($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.box2d($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.box3d($extension:postgis.box2d)",
      expression: api.sql.overloads["routine:$extension:postgis.box3d($extension:postgis.box2d)"](null),
    },
    {
      member: "routine:$extension:postgis.box3d($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.box3d($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.box3dtobox($extension:postgis.box3d)",
      expression: api.sql.overloads["routine:$extension:postgis.box3dtobox($extension:postgis.box3d)"](null),
    },
    {
      member: "routine:$extension:postgis.bytea($extension:postgis.geography)",
      expression: api.sql.overloads["routine:$extension:postgis.bytea($extension:postgis.geography)"](null),
    },
    {
      member: "routine:$extension:postgis.bytea($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.bytea($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.contains_2d($extension:postgis.box2df,$extension:postgis.box2df)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.contains_2d($extension:postgis.box2df,$extension:postgis.box2df)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.contains_2d($extension:postgis.box2df,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.contains_2d($extension:postgis.box2df,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.contains_2d($extension:postgis.geometry,$extension:postgis.box2df)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.contains_2d($extension:postgis.geometry,$extension:postgis.box2df)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.equals($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.equals($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.find_srid(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.find_srid(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.geography_cmp($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geography_cmp($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.geography_distance_knn($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geography_distance_knn($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geography_eq($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geography_eq($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geography_ge($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geography_ge($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geography_gt($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geography_gt($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geography_le($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geography_le($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geography_lt($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geography_lt($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.geography_overlaps($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geography_overlaps($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geography_send($extension:postgis.geography)",
      expression: api.sql.overloads["routine:$extension:postgis.geography_send($extension:postgis.geography)"](null),
    },
    {
      member: "routine:$extension:postgis.geography($extension:postgis.geography,pg_catalog.int4,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geography($extension:postgis.geography,pg_catalog.int4,pg_catalog.bool)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.geography($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.geography($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.geography(pg_catalog.bytea)",
      expression: api.sql.overloads["routine:$extension:postgis.geography(pg_catalog.bytea)"](null),
    },
    {
      member: "routine:$extension:postgis.geometry_above($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_above($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geometry_below($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_below($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geometry_cmp($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_cmp($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.geometry_contained_3d($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_contained_3d($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.geometry_contains_3d($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_contains_3d($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.geometry_contains_nd($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_contains_nd($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geometry_contains($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_contains($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.geometry_distance_box($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_distance_box($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.geometry_distance_centroid_nd($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_distance_centroid_nd($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.geometry_distance_centroid($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_distance_centroid($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.geometry_distance_cpa($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_distance_cpa($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geometry_eq($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_eq($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geometry_ge($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_ge($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geometry_gt($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_gt($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geometry_hash($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.geometry_hash($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.geometry_le($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_le($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geometry_left($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_left($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geometry_lt($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_lt($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geometry_neq($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_neq($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geometry_overabove($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_overabove($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geometry_overbelow($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_overbelow($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.geometry_overlaps_3d($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_overlaps_3d($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.geometry_overlaps_nd($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_overlaps_nd($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geometry_overlaps($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_overlaps($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geometry_overleft($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_overleft($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geometry_overright($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_overright($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geometry_right($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_right($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geometry_same_3d($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_same_3d($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geometry_same_nd($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_same_nd($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geometry_same($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_same($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geometry_send($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.geometry_send($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.geometry_within_nd($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_within_nd($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geometry_within($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry_within($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.geometry($extension:postgis.box2d)",
      expression: api.sql.overloads["routine:$extension:postgis.geometry($extension:postgis.box2d)"](null),
    },
    {
      member: "routine:$extension:postgis.geometry($extension:postgis.box3d)",
      expression: api.sql.overloads["routine:$extension:postgis.geometry($extension:postgis.box3d)"](null),
    },
    {
      member: "routine:$extension:postgis.geometry($extension:postgis.geography)",
      expression: api.sql.overloads["routine:$extension:postgis.geometry($extension:postgis.geography)"](null),
    },
    {
      member: "routine:$extension:postgis.geometry($extension:postgis.geometry,pg_catalog.int4,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.geometry($extension:postgis.geometry,pg_catalog.int4,pg_catalog.bool)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.geometry(pg_catalog.bytea)",
      expression: api.sql.overloads["routine:$extension:postgis.geometry(pg_catalog.bytea)"](null),
    },
    {
      member: "routine:$extension:postgis.geometry(pg_catalog.path)",
      expression: api.sql.overloads["routine:$extension:postgis.geometry(pg_catalog.path)"](null),
    },
    {
      member: "routine:$extension:postgis.geometry(pg_catalog.point)",
      expression: api.sql.overloads["routine:$extension:postgis.geometry(pg_catalog.point)"](null),
    },
    {
      member: "routine:$extension:postgis.geometry(pg_catalog.polygon)",
      expression: api.sql.overloads["routine:$extension:postgis.geometry(pg_catalog.polygon)"](null),
    },
    {
      member: "routine:$extension:postgis.geometry(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.geometry(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.geometrytype($extension:postgis.geography)",
      expression: api.sql.overloads["routine:$extension:postgis.geometrytype($extension:postgis.geography)"](null),
    },
    {
      member: "routine:$extension:postgis.geometrytype($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.geometrytype($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.geomfromewkb(pg_catalog.bytea)",
      expression: api.sql.overloads["routine:$extension:postgis.geomfromewkb(pg_catalog.bytea)"](null),
    },
    {
      member: "routine:$extension:postgis.geomfromewkt(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.geomfromewkt(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.get_proj4_from_srid(pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.get_proj4_from_srid(pg_catalog.int4)"](null),
    },
    {
      member: "routine:$extension:postgis.is_contained_2d($extension:postgis.box2df,$extension:postgis.box2df)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.is_contained_2d($extension:postgis.box2df,$extension:postgis.box2df)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.is_contained_2d($extension:postgis.box2df,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.is_contained_2d($extension:postgis.box2df,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.is_contained_2d($extension:postgis.geometry,$extension:postgis.box2df)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.is_contained_2d($extension:postgis.geometry,$extension:postgis.box2df)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.json($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.json($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.jsonb($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.jsonb($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.overlaps_2d($extension:postgis.box2df,$extension:postgis.box2df)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.overlaps_2d($extension:postgis.box2df,$extension:postgis.box2df)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.overlaps_2d($extension:postgis.box2df,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.overlaps_2d($extension:postgis.box2df,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.overlaps_2d($extension:postgis.geometry,$extension:postgis.box2df)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.overlaps_2d($extension:postgis.geometry,$extension:postgis.box2df)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.overlaps_geog($extension:postgis.geography,$extension:postgis.gidx)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.overlaps_geog($extension:postgis.geography,$extension:postgis.gidx)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.overlaps_geog($extension:postgis.gidx,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.overlaps_geog($extension:postgis.gidx,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.overlaps_geog($extension:postgis.gidx,$extension:postgis.gidx)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.overlaps_geog($extension:postgis.gidx,$extension:postgis.gidx)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.overlaps_nd($extension:postgis.geometry,$extension:postgis.gidx)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.overlaps_nd($extension:postgis.geometry,$extension:postgis.gidx)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.overlaps_nd($extension:postgis.gidx,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.overlaps_nd($extension:postgis.gidx,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.overlaps_nd($extension:postgis.gidx,$extension:postgis.gidx)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.overlaps_nd($extension:postgis.gidx,$extension:postgis.gidx)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.path($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.path($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.point($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.point($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.polygon($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.polygon($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.postgis_addbbox($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_addbbox($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.postgis_constraint_dims(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.postgis_constraint_dims(pg_catalog.text,pg_catalog.text,pg_catalog.text)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.postgis_constraint_srid(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.postgis_constraint_srid(pg_catalog.text,pg_catalog.text,pg_catalog.text)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.postgis_constraint_type(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.postgis_constraint_type(pg_catalog.text,pg_catalog.text,pg_catalog.text)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.postgis_dropbbox($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_dropbbox($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.postgis_full_version()",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_full_version()"](),
    },
    {
      member: "routine:$extension:postgis.postgis_geos_compiled_version()",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_geos_compiled_version()"](),
    },
    {
      member: "routine:$extension:postgis.postgis_geos_noop($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_geos_noop($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.postgis_geos_version()",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_geos_version()"](),
    },
    {
      member: "routine:$extension:postgis.postgis_getbbox($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_getbbox($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.postgis_hasbbox($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_hasbbox($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.postgis_lib_build_date()",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_lib_build_date()"](),
    },
    {
      member: "routine:$extension:postgis.postgis_lib_revision()",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_lib_revision()"](),
    },
    {
      member: "routine:$extension:postgis.postgis_lib_version()",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_lib_version()"](),
    },
    {
      member: "routine:$extension:postgis.postgis_libjson_version()",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_libjson_version()"](),
    },
    {
      member: "routine:$extension:postgis.postgis_liblwgeom_version()",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_liblwgeom_version()"](),
    },
    {
      member: "routine:$extension:postgis.postgis_libprotobuf_version()",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_libprotobuf_version()"](),
    },
    {
      member: "routine:$extension:postgis.postgis_libxml_version()",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_libxml_version()"](),
    },
    {
      member: "routine:$extension:postgis.postgis_noop($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_noop($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.postgis_proj_compiled_version()",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_proj_compiled_version()"](),
    },
    {
      member: "routine:$extension:postgis.postgis_proj_version()",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_proj_version()"](),
    },
    {
      member: "routine:$extension:postgis.postgis_scripts_build_date()",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_scripts_build_date()"](),
    },
    {
      member: "routine:$extension:postgis.postgis_scripts_installed()",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_scripts_installed()"](),
    },
    {
      member: "routine:$extension:postgis.postgis_scripts_released()",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_scripts_released()"](),
    },
    {
      member: "routine:$extension:postgis.postgis_srs_all()",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_srs_all()"](),
    },
    {
      member: "routine:$extension:postgis.postgis_srs_codes(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_srs_codes(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.postgis_srs_search($extension:postgis.geometry,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.postgis_srs_search($extension:postgis.geometry,pg_catalog.text)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.postgis_srs(pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_srs(pg_catalog.text,pg_catalog.text)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.postgis_svn_version()",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_svn_version()"](),
    },
    {
      member:
        "routine:$extension:postgis.postgis_transform_geometry($extension:postgis.geometry,pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.postgis_transform_geometry($extension:postgis.geometry,pg_catalog.text,pg_catalog.text,pg_catalog.int4)"
      ](null, null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.postgis_transform_pipeline_geometry($extension:postgis.geometry,pg_catalog.text,pg_catalog.bool,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.postgis_transform_pipeline_geometry($extension:postgis.geometry,pg_catalog.text,pg_catalog.bool,pg_catalog.int4)"
      ](null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.postgis_type_name(pg_catalog.varchar,pg_catalog.int4,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.postgis_type_name(pg_catalog.varchar,pg_catalog.int4,pg_catalog.bool)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.postgis_typmod_dims(pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_typmod_dims(pg_catalog.int4)"](null),
    },
    {
      member: "routine:$extension:postgis.postgis_typmod_srid(pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_typmod_srid(pg_catalog.int4)"](null),
    },
    {
      member: "routine:$extension:postgis.postgis_typmod_type(pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_typmod_type(pg_catalog.int4)"](null),
    },
    {
      member: "routine:$extension:postgis.postgis_version()",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_version()"](),
    },
    {
      member: "routine:$extension:postgis.postgis_wagyu_version()",
      expression: api.sql.overloads["routine:$extension:postgis.postgis_wagyu_version()"](),
    },
    {
      member: "routine:$extension:postgis.st_3dclosestpoint($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_3dclosestpoint($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_3ddfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_3ddfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_3ddistance($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_3ddistance($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_3ddwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_3ddwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_3dextent($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_3dextent($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_3dintersects($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_3dintersects($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_3dlength($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_3dlength($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_3dlineinterpolatepoint($extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_3dlineinterpolatepoint($extension:postgis.geometry,pg_catalog.float8)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_3dlongestline($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_3dlongestline($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_3dmakebox($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_3dmakebox($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_3dmaxdistance($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_3dmaxdistance($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_3dperimeter($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_3dperimeter($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_3dshortestline($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_3dshortestline($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_addmeasure($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_addmeasure($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_addpoint($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_addpoint($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.int4)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_addpoint($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_addpoint($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_affine($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_affine($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null, null, null, null, null, null, null, null, null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_affine($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_affine($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null, null, null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_angle($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_angle($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_angle($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_angle($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_area($extension:postgis.geography,pg_catalog.bool)",
      expression: api.sql.overloads["routine:$extension:postgis.st_area($extension:postgis.geography,pg_catalog.bool)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_area($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_area($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_area(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_area(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_area2d($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_area2d($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_asbinary($extension:postgis.geography,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_asbinary($extension:postgis.geography,pg_catalog.text)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_asbinary($extension:postgis.geography)",
      expression: api.sql.overloads["routine:$extension:postgis.st_asbinary($extension:postgis.geography)"](null),
    },
    {
      member: "routine:$extension:postgis.st_asbinary($extension:postgis.geometry,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_asbinary($extension:postgis.geometry,pg_catalog.text)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_asbinary($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_asbinary($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_asencodedpolyline($extension:postgis.geometry,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_asencodedpolyline($extension:postgis.geometry,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_asewkb($extension:postgis.geometry,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_asewkb($extension:postgis.geometry,pg_catalog.text)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_asewkb($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_asewkb($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_asewkt($extension:postgis.geography,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_asewkt($extension:postgis.geography,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_asewkt($extension:postgis.geography)",
      expression: api.sql.overloads["routine:$extension:postgis.st_asewkt($extension:postgis.geography)"](null),
    },
    {
      member: "routine:$extension:postgis.st_asewkt($extension:postgis.geometry,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_asewkt($extension:postgis.geometry,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_asewkt($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_asewkt($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_asewkt(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_asewkt(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_asflatgeobuf(pg_catalog.anyelement,pg_catalog.bool,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_asflatgeobuf(pg_catalog.anyelement,pg_catalog.bool,pg_catalog.text)"
      ](sql`ROW(NULL::${sql.identifier(api.schema)}.geometry)`, null, null),
    },
    {
      member: "routine:$extension:postgis.st_asflatgeobuf(pg_catalog.anyelement,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_asflatgeobuf(pg_catalog.anyelement,pg_catalog.bool)"
      ](sql`ROW(NULL::${sql.identifier(api.schema)}.geometry)`, null),
    },
    {
      member: "routine:$extension:postgis.st_asflatgeobuf(pg_catalog.anyelement)",
      expression: api.sql.overloads["routine:$extension:postgis.st_asflatgeobuf(pg_catalog.anyelement)"](
        sql`ROW(NULL::${sql.identifier(api.schema)}.geometry)`,
      ),
    },
    {
      member: "routine:$extension:postgis.st_asgeobuf(pg_catalog.anyelement,pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_asgeobuf(pg_catalog.anyelement,pg_catalog.text)"](
        sql`ROW(NULL::${sql.identifier(api.schema)}.geometry)`,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_asgeobuf(pg_catalog.anyelement)",
      expression: api.sql.overloads["routine:$extension:postgis.st_asgeobuf(pg_catalog.anyelement)"](
        sql`ROW(NULL::${sql.identifier(api.schema)}.geometry)`,
      ),
    },
    {
      member: "routine:$extension:postgis.st_asgeojson($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_asgeojson($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_asgeojson($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_asgeojson($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_asgeojson(pg_catalog.record,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_asgeojson(pg_catalog.record,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.text)"
      ](sql`ROW(NULL::${sql.identifier(api.schema)}.geometry)`, null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_asgeojson(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_asgeojson(pg_catalog.text)"](null),
    },
    {
      member:
        "routine:$extension:postgis.st_asgml($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_asgml($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)"
      ](null, null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_asgml($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_asgml($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_asgml(pg_catalog.int4,$extension:postgis.geography,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_asgml(pg_catalog.int4,$extension:postgis.geography,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)"
      ](3, null, null, null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_asgml(pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_asgml(pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text)"
      ](3, null, null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_asgml(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_asgml(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_ashexewkb($extension:postgis.geometry,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_ashexewkb($extension:postgis.geometry,pg_catalog.text)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_ashexewkb($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_ashexewkb($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_askml($extension:postgis.geography,pg_catalog.int4,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_askml($extension:postgis.geography,pg_catalog.int4,pg_catalog.text)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_askml($extension:postgis.geometry,pg_catalog.int4,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_askml($extension:postgis.geometry,pg_catalog.int4,pg_catalog.text)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_askml(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_askml(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_aslatlontext($extension:postgis.geometry,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_aslatlontext($extension:postgis.geometry,pg_catalog.text)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_asmarc21($extension:postgis.geometry,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_asmarc21($extension:postgis.geometry,pg_catalog.text)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4,pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4,pg_catalog.text,pg_catalog.text)"
      ](sql`ROW(NULL::${sql.identifier(api.schema)}.geometry)`, null, null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4,pg_catalog.text)"
      ](sql`ROW(NULL::${sql.identifier(api.schema)}.geometry)`, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text,pg_catalog.int4)"
      ](sql`ROW(NULL::${sql.identifier(api.schema)}.geometry)`, null, null),
    },
    {
      member: "routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_asmvt(pg_catalog.anyelement,pg_catalog.text)"](
        sql`ROW(NULL::${sql.identifier(api.schema)}.geometry)`,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_asmvt(pg_catalog.anyelement)",
      expression: api.sql.overloads["routine:$extension:postgis.st_asmvt(pg_catalog.anyelement)"](
        sql`ROW(NULL::${sql.identifier(api.schema)}.geometry)`,
      ),
    },
    {
      member:
        "routine:$extension:postgis.st_asmvtgeom($extension:postgis.geometry,$extension:postgis.box2d,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_asmvtgeom($extension:postgis.geometry,$extension:postgis.box2d,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)"
      ](null, null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_assvg($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_assvg($extension:postgis.geography,pg_catalog.int4,pg_catalog.int4)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_assvg($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_assvg($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_assvg(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_assvg(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_astext($extension:postgis.geography,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_astext($extension:postgis.geography,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_astext($extension:postgis.geography)",
      expression: api.sql.overloads["routine:$extension:postgis.st_astext($extension:postgis.geography)"](null),
    },
    {
      member: "routine:$extension:postgis.st_astext($extension:postgis.geometry,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_astext($extension:postgis.geometry,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_astext($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_astext($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_astext(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_astext(pg_catalog.text)"](null),
    },
    {
      member:
        "routine:$extension:postgis.st_astwkb($extension:postgis._geometry,pg_catalog._int8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_astwkb($extension:postgis._geometry,pg_catalog._int8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"
      ](null, null, null, null, null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_astwkb($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_astwkb($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)"
      ](null, null, null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_asx3d($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_asx3d($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_azimuth($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_azimuth($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_azimuth($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_azimuth($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_bdmpolyfromtext(pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_bdmpolyfromtext(pg_catalog.text,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_bdpolyfromtext(pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_bdpolyfromtext(pg_catalog.text,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_boundary($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_boundary($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_boundingdiagonal($extension:postgis.geometry,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_boundingdiagonal($extension:postgis.geometry,pg_catalog.bool)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_box2dfromgeohash(pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_box2dfromgeohash(pg_catalog.text,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_buffer($extension:postgis.geography,pg_catalog.float8,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_buffer($extension:postgis.geography,pg_catalog.float8,pg_catalog.int4)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_buffer($extension:postgis.geography,pg_catalog.float8,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_buffer($extension:postgis.geography,pg_catalog.float8,pg_catalog.text)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_buffer($extension:postgis.geography,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_buffer($extension:postgis.geography,pg_catalog.float8)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_buffer($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_buffer($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_buffer($extension:postgis.geometry,pg_catalog.float8,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_buffer($extension:postgis.geometry,pg_catalog.float8,pg_catalog.text)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_buffer(pg_catalog.text,pg_catalog.float8,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_buffer(pg_catalog.text,pg_catalog.float8,pg_catalog.int4)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_buffer(pg_catalog.text,pg_catalog.float8,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_buffer(pg_catalog.text,pg_catalog.float8,pg_catalog.text)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_buffer(pg_catalog.text,pg_catalog.float8)",
      expression: api.sql.overloads["routine:$extension:postgis.st_buffer(pg_catalog.text,pg_catalog.float8)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_buildarea($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_buildarea($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_centroid($extension:postgis.geography,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_centroid($extension:postgis.geography,pg_catalog.bool)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_centroid($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_centroid($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_centroid(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_centroid(pg_catalog.text)"](null),
    },
    {
      member:
        "routine:$extension:postgis.st_chaikinsmoothing($extension:postgis.geometry,pg_catalog.int4,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_chaikinsmoothing($extension:postgis.geometry,pg_catalog.int4,pg_catalog.bool)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_cleangeometry($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_cleangeometry($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_clipbybox2d($extension:postgis.geometry,$extension:postgis.box2d)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_clipbybox2d($extension:postgis.geometry,$extension:postgis.box2d)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_closestpoint($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_closestpoint($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_closestpoint($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_closestpoint($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_closestpoint(pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_closestpoint(pg_catalog.text,pg_catalog.text)"](
        null,
        null,
      ),
    },
    {
      member:
        "routine:$extension:postgis.st_closestpointofapproach($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_closestpointofapproach($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_clusterdbscan($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_clusterdbscan($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)"
      ]({}, null, 1, 1),
    },
    {
      member: "routine:$extension:postgis.st_clusterintersecting($extension:postgis._geometry)",
      expression:
        api.sql.overloads["routine:$extension:postgis.st_clusterintersecting($extension:postgis._geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_clusterintersecting($extension:postgis.geometry)",
      expression:
        api.sql.overloads["routine:$extension:postgis.st_clusterintersecting($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_clusterintersectingwin($extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_clusterintersectingwin($extension:postgis.geometry)"
      ]({}, null),
    },
    {
      member:
        "routine:$extension:postgis.st_clusterkmeans($extension:postgis.geometry,pg_catalog.int4,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_clusterkmeans($extension:postgis.geometry,pg_catalog.int4,pg_catalog.float8)"
      ]({}, null, 1, 1),
    },
    {
      member: "routine:$extension:postgis.st_clusterwithin($extension:postgis._geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_clusterwithin($extension:postgis._geometry,pg_catalog.float8)"
      ](null, 1),
    },
    {
      member: "routine:$extension:postgis.st_clusterwithin($extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_clusterwithin($extension:postgis.geometry,pg_catalog.float8)"
      ](null, 1),
    },
    {
      member: "routine:$extension:postgis.st_clusterwithinwin($extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_clusterwithinwin($extension:postgis.geometry,pg_catalog.float8)"
      ]({}, null, 1),
    },
    {
      member: "routine:$extension:postgis.st_collect($extension:postgis._geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_collect($extension:postgis._geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_collect($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_collect($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_collect($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_collect($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_collectionextract($extension:postgis.geometry,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_collectionextract($extension:postgis.geometry,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_collectionextract($extension:postgis.geometry)",
      expression:
        api.sql.overloads["routine:$extension:postgis.st_collectionextract($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_collectionhomogenize($extension:postgis.geometry)",
      expression:
        api.sql.overloads["routine:$extension:postgis.st_collectionhomogenize($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_combinebbox($extension:postgis.box2d,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_combinebbox($extension:postgis.box2d,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_combinebbox($extension:postgis.box3d,$extension:postgis.box3d)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_combinebbox($extension:postgis.box3d,$extension:postgis.box3d)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_combinebbox($extension:postgis.box3d,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_combinebbox($extension:postgis.box3d,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_concavehull($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_concavehull($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_contains($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_contains($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_containsproperly($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_containsproperly($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_convexhull($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_convexhull($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_coorddim($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_coorddim($extension:postgis.geometry)"](null),
    },
    {
      member:
        "routine:$extension:postgis.st_coverageclean($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_coverageclean($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.text)"
      ]({}, null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_coverageinvalidedges($extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_coverageinvalidedges($extension:postgis.geometry,pg_catalog.float8)"
      ]({}, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_coveragesimplify($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_coveragesimplify($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)"
      ]({}, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_coverageunion($extension:postgis._geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_coverageunion($extension:postgis._geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_coverageunion($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_coverageunion($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_coveredby($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_coveredby($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_coveredby($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_coveredby($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_coveredby(pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_coveredby(pg_catalog.text,pg_catalog.text)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_covers($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_covers($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_covers($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_covers($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_covers(pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_covers(pg_catalog.text,pg_catalog.text)"](
        null,
        null,
      ),
    },
    {
      member:
        "routine:$extension:postgis.st_cpawithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_cpawithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_crosses($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_crosses($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_curven($extension:postgis.geometry,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_curven($extension:postgis.geometry,pg_catalog.int4)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_curvetoline($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_curvetoline($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)"
      ](null, null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_delaunaytriangles($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_delaunaytriangles($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_dfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_dfullywithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_difference($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_difference($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_dimension($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_dimension($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_disjoint($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_disjoint($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_distance($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_distance($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_distance($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_distance($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_distance(pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_distance(pg_catalog.text,pg_catalog.text)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_distancecpa($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_distancecpa($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_distancesphere($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_distancesphere($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_distancesphere($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_distancesphere($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_distancespheroid($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.spheroid)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_distancespheroid($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.spheroid)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_distancespheroid($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_distancespheroid($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_dump($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_dump($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_dumppoints($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_dumppoints($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_dumprings($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_dumprings($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_dumpsegments($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_dumpsegments($extension:postgis.geometry)"](null),
    },
    {
      member:
        "routine:$extension:postgis.st_dwithin($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_dwithin($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)"
      ](null, null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_dwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_dwithin($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_dwithin(pg_catalog.text,pg_catalog.text,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_dwithin(pg_catalog.text,pg_catalog.text,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_endpoint($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_endpoint($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_envelope($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_envelope($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_equals($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_equals($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_estimatedextent(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_estimatedextent(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)"
      ](null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_estimatedextent(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_estimatedextent(pg_catalog.text,pg_catalog.text,pg_catalog.text)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_estimatedextent(pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_estimatedextent(pg_catalog.text,pg_catalog.text)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_expand($extension:postgis.box2d,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_expand($extension:postgis.box2d,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_expand($extension:postgis.box2d,pg_catalog.float8)",
      expression: api.sql.overloads["routine:$extension:postgis.st_expand($extension:postgis.box2d,pg_catalog.float8)"](
        null,
        null,
      ),
    },
    {
      member:
        "routine:$extension:postgis.st_expand($extension:postgis.box3d,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_expand($extension:postgis.box3d,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_expand($extension:postgis.box3d,pg_catalog.float8)",
      expression: api.sql.overloads["routine:$extension:postgis.st_expand($extension:postgis.box3d,pg_catalog.float8)"](
        null,
        null,
      ),
    },
    {
      member:
        "routine:$extension:postgis.st_expand($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_expand($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_expand($extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_expand($extension:postgis.geometry,pg_catalog.float8)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_extent($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_extent($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_exteriorring($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_exteriorring($extension:postgis.geometry)"](null),
    },
    {
      member:
        "routine:$extension:postgis.st_filterbym($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_filterbym($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)"
      ](null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_findextent(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_findextent(pg_catalog.text,pg_catalog.text,pg_catalog.text)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_findextent(pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_findextent(pg_catalog.text,pg_catalog.text)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_flipcoordinates($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_flipcoordinates($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_force2d($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_force2d($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_force3d($extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_force3d($extension:postgis.geometry,pg_catalog.float8)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_force3dm($extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_force3dm($extension:postgis.geometry,pg_catalog.float8)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_force3dz($extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_force3dz($extension:postgis.geometry,pg_catalog.float8)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_force4d($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_force4d($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_forcecollection($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_forcecollection($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_forcecurve($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_forcecurve($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_forcepolygonccw($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_forcepolygonccw($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_forcepolygoncw($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_forcepolygoncw($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_forcerhr($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_forcerhr($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_forcesfs($extension:postgis.geometry,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_forcesfs($extension:postgis.geometry,pg_catalog.text)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_forcesfs($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_forcesfs($extension:postgis.geometry)"](null),
    },
    {
      member:
        "routine:$extension:postgis.st_frechetdistance($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_frechetdistance($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_generatepoints($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_generatepoints($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_generatepoints($extension:postgis.geometry,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_generatepoints($extension:postgis.geometry,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_geogfromtext(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geogfromtext(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_geogfromwkb(pg_catalog.bytea)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geogfromwkb(pg_catalog.bytea)"](null),
    },
    {
      member: "routine:$extension:postgis.st_geographyfromtext(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geographyfromtext(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_geohash($extension:postgis.geography,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_geohash($extension:postgis.geography,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_geohash($extension:postgis.geometry,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_geohash($extension:postgis.geometry,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_geomcollfromtext(pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geomcollfromtext(pg_catalog.text,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_geomcollfromtext(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geomcollfromtext(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_geomcollfromwkb(pg_catalog.bytea,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geomcollfromwkb(pg_catalog.bytea,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_geomcollfromwkb(pg_catalog.bytea)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geomcollfromwkb(pg_catalog.bytea)"](null),
    },
    {
      member:
        "routine:$extension:postgis.st_geometricmedian($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_geometricmedian($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)"
      ](null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_geometryfromtext(pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geometryfromtext(pg_catalog.text,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_geometryfromtext(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geometryfromtext(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_geometryn($extension:postgis.geometry,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_geometryn($extension:postgis.geometry,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_geometrytype($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geometrytype($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_geomfromewkb(pg_catalog.bytea)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geomfromewkb(pg_catalog.bytea)"](null),
    },
    {
      member: "routine:$extension:postgis.st_geomfromewkt(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geomfromewkt(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_geomfromgeohash(pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geomfromgeohash(pg_catalog.text,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_geomfromgeojson(pg_catalog.json)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geomfromgeojson(pg_catalog.json)"](null),
    },
    {
      member: "routine:$extension:postgis.st_geomfromgeojson(pg_catalog.jsonb)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geomfromgeojson(pg_catalog.jsonb)"](null),
    },
    {
      member: "routine:$extension:postgis.st_geomfromgeojson(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geomfromgeojson(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_geomfromgml(pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geomfromgml(pg_catalog.text,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_geomfromgml(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geomfromgml(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_geomfromkml(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geomfromkml(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_geomfrommarc21(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geomfrommarc21(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_geomfromtext(pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geomfromtext(pg_catalog.text,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_geomfromtext(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geomfromtext(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_geomfromtwkb(pg_catalog.bytea)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geomfromtwkb(pg_catalog.bytea)"](null),
    },
    {
      member: "routine:$extension:postgis.st_geomfromwkb(pg_catalog.bytea,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geomfromwkb(pg_catalog.bytea,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_geomfromwkb(pg_catalog.bytea)",
      expression: api.sql.overloads["routine:$extension:postgis.st_geomfromwkb(pg_catalog.bytea)"](null),
    },
    {
      member: "routine:$extension:postgis.st_gmltosql(pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_gmltosql(pg_catalog.text,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_gmltosql(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_gmltosql(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_hasarc($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_hasarc($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_hasm($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_hasm($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_hasz($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_hasz($extension:postgis.geometry)"](null),
    },
    {
      member:
        "routine:$extension:postgis.st_hausdorffdistance($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_hausdorffdistance($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_hausdorffdistance($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_hausdorffdistance($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_hexagon(pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_hexagon(pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,$extension:postgis.geometry)"
      ](null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_hexagongrid(pg_catalog.float8,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_hexagongrid(pg_catalog.float8,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_interiorringn($extension:postgis.geometry,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_interiorringn($extension:postgis.geometry,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_interpolatepoint($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_interpolatepoint($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_intersection($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_intersection($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_intersection($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_intersection($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_intersection(pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_intersection(pg_catalog.text,pg_catalog.text)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_intersects($extension:postgis.geography,$extension:postgis.geography)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_intersects($extension:postgis.geography,$extension:postgis.geography)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_intersects($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_intersects($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_intersects(pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_intersects(pg_catalog.text,pg_catalog.text)"](
        null,
        null,
      ),
    },
    {
      member:
        "routine:$extension:postgis.st_inversetransformpipeline($extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_inversetransformpipeline($extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_isclosed($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_isclosed($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_iscollection($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_iscollection($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_isempty($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_isempty($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_ispolygonccw($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_ispolygonccw($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_ispolygoncw($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_ispolygoncw($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_isring($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_isring($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_issimple($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_issimple($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_isvalid($extension:postgis.geometry,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_isvalid($extension:postgis.geometry,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_isvalid($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_isvalid($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_isvaliddetail($extension:postgis.geometry,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_isvaliddetail($extension:postgis.geometry,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_isvalidreason($extension:postgis.geometry,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_isvalidreason($extension:postgis.geometry,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_isvalidreason($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_isvalidreason($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_isvalidtrajectory($extension:postgis.geometry)",
      expression:
        api.sql.overloads["routine:$extension:postgis.st_isvalidtrajectory($extension:postgis.geometry)"](null),
    },
    {
      member:
        "routine:$extension:postgis.st_largestemptycircle($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_largestemptycircle($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_length($extension:postgis.geography,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_length($extension:postgis.geography,pg_catalog.bool)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_length($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_length($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_length(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_length(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_length2d($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_length2d($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_length2dspheroid($extension:postgis.geometry,$extension:postgis.spheroid)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_length2dspheroid($extension:postgis.geometry,$extension:postgis.spheroid)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_lengthspheroid($extension:postgis.geometry,$extension:postgis.spheroid)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_lengthspheroid($extension:postgis.geometry,$extension:postgis.spheroid)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_letters(pg_catalog.text,pg_catalog.json)",
      expression: api.sql.overloads["routine:$extension:postgis.st_letters(pg_catalog.text,pg_catalog.json)"](
        null,
        null,
      ),
    },
    {
      member:
        "routine:$extension:postgis.st_linecrossingdirection($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_linecrossingdirection($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_lineextend($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_lineextend($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_linefromencodedpolyline(pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_linefromencodedpolyline(pg_catalog.text,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_linefrommultipoint($extension:postgis.geometry)",
      expression:
        api.sql.overloads["routine:$extension:postgis.st_linefrommultipoint($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_linefromtext(pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_linefromtext(pg_catalog.text,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_linefromtext(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_linefromtext(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_linefromwkb(pg_catalog.bytea,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_linefromwkb(pg_catalog.bytea,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_linefromwkb(pg_catalog.bytea)",
      expression: api.sql.overloads["routine:$extension:postgis.st_linefromwkb(pg_catalog.bytea)"](null),
    },
    {
      member:
        "routine:$extension:postgis.st_lineinterpolatepoint($extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_lineinterpolatepoint($extension:postgis.geography,pg_catalog.float8,pg_catalog.bool)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_lineinterpolatepoint($extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_lineinterpolatepoint($extension:postgis.geometry,pg_catalog.float8)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_lineinterpolatepoint(pg_catalog.text,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_lineinterpolatepoint(pg_catalog.text,pg_catalog.float8)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_lineinterpolatepoints($extension:postgis.geography,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_lineinterpolatepoints($extension:postgis.geography,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)"
      ](null, null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_lineinterpolatepoints($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_lineinterpolatepoints($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_lineinterpolatepoints(pg_catalog.text,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_lineinterpolatepoints(pg_catalog.text,pg_catalog.float8)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_linelocatepoint($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_linelocatepoint($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_linelocatepoint($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_linelocatepoint($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_linelocatepoint(pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_linelocatepoint(pg_catalog.text,pg_catalog.text)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_linemerge($extension:postgis.geometry,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_linemerge($extension:postgis.geometry,pg_catalog.bool)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_linemerge($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_linemerge($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_linestringfromwkb(pg_catalog.bytea,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_linestringfromwkb(pg_catalog.bytea,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_linestringfromwkb(pg_catalog.bytea)",
      expression: api.sql.overloads["routine:$extension:postgis.st_linestringfromwkb(pg_catalog.bytea)"](null),
    },
    {
      member:
        "routine:$extension:postgis.st_linesubstring($extension:postgis.geography,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_linesubstring($extension:postgis.geography,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_linesubstring($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_linesubstring($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_linesubstring(pg_catalog.text,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_linesubstring(pg_catalog.text,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_linetocurve($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_linetocurve($extension:postgis.geometry)"](null),
    },
    {
      member:
        "routine:$extension:postgis.st_locatealong($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_locatealong($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_locatebetween($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_locatebetween($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_locatebetweenelevations($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_locatebetweenelevations($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_longestline($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_longestline($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_m($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_m($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_makebox2d($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_makebox2d($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_makeenvelope(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_makeenvelope(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)"
      ](null, null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_makeline($extension:postgis._geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_makeline($extension:postgis._geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_makeline($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_makeline($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_makeline($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_makeline($extension:postgis.geometry)"](null),
    },
    {
      member:
        "routine:$extension:postgis.st_makepoint(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_makepoint(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_makepoint(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_makepoint(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_makepoint(pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads["routine:$extension:postgis.st_makepoint(pg_catalog.float8,pg_catalog.float8)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_makepointm(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_makepointm(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_makepolygon($extension:postgis.geometry,$extension:postgis._geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_makepolygon($extension:postgis.geometry,$extension:postgis._geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_makepolygon($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_makepolygon($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_makevalid($extension:postgis.geometry,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_makevalid($extension:postgis.geometry,pg_catalog.text)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_makevalid($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_makevalid($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_maxdistance($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_maxdistance($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_maximuminscribedcircle($extension:postgis.geometry)",
      expression:
        api.sql.overloads["routine:$extension:postgis.st_maximuminscribedcircle($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_memcollect($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_memcollect($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_memsize($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_memsize($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_memunion($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_memunion($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_minimumboundingcircle($extension:postgis.geometry,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_minimumboundingcircle($extension:postgis.geometry,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_minimumboundingradius($extension:postgis.geometry)",
      expression:
        api.sql.overloads["routine:$extension:postgis.st_minimumboundingradius($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_minimumclearance($extension:postgis.geometry)",
      expression:
        api.sql.overloads["routine:$extension:postgis.st_minimumclearance($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_minimumclearanceline($extension:postgis.geometry)",
      expression:
        api.sql.overloads["routine:$extension:postgis.st_minimumclearanceline($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_mlinefromtext(pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_mlinefromtext(pg_catalog.text,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_mlinefromtext(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_mlinefromtext(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_mlinefromwkb(pg_catalog.bytea,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_mlinefromwkb(pg_catalog.bytea,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_mlinefromwkb(pg_catalog.bytea)",
      expression: api.sql.overloads["routine:$extension:postgis.st_mlinefromwkb(pg_catalog.bytea)"](null),
    },
    {
      member: "routine:$extension:postgis.st_mpointfromtext(pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_mpointfromtext(pg_catalog.text,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_mpointfromtext(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_mpointfromtext(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_mpointfromwkb(pg_catalog.bytea,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_mpointfromwkb(pg_catalog.bytea,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_mpointfromwkb(pg_catalog.bytea)",
      expression: api.sql.overloads["routine:$extension:postgis.st_mpointfromwkb(pg_catalog.bytea)"](null),
    },
    {
      member: "routine:$extension:postgis.st_mpolyfromtext(pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_mpolyfromtext(pg_catalog.text,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_mpolyfromtext(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_mpolyfromtext(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_mpolyfromwkb(pg_catalog.bytea,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_mpolyfromwkb(pg_catalog.bytea,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_mpolyfromwkb(pg_catalog.bytea)",
      expression: api.sql.overloads["routine:$extension:postgis.st_mpolyfromwkb(pg_catalog.bytea)"](null),
    },
    {
      member: "routine:$extension:postgis.st_multi($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_multi($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_multilinefromwkb(pg_catalog.bytea)",
      expression: api.sql.overloads["routine:$extension:postgis.st_multilinefromwkb(pg_catalog.bytea)"](null),
    },
    {
      member: "routine:$extension:postgis.st_multilinestringfromtext(pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_multilinestringfromtext(pg_catalog.text,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_multilinestringfromtext(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_multilinestringfromtext(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_multipointfromtext(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_multipointfromtext(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_multipointfromwkb(pg_catalog.bytea,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_multipointfromwkb(pg_catalog.bytea,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_multipointfromwkb(pg_catalog.bytea)",
      expression: api.sql.overloads["routine:$extension:postgis.st_multipointfromwkb(pg_catalog.bytea)"](null),
    },
    {
      member: "routine:$extension:postgis.st_multipolyfromwkb(pg_catalog.bytea,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_multipolyfromwkb(pg_catalog.bytea,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_multipolyfromwkb(pg_catalog.bytea)",
      expression: api.sql.overloads["routine:$extension:postgis.st_multipolyfromwkb(pg_catalog.bytea)"](null),
    },
    {
      member: "routine:$extension:postgis.st_multipolygonfromtext(pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_multipolygonfromtext(pg_catalog.text,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_multipolygonfromtext(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_multipolygonfromtext(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_ndims($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_ndims($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_node($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_node($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_normalize($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_normalize($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_npoints($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_npoints($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_nrings($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_nrings($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_numcurves($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_numcurves($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_numgeometries($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_numgeometries($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_numinteriorring($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_numinteriorring($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_numinteriorrings($extension:postgis.geometry)",
      expression:
        api.sql.overloads["routine:$extension:postgis.st_numinteriorrings($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_numpatches($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_numpatches($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_numpoints($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_numpoints($extension:postgis.geometry)"](null),
    },
    {
      member:
        "routine:$extension:postgis.st_offsetcurve($extension:postgis.geometry,pg_catalog.float8,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_offsetcurve($extension:postgis.geometry,pg_catalog.float8,pg_catalog.text)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_orderingequals($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_orderingequals($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_orientedenvelope($extension:postgis.geometry)",
      expression:
        api.sql.overloads["routine:$extension:postgis.st_orientedenvelope($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_overlaps($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_overlaps($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_patchn($extension:postgis.geometry,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_patchn($extension:postgis.geometry,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_perimeter($extension:postgis.geography,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_perimeter($extension:postgis.geography,pg_catalog.bool)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_perimeter($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_perimeter($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_perimeter2d($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_perimeter2d($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_point(pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_point(pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_point(pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads["routine:$extension:postgis.st_point(pg_catalog.float8,pg_catalog.float8)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_pointfromgeohash(pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_pointfromgeohash(pg_catalog.text,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_pointfromtext(pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_pointfromtext(pg_catalog.text,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_pointfromtext(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_pointfromtext(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_pointfromwkb(pg_catalog.bytea,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_pointfromwkb(pg_catalog.bytea,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_pointfromwkb(pg_catalog.bytea)",
      expression: api.sql.overloads["routine:$extension:postgis.st_pointfromwkb(pg_catalog.bytea)"](null),
    },
    {
      member:
        "routine:$extension:postgis.st_pointinsidecircle($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_pointinsidecircle($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_pointm(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_pointm(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)"
      ](null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_pointn($extension:postgis.geometry,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_pointn($extension:postgis.geometry,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_pointonsurface($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_pointonsurface($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_points($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_points($extension:postgis.geometry)"](null),
    },
    {
      member:
        "routine:$extension:postgis.st_pointz(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_pointz(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)"
      ](null, null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_pointzm(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_pointzm(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)"
      ](null, null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_polyfromtext(pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_polyfromtext(pg_catalog.text,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_polyfromtext(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_polyfromtext(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_polyfromwkb(pg_catalog.bytea,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_polyfromwkb(pg_catalog.bytea,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_polyfromwkb(pg_catalog.bytea)",
      expression: api.sql.overloads["routine:$extension:postgis.st_polyfromwkb(pg_catalog.bytea)"](null),
    },
    {
      member: "routine:$extension:postgis.st_polygon($extension:postgis.geometry,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_polygon($extension:postgis.geometry,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_polygonfromtext(pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_polygonfromtext(pg_catalog.text,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_polygonfromtext(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_polygonfromtext(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_polygonfromwkb(pg_catalog.bytea,pg_catalog.int4)",
      expression: api.sql.overloads["routine:$extension:postgis.st_polygonfromwkb(pg_catalog.bytea,pg_catalog.int4)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_polygonfromwkb(pg_catalog.bytea)",
      expression: api.sql.overloads["routine:$extension:postgis.st_polygonfromwkb(pg_catalog.bytea)"](null),
    },
    {
      member: "routine:$extension:postgis.st_polygonize($extension:postgis._geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_polygonize($extension:postgis._geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_polygonize($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_polygonize($extension:postgis.geometry)"](null),
    },
    {
      member:
        "routine:$extension:postgis.st_project($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_project($extension:postgis.geography,$extension:postgis.geography,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_project($extension:postgis.geography,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_project($extension:postgis.geography,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_project($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_project($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_project($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_project($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_quantizecoordinates($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_quantizecoordinates($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)"
      ](null, null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_reduceprecision($extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_reduceprecision($extension:postgis.geometry,pg_catalog.float8)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_relate($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_relate($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.int4)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_relate($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_relate($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.text)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_relate($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_relate($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_relatematch(pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_relatematch(pg_catalog.text,pg_catalog.text)"](
        null,
        null,
      ),
    },
    {
      member:
        "routine:$extension:postgis.st_removeirrelevantpointsforview($extension:postgis.geometry,$extension:postgis.box2d,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_removeirrelevantpointsforview($extension:postgis.geometry,$extension:postgis.box2d,pg_catalog.bool)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_removepoint($extension:postgis.geometry,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_removepoint($extension:postgis.geometry,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_removerepeatedpoints($extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_removerepeatedpoints($extension:postgis.geometry,pg_catalog.float8)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_removesmallparts($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_removesmallparts($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_reverse($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_reverse($extension:postgis.geometry)"](null),
    },
    {
      member:
        "routine:$extension:postgis.st_rotate($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_rotate($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_rotate($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_rotate($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_rotate($extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_rotate($extension:postgis.geometry,pg_catalog.float8)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_rotatex($extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_rotatex($extension:postgis.geometry,pg_catalog.float8)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_rotatey($extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_rotatey($extension:postgis.geometry,pg_catalog.float8)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_rotatez($extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_rotatez($extension:postgis.geometry,pg_catalog.float8)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_scale($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_scale($extension:postgis.geometry,$extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_scale($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_scale($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_scale($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_scale($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_scale($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_scale($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_scroll($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_scroll($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_segmentize($extension:postgis.geography,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_segmentize($extension:postgis.geography,pg_catalog.float8)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_segmentize($extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_segmentize($extension:postgis.geometry,pg_catalog.float8)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_seteffectivearea($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_seteffectivearea($extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_setpoint($extension:postgis.geometry,pg_catalog.int4,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_setpoint($extension:postgis.geometry,pg_catalog.int4,$extension:postgis.geometry)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_setsrid($extension:postgis.geography,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_setsrid($extension:postgis.geography,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_setsrid($extension:postgis.geometry,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_setsrid($extension:postgis.geometry,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_sharedpaths($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_sharedpaths($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_shiftlongitude($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_shiftlongitude($extension:postgis.geometry)"](null),
    },
    {
      member:
        "routine:$extension:postgis.st_shortestline($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_shortestline($extension:postgis.geography,$extension:postgis.geography,pg_catalog.bool)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_shortestline($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_shortestline($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_shortestline(pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_shortestline(pg_catalog.text,pg_catalog.text)"](
        null,
        null,
      ),
    },
    {
      member: "routine:$extension:postgis.st_simplify($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_simplify($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_simplify($extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_simplify($extension:postgis.geometry,pg_catalog.float8)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_simplifypolygonhull($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_simplifypolygonhull($extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_simplifypreservetopology($extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_simplifypreservetopology($extension:postgis.geometry,pg_catalog.float8)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_simplifyvw($extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_simplifyvw($extension:postgis.geometry,pg_catalog.float8)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_snap($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_snap($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null, null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_snaptogrid($extension:postgis.geometry,pg_catalog.float8)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_split($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_split($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_square(pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_square(pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,$extension:postgis.geometry)"
      ](null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_squaregrid(pg_catalog.float8,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_squaregrid(pg_catalog.float8,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_srid($extension:postgis.geography)",
      expression: api.sql.overloads["routine:$extension:postgis.st_srid($extension:postgis.geography)"](null),
    },
    {
      member: "routine:$extension:postgis.st_srid($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_srid($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_startpoint($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_startpoint($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_subdivide($extension:postgis.geometry,pg_catalog.int4,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_subdivide($extension:postgis.geometry,pg_catalog.int4,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_summary($extension:postgis.geography)",
      expression: api.sql.overloads["routine:$extension:postgis.st_summary($extension:postgis.geography)"](null),
    },
    {
      member: "routine:$extension:postgis.st_summary($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_summary($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_swapordinates($extension:postgis.geometry,pg_catalog.cstring)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_swapordinates($extension:postgis.geometry,pg_catalog.cstring)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_symdifference($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_symdifference($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_symmetricdifference($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_symmetricdifference($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_tileenvelope(pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_tileenvelope(pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.float8)"
      ](null, null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_touches($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_touches($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.int4)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.text,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.text,pg_catalog.text)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.text)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_transform($extension:postgis.geometry,pg_catalog.text)"
      ](null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_transformpipeline($extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_transformpipeline($extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_translate($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_translate($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_translate($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_translate($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_transscale($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_transscale($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_triangulatepolygon($extension:postgis.geometry)",
      expression:
        api.sql.overloads["routine:$extension:postgis.st_triangulatepolygon($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_unaryunion($extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_unaryunion($extension:postgis.geometry,pg_catalog.float8)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_union($extension:postgis._geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_union($extension:postgis._geometry)"](null),
    },
    {
      member:
        "routine:$extension:postgis.st_union($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_union($extension:postgis.geometry,$extension:postgis.geometry,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_union($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_union($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_union($extension:postgis.geometry,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_union($extension:postgis.geometry,pg_catalog.float8)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_union($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_union($extension:postgis.geometry)"](null),
    },
    {
      member:
        "routine:$extension:postgis.st_voronoilines($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_voronoilines($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)"
      ](null, null, null),
    },
    {
      member:
        "routine:$extension:postgis.st_voronoipolygons($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_voronoipolygons($extension:postgis.geometry,pg_catalog.float8,$extension:postgis.geometry)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_within($extension:postgis.geometry,$extension:postgis.geometry)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_within($extension:postgis.geometry,$extension:postgis.geometry)"
      ](null, null),
    },
    {
      member: "routine:$extension:postgis.st_wkbtosql(pg_catalog.bytea)",
      expression: api.sql.overloads["routine:$extension:postgis.st_wkbtosql(pg_catalog.bytea)"](null),
    },
    {
      member: "routine:$extension:postgis.st_wkttosql(pg_catalog.text)",
      expression: api.sql.overloads["routine:$extension:postgis.st_wkttosql(pg_catalog.text)"](null),
    },
    {
      member: "routine:$extension:postgis.st_wrapx($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)",
      expression: api.sql.overloads[
        "routine:$extension:postgis.st_wrapx($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8)"
      ](null, null, null),
    },
    {
      member: "routine:$extension:postgis.st_x($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_x($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_xmax($extension:postgis.box3d)",
      expression: api.sql.overloads["routine:$extension:postgis.st_xmax($extension:postgis.box3d)"](null),
    },
    {
      member: "routine:$extension:postgis.st_xmin($extension:postgis.box3d)",
      expression: api.sql.overloads["routine:$extension:postgis.st_xmin($extension:postgis.box3d)"](null),
    },
    {
      member: "routine:$extension:postgis.st_y($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_y($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_ymax($extension:postgis.box3d)",
      expression: api.sql.overloads["routine:$extension:postgis.st_ymax($extension:postgis.box3d)"](null),
    },
    {
      member: "routine:$extension:postgis.st_ymin($extension:postgis.box3d)",
      expression: api.sql.overloads["routine:$extension:postgis.st_ymin($extension:postgis.box3d)"](null),
    },
    {
      member: "routine:$extension:postgis.st_z($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_z($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_zmax($extension:postgis.box3d)",
      expression: api.sql.overloads["routine:$extension:postgis.st_zmax($extension:postgis.box3d)"](null),
    },
    {
      member: "routine:$extension:postgis.st_zmflag($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.st_zmflag($extension:postgis.geometry)"](null),
    },
    {
      member: "routine:$extension:postgis.st_zmin($extension:postgis.box3d)",
      expression: api.sql.overloads["routine:$extension:postgis.st_zmin($extension:postgis.box3d)"](null),
    },
    {
      member: "routine:$extension:postgis.text($extension:postgis.geometry)",
      expression: api.sql.overloads["routine:$extension:postgis.text($extension:postgis.geometry)"](null),
    },
  ];
}
