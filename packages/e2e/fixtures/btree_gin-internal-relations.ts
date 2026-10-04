import type { ExtensionProofDeclaration } from "../../../apps/loom/src/tooling/extensions/semantic-proof";
type Relation = Extract<
  ExtensionProofDeclaration,
  { state: "candidate" }
>["members"][number]["transfers"][number]["relation"];
/** Exact captured catalog edges; no inferred name-prefix coverage. */
export const btreeGinInternalRelations = {
  'function of access method:function 1 (bigint, bigint) of "$extension:btree_gin".int8_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int8_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int8_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "int8",
          },
          right: {
            namespace: "pg_catalog",
            name: "int8",
          },
          number: 1,
          procedure: "pg_catalog.btint8cmp(pg_catalog.int8,pg_catalog.int8)",
        },
      },
    },
  ],
  'function of access method:function 1 (bit varying, bit varying) of "$extension:btree_gin".varbit_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.varbit_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.varbit_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          right: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          number: 1,
          procedure: "pg_catalog.varbitcmp(pg_catalog.varbit,pg_catalog.varbit)",
        },
      },
    },
  ],
  'function of access method:function 1 (bit, bit) of "$extension:btree_gin".bit_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bit_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bit_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "bit",
          },
          right: {
            namespace: "pg_catalog",
            name: "bit",
          },
          number: 1,
          procedure: "pg_catalog.bitcmp(pg_catalog.bit,pg_catalog.bit)",
        },
      },
    },
  ],
  'function of access method:function 1 (boolean, boolean) of "$extension:btree_gin".bool_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bool_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bool_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "bool",
          },
          right: {
            namespace: "pg_catalog",
            name: "bool",
          },
          number: 1,
          procedure: "pg_catalog.btboolcmp(pg_catalog.bool,pg_catalog.bool)",
        },
      },
    },
  ],
  'function of access method:function 1 (character varying, character varying) of "$extension:btree_gin".varchar_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.varchar_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.varchar_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "varchar",
            },
            right: {
              namespace: "pg_catalog",
              name: "varchar",
            },
            number: 1,
            procedure: "pg_catalog.bttextcmp(pg_catalog.text,pg_catalog.text)",
          },
        },
      },
    ],
  'function of access method:function 1 (character, character) of "$extension:btree_gin".bpchar_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bpchar_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bpchar_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          right: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          number: 1,
          procedure: "pg_catalog.bpcharcmp(pg_catalog.bpchar,pg_catalog.bpchar)",
        },
      },
    },
  ],
  'function of access method:function 1 (double precision, double precision) of "$extension:btree_gin".float8_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.float8_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.float8_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "float8",
            },
            right: {
              namespace: "pg_catalog",
              name: "float8",
            },
            number: 1,
            procedure: "pg_catalog.btfloat8cmp(pg_catalog.float8,pg_catalog.float8)",
          },
        },
      },
    ],
  'function of access method:function 1 (integer, integer) of "$extension:btree_gin".int4_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int4_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int4_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "int4",
          },
          right: {
            namespace: "pg_catalog",
            name: "int4",
          },
          number: 1,
          procedure: "pg_catalog.btint4cmp(pg_catalog.int4,pg_catalog.int4)",
        },
      },
    },
  ],
  'function of access method:function 1 (interval, interval) of "$extension:btree_gin".interval_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.interval_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.interval_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "interval",
          },
          right: {
            namespace: "pg_catalog",
            name: "interval",
          },
          number: 1,
          procedure: "pg_catalog.interval_cmp(pg_catalog.interval,pg_catalog.interval)",
        },
      },
    },
  ],
  'function of access method:function 1 (numeric, numeric) of "$extension:btree_gin".numeric_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.numeric_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.numeric_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          right: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          number: 1,
          procedure: "$extension:btree_gin.gin_numeric_cmp(pg_catalog.numeric,pg_catalog.numeric)",
        },
      },
    },
  ],
  'function of access method:function 1 (pg_catalog."char", pg_catalog."char") of "$extension:btree_gin".char_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.char_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.char_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "char",
            },
            right: {
              namespace: "pg_catalog",
              name: "char",
            },
            number: 1,
            procedure: "pg_catalog.btcharcmp(pg_catalog.char,pg_catalog.char)",
          },
        },
      },
    ],
  'function of access method:function 1 (pg_catalog.anyenum, pg_catalog.anyenum) of "$extension:btree_gin".enum_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.enum_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.enum_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "anyenum",
            },
            right: {
              namespace: "pg_catalog",
              name: "anyenum",
            },
            number: 1,
            procedure: "$extension:btree_gin.gin_enum_cmp(pg_catalog.anyenum,pg_catalog.anyenum)",
          },
        },
      },
    ],
  'function of access method:function 1 (pg_catalog.bytea, pg_catalog.bytea) of "$extension:btree_gin".bytea_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.bytea_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.bytea_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "bytea",
            },
            right: {
              namespace: "pg_catalog",
              name: "bytea",
            },
            number: 1,
            procedure: "pg_catalog.byteacmp(pg_catalog.bytea,pg_catalog.bytea)",
          },
        },
      },
    ],
  'function of access method:function 1 (pg_catalog.cidr, pg_catalog.cidr) of "$extension:btree_gin".cidr_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.cidr_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.cidr_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "cidr",
            },
            right: {
              namespace: "pg_catalog",
              name: "cidr",
            },
            number: 1,
            procedure: "pg_catalog.network_cmp(pg_catalog.inet,pg_catalog.inet)",
          },
        },
      },
    ],
  'function of access method:function 1 (pg_catalog.date, pg_catalog.date) of "$extension:btree_gin".date_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.date_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.date_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "date",
            },
            right: {
              namespace: "pg_catalog",
              name: "date",
            },
            number: 1,
            procedure: "pg_catalog.date_cmp(pg_catalog.date,pg_catalog.date)",
          },
        },
      },
    ],
  'function of access method:function 1 (pg_catalog.inet, pg_catalog.inet) of "$extension:btree_gin".inet_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.inet_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.inet_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "inet",
            },
            right: {
              namespace: "pg_catalog",
              name: "inet",
            },
            number: 1,
            procedure: "pg_catalog.network_cmp(pg_catalog.inet,pg_catalog.inet)",
          },
        },
      },
    ],
  'function of access method:function 1 (pg_catalog.macaddr, pg_catalog.macaddr) of "$extension:btree_gin".macaddr_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.macaddr_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.macaddr_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "macaddr",
            },
            right: {
              namespace: "pg_catalog",
              name: "macaddr",
            },
            number: 1,
            procedure: "pg_catalog.macaddr_cmp(pg_catalog.macaddr,pg_catalog.macaddr)",
          },
        },
      },
    ],
  'function of access method:function 1 (pg_catalog.macaddr8, pg_catalog.macaddr8) of "$extension:btree_gin".macaddr8_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.macaddr8_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.macaddr8_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "macaddr8",
            },
            right: {
              namespace: "pg_catalog",
              name: "macaddr8",
            },
            number: 1,
            procedure: "pg_catalog.macaddr8_cmp(pg_catalog.macaddr8,pg_catalog.macaddr8)",
          },
        },
      },
    ],
  'function of access method:function 1 (pg_catalog.money, pg_catalog.money) of "$extension:btree_gin".money_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.money_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.money_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "money",
            },
            right: {
              namespace: "pg_catalog",
              name: "money",
            },
            number: 1,
            procedure: "pg_catalog.cash_cmp(pg_catalog.money,pg_catalog.money)",
          },
        },
      },
    ],
  'function of access method:function 1 (pg_catalog.name, pg_catalog.name) of "$extension:btree_gin".name_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.name_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.name_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "name",
            },
            right: {
              namespace: "pg_catalog",
              name: "name",
            },
            number: 1,
            procedure: "pg_catalog.btnamecmp(pg_catalog.name,pg_catalog.name)",
          },
        },
      },
    ],
  'function of access method:function 1 (pg_catalog.oid, pg_catalog.oid) of "$extension:btree_gin".oid_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.oid_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.oid_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "oid",
          },
          right: {
            namespace: "pg_catalog",
            name: "oid",
          },
          number: 1,
          procedure: "pg_catalog.btoidcmp(pg_catalog.oid,pg_catalog.oid)",
        },
      },
    },
  ],
  'function of access method:function 1 (pg_catalog.text, pg_catalog.text) of "$extension:btree_gin".text_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.text_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.text_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "text",
            },
            right: {
              namespace: "pg_catalog",
              name: "text",
            },
            number: 1,
            procedure: "pg_catalog.bttextcmp(pg_catalog.text,pg_catalog.text)",
          },
        },
      },
    ],
  'function of access method:function 1 (pg_catalog.uuid, pg_catalog.uuid) of "$extension:btree_gin".uuid_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.uuid_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.uuid_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "uuid",
            },
            right: {
              namespace: "pg_catalog",
              name: "uuid",
            },
            number: 1,
            procedure: "pg_catalog.uuid_cmp(pg_catalog.uuid,pg_catalog.uuid)",
          },
        },
      },
    ],
  'function of access method:function 1 (real, real) of "$extension:btree_gin".float4_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.float4_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.float4_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "float4",
          },
          right: {
            namespace: "pg_catalog",
            name: "float4",
          },
          number: 1,
          procedure: "pg_catalog.btfloat4cmp(pg_catalog.float4,pg_catalog.float4)",
        },
      },
    },
  ],
  'function of access method:function 1 (smallint, smallint) of "$extension:btree_gin".int2_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int2_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int2_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "int2",
          },
          right: {
            namespace: "pg_catalog",
            name: "int2",
          },
          number: 1,
          procedure: "pg_catalog.btint2cmp(pg_catalog.int2,pg_catalog.int2)",
        },
      },
    },
  ],
  'function of access method:function 1 (time with time zone, time with time zone) of "$extension:btree_gin".timetz_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timetz_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timetz_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "timetz",
            },
            right: {
              namespace: "pg_catalog",
              name: "timetz",
            },
            number: 1,
            procedure: "pg_catalog.timetz_cmp(pg_catalog.timetz,pg_catalog.timetz)",
          },
        },
      },
    ],
  'function of access method:function 1 (time without time zone, time without time zone) of "$extension:btree_gin".time_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.time_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.time_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "time",
            },
            right: {
              namespace: "pg_catalog",
              name: "time",
            },
            number: 1,
            procedure: "pg_catalog.time_cmp(pg_catalog.time,pg_catalog.time)",
          },
        },
      },
    ],
  'function of access method:function 1 (timestamp with time zone, timestamp with time zone) of "$extension:btree_gin".timestamptz_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timestamptz_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timestamptz_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "timestamptz",
            },
            right: {
              namespace: "pg_catalog",
              name: "timestamptz",
            },
            number: 1,
            procedure: "pg_catalog.timestamptz_cmp(pg_catalog.timestamptz,pg_catalog.timestamptz)",
          },
        },
      },
    ],
  'function of access method:function 1 (timestamp without time zone, timestamp without time zone) of "$extension:btree_gin".timestamp_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timestamp_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timestamp_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "timestamp",
            },
            right: {
              namespace: "pg_catalog",
              name: "timestamp",
            },
            number: 1,
            procedure: "pg_catalog.timestamp_cmp(pg_catalog.timestamp,pg_catalog.timestamp)",
          },
        },
      },
    ],
  'function of access method:function 2 (bigint, bigint) of "$extension:btree_gin".int8_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int8_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int8_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "int8",
          },
          right: {
            namespace: "pg_catalog",
            name: "int8",
          },
          number: 2,
          procedure: "$extension:btree_gin.gin_extract_value_int8(pg_catalog.int8,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 2 (bit varying, bit varying) of "$extension:btree_gin".varbit_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.varbit_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.varbit_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          right: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          number: 2,
          procedure: "$extension:btree_gin.gin_extract_value_varbit(pg_catalog.varbit,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 2 (bit, bit) of "$extension:btree_gin".bit_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bit_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bit_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "bit",
          },
          right: {
            namespace: "pg_catalog",
            name: "bit",
          },
          number: 2,
          procedure: "$extension:btree_gin.gin_extract_value_bit(pg_catalog.bit,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 2 (boolean, boolean) of "$extension:btree_gin".bool_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bool_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bool_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "bool",
          },
          right: {
            namespace: "pg_catalog",
            name: "bool",
          },
          number: 2,
          procedure: "$extension:btree_gin.gin_extract_value_bool(pg_catalog.bool,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 2 (character varying, character varying) of "$extension:btree_gin".varchar_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.varchar_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.varchar_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "varchar",
            },
            right: {
              namespace: "pg_catalog",
              name: "varchar",
            },
            number: 2,
            procedure: "$extension:btree_gin.gin_extract_value_text(pg_catalog.text,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 2 (character, character) of "$extension:btree_gin".bpchar_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bpchar_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bpchar_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          right: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          number: 2,
          procedure: "$extension:btree_gin.gin_extract_value_bpchar(pg_catalog.bpchar,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 2 (double precision, double precision) of "$extension:btree_gin".float8_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.float8_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.float8_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "float8",
            },
            right: {
              namespace: "pg_catalog",
              name: "float8",
            },
            number: 2,
            procedure: "$extension:btree_gin.gin_extract_value_float8(pg_catalog.float8,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 2 (integer, integer) of "$extension:btree_gin".int4_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int4_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int4_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "int4",
          },
          right: {
            namespace: "pg_catalog",
            name: "int4",
          },
          number: 2,
          procedure: "$extension:btree_gin.gin_extract_value_int4(pg_catalog.int4,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 2 (interval, interval) of "$extension:btree_gin".interval_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.interval_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.interval_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "interval",
          },
          right: {
            namespace: "pg_catalog",
            name: "interval",
          },
          number: 2,
          procedure: "$extension:btree_gin.gin_extract_value_interval(pg_catalog.interval,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 2 (numeric, numeric) of "$extension:btree_gin".numeric_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.numeric_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.numeric_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          right: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          number: 2,
          procedure: "$extension:btree_gin.gin_extract_value_numeric(pg_catalog.numeric,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 2 (pg_catalog."char", pg_catalog."char") of "$extension:btree_gin".char_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.char_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.char_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "char",
            },
            right: {
              namespace: "pg_catalog",
              name: "char",
            },
            number: 2,
            procedure: "$extension:btree_gin.gin_extract_value_char(pg_catalog.char,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 2 (pg_catalog.anyenum, pg_catalog.anyenum) of "$extension:btree_gin".enum_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.enum_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.enum_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "anyenum",
            },
            right: {
              namespace: "pg_catalog",
              name: "anyenum",
            },
            number: 2,
            procedure: "$extension:btree_gin.gin_extract_value_anyenum(pg_catalog.anyenum,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 2 (pg_catalog.bytea, pg_catalog.bytea) of "$extension:btree_gin".bytea_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.bytea_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.bytea_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "bytea",
            },
            right: {
              namespace: "pg_catalog",
              name: "bytea",
            },
            number: 2,
            procedure: "$extension:btree_gin.gin_extract_value_bytea(pg_catalog.bytea,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 2 (pg_catalog.cidr, pg_catalog.cidr) of "$extension:btree_gin".cidr_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.cidr_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.cidr_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "cidr",
            },
            right: {
              namespace: "pg_catalog",
              name: "cidr",
            },
            number: 2,
            procedure: "$extension:btree_gin.gin_extract_value_cidr(pg_catalog.cidr,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 2 (pg_catalog.date, pg_catalog.date) of "$extension:btree_gin".date_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.date_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.date_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "date",
            },
            right: {
              namespace: "pg_catalog",
              name: "date",
            },
            number: 2,
            procedure: "$extension:btree_gin.gin_extract_value_date(pg_catalog.date,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 2 (pg_catalog.inet, pg_catalog.inet) of "$extension:btree_gin".inet_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.inet_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.inet_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "inet",
            },
            right: {
              namespace: "pg_catalog",
              name: "inet",
            },
            number: 2,
            procedure: "$extension:btree_gin.gin_extract_value_inet(pg_catalog.inet,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 2 (pg_catalog.macaddr, pg_catalog.macaddr) of "$extension:btree_gin".macaddr_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.macaddr_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.macaddr_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "macaddr",
            },
            right: {
              namespace: "pg_catalog",
              name: "macaddr",
            },
            number: 2,
            procedure: "$extension:btree_gin.gin_extract_value_macaddr(pg_catalog.macaddr,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 2 (pg_catalog.macaddr8, pg_catalog.macaddr8) of "$extension:btree_gin".macaddr8_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.macaddr8_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.macaddr8_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "macaddr8",
            },
            right: {
              namespace: "pg_catalog",
              name: "macaddr8",
            },
            number: 2,
            procedure: "$extension:btree_gin.gin_extract_value_macaddr8(pg_catalog.macaddr8,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 2 (pg_catalog.money, pg_catalog.money) of "$extension:btree_gin".money_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.money_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.money_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "money",
            },
            right: {
              namespace: "pg_catalog",
              name: "money",
            },
            number: 2,
            procedure: "$extension:btree_gin.gin_extract_value_money(pg_catalog.money,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 2 (pg_catalog.name, pg_catalog.name) of "$extension:btree_gin".name_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.name_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.name_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "name",
            },
            right: {
              namespace: "pg_catalog",
              name: "name",
            },
            number: 2,
            procedure: "$extension:btree_gin.gin_extract_value_name(pg_catalog.name,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 2 (pg_catalog.oid, pg_catalog.oid) of "$extension:btree_gin".oid_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.oid_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.oid_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "oid",
          },
          right: {
            namespace: "pg_catalog",
            name: "oid",
          },
          number: 2,
          procedure: "$extension:btree_gin.gin_extract_value_oid(pg_catalog.oid,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 2 (pg_catalog.text, pg_catalog.text) of "$extension:btree_gin".text_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.text_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.text_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "text",
            },
            right: {
              namespace: "pg_catalog",
              name: "text",
            },
            number: 2,
            procedure: "$extension:btree_gin.gin_extract_value_text(pg_catalog.text,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 2 (pg_catalog.uuid, pg_catalog.uuid) of "$extension:btree_gin".uuid_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.uuid_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.uuid_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "uuid",
            },
            right: {
              namespace: "pg_catalog",
              name: "uuid",
            },
            number: 2,
            procedure: "$extension:btree_gin.gin_extract_value_uuid(pg_catalog.uuid,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 2 (real, real) of "$extension:btree_gin".float4_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.float4_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.float4_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "float4",
          },
          right: {
            namespace: "pg_catalog",
            name: "float4",
          },
          number: 2,
          procedure: "$extension:btree_gin.gin_extract_value_float4(pg_catalog.float4,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 2 (smallint, smallint) of "$extension:btree_gin".int2_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int2_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int2_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "int2",
          },
          right: {
            namespace: "pg_catalog",
            name: "int2",
          },
          number: 2,
          procedure: "$extension:btree_gin.gin_extract_value_int2(pg_catalog.int2,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 2 (time with time zone, time with time zone) of "$extension:btree_gin".timetz_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timetz_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timetz_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "timetz",
            },
            right: {
              namespace: "pg_catalog",
              name: "timetz",
            },
            number: 2,
            procedure: "$extension:btree_gin.gin_extract_value_timetz(pg_catalog.timetz,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 2 (time without time zone, time without time zone) of "$extension:btree_gin".time_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.time_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.time_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "time",
            },
            right: {
              namespace: "pg_catalog",
              name: "time",
            },
            number: 2,
            procedure: "$extension:btree_gin.gin_extract_value_time(pg_catalog.time,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 2 (timestamp with time zone, timestamp with time zone) of "$extension:btree_gin".timestamptz_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timestamptz_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timestamptz_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "timestamptz",
            },
            right: {
              namespace: "pg_catalog",
              name: "timestamptz",
            },
            number: 2,
            procedure: "$extension:btree_gin.gin_extract_value_timestamptz(pg_catalog.timestamptz,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 2 (timestamp without time zone, timestamp without time zone) of "$extension:btree_gin".timestamp_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timestamp_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timestamp_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "timestamp",
            },
            right: {
              namespace: "pg_catalog",
              name: "timestamp",
            },
            number: 2,
            procedure: "$extension:btree_gin.gin_extract_value_timestamp(pg_catalog.timestamp,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 3 (bigint, bigint) of "$extension:btree_gin".int8_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int8_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int8_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "int8",
          },
          right: {
            namespace: "pg_catalog",
            name: "int8",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_int8(pg_catalog.int8,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 3 (bit varying, bit varying) of "$extension:btree_gin".varbit_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.varbit_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.varbit_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          right: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_varbit(pg_catalog.varbit,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 3 (bit, bit) of "$extension:btree_gin".bit_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bit_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bit_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "bit",
          },
          right: {
            namespace: "pg_catalog",
            name: "bit",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_bit(pg_catalog.bit,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 3 (boolean, boolean) of "$extension:btree_gin".bool_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bool_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bool_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "bool",
          },
          right: {
            namespace: "pg_catalog",
            name: "bool",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_bool(pg_catalog.bool,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 3 (character varying, character varying) of "$extension:btree_gin".varchar_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.varchar_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.varchar_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "varchar",
            },
            right: {
              namespace: "pg_catalog",
              name: "varchar",
            },
            number: 3,
            procedure:
              "$extension:btree_gin.gin_extract_query_text(pg_catalog.text,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 3 (character, character) of "$extension:btree_gin".bpchar_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bpchar_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bpchar_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          right: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_bpchar(pg_catalog.bpchar,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 3 (double precision, double precision) of "$extension:btree_gin".float8_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.float8_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.float8_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "float8",
            },
            right: {
              namespace: "pg_catalog",
              name: "float8",
            },
            number: 3,
            procedure:
              "$extension:btree_gin.gin_extract_query_float8(pg_catalog.float8,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 3 (integer, integer) of "$extension:btree_gin".int4_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int4_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int4_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "int4",
          },
          right: {
            namespace: "pg_catalog",
            name: "int4",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_int4(pg_catalog.int4,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 3 (interval, interval) of "$extension:btree_gin".interval_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.interval_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.interval_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "interval",
          },
          right: {
            namespace: "pg_catalog",
            name: "interval",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_interval(pg_catalog.interval,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 3 (numeric, numeric) of "$extension:btree_gin".numeric_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.numeric_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.numeric_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          right: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_numeric(pg_catalog.numeric,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 3 (pg_catalog."char", pg_catalog."char") of "$extension:btree_gin".char_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.char_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.char_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "char",
            },
            right: {
              namespace: "pg_catalog",
              name: "char",
            },
            number: 3,
            procedure:
              "$extension:btree_gin.gin_extract_query_char(pg_catalog.char,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 3 (pg_catalog.anyenum, pg_catalog.anyenum) of "$extension:btree_gin".enum_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.enum_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.enum_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "anyenum",
            },
            right: {
              namespace: "pg_catalog",
              name: "anyenum",
            },
            number: 3,
            procedure:
              "$extension:btree_gin.gin_extract_query_anyenum(pg_catalog.anyenum,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 3 (pg_catalog.bytea, pg_catalog.bytea) of "$extension:btree_gin".bytea_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.bytea_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.bytea_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "bytea",
            },
            right: {
              namespace: "pg_catalog",
              name: "bytea",
            },
            number: 3,
            procedure:
              "$extension:btree_gin.gin_extract_query_bytea(pg_catalog.bytea,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 3 (pg_catalog.cidr, pg_catalog.cidr) of "$extension:btree_gin".cidr_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.cidr_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.cidr_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "cidr",
            },
            right: {
              namespace: "pg_catalog",
              name: "cidr",
            },
            number: 3,
            procedure:
              "$extension:btree_gin.gin_extract_query_cidr(pg_catalog.cidr,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 3 (pg_catalog.date, pg_catalog.date) of "$extension:btree_gin".date_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.date_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.date_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "date",
            },
            right: {
              namespace: "pg_catalog",
              name: "date",
            },
            number: 3,
            procedure:
              "$extension:btree_gin.gin_extract_query_date(pg_catalog.date,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 3 (pg_catalog.inet, pg_catalog.inet) of "$extension:btree_gin".inet_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.inet_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.inet_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "inet",
            },
            right: {
              namespace: "pg_catalog",
              name: "inet",
            },
            number: 3,
            procedure:
              "$extension:btree_gin.gin_extract_query_inet(pg_catalog.inet,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 3 (pg_catalog.macaddr, pg_catalog.macaddr) of "$extension:btree_gin".macaddr_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.macaddr_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.macaddr_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "macaddr",
            },
            right: {
              namespace: "pg_catalog",
              name: "macaddr",
            },
            number: 3,
            procedure:
              "$extension:btree_gin.gin_extract_query_macaddr(pg_catalog.macaddr,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 3 (pg_catalog.macaddr8, pg_catalog.macaddr8) of "$extension:btree_gin".macaddr8_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.macaddr8_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.macaddr8_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "macaddr8",
            },
            right: {
              namespace: "pg_catalog",
              name: "macaddr8",
            },
            number: 3,
            procedure:
              "$extension:btree_gin.gin_extract_query_macaddr8(pg_catalog.macaddr8,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 3 (pg_catalog.money, pg_catalog.money) of "$extension:btree_gin".money_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.money_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.money_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "money",
            },
            right: {
              namespace: "pg_catalog",
              name: "money",
            },
            number: 3,
            procedure:
              "$extension:btree_gin.gin_extract_query_money(pg_catalog.money,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 3 (pg_catalog.name, pg_catalog.name) of "$extension:btree_gin".name_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.name_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.name_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "name",
            },
            right: {
              namespace: "pg_catalog",
              name: "name",
            },
            number: 3,
            procedure:
              "$extension:btree_gin.gin_extract_query_name(pg_catalog.name,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 3 (pg_catalog.oid, pg_catalog.oid) of "$extension:btree_gin".oid_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.oid_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.oid_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "oid",
          },
          right: {
            namespace: "pg_catalog",
            name: "oid",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_oid(pg_catalog.oid,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 3 (pg_catalog.text, pg_catalog.text) of "$extension:btree_gin".text_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.text_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.text_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "text",
            },
            right: {
              namespace: "pg_catalog",
              name: "text",
            },
            number: 3,
            procedure:
              "$extension:btree_gin.gin_extract_query_text(pg_catalog.text,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 3 (pg_catalog.uuid, pg_catalog.uuid) of "$extension:btree_gin".uuid_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.uuid_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.uuid_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "uuid",
            },
            right: {
              namespace: "pg_catalog",
              name: "uuid",
            },
            number: 3,
            procedure:
              "$extension:btree_gin.gin_extract_query_uuid(pg_catalog.uuid,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 3 (real, real) of "$extension:btree_gin".float4_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.float4_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.float4_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "float4",
          },
          right: {
            namespace: "pg_catalog",
            name: "float4",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_float4(pg_catalog.float4,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 3 (smallint, smallint) of "$extension:btree_gin".int2_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int2_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int2_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "int2",
          },
          right: {
            namespace: "pg_catalog",
            name: "int2",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_int2(pg_catalog.int2,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 3 (time with time zone, time with time zone) of "$extension:btree_gin".timetz_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timetz_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timetz_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "timetz",
            },
            right: {
              namespace: "pg_catalog",
              name: "timetz",
            },
            number: 3,
            procedure:
              "$extension:btree_gin.gin_extract_query_timetz(pg_catalog.timetz,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 3 (time without time zone, time without time zone) of "$extension:btree_gin".time_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.time_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.time_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "time",
            },
            right: {
              namespace: "pg_catalog",
              name: "time",
            },
            number: 3,
            procedure:
              "$extension:btree_gin.gin_extract_query_time(pg_catalog.time,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 3 (timestamp with time zone, timestamp with time zone) of "$extension:btree_gin".timestamptz_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timestamptz_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timestamptz_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "timestamptz",
            },
            right: {
              namespace: "pg_catalog",
              name: "timestamptz",
            },
            number: 3,
            procedure:
              "$extension:btree_gin.gin_extract_query_timestamptz(pg_catalog.timestamptz,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 3 (timestamp without time zone, timestamp without time zone) of "$extension:btree_gin".timestamp_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timestamp_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timestamp_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "timestamp",
            },
            right: {
              namespace: "pg_catalog",
              name: "timestamp",
            },
            number: 3,
            procedure:
              "$extension:btree_gin.gin_extract_query_timestamp(pg_catalog.timestamp,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 4 (bigint, bigint) of "$extension:btree_gin".int8_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int8_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int8_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "int8",
          },
          right: {
            namespace: "pg_catalog",
            name: "int8",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 4 (bit varying, bit varying) of "$extension:btree_gin".varbit_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.varbit_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.varbit_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          right: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 4 (bit, bit) of "$extension:btree_gin".bit_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bit_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bit_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "bit",
          },
          right: {
            namespace: "pg_catalog",
            name: "bit",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 4 (boolean, boolean) of "$extension:btree_gin".bool_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bool_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bool_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "bool",
          },
          right: {
            namespace: "pg_catalog",
            name: "bool",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 4 (character varying, character varying) of "$extension:btree_gin".varchar_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.varchar_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.varchar_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "varchar",
            },
            right: {
              namespace: "pg_catalog",
              name: "varchar",
            },
            number: 4,
            procedure:
              "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 4 (character, character) of "$extension:btree_gin".bpchar_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bpchar_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bpchar_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          right: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 4 (double precision, double precision) of "$extension:btree_gin".float8_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.float8_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.float8_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "float8",
            },
            right: {
              namespace: "pg_catalog",
              name: "float8",
            },
            number: 4,
            procedure:
              "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 4 (integer, integer) of "$extension:btree_gin".int4_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int4_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int4_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "int4",
          },
          right: {
            namespace: "pg_catalog",
            name: "int4",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 4 (interval, interval) of "$extension:btree_gin".interval_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.interval_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.interval_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "interval",
          },
          right: {
            namespace: "pg_catalog",
            name: "interval",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 4 (numeric, numeric) of "$extension:btree_gin".numeric_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.numeric_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.numeric_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          right: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 4 (pg_catalog."char", pg_catalog."char") of "$extension:btree_gin".char_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.char_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.char_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "char",
            },
            right: {
              namespace: "pg_catalog",
              name: "char",
            },
            number: 4,
            procedure:
              "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 4 (pg_catalog.anyenum, pg_catalog.anyenum) of "$extension:btree_gin".enum_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.enum_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.enum_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "anyenum",
            },
            right: {
              namespace: "pg_catalog",
              name: "anyenum",
            },
            number: 4,
            procedure:
              "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 4 (pg_catalog.bytea, pg_catalog.bytea) of "$extension:btree_gin".bytea_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.bytea_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.bytea_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "bytea",
            },
            right: {
              namespace: "pg_catalog",
              name: "bytea",
            },
            number: 4,
            procedure:
              "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 4 (pg_catalog.cidr, pg_catalog.cidr) of "$extension:btree_gin".cidr_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.cidr_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.cidr_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "cidr",
            },
            right: {
              namespace: "pg_catalog",
              name: "cidr",
            },
            number: 4,
            procedure:
              "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 4 (pg_catalog.date, pg_catalog.date) of "$extension:btree_gin".date_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.date_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.date_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "date",
            },
            right: {
              namespace: "pg_catalog",
              name: "date",
            },
            number: 4,
            procedure:
              "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 4 (pg_catalog.inet, pg_catalog.inet) of "$extension:btree_gin".inet_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.inet_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.inet_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "inet",
            },
            right: {
              namespace: "pg_catalog",
              name: "inet",
            },
            number: 4,
            procedure:
              "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 4 (pg_catalog.macaddr, pg_catalog.macaddr) of "$extension:btree_gin".macaddr_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.macaddr_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.macaddr_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "macaddr",
            },
            right: {
              namespace: "pg_catalog",
              name: "macaddr",
            },
            number: 4,
            procedure:
              "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 4 (pg_catalog.macaddr8, pg_catalog.macaddr8) of "$extension:btree_gin".macaddr8_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.macaddr8_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.macaddr8_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "macaddr8",
            },
            right: {
              namespace: "pg_catalog",
              name: "macaddr8",
            },
            number: 4,
            procedure:
              "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 4 (pg_catalog.money, pg_catalog.money) of "$extension:btree_gin".money_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.money_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.money_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "money",
            },
            right: {
              namespace: "pg_catalog",
              name: "money",
            },
            number: 4,
            procedure:
              "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 4 (pg_catalog.name, pg_catalog.name) of "$extension:btree_gin".name_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.name_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.name_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "name",
            },
            right: {
              namespace: "pg_catalog",
              name: "name",
            },
            number: 4,
            procedure:
              "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 4 (pg_catalog.oid, pg_catalog.oid) of "$extension:btree_gin".oid_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.oid_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.oid_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "oid",
          },
          right: {
            namespace: "pg_catalog",
            name: "oid",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 4 (pg_catalog.text, pg_catalog.text) of "$extension:btree_gin".text_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.text_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.text_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "text",
            },
            right: {
              namespace: "pg_catalog",
              name: "text",
            },
            number: 4,
            procedure:
              "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 4 (pg_catalog.uuid, pg_catalog.uuid) of "$extension:btree_gin".uuid_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.uuid_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.uuid_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "uuid",
            },
            right: {
              namespace: "pg_catalog",
              name: "uuid",
            },
            number: 4,
            procedure:
              "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 4 (real, real) of "$extension:btree_gin".float4_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.float4_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.float4_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "float4",
          },
          right: {
            namespace: "pg_catalog",
            name: "float4",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 4 (smallint, smallint) of "$extension:btree_gin".int2_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int2_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int2_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "int2",
          },
          right: {
            namespace: "pg_catalog",
            name: "int2",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 4 (time with time zone, time with time zone) of "$extension:btree_gin".timetz_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timetz_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timetz_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "timetz",
            },
            right: {
              namespace: "pg_catalog",
              name: "timetz",
            },
            number: 4,
            procedure:
              "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 4 (time without time zone, time without time zone) of "$extension:btree_gin".time_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.time_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.time_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "time",
            },
            right: {
              namespace: "pg_catalog",
              name: "time",
            },
            number: 4,
            procedure:
              "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 4 (timestamp with time zone, timestamp with time zone) of "$extension:btree_gin".timestamptz_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timestamptz_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timestamptz_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "timestamptz",
            },
            right: {
              namespace: "pg_catalog",
              name: "timestamptz",
            },
            number: 4,
            procedure:
              "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 4 (timestamp without time zone, timestamp without time zone) of "$extension:btree_gin".timestamp_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timestamp_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timestamp_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "timestamp",
            },
            right: {
              namespace: "pg_catalog",
              name: "timestamp",
            },
            number: 4,
            procedure:
              "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 5 (bigint, bigint) of "$extension:btree_gin".int8_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int8_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int8_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "int8",
          },
          right: {
            namespace: "pg_catalog",
            name: "int8",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_int8(pg_catalog.int8,pg_catalog.int8,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 5 (bit varying, bit varying) of "$extension:btree_gin".varbit_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.varbit_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.varbit_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          right: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_varbit(pg_catalog.varbit,pg_catalog.varbit,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 5 (bit, bit) of "$extension:btree_gin".bit_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bit_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bit_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "bit",
          },
          right: {
            namespace: "pg_catalog",
            name: "bit",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_bit(pg_catalog.bit,pg_catalog.bit,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 5 (boolean, boolean) of "$extension:btree_gin".bool_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bool_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bool_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "bool",
          },
          right: {
            namespace: "pg_catalog",
            name: "bool",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_bool(pg_catalog.bool,pg_catalog.bool,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 5 (character varying, character varying) of "$extension:btree_gin".varchar_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.varchar_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.varchar_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "varchar",
            },
            right: {
              namespace: "pg_catalog",
              name: "varchar",
            },
            number: 5,
            procedure:
              "$extension:btree_gin.gin_compare_prefix_text(pg_catalog.text,pg_catalog.text,pg_catalog.int2,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 5 (character, character) of "$extension:btree_gin".bpchar_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bpchar_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bpchar_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          right: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_bpchar(pg_catalog.bpchar,pg_catalog.bpchar,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 5 (double precision, double precision) of "$extension:btree_gin".float8_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.float8_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.float8_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "float8",
            },
            right: {
              namespace: "pg_catalog",
              name: "float8",
            },
            number: 5,
            procedure:
              "$extension:btree_gin.gin_compare_prefix_float8(pg_catalog.float8,pg_catalog.float8,pg_catalog.int2,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 5 (integer, integer) of "$extension:btree_gin".int4_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int4_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int4_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "int4",
          },
          right: {
            namespace: "pg_catalog",
            name: "int4",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_int4(pg_catalog.int4,pg_catalog.int4,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 5 (interval, interval) of "$extension:btree_gin".interval_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.interval_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.interval_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "interval",
          },
          right: {
            namespace: "pg_catalog",
            name: "interval",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_interval(pg_catalog.interval,pg_catalog.interval,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 5 (numeric, numeric) of "$extension:btree_gin".numeric_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.numeric_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.numeric_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          right: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_numeric(pg_catalog.numeric,pg_catalog.numeric,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 5 (pg_catalog."char", pg_catalog."char") of "$extension:btree_gin".char_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.char_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.char_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "char",
            },
            right: {
              namespace: "pg_catalog",
              name: "char",
            },
            number: 5,
            procedure:
              "$extension:btree_gin.gin_compare_prefix_char(pg_catalog.char,pg_catalog.char,pg_catalog.int2,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 5 (pg_catalog.anyenum, pg_catalog.anyenum) of "$extension:btree_gin".enum_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.enum_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.enum_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "anyenum",
            },
            right: {
              namespace: "pg_catalog",
              name: "anyenum",
            },
            number: 5,
            procedure:
              "$extension:btree_gin.gin_compare_prefix_anyenum(pg_catalog.anyenum,pg_catalog.anyenum,pg_catalog.int2,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 5 (pg_catalog.bytea, pg_catalog.bytea) of "$extension:btree_gin".bytea_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.bytea_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.bytea_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "bytea",
            },
            right: {
              namespace: "pg_catalog",
              name: "bytea",
            },
            number: 5,
            procedure:
              "$extension:btree_gin.gin_compare_prefix_bytea(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.int2,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 5 (pg_catalog.cidr, pg_catalog.cidr) of "$extension:btree_gin".cidr_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.cidr_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.cidr_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "cidr",
            },
            right: {
              namespace: "pg_catalog",
              name: "cidr",
            },
            number: 5,
            procedure:
              "$extension:btree_gin.gin_compare_prefix_cidr(pg_catalog.cidr,pg_catalog.cidr,pg_catalog.int2,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 5 (pg_catalog.date, pg_catalog.date) of "$extension:btree_gin".date_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.date_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.date_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "date",
            },
            right: {
              namespace: "pg_catalog",
              name: "date",
            },
            number: 5,
            procedure:
              "$extension:btree_gin.gin_compare_prefix_date(pg_catalog.date,pg_catalog.date,pg_catalog.int2,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 5 (pg_catalog.inet, pg_catalog.inet) of "$extension:btree_gin".inet_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.inet_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.inet_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "inet",
            },
            right: {
              namespace: "pg_catalog",
              name: "inet",
            },
            number: 5,
            procedure:
              "$extension:btree_gin.gin_compare_prefix_inet(pg_catalog.inet,pg_catalog.inet,pg_catalog.int2,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 5 (pg_catalog.macaddr, pg_catalog.macaddr) of "$extension:btree_gin".macaddr_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.macaddr_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.macaddr_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "macaddr",
            },
            right: {
              namespace: "pg_catalog",
              name: "macaddr",
            },
            number: 5,
            procedure:
              "$extension:btree_gin.gin_compare_prefix_macaddr(pg_catalog.macaddr,pg_catalog.macaddr,pg_catalog.int2,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 5 (pg_catalog.macaddr8, pg_catalog.macaddr8) of "$extension:btree_gin".macaddr8_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.macaddr8_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.macaddr8_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "macaddr8",
            },
            right: {
              namespace: "pg_catalog",
              name: "macaddr8",
            },
            number: 5,
            procedure:
              "$extension:btree_gin.gin_compare_prefix_macaddr8(pg_catalog.macaddr8,pg_catalog.macaddr8,pg_catalog.int2,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 5 (pg_catalog.money, pg_catalog.money) of "$extension:btree_gin".money_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.money_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.money_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "money",
            },
            right: {
              namespace: "pg_catalog",
              name: "money",
            },
            number: 5,
            procedure:
              "$extension:btree_gin.gin_compare_prefix_money(pg_catalog.money,pg_catalog.money,pg_catalog.int2,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 5 (pg_catalog.name, pg_catalog.name) of "$extension:btree_gin".name_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.name_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.name_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "name",
            },
            right: {
              namespace: "pg_catalog",
              name: "name",
            },
            number: 5,
            procedure:
              "$extension:btree_gin.gin_compare_prefix_name(pg_catalog.name,pg_catalog.name,pg_catalog.int2,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 5 (pg_catalog.oid, pg_catalog.oid) of "$extension:btree_gin".oid_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.oid_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.oid_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "oid",
          },
          right: {
            namespace: "pg_catalog",
            name: "oid",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_oid(pg_catalog.oid,pg_catalog.oid,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 5 (pg_catalog.text, pg_catalog.text) of "$extension:btree_gin".text_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.text_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.text_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "text",
            },
            right: {
              namespace: "pg_catalog",
              name: "text",
            },
            number: 5,
            procedure:
              "$extension:btree_gin.gin_compare_prefix_text(pg_catalog.text,pg_catalog.text,pg_catalog.int2,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 5 (pg_catalog.uuid, pg_catalog.uuid) of "$extension:btree_gin".uuid_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.uuid_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.uuid_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "uuid",
            },
            right: {
              namespace: "pg_catalog",
              name: "uuid",
            },
            number: 5,
            procedure:
              "$extension:btree_gin.gin_compare_prefix_uuid(pg_catalog.uuid,pg_catalog.uuid,pg_catalog.int2,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 5 (real, real) of "$extension:btree_gin".float4_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.float4_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.float4_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "float4",
          },
          right: {
            namespace: "pg_catalog",
            name: "float4",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_float4(pg_catalog.float4,pg_catalog.float4,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 5 (smallint, smallint) of "$extension:btree_gin".int2_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int2_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int2_ops/gin",
        row: {
          kind: "procedure",
          left: {
            namespace: "pg_catalog",
            name: "int2",
          },
          right: {
            namespace: "pg_catalog",
            name: "int2",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_int2(pg_catalog.int2,pg_catalog.int2,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    },
  ],
  'function of access method:function 5 (time with time zone, time with time zone) of "$extension:btree_gin".timetz_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timetz_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timetz_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "timetz",
            },
            right: {
              namespace: "pg_catalog",
              name: "timetz",
            },
            number: 5,
            procedure:
              "$extension:btree_gin.gin_compare_prefix_timetz(pg_catalog.timetz,pg_catalog.timetz,pg_catalog.int2,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 5 (time without time zone, time without time zone) of "$extension:btree_gin".time_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.time_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.time_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "time",
            },
            right: {
              namespace: "pg_catalog",
              name: "time",
            },
            number: 5,
            procedure:
              "$extension:btree_gin.gin_compare_prefix_time(pg_catalog.time,pg_catalog.time,pg_catalog.int2,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 5 (timestamp with time zone, timestamp with time zone) of "$extension:btree_gin".timestamptz_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timestamptz_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timestamptz_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "timestamptz",
            },
            right: {
              namespace: "pg_catalog",
              name: "timestamptz",
            },
            number: 5,
            procedure:
              "$extension:btree_gin.gin_compare_prefix_timestamptz(pg_catalog.timestamptz,pg_catalog.timestamptz,pg_catalog.int2,pg_catalog.internal)",
          },
        },
      },
    ],
  'function of access method:function 5 (timestamp without time zone, timestamp without time zone) of "$extension:btree_gin".timestamp_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timestamp_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timestamp_ops/gin",
          row: {
            kind: "procedure",
            left: {
              namespace: "pg_catalog",
              name: "timestamp",
            },
            right: {
              namespace: "pg_catalog",
              name: "timestamp",
            },
            number: 5,
            procedure:
              "$extension:btree_gin.gin_compare_prefix_timestamp(pg_catalog.timestamp,pg_catalog.timestamp,pg_catalog.int2,pg_catalog.internal)",
          },
        },
      },
    ],
  'operator of access method:operator 1 (bigint, bigint) of "$extension:btree_gin".int8_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int8_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int8_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "int8",
          },
          right: {
            namespace: "pg_catalog",
            name: "int8",
          },
          strategy: 1,
          purpose: "s",
          operator: "pg_catalog.<(pg_catalog.int8,pg_catalog.int8)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 1 (bit varying, bit varying) of "$extension:btree_gin".varbit_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.varbit_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.varbit_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          right: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          strategy: 1,
          purpose: "s",
          operator: "pg_catalog.<(pg_catalog.varbit,pg_catalog.varbit)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 1 (bit, bit) of "$extension:btree_gin".bit_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bit_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bit_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "bit",
          },
          right: {
            namespace: "pg_catalog",
            name: "bit",
          },
          strategy: 1,
          purpose: "s",
          operator: "pg_catalog.<(pg_catalog.bit,pg_catalog.bit)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 1 (boolean, boolean) of "$extension:btree_gin".bool_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bool_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bool_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "bool",
          },
          right: {
            namespace: "pg_catalog",
            name: "bool",
          },
          strategy: 1,
          purpose: "s",
          operator: "pg_catalog.<(pg_catalog.bool,pg_catalog.bool)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 1 (character, character) of "$extension:btree_gin".bpchar_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bpchar_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bpchar_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          right: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          strategy: 1,
          purpose: "s",
          operator: "pg_catalog.<(pg_catalog.bpchar,pg_catalog.bpchar)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 1 (double precision, double precision) of "$extension:btree_gin".float8_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.float8_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.float8_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "float8",
            },
            right: {
              namespace: "pg_catalog",
              name: "float8",
            },
            strategy: 1,
            purpose: "s",
            operator: "pg_catalog.<(pg_catalog.float8,pg_catalog.float8)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 1 (integer, integer) of "$extension:btree_gin".int4_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int4_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int4_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "int4",
          },
          right: {
            namespace: "pg_catalog",
            name: "int4",
          },
          strategy: 1,
          purpose: "s",
          operator: "pg_catalog.<(pg_catalog.int4,pg_catalog.int4)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 1 (interval, interval) of "$extension:btree_gin".interval_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.interval_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.interval_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "interval",
          },
          right: {
            namespace: "pg_catalog",
            name: "interval",
          },
          strategy: 1,
          purpose: "s",
          operator: "pg_catalog.<(pg_catalog.interval,pg_catalog.interval)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 1 (numeric, numeric) of "$extension:btree_gin".numeric_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.numeric_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.numeric_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          right: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          strategy: 1,
          purpose: "s",
          operator: "pg_catalog.<(pg_catalog.numeric,pg_catalog.numeric)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 1 (pg_catalog."char", pg_catalog."char") of "$extension:btree_gin".char_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.char_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.char_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "char",
            },
            right: {
              namespace: "pg_catalog",
              name: "char",
            },
            strategy: 1,
            purpose: "s",
            operator: "pg_catalog.<(pg_catalog.char,pg_catalog.char)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 1 (pg_catalog.anyenum, pg_catalog.anyenum) of "$extension:btree_gin".enum_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.enum_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.enum_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "anyenum",
            },
            right: {
              namespace: "pg_catalog",
              name: "anyenum",
            },
            strategy: 1,
            purpose: "s",
            operator: "pg_catalog.<(pg_catalog.anyenum,pg_catalog.anyenum)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 1 (pg_catalog.bytea, pg_catalog.bytea) of "$extension:btree_gin".bytea_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.bytea_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.bytea_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "bytea",
            },
            right: {
              namespace: "pg_catalog",
              name: "bytea",
            },
            strategy: 1,
            purpose: "s",
            operator: "pg_catalog.<(pg_catalog.bytea,pg_catalog.bytea)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 1 (pg_catalog.date, pg_catalog.date) of "$extension:btree_gin".date_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.date_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.date_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "date",
            },
            right: {
              namespace: "pg_catalog",
              name: "date",
            },
            strategy: 1,
            purpose: "s",
            operator: "pg_catalog.<(pg_catalog.date,pg_catalog.date)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 1 (pg_catalog.inet, pg_catalog.inet) of "$extension:btree_gin".cidr_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.cidr_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.cidr_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "inet",
            },
            right: {
              namespace: "pg_catalog",
              name: "inet",
            },
            strategy: 1,
            purpose: "s",
            operator: "pg_catalog.<(pg_catalog.inet,pg_catalog.inet)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 1 (pg_catalog.inet, pg_catalog.inet) of "$extension:btree_gin".inet_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.inet_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.inet_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "inet",
            },
            right: {
              namespace: "pg_catalog",
              name: "inet",
            },
            strategy: 1,
            purpose: "s",
            operator: "pg_catalog.<(pg_catalog.inet,pg_catalog.inet)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 1 (pg_catalog.macaddr, pg_catalog.macaddr) of "$extension:btree_gin".macaddr_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.macaddr_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.macaddr_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "macaddr",
            },
            right: {
              namespace: "pg_catalog",
              name: "macaddr",
            },
            strategy: 1,
            purpose: "s",
            operator: "pg_catalog.<(pg_catalog.macaddr,pg_catalog.macaddr)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 1 (pg_catalog.macaddr8, pg_catalog.macaddr8) of "$extension:btree_gin".macaddr8_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.macaddr8_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.macaddr8_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "macaddr8",
            },
            right: {
              namespace: "pg_catalog",
              name: "macaddr8",
            },
            strategy: 1,
            purpose: "s",
            operator: "pg_catalog.<(pg_catalog.macaddr8,pg_catalog.macaddr8)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 1 (pg_catalog.money, pg_catalog.money) of "$extension:btree_gin".money_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.money_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.money_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "money",
            },
            right: {
              namespace: "pg_catalog",
              name: "money",
            },
            strategy: 1,
            purpose: "s",
            operator: "pg_catalog.<(pg_catalog.money,pg_catalog.money)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 1 (pg_catalog.name, pg_catalog.name) of "$extension:btree_gin".name_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.name_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.name_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "name",
            },
            right: {
              namespace: "pg_catalog",
              name: "name",
            },
            strategy: 1,
            purpose: "s",
            operator: "pg_catalog.<(pg_catalog.name,pg_catalog.name)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 1 (pg_catalog.oid, pg_catalog.oid) of "$extension:btree_gin".oid_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.oid_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.oid_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "oid",
          },
          right: {
            namespace: "pg_catalog",
            name: "oid",
          },
          strategy: 1,
          purpose: "s",
          operator: "pg_catalog.<(pg_catalog.oid,pg_catalog.oid)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 1 (pg_catalog.text, pg_catalog.text) of "$extension:btree_gin".text_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.text_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.text_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "text",
            },
            right: {
              namespace: "pg_catalog",
              name: "text",
            },
            strategy: 1,
            purpose: "s",
            operator: "pg_catalog.<(pg_catalog.text,pg_catalog.text)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 1 (pg_catalog.text, pg_catalog.text) of "$extension:btree_gin".varchar_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.varchar_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.varchar_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "text",
            },
            right: {
              namespace: "pg_catalog",
              name: "text",
            },
            strategy: 1,
            purpose: "s",
            operator: "pg_catalog.<(pg_catalog.text,pg_catalog.text)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 1 (pg_catalog.uuid, pg_catalog.uuid) of "$extension:btree_gin".uuid_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.uuid_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.uuid_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "uuid",
            },
            right: {
              namespace: "pg_catalog",
              name: "uuid",
            },
            strategy: 1,
            purpose: "s",
            operator: "pg_catalog.<(pg_catalog.uuid,pg_catalog.uuid)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 1 (real, real) of "$extension:btree_gin".float4_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.float4_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.float4_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "float4",
          },
          right: {
            namespace: "pg_catalog",
            name: "float4",
          },
          strategy: 1,
          purpose: "s",
          operator: "pg_catalog.<(pg_catalog.float4,pg_catalog.float4)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 1 (smallint, smallint) of "$extension:btree_gin".int2_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int2_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int2_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "int2",
          },
          right: {
            namespace: "pg_catalog",
            name: "int2",
          },
          strategy: 1,
          purpose: "s",
          operator: "pg_catalog.<(pg_catalog.int2,pg_catalog.int2)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 1 (time with time zone, time with time zone) of "$extension:btree_gin".timetz_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timetz_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timetz_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "timetz",
            },
            right: {
              namespace: "pg_catalog",
              name: "timetz",
            },
            strategy: 1,
            purpose: "s",
            operator: "pg_catalog.<(pg_catalog.timetz,pg_catalog.timetz)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 1 (time without time zone, time without time zone) of "$extension:btree_gin".time_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.time_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.time_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "time",
            },
            right: {
              namespace: "pg_catalog",
              name: "time",
            },
            strategy: 1,
            purpose: "s",
            operator: "pg_catalog.<(pg_catalog.time,pg_catalog.time)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 1 (timestamp with time zone, timestamp with time zone) of "$extension:btree_gin".timestamptz_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timestamptz_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timestamptz_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "timestamptz",
            },
            right: {
              namespace: "pg_catalog",
              name: "timestamptz",
            },
            strategy: 1,
            purpose: "s",
            operator: "pg_catalog.<(pg_catalog.timestamptz,pg_catalog.timestamptz)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 1 (timestamp without time zone, timestamp without time zone) of "$extension:btree_gin".timestamp_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timestamp_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timestamp_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "timestamp",
            },
            right: {
              namespace: "pg_catalog",
              name: "timestamp",
            },
            strategy: 1,
            purpose: "s",
            operator: "pg_catalog.<(pg_catalog.timestamp,pg_catalog.timestamp)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 2 (bigint, bigint) of "$extension:btree_gin".int8_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int8_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int8_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "int8",
          },
          right: {
            namespace: "pg_catalog",
            name: "int8",
          },
          strategy: 2,
          purpose: "s",
          operator: "pg_catalog.<=(pg_catalog.int8,pg_catalog.int8)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 2 (bit varying, bit varying) of "$extension:btree_gin".varbit_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.varbit_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.varbit_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          right: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          strategy: 2,
          purpose: "s",
          operator: "pg_catalog.<=(pg_catalog.varbit,pg_catalog.varbit)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 2 (bit, bit) of "$extension:btree_gin".bit_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bit_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bit_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "bit",
          },
          right: {
            namespace: "pg_catalog",
            name: "bit",
          },
          strategy: 2,
          purpose: "s",
          operator: "pg_catalog.<=(pg_catalog.bit,pg_catalog.bit)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 2 (boolean, boolean) of "$extension:btree_gin".bool_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bool_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bool_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "bool",
          },
          right: {
            namespace: "pg_catalog",
            name: "bool",
          },
          strategy: 2,
          purpose: "s",
          operator: "pg_catalog.<=(pg_catalog.bool,pg_catalog.bool)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 2 (character, character) of "$extension:btree_gin".bpchar_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bpchar_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bpchar_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          right: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          strategy: 2,
          purpose: "s",
          operator: "pg_catalog.<=(pg_catalog.bpchar,pg_catalog.bpchar)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 2 (double precision, double precision) of "$extension:btree_gin".float8_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.float8_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.float8_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "float8",
            },
            right: {
              namespace: "pg_catalog",
              name: "float8",
            },
            strategy: 2,
            purpose: "s",
            operator: "pg_catalog.<=(pg_catalog.float8,pg_catalog.float8)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 2 (integer, integer) of "$extension:btree_gin".int4_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int4_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int4_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "int4",
          },
          right: {
            namespace: "pg_catalog",
            name: "int4",
          },
          strategy: 2,
          purpose: "s",
          operator: "pg_catalog.<=(pg_catalog.int4,pg_catalog.int4)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 2 (interval, interval) of "$extension:btree_gin".interval_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.interval_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.interval_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "interval",
          },
          right: {
            namespace: "pg_catalog",
            name: "interval",
          },
          strategy: 2,
          purpose: "s",
          operator: "pg_catalog.<=(pg_catalog.interval,pg_catalog.interval)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 2 (numeric, numeric) of "$extension:btree_gin".numeric_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.numeric_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.numeric_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          right: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          strategy: 2,
          purpose: "s",
          operator: "pg_catalog.<=(pg_catalog.numeric,pg_catalog.numeric)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 2 (pg_catalog."char", pg_catalog."char") of "$extension:btree_gin".char_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.char_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.char_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "char",
            },
            right: {
              namespace: "pg_catalog",
              name: "char",
            },
            strategy: 2,
            purpose: "s",
            operator: "pg_catalog.<=(pg_catalog.char,pg_catalog.char)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 2 (pg_catalog.anyenum, pg_catalog.anyenum) of "$extension:btree_gin".enum_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.enum_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.enum_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "anyenum",
            },
            right: {
              namespace: "pg_catalog",
              name: "anyenum",
            },
            strategy: 2,
            purpose: "s",
            operator: "pg_catalog.<=(pg_catalog.anyenum,pg_catalog.anyenum)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 2 (pg_catalog.bytea, pg_catalog.bytea) of "$extension:btree_gin".bytea_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.bytea_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.bytea_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "bytea",
            },
            right: {
              namespace: "pg_catalog",
              name: "bytea",
            },
            strategy: 2,
            purpose: "s",
            operator: "pg_catalog.<=(pg_catalog.bytea,pg_catalog.bytea)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 2 (pg_catalog.date, pg_catalog.date) of "$extension:btree_gin".date_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.date_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.date_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "date",
            },
            right: {
              namespace: "pg_catalog",
              name: "date",
            },
            strategy: 2,
            purpose: "s",
            operator: "pg_catalog.<=(pg_catalog.date,pg_catalog.date)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 2 (pg_catalog.inet, pg_catalog.inet) of "$extension:btree_gin".cidr_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.cidr_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.cidr_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "inet",
            },
            right: {
              namespace: "pg_catalog",
              name: "inet",
            },
            strategy: 2,
            purpose: "s",
            operator: "pg_catalog.<=(pg_catalog.inet,pg_catalog.inet)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 2 (pg_catalog.inet, pg_catalog.inet) of "$extension:btree_gin".inet_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.inet_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.inet_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "inet",
            },
            right: {
              namespace: "pg_catalog",
              name: "inet",
            },
            strategy: 2,
            purpose: "s",
            operator: "pg_catalog.<=(pg_catalog.inet,pg_catalog.inet)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 2 (pg_catalog.macaddr, pg_catalog.macaddr) of "$extension:btree_gin".macaddr_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.macaddr_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.macaddr_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "macaddr",
            },
            right: {
              namespace: "pg_catalog",
              name: "macaddr",
            },
            strategy: 2,
            purpose: "s",
            operator: "pg_catalog.<=(pg_catalog.macaddr,pg_catalog.macaddr)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 2 (pg_catalog.macaddr8, pg_catalog.macaddr8) of "$extension:btree_gin".macaddr8_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.macaddr8_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.macaddr8_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "macaddr8",
            },
            right: {
              namespace: "pg_catalog",
              name: "macaddr8",
            },
            strategy: 2,
            purpose: "s",
            operator: "pg_catalog.<=(pg_catalog.macaddr8,pg_catalog.macaddr8)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 2 (pg_catalog.money, pg_catalog.money) of "$extension:btree_gin".money_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.money_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.money_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "money",
            },
            right: {
              namespace: "pg_catalog",
              name: "money",
            },
            strategy: 2,
            purpose: "s",
            operator: "pg_catalog.<=(pg_catalog.money,pg_catalog.money)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 2 (pg_catalog.name, pg_catalog.name) of "$extension:btree_gin".name_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.name_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.name_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "name",
            },
            right: {
              namespace: "pg_catalog",
              name: "name",
            },
            strategy: 2,
            purpose: "s",
            operator: "pg_catalog.<=(pg_catalog.name,pg_catalog.name)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 2 (pg_catalog.oid, pg_catalog.oid) of "$extension:btree_gin".oid_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.oid_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.oid_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "oid",
          },
          right: {
            namespace: "pg_catalog",
            name: "oid",
          },
          strategy: 2,
          purpose: "s",
          operator: "pg_catalog.<=(pg_catalog.oid,pg_catalog.oid)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 2 (pg_catalog.text, pg_catalog.text) of "$extension:btree_gin".text_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.text_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.text_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "text",
            },
            right: {
              namespace: "pg_catalog",
              name: "text",
            },
            strategy: 2,
            purpose: "s",
            operator: "pg_catalog.<=(pg_catalog.text,pg_catalog.text)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 2 (pg_catalog.text, pg_catalog.text) of "$extension:btree_gin".varchar_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.varchar_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.varchar_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "text",
            },
            right: {
              namespace: "pg_catalog",
              name: "text",
            },
            strategy: 2,
            purpose: "s",
            operator: "pg_catalog.<=(pg_catalog.text,pg_catalog.text)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 2 (pg_catalog.uuid, pg_catalog.uuid) of "$extension:btree_gin".uuid_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.uuid_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.uuid_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "uuid",
            },
            right: {
              namespace: "pg_catalog",
              name: "uuid",
            },
            strategy: 2,
            purpose: "s",
            operator: "pg_catalog.<=(pg_catalog.uuid,pg_catalog.uuid)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 2 (real, real) of "$extension:btree_gin".float4_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.float4_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.float4_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "float4",
          },
          right: {
            namespace: "pg_catalog",
            name: "float4",
          },
          strategy: 2,
          purpose: "s",
          operator: "pg_catalog.<=(pg_catalog.float4,pg_catalog.float4)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 2 (smallint, smallint) of "$extension:btree_gin".int2_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int2_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int2_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "int2",
          },
          right: {
            namespace: "pg_catalog",
            name: "int2",
          },
          strategy: 2,
          purpose: "s",
          operator: "pg_catalog.<=(pg_catalog.int2,pg_catalog.int2)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 2 (time with time zone, time with time zone) of "$extension:btree_gin".timetz_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timetz_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timetz_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "timetz",
            },
            right: {
              namespace: "pg_catalog",
              name: "timetz",
            },
            strategy: 2,
            purpose: "s",
            operator: "pg_catalog.<=(pg_catalog.timetz,pg_catalog.timetz)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 2 (time without time zone, time without time zone) of "$extension:btree_gin".time_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.time_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.time_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "time",
            },
            right: {
              namespace: "pg_catalog",
              name: "time",
            },
            strategy: 2,
            purpose: "s",
            operator: "pg_catalog.<=(pg_catalog.time,pg_catalog.time)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 2 (timestamp with time zone, timestamp with time zone) of "$extension:btree_gin".timestamptz_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timestamptz_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timestamptz_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "timestamptz",
            },
            right: {
              namespace: "pg_catalog",
              name: "timestamptz",
            },
            strategy: 2,
            purpose: "s",
            operator: "pg_catalog.<=(pg_catalog.timestamptz,pg_catalog.timestamptz)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 2 (timestamp without time zone, timestamp without time zone) of "$extension:btree_gin".timestamp_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timestamp_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timestamp_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "timestamp",
            },
            right: {
              namespace: "pg_catalog",
              name: "timestamp",
            },
            strategy: 2,
            purpose: "s",
            operator: "pg_catalog.<=(pg_catalog.timestamp,pg_catalog.timestamp)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 3 (bigint, bigint) of "$extension:btree_gin".int8_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int8_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int8_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "int8",
          },
          right: {
            namespace: "pg_catalog",
            name: "int8",
          },
          strategy: 3,
          purpose: "s",
          operator: "pg_catalog.=(pg_catalog.int8,pg_catalog.int8)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 3 (bit varying, bit varying) of "$extension:btree_gin".varbit_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.varbit_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.varbit_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          right: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          strategy: 3,
          purpose: "s",
          operator: "pg_catalog.=(pg_catalog.varbit,pg_catalog.varbit)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 3 (bit, bit) of "$extension:btree_gin".bit_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bit_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bit_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "bit",
          },
          right: {
            namespace: "pg_catalog",
            name: "bit",
          },
          strategy: 3,
          purpose: "s",
          operator: "pg_catalog.=(pg_catalog.bit,pg_catalog.bit)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 3 (boolean, boolean) of "$extension:btree_gin".bool_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bool_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bool_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "bool",
          },
          right: {
            namespace: "pg_catalog",
            name: "bool",
          },
          strategy: 3,
          purpose: "s",
          operator: "pg_catalog.=(pg_catalog.bool,pg_catalog.bool)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 3 (character, character) of "$extension:btree_gin".bpchar_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bpchar_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bpchar_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          right: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          strategy: 3,
          purpose: "s",
          operator: "pg_catalog.=(pg_catalog.bpchar,pg_catalog.bpchar)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 3 (double precision, double precision) of "$extension:btree_gin".float8_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.float8_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.float8_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "float8",
            },
            right: {
              namespace: "pg_catalog",
              name: "float8",
            },
            strategy: 3,
            purpose: "s",
            operator: "pg_catalog.=(pg_catalog.float8,pg_catalog.float8)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 3 (integer, integer) of "$extension:btree_gin".int4_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int4_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int4_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "int4",
          },
          right: {
            namespace: "pg_catalog",
            name: "int4",
          },
          strategy: 3,
          purpose: "s",
          operator: "pg_catalog.=(pg_catalog.int4,pg_catalog.int4)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 3 (interval, interval) of "$extension:btree_gin".interval_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.interval_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.interval_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "interval",
          },
          right: {
            namespace: "pg_catalog",
            name: "interval",
          },
          strategy: 3,
          purpose: "s",
          operator: "pg_catalog.=(pg_catalog.interval,pg_catalog.interval)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 3 (numeric, numeric) of "$extension:btree_gin".numeric_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.numeric_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.numeric_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          right: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          strategy: 3,
          purpose: "s",
          operator: "pg_catalog.=(pg_catalog.numeric,pg_catalog.numeric)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 3 (pg_catalog."char", pg_catalog."char") of "$extension:btree_gin".char_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.char_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.char_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "char",
            },
            right: {
              namespace: "pg_catalog",
              name: "char",
            },
            strategy: 3,
            purpose: "s",
            operator: "pg_catalog.=(pg_catalog.char,pg_catalog.char)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 3 (pg_catalog.anyenum, pg_catalog.anyenum) of "$extension:btree_gin".enum_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.enum_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.enum_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "anyenum",
            },
            right: {
              namespace: "pg_catalog",
              name: "anyenum",
            },
            strategy: 3,
            purpose: "s",
            operator: "pg_catalog.=(pg_catalog.anyenum,pg_catalog.anyenum)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 3 (pg_catalog.bytea, pg_catalog.bytea) of "$extension:btree_gin".bytea_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.bytea_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.bytea_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "bytea",
            },
            right: {
              namespace: "pg_catalog",
              name: "bytea",
            },
            strategy: 3,
            purpose: "s",
            operator: "pg_catalog.=(pg_catalog.bytea,pg_catalog.bytea)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 3 (pg_catalog.date, pg_catalog.date) of "$extension:btree_gin".date_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.date_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.date_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "date",
            },
            right: {
              namespace: "pg_catalog",
              name: "date",
            },
            strategy: 3,
            purpose: "s",
            operator: "pg_catalog.=(pg_catalog.date,pg_catalog.date)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 3 (pg_catalog.inet, pg_catalog.inet) of "$extension:btree_gin".cidr_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.cidr_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.cidr_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "inet",
            },
            right: {
              namespace: "pg_catalog",
              name: "inet",
            },
            strategy: 3,
            purpose: "s",
            operator: "pg_catalog.=(pg_catalog.inet,pg_catalog.inet)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 3 (pg_catalog.inet, pg_catalog.inet) of "$extension:btree_gin".inet_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.inet_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.inet_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "inet",
            },
            right: {
              namespace: "pg_catalog",
              name: "inet",
            },
            strategy: 3,
            purpose: "s",
            operator: "pg_catalog.=(pg_catalog.inet,pg_catalog.inet)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 3 (pg_catalog.macaddr, pg_catalog.macaddr) of "$extension:btree_gin".macaddr_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.macaddr_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.macaddr_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "macaddr",
            },
            right: {
              namespace: "pg_catalog",
              name: "macaddr",
            },
            strategy: 3,
            purpose: "s",
            operator: "pg_catalog.=(pg_catalog.macaddr,pg_catalog.macaddr)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 3 (pg_catalog.macaddr8, pg_catalog.macaddr8) of "$extension:btree_gin".macaddr8_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.macaddr8_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.macaddr8_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "macaddr8",
            },
            right: {
              namespace: "pg_catalog",
              name: "macaddr8",
            },
            strategy: 3,
            purpose: "s",
            operator: "pg_catalog.=(pg_catalog.macaddr8,pg_catalog.macaddr8)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 3 (pg_catalog.money, pg_catalog.money) of "$extension:btree_gin".money_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.money_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.money_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "money",
            },
            right: {
              namespace: "pg_catalog",
              name: "money",
            },
            strategy: 3,
            purpose: "s",
            operator: "pg_catalog.=(pg_catalog.money,pg_catalog.money)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 3 (pg_catalog.name, pg_catalog.name) of "$extension:btree_gin".name_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.name_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.name_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "name",
            },
            right: {
              namespace: "pg_catalog",
              name: "name",
            },
            strategy: 3,
            purpose: "s",
            operator: "pg_catalog.=(pg_catalog.name,pg_catalog.name)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 3 (pg_catalog.oid, pg_catalog.oid) of "$extension:btree_gin".oid_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.oid_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.oid_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "oid",
          },
          right: {
            namespace: "pg_catalog",
            name: "oid",
          },
          strategy: 3,
          purpose: "s",
          operator: "pg_catalog.=(pg_catalog.oid,pg_catalog.oid)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 3 (pg_catalog.text, pg_catalog.text) of "$extension:btree_gin".text_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.text_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.text_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "text",
            },
            right: {
              namespace: "pg_catalog",
              name: "text",
            },
            strategy: 3,
            purpose: "s",
            operator: "pg_catalog.=(pg_catalog.text,pg_catalog.text)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 3 (pg_catalog.text, pg_catalog.text) of "$extension:btree_gin".varchar_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.varchar_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.varchar_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "text",
            },
            right: {
              namespace: "pg_catalog",
              name: "text",
            },
            strategy: 3,
            purpose: "s",
            operator: "pg_catalog.=(pg_catalog.text,pg_catalog.text)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 3 (pg_catalog.uuid, pg_catalog.uuid) of "$extension:btree_gin".uuid_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.uuid_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.uuid_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "uuid",
            },
            right: {
              namespace: "pg_catalog",
              name: "uuid",
            },
            strategy: 3,
            purpose: "s",
            operator: "pg_catalog.=(pg_catalog.uuid,pg_catalog.uuid)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 3 (real, real) of "$extension:btree_gin".float4_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.float4_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.float4_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "float4",
          },
          right: {
            namespace: "pg_catalog",
            name: "float4",
          },
          strategy: 3,
          purpose: "s",
          operator: "pg_catalog.=(pg_catalog.float4,pg_catalog.float4)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 3 (smallint, smallint) of "$extension:btree_gin".int2_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int2_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int2_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "int2",
          },
          right: {
            namespace: "pg_catalog",
            name: "int2",
          },
          strategy: 3,
          purpose: "s",
          operator: "pg_catalog.=(pg_catalog.int2,pg_catalog.int2)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 3 (time with time zone, time with time zone) of "$extension:btree_gin".timetz_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timetz_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timetz_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "timetz",
            },
            right: {
              namespace: "pg_catalog",
              name: "timetz",
            },
            strategy: 3,
            purpose: "s",
            operator: "pg_catalog.=(pg_catalog.timetz,pg_catalog.timetz)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 3 (time without time zone, time without time zone) of "$extension:btree_gin".time_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.time_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.time_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "time",
            },
            right: {
              namespace: "pg_catalog",
              name: "time",
            },
            strategy: 3,
            purpose: "s",
            operator: "pg_catalog.=(pg_catalog.time,pg_catalog.time)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 3 (timestamp with time zone, timestamp with time zone) of "$extension:btree_gin".timestamptz_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timestamptz_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timestamptz_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "timestamptz",
            },
            right: {
              namespace: "pg_catalog",
              name: "timestamptz",
            },
            strategy: 3,
            purpose: "s",
            operator: "pg_catalog.=(pg_catalog.timestamptz,pg_catalog.timestamptz)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 3 (timestamp without time zone, timestamp without time zone) of "$extension:btree_gin".timestamp_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timestamp_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timestamp_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "timestamp",
            },
            right: {
              namespace: "pg_catalog",
              name: "timestamp",
            },
            strategy: 3,
            purpose: "s",
            operator: "pg_catalog.=(pg_catalog.timestamp,pg_catalog.timestamp)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 4 (bigint, bigint) of "$extension:btree_gin".int8_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int8_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int8_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "int8",
          },
          right: {
            namespace: "pg_catalog",
            name: "int8",
          },
          strategy: 4,
          purpose: "s",
          operator: "pg_catalog.>=(pg_catalog.int8,pg_catalog.int8)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 4 (bit varying, bit varying) of "$extension:btree_gin".varbit_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.varbit_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.varbit_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          right: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          strategy: 4,
          purpose: "s",
          operator: "pg_catalog.>=(pg_catalog.varbit,pg_catalog.varbit)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 4 (bit, bit) of "$extension:btree_gin".bit_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bit_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bit_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "bit",
          },
          right: {
            namespace: "pg_catalog",
            name: "bit",
          },
          strategy: 4,
          purpose: "s",
          operator: "pg_catalog.>=(pg_catalog.bit,pg_catalog.bit)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 4 (boolean, boolean) of "$extension:btree_gin".bool_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bool_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bool_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "bool",
          },
          right: {
            namespace: "pg_catalog",
            name: "bool",
          },
          strategy: 4,
          purpose: "s",
          operator: "pg_catalog.>=(pg_catalog.bool,pg_catalog.bool)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 4 (character, character) of "$extension:btree_gin".bpchar_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bpchar_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bpchar_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          right: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          strategy: 4,
          purpose: "s",
          operator: "pg_catalog.>=(pg_catalog.bpchar,pg_catalog.bpchar)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 4 (double precision, double precision) of "$extension:btree_gin".float8_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.float8_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.float8_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "float8",
            },
            right: {
              namespace: "pg_catalog",
              name: "float8",
            },
            strategy: 4,
            purpose: "s",
            operator: "pg_catalog.>=(pg_catalog.float8,pg_catalog.float8)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 4 (integer, integer) of "$extension:btree_gin".int4_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int4_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int4_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "int4",
          },
          right: {
            namespace: "pg_catalog",
            name: "int4",
          },
          strategy: 4,
          purpose: "s",
          operator: "pg_catalog.>=(pg_catalog.int4,pg_catalog.int4)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 4 (interval, interval) of "$extension:btree_gin".interval_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.interval_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.interval_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "interval",
          },
          right: {
            namespace: "pg_catalog",
            name: "interval",
          },
          strategy: 4,
          purpose: "s",
          operator: "pg_catalog.>=(pg_catalog.interval,pg_catalog.interval)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 4 (numeric, numeric) of "$extension:btree_gin".numeric_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.numeric_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.numeric_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          right: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          strategy: 4,
          purpose: "s",
          operator: "pg_catalog.>=(pg_catalog.numeric,pg_catalog.numeric)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 4 (pg_catalog."char", pg_catalog."char") of "$extension:btree_gin".char_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.char_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.char_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "char",
            },
            right: {
              namespace: "pg_catalog",
              name: "char",
            },
            strategy: 4,
            purpose: "s",
            operator: "pg_catalog.>=(pg_catalog.char,pg_catalog.char)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 4 (pg_catalog.anyenum, pg_catalog.anyenum) of "$extension:btree_gin".enum_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.enum_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.enum_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "anyenum",
            },
            right: {
              namespace: "pg_catalog",
              name: "anyenum",
            },
            strategy: 4,
            purpose: "s",
            operator: "pg_catalog.>=(pg_catalog.anyenum,pg_catalog.anyenum)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 4 (pg_catalog.bytea, pg_catalog.bytea) of "$extension:btree_gin".bytea_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.bytea_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.bytea_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "bytea",
            },
            right: {
              namespace: "pg_catalog",
              name: "bytea",
            },
            strategy: 4,
            purpose: "s",
            operator: "pg_catalog.>=(pg_catalog.bytea,pg_catalog.bytea)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 4 (pg_catalog.date, pg_catalog.date) of "$extension:btree_gin".date_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.date_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.date_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "date",
            },
            right: {
              namespace: "pg_catalog",
              name: "date",
            },
            strategy: 4,
            purpose: "s",
            operator: "pg_catalog.>=(pg_catalog.date,pg_catalog.date)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 4 (pg_catalog.inet, pg_catalog.inet) of "$extension:btree_gin".cidr_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.cidr_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.cidr_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "inet",
            },
            right: {
              namespace: "pg_catalog",
              name: "inet",
            },
            strategy: 4,
            purpose: "s",
            operator: "pg_catalog.>=(pg_catalog.inet,pg_catalog.inet)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 4 (pg_catalog.inet, pg_catalog.inet) of "$extension:btree_gin".inet_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.inet_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.inet_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "inet",
            },
            right: {
              namespace: "pg_catalog",
              name: "inet",
            },
            strategy: 4,
            purpose: "s",
            operator: "pg_catalog.>=(pg_catalog.inet,pg_catalog.inet)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 4 (pg_catalog.macaddr, pg_catalog.macaddr) of "$extension:btree_gin".macaddr_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.macaddr_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.macaddr_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "macaddr",
            },
            right: {
              namespace: "pg_catalog",
              name: "macaddr",
            },
            strategy: 4,
            purpose: "s",
            operator: "pg_catalog.>=(pg_catalog.macaddr,pg_catalog.macaddr)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 4 (pg_catalog.macaddr8, pg_catalog.macaddr8) of "$extension:btree_gin".macaddr8_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.macaddr8_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.macaddr8_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "macaddr8",
            },
            right: {
              namespace: "pg_catalog",
              name: "macaddr8",
            },
            strategy: 4,
            purpose: "s",
            operator: "pg_catalog.>=(pg_catalog.macaddr8,pg_catalog.macaddr8)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 4 (pg_catalog.money, pg_catalog.money) of "$extension:btree_gin".money_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.money_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.money_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "money",
            },
            right: {
              namespace: "pg_catalog",
              name: "money",
            },
            strategy: 4,
            purpose: "s",
            operator: "pg_catalog.>=(pg_catalog.money,pg_catalog.money)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 4 (pg_catalog.name, pg_catalog.name) of "$extension:btree_gin".name_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.name_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.name_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "name",
            },
            right: {
              namespace: "pg_catalog",
              name: "name",
            },
            strategy: 4,
            purpose: "s",
            operator: "pg_catalog.>=(pg_catalog.name,pg_catalog.name)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 4 (pg_catalog.oid, pg_catalog.oid) of "$extension:btree_gin".oid_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.oid_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.oid_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "oid",
          },
          right: {
            namespace: "pg_catalog",
            name: "oid",
          },
          strategy: 4,
          purpose: "s",
          operator: "pg_catalog.>=(pg_catalog.oid,pg_catalog.oid)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 4 (pg_catalog.text, pg_catalog.text) of "$extension:btree_gin".text_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.text_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.text_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "text",
            },
            right: {
              namespace: "pg_catalog",
              name: "text",
            },
            strategy: 4,
            purpose: "s",
            operator: "pg_catalog.>=(pg_catalog.text,pg_catalog.text)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 4 (pg_catalog.text, pg_catalog.text) of "$extension:btree_gin".varchar_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.varchar_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.varchar_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "text",
            },
            right: {
              namespace: "pg_catalog",
              name: "text",
            },
            strategy: 4,
            purpose: "s",
            operator: "pg_catalog.>=(pg_catalog.text,pg_catalog.text)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 4 (pg_catalog.uuid, pg_catalog.uuid) of "$extension:btree_gin".uuid_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.uuid_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.uuid_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "uuid",
            },
            right: {
              namespace: "pg_catalog",
              name: "uuid",
            },
            strategy: 4,
            purpose: "s",
            operator: "pg_catalog.>=(pg_catalog.uuid,pg_catalog.uuid)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 4 (real, real) of "$extension:btree_gin".float4_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.float4_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.float4_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "float4",
          },
          right: {
            namespace: "pg_catalog",
            name: "float4",
          },
          strategy: 4,
          purpose: "s",
          operator: "pg_catalog.>=(pg_catalog.float4,pg_catalog.float4)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 4 (smallint, smallint) of "$extension:btree_gin".int2_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int2_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int2_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "int2",
          },
          right: {
            namespace: "pg_catalog",
            name: "int2",
          },
          strategy: 4,
          purpose: "s",
          operator: "pg_catalog.>=(pg_catalog.int2,pg_catalog.int2)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 4 (time with time zone, time with time zone) of "$extension:btree_gin".timetz_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timetz_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timetz_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "timetz",
            },
            right: {
              namespace: "pg_catalog",
              name: "timetz",
            },
            strategy: 4,
            purpose: "s",
            operator: "pg_catalog.>=(pg_catalog.timetz,pg_catalog.timetz)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 4 (time without time zone, time without time zone) of "$extension:btree_gin".time_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.time_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.time_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "time",
            },
            right: {
              namespace: "pg_catalog",
              name: "time",
            },
            strategy: 4,
            purpose: "s",
            operator: "pg_catalog.>=(pg_catalog.time,pg_catalog.time)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 4 (timestamp with time zone, timestamp with time zone) of "$extension:btree_gin".timestamptz_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timestamptz_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timestamptz_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "timestamptz",
            },
            right: {
              namespace: "pg_catalog",
              name: "timestamptz",
            },
            strategy: 4,
            purpose: "s",
            operator: "pg_catalog.>=(pg_catalog.timestamptz,pg_catalog.timestamptz)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 4 (timestamp without time zone, timestamp without time zone) of "$extension:btree_gin".timestamp_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timestamp_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timestamp_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "timestamp",
            },
            right: {
              namespace: "pg_catalog",
              name: "timestamp",
            },
            strategy: 4,
            purpose: "s",
            operator: "pg_catalog.>=(pg_catalog.timestamp,pg_catalog.timestamp)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 5 (bigint, bigint) of "$extension:btree_gin".int8_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int8_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int8_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "int8",
          },
          right: {
            namespace: "pg_catalog",
            name: "int8",
          },
          strategy: 5,
          purpose: "s",
          operator: "pg_catalog.>(pg_catalog.int8,pg_catalog.int8)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 5 (bit varying, bit varying) of "$extension:btree_gin".varbit_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.varbit_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.varbit_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          right: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          strategy: 5,
          purpose: "s",
          operator: "pg_catalog.>(pg_catalog.varbit,pg_catalog.varbit)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 5 (bit, bit) of "$extension:btree_gin".bit_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bit_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bit_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "bit",
          },
          right: {
            namespace: "pg_catalog",
            name: "bit",
          },
          strategy: 5,
          purpose: "s",
          operator: "pg_catalog.>(pg_catalog.bit,pg_catalog.bit)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 5 (boolean, boolean) of "$extension:btree_gin".bool_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bool_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bool_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "bool",
          },
          right: {
            namespace: "pg_catalog",
            name: "bool",
          },
          strategy: 5,
          purpose: "s",
          operator: "pg_catalog.>(pg_catalog.bool,pg_catalog.bool)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 5 (character, character) of "$extension:btree_gin".bpchar_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.bpchar_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.bpchar_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          right: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          strategy: 5,
          purpose: "s",
          operator: "pg_catalog.>(pg_catalog.bpchar,pg_catalog.bpchar)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 5 (double precision, double precision) of "$extension:btree_gin".float8_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.float8_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.float8_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "float8",
            },
            right: {
              namespace: "pg_catalog",
              name: "float8",
            },
            strategy: 5,
            purpose: "s",
            operator: "pg_catalog.>(pg_catalog.float8,pg_catalog.float8)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 5 (integer, integer) of "$extension:btree_gin".int4_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int4_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int4_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "int4",
          },
          right: {
            namespace: "pg_catalog",
            name: "int4",
          },
          strategy: 5,
          purpose: "s",
          operator: "pg_catalog.>(pg_catalog.int4,pg_catalog.int4)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 5 (interval, interval) of "$extension:btree_gin".interval_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.interval_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.interval_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "interval",
          },
          right: {
            namespace: "pg_catalog",
            name: "interval",
          },
          strategy: 5,
          purpose: "s",
          operator: "pg_catalog.>(pg_catalog.interval,pg_catalog.interval)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 5 (numeric, numeric) of "$extension:btree_gin".numeric_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.numeric_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.numeric_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          right: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          strategy: 5,
          purpose: "s",
          operator: "pg_catalog.>(pg_catalog.numeric,pg_catalog.numeric)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 5 (pg_catalog."char", pg_catalog."char") of "$extension:btree_gin".char_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.char_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.char_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "char",
            },
            right: {
              namespace: "pg_catalog",
              name: "char",
            },
            strategy: 5,
            purpose: "s",
            operator: "pg_catalog.>(pg_catalog.char,pg_catalog.char)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 5 (pg_catalog.anyenum, pg_catalog.anyenum) of "$extension:btree_gin".enum_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.enum_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.enum_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "anyenum",
            },
            right: {
              namespace: "pg_catalog",
              name: "anyenum",
            },
            strategy: 5,
            purpose: "s",
            operator: "pg_catalog.>(pg_catalog.anyenum,pg_catalog.anyenum)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 5 (pg_catalog.bytea, pg_catalog.bytea) of "$extension:btree_gin".bytea_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.bytea_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.bytea_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "bytea",
            },
            right: {
              namespace: "pg_catalog",
              name: "bytea",
            },
            strategy: 5,
            purpose: "s",
            operator: "pg_catalog.>(pg_catalog.bytea,pg_catalog.bytea)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 5 (pg_catalog.date, pg_catalog.date) of "$extension:btree_gin".date_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.date_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.date_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "date",
            },
            right: {
              namespace: "pg_catalog",
              name: "date",
            },
            strategy: 5,
            purpose: "s",
            operator: "pg_catalog.>(pg_catalog.date,pg_catalog.date)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 5 (pg_catalog.inet, pg_catalog.inet) of "$extension:btree_gin".cidr_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.cidr_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.cidr_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "inet",
            },
            right: {
              namespace: "pg_catalog",
              name: "inet",
            },
            strategy: 5,
            purpose: "s",
            operator: "pg_catalog.>(pg_catalog.inet,pg_catalog.inet)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 5 (pg_catalog.inet, pg_catalog.inet) of "$extension:btree_gin".inet_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.inet_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.inet_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "inet",
            },
            right: {
              namespace: "pg_catalog",
              name: "inet",
            },
            strategy: 5,
            purpose: "s",
            operator: "pg_catalog.>(pg_catalog.inet,pg_catalog.inet)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 5 (pg_catalog.macaddr, pg_catalog.macaddr) of "$extension:btree_gin".macaddr_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.macaddr_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.macaddr_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "macaddr",
            },
            right: {
              namespace: "pg_catalog",
              name: "macaddr",
            },
            strategy: 5,
            purpose: "s",
            operator: "pg_catalog.>(pg_catalog.macaddr,pg_catalog.macaddr)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 5 (pg_catalog.macaddr8, pg_catalog.macaddr8) of "$extension:btree_gin".macaddr8_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.macaddr8_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.macaddr8_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "macaddr8",
            },
            right: {
              namespace: "pg_catalog",
              name: "macaddr8",
            },
            strategy: 5,
            purpose: "s",
            operator: "pg_catalog.>(pg_catalog.macaddr8,pg_catalog.macaddr8)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 5 (pg_catalog.money, pg_catalog.money) of "$extension:btree_gin".money_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.money_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.money_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "money",
            },
            right: {
              namespace: "pg_catalog",
              name: "money",
            },
            strategy: 5,
            purpose: "s",
            operator: "pg_catalog.>(pg_catalog.money,pg_catalog.money)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 5 (pg_catalog.name, pg_catalog.name) of "$extension:btree_gin".name_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.name_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.name_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "name",
            },
            right: {
              namespace: "pg_catalog",
              name: "name",
            },
            strategy: 5,
            purpose: "s",
            operator: "pg_catalog.>(pg_catalog.name,pg_catalog.name)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 5 (pg_catalog.oid, pg_catalog.oid) of "$extension:btree_gin".oid_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.oid_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.oid_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "oid",
          },
          right: {
            namespace: "pg_catalog",
            name: "oid",
          },
          strategy: 5,
          purpose: "s",
          operator: "pg_catalog.>(pg_catalog.oid,pg_catalog.oid)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 5 (pg_catalog.text, pg_catalog.text) of "$extension:btree_gin".text_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.text_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.text_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "text",
            },
            right: {
              namespace: "pg_catalog",
              name: "text",
            },
            strategy: 5,
            purpose: "s",
            operator: "pg_catalog.>(pg_catalog.text,pg_catalog.text)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 5 (pg_catalog.text, pg_catalog.text) of "$extension:btree_gin".varchar_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.varchar_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.varchar_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "text",
            },
            right: {
              namespace: "pg_catalog",
              name: "text",
            },
            strategy: 5,
            purpose: "s",
            operator: "pg_catalog.>(pg_catalog.text,pg_catalog.text)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 5 (pg_catalog.uuid, pg_catalog.uuid) of "$extension:btree_gin".uuid_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.uuid_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.uuid_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "uuid",
            },
            right: {
              namespace: "pg_catalog",
              name: "uuid",
            },
            strategy: 5,
            purpose: "s",
            operator: "pg_catalog.>(pg_catalog.uuid,pg_catalog.uuid)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 5 (real, real) of "$extension:btree_gin".float4_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.float4_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.float4_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "float4",
          },
          right: {
            namespace: "pg_catalog",
            name: "float4",
          },
          strategy: 5,
          purpose: "s",
          operator: "pg_catalog.>(pg_catalog.float4,pg_catalog.float4)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 5 (smallint, smallint) of "$extension:btree_gin".int2_ops USING gin': [
    {
      from: "opclass:$extension:btree_gin.int2_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:btree_gin.int2_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "int2",
          },
          right: {
            namespace: "pg_catalog",
            name: "int2",
          },
          strategy: 5,
          purpose: "s",
          operator: "pg_catalog.>(pg_catalog.int2,pg_catalog.int2)",
          sortFamily: null,
        },
      },
    },
  ],
  'operator of access method:operator 5 (time with time zone, time with time zone) of "$extension:btree_gin".timetz_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timetz_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timetz_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "timetz",
            },
            right: {
              namespace: "pg_catalog",
              name: "timetz",
            },
            strategy: 5,
            purpose: "s",
            operator: "pg_catalog.>(pg_catalog.timetz,pg_catalog.timetz)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 5 (time without time zone, time without time zone) of "$extension:btree_gin".time_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.time_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.time_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "time",
            },
            right: {
              namespace: "pg_catalog",
              name: "time",
            },
            strategy: 5,
            purpose: "s",
            operator: "pg_catalog.>(pg_catalog.time,pg_catalog.time)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 5 (timestamp with time zone, timestamp with time zone) of "$extension:btree_gin".timestamptz_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timestamptz_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timestamptz_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "timestamptz",
            },
            right: {
              namespace: "pg_catalog",
              name: "timestamptz",
            },
            strategy: 5,
            purpose: "s",
            operator: "pg_catalog.>(pg_catalog.timestamptz,pg_catalog.timestamptz)",
            sortFamily: null,
          },
        },
      },
    ],
  'operator of access method:operator 5 (timestamp without time zone, timestamp without time zone) of "$extension:btree_gin".timestamp_ops USING gin':
    [
      {
        from: "opclass:$extension:btree_gin.timestamp_ops/gin",
        relation: {
          kind: "attachment",
          family: "opfamily:$extension:btree_gin.timestamp_ops/gin",
          row: {
            kind: "operator",
            left: {
              namespace: "pg_catalog",
              name: "timestamp",
            },
            right: {
              namespace: "pg_catalog",
              name: "timestamp",
            },
            strategy: 5,
            purpose: "s",
            operator: "pg_catalog.>(pg_catalog.timestamp,pg_catalog.timestamp)",
            sortFamily: null,
          },
        },
      },
    ],
  "opfamily:$extension:btree_gin.bit_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.bit_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.bool_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.bool_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.bpchar_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.bpchar_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.bytea_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.bytea_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.char_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.char_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.cidr_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.cidr_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.date_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.date_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.enum_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.enum_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.float4_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.float4_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.float8_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.float8_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.inet_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.inet_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.int2_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.int2_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.int4_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.int4_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.int8_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.int8_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.interval_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.interval_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.macaddr_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.macaddr_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.macaddr8_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.macaddr8_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.money_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.money_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.name_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.name_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.numeric_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.numeric_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.oid_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.oid_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.text_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.text_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.time_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.time_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.timestamp_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.timestamp_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.timestamptz_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.timestamptz_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.timetz_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.timetz_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.uuid_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.uuid_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.varbit_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.varbit_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "opfamily:$extension:btree_gin.varchar_ops/gin": [
    {
      from: "opclass:$extension:btree_gin.varchar_ops/gin",
      relation: {
        kind: "opclass-family",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.bit_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.bit_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "bit",
          },
          right: {
            namespace: "pg_catalog",
            name: "bit",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.bool_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.bool_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "bool",
          },
          right: {
            namespace: "pg_catalog",
            name: "bool",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.bpchar_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.bpchar_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          right: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.bytea_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.bytea_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "bytea",
          },
          right: {
            namespace: "pg_catalog",
            name: "bytea",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.char_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.char_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "char",
          },
          right: {
            namespace: "pg_catalog",
            name: "char",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.cidr_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.cidr_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "cidr",
          },
          right: {
            namespace: "pg_catalog",
            name: "cidr",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.date_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.date_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "date",
          },
          right: {
            namespace: "pg_catalog",
            name: "date",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.enum_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.enum_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "anyenum",
          },
          right: {
            namespace: "pg_catalog",
            name: "anyenum",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.float4_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.float4_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "float4",
          },
          right: {
            namespace: "pg_catalog",
            name: "float4",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.float8_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.float8_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "float8",
          },
          right: {
            namespace: "pg_catalog",
            name: "float8",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.inet_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.inet_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "inet",
          },
          right: {
            namespace: "pg_catalog",
            name: "inet",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.int2_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.int2_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "int2",
          },
          right: {
            namespace: "pg_catalog",
            name: "int2",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.int4_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.int4_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "int4",
          },
          right: {
            namespace: "pg_catalog",
            name: "int4",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.int8_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.int8_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "int8",
          },
          right: {
            namespace: "pg_catalog",
            name: "int8",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.interval_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.interval_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "interval",
          },
          right: {
            namespace: "pg_catalog",
            name: "interval",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.macaddr_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.macaddr_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "macaddr",
          },
          right: {
            namespace: "pg_catalog",
            name: "macaddr",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.macaddr8_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.macaddr8_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "macaddr8",
          },
          right: {
            namespace: "pg_catalog",
            name: "macaddr8",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.money_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.money_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "money",
          },
          right: {
            namespace: "pg_catalog",
            name: "money",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.name_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.name_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "name",
          },
          right: {
            namespace: "pg_catalog",
            name: "name",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.numeric_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.numeric_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          right: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.oid_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.oid_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "oid",
          },
          right: {
            namespace: "pg_catalog",
            name: "oid",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.text_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.text_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "text",
          },
          right: {
            namespace: "pg_catalog",
            name: "text",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.time_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.time_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "time",
          },
          right: {
            namespace: "pg_catalog",
            name: "time",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.timestamp_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.timestamp_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "timestamp",
          },
          right: {
            namespace: "pg_catalog",
            name: "timestamp",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.timestamptz_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.timestamptz_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "timestamptz",
          },
          right: {
            namespace: "pg_catalog",
            name: "timestamptz",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.timetz_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.timetz_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "timetz",
          },
          right: {
            namespace: "pg_catalog",
            name: "timetz",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.uuid_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.uuid_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "uuid",
          },
          right: {
            namespace: "pg_catalog",
            name: "uuid",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.varbit_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.varbit_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          right: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.varchar_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.varchar_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "varchar",
          },
          right: {
            namespace: "pg_catalog",
            name: "varchar",
          },
          number: 4,
          procedure:
            "$extension:btree_gin.gin_btree_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.anyelement,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_anyenum(pg_catalog.anyenum,pg_catalog.anyenum,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.enum_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.enum_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "anyenum",
          },
          right: {
            namespace: "pg_catalog",
            name: "anyenum",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_anyenum(pg_catalog.anyenum,pg_catalog.anyenum,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_bit(pg_catalog.bit,pg_catalog.bit,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.bit_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.bit_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "bit",
          },
          right: {
            namespace: "pg_catalog",
            name: "bit",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_bit(pg_catalog.bit,pg_catalog.bit,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_bool(pg_catalog.bool,pg_catalog.bool,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.bool_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.bool_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "bool",
          },
          right: {
            namespace: "pg_catalog",
            name: "bool",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_bool(pg_catalog.bool,pg_catalog.bool,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_bpchar(pg_catalog.bpchar,pg_catalog.bpchar,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.bpchar_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.bpchar_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          right: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_bpchar(pg_catalog.bpchar,pg_catalog.bpchar,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_bytea(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.bytea_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.bytea_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "bytea",
          },
          right: {
            namespace: "pg_catalog",
            name: "bytea",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_bytea(pg_catalog.bytea,pg_catalog.bytea,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_char(pg_catalog.char,pg_catalog.char,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.char_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.char_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "char",
          },
          right: {
            namespace: "pg_catalog",
            name: "char",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_char(pg_catalog.char,pg_catalog.char,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_cidr(pg_catalog.cidr,pg_catalog.cidr,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.cidr_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.cidr_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "cidr",
          },
          right: {
            namespace: "pg_catalog",
            name: "cidr",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_cidr(pg_catalog.cidr,pg_catalog.cidr,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_date(pg_catalog.date,pg_catalog.date,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.date_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.date_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "date",
          },
          right: {
            namespace: "pg_catalog",
            name: "date",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_date(pg_catalog.date,pg_catalog.date,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_float4(pg_catalog.float4,pg_catalog.float4,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.float4_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.float4_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "float4",
          },
          right: {
            namespace: "pg_catalog",
            name: "float4",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_float4(pg_catalog.float4,pg_catalog.float4,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_float8(pg_catalog.float8,pg_catalog.float8,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.float8_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.float8_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "float8",
          },
          right: {
            namespace: "pg_catalog",
            name: "float8",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_float8(pg_catalog.float8,pg_catalog.float8,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_inet(pg_catalog.inet,pg_catalog.inet,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.inet_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.inet_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "inet",
          },
          right: {
            namespace: "pg_catalog",
            name: "inet",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_inet(pg_catalog.inet,pg_catalog.inet,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_int2(pg_catalog.int2,pg_catalog.int2,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.int2_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.int2_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "int2",
          },
          right: {
            namespace: "pg_catalog",
            name: "int2",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_int2(pg_catalog.int2,pg_catalog.int2,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_int4(pg_catalog.int4,pg_catalog.int4,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.int4_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.int4_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "int4",
          },
          right: {
            namespace: "pg_catalog",
            name: "int4",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_int4(pg_catalog.int4,pg_catalog.int4,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_int8(pg_catalog.int8,pg_catalog.int8,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.int8_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.int8_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "int8",
          },
          right: {
            namespace: "pg_catalog",
            name: "int8",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_int8(pg_catalog.int8,pg_catalog.int8,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_interval(pg_catalog.interval,pg_catalog.interval,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.interval_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.interval_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "interval",
          },
          right: {
            namespace: "pg_catalog",
            name: "interval",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_interval(pg_catalog.interval,pg_catalog.interval,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_macaddr(pg_catalog.macaddr,pg_catalog.macaddr,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.macaddr_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.macaddr_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "macaddr",
          },
          right: {
            namespace: "pg_catalog",
            name: "macaddr",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_macaddr(pg_catalog.macaddr,pg_catalog.macaddr,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_macaddr8(pg_catalog.macaddr8,pg_catalog.macaddr8,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.macaddr8_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.macaddr8_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "macaddr8",
          },
          right: {
            namespace: "pg_catalog",
            name: "macaddr8",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_macaddr8(pg_catalog.macaddr8,pg_catalog.macaddr8,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_money(pg_catalog.money,pg_catalog.money,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.money_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.money_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "money",
          },
          right: {
            namespace: "pg_catalog",
            name: "money",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_money(pg_catalog.money,pg_catalog.money,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_name(pg_catalog.name,pg_catalog.name,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.name_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.name_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "name",
          },
          right: {
            namespace: "pg_catalog",
            name: "name",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_name(pg_catalog.name,pg_catalog.name,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_numeric(pg_catalog.numeric,pg_catalog.numeric,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.numeric_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.numeric_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          right: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_numeric(pg_catalog.numeric,pg_catalog.numeric,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_oid(pg_catalog.oid,pg_catalog.oid,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.oid_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.oid_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "oid",
          },
          right: {
            namespace: "pg_catalog",
            name: "oid",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_oid(pg_catalog.oid,pg_catalog.oid,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_text(pg_catalog.text,pg_catalog.text,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.text_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.text_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "text",
          },
          right: {
            namespace: "pg_catalog",
            name: "text",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_text(pg_catalog.text,pg_catalog.text,pg_catalog.int2,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.varchar_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.varchar_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "varchar",
          },
          right: {
            namespace: "pg_catalog",
            name: "varchar",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_text(pg_catalog.text,pg_catalog.text,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_time(pg_catalog.time,pg_catalog.time,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.time_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.time_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "time",
          },
          right: {
            namespace: "pg_catalog",
            name: "time",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_time(pg_catalog.time,pg_catalog.time,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_timestamp(pg_catalog.timestamp,pg_catalog.timestamp,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.timestamp_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.timestamp_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "timestamp",
          },
          right: {
            namespace: "pg_catalog",
            name: "timestamp",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_timestamp(pg_catalog.timestamp,pg_catalog.timestamp,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_timestamptz(pg_catalog.timestamptz,pg_catalog.timestamptz,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.timestamptz_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.timestamptz_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "timestamptz",
          },
          right: {
            namespace: "pg_catalog",
            name: "timestamptz",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_timestamptz(pg_catalog.timestamptz,pg_catalog.timestamptz,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_timetz(pg_catalog.timetz,pg_catalog.timetz,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.timetz_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.timetz_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "timetz",
          },
          right: {
            namespace: "pg_catalog",
            name: "timetz",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_timetz(pg_catalog.timetz,pg_catalog.timetz,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_uuid(pg_catalog.uuid,pg_catalog.uuid,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.uuid_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.uuid_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "uuid",
          },
          right: {
            namespace: "pg_catalog",
            name: "uuid",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_uuid(pg_catalog.uuid,pg_catalog.uuid,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_compare_prefix_varbit(pg_catalog.varbit,pg_catalog.varbit,pg_catalog.int2,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.varbit_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.varbit_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          right: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          number: 5,
          procedure:
            "$extension:btree_gin.gin_compare_prefix_varbit(pg_catalog.varbit,pg_catalog.varbit,pg_catalog.int2,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_anyenum(pg_catalog.anyenum,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.enum_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.enum_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "anyenum",
          },
          right: {
            namespace: "pg_catalog",
            name: "anyenum",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_anyenum(pg_catalog.anyenum,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_bit(pg_catalog.bit,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.bit_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.bit_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "bit",
          },
          right: {
            namespace: "pg_catalog",
            name: "bit",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_bit(pg_catalog.bit,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_bool(pg_catalog.bool,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.bool_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.bool_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "bool",
          },
          right: {
            namespace: "pg_catalog",
            name: "bool",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_bool(pg_catalog.bool,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_bpchar(pg_catalog.bpchar,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.bpchar_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.bpchar_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          right: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_bpchar(pg_catalog.bpchar,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_bytea(pg_catalog.bytea,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.bytea_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.bytea_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "bytea",
          },
          right: {
            namespace: "pg_catalog",
            name: "bytea",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_bytea(pg_catalog.bytea,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_char(pg_catalog.char,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.char_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.char_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "char",
          },
          right: {
            namespace: "pg_catalog",
            name: "char",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_char(pg_catalog.char,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_cidr(pg_catalog.cidr,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.cidr_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.cidr_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "cidr",
          },
          right: {
            namespace: "pg_catalog",
            name: "cidr",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_cidr(pg_catalog.cidr,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_date(pg_catalog.date,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.date_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.date_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "date",
          },
          right: {
            namespace: "pg_catalog",
            name: "date",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_date(pg_catalog.date,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_float4(pg_catalog.float4,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.float4_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.float4_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "float4",
          },
          right: {
            namespace: "pg_catalog",
            name: "float4",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_float4(pg_catalog.float4,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_float8(pg_catalog.float8,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.float8_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.float8_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "float8",
          },
          right: {
            namespace: "pg_catalog",
            name: "float8",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_float8(pg_catalog.float8,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_inet(pg_catalog.inet,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.inet_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.inet_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "inet",
          },
          right: {
            namespace: "pg_catalog",
            name: "inet",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_inet(pg_catalog.inet,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_int2(pg_catalog.int2,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.int2_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.int2_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "int2",
          },
          right: {
            namespace: "pg_catalog",
            name: "int2",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_int2(pg_catalog.int2,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_int4(pg_catalog.int4,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.int4_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.int4_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "int4",
          },
          right: {
            namespace: "pg_catalog",
            name: "int4",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_int4(pg_catalog.int4,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_int8(pg_catalog.int8,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.int8_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.int8_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "int8",
          },
          right: {
            namespace: "pg_catalog",
            name: "int8",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_int8(pg_catalog.int8,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_interval(pg_catalog.interval,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.interval_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.interval_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "interval",
          },
          right: {
            namespace: "pg_catalog",
            name: "interval",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_interval(pg_catalog.interval,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_macaddr(pg_catalog.macaddr,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.macaddr_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.macaddr_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "macaddr",
          },
          right: {
            namespace: "pg_catalog",
            name: "macaddr",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_macaddr(pg_catalog.macaddr,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_macaddr8(pg_catalog.macaddr8,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.macaddr8_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.macaddr8_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "macaddr8",
          },
          right: {
            namespace: "pg_catalog",
            name: "macaddr8",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_macaddr8(pg_catalog.macaddr8,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_money(pg_catalog.money,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.money_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.money_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "money",
          },
          right: {
            namespace: "pg_catalog",
            name: "money",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_money(pg_catalog.money,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_name(pg_catalog.name,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.name_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.name_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "name",
          },
          right: {
            namespace: "pg_catalog",
            name: "name",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_name(pg_catalog.name,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_numeric(pg_catalog.numeric,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.numeric_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.numeric_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          right: {
            namespace: "pg_catalog",
            name: "numeric",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_numeric(pg_catalog.numeric,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_oid(pg_catalog.oid,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.oid_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.oid_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "oid",
          },
          right: {
            namespace: "pg_catalog",
            name: "oid",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_oid(pg_catalog.oid,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_text(pg_catalog.text,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.text_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.text_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "text",
          },
          right: {
            namespace: "pg_catalog",
            name: "text",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_text(pg_catalog.text,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
      {
        from: "opclass:$extension:btree_gin.varchar_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.varchar_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "varchar",
          },
          right: {
            namespace: "pg_catalog",
            name: "varchar",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_text(pg_catalog.text,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_time(pg_catalog.time,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.time_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.time_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "time",
          },
          right: {
            namespace: "pg_catalog",
            name: "time",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_time(pg_catalog.time,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_timestamp(pg_catalog.timestamp,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.timestamp_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.timestamp_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "timestamp",
          },
          right: {
            namespace: "pg_catalog",
            name: "timestamp",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_timestamp(pg_catalog.timestamp,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_timestamptz(pg_catalog.timestamptz,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.timestamptz_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.timestamptz_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "timestamptz",
          },
          right: {
            namespace: "pg_catalog",
            name: "timestamptz",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_timestamptz(pg_catalog.timestamptz,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_timetz(pg_catalog.timetz,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.timetz_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.timetz_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "timetz",
          },
          right: {
            namespace: "pg_catalog",
            name: "timetz",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_timetz(pg_catalog.timetz,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_uuid(pg_catalog.uuid,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.uuid_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.uuid_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "uuid",
          },
          right: {
            namespace: "pg_catalog",
            name: "uuid",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_uuid(pg_catalog.uuid,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_query_varbit(pg_catalog.varbit,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)":
    [
      {
        from: "opclass:$extension:btree_gin.varbit_ops/gin",
        relation: {
          kind: "family-procedure",
          family: "opfamily:$extension:btree_gin.varbit_ops/gin",
          left: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          right: {
            namespace: "pg_catalog",
            name: "varbit",
          },
          number: 3,
          procedure:
            "$extension:btree_gin.gin_extract_query_varbit(pg_catalog.varbit,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    ],
  "routine:$extension:btree_gin.gin_extract_value_anyenum(pg_catalog.anyenum,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.enum_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.enum_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "anyenum",
        },
        right: {
          namespace: "pg_catalog",
          name: "anyenum",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_anyenum(pg_catalog.anyenum,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_bit(pg_catalog.bit,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.bit_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.bit_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "bit",
        },
        right: {
          namespace: "pg_catalog",
          name: "bit",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_bit(pg_catalog.bit,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_bool(pg_catalog.bool,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.bool_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.bool_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "bool",
        },
        right: {
          namespace: "pg_catalog",
          name: "bool",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_bool(pg_catalog.bool,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_bpchar(pg_catalog.bpchar,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.bpchar_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.bpchar_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "bpchar",
        },
        right: {
          namespace: "pg_catalog",
          name: "bpchar",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_bpchar(pg_catalog.bpchar,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_bytea(pg_catalog.bytea,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.bytea_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.bytea_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "bytea",
        },
        right: {
          namespace: "pg_catalog",
          name: "bytea",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_bytea(pg_catalog.bytea,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_char(pg_catalog.char,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.char_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.char_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "char",
        },
        right: {
          namespace: "pg_catalog",
          name: "char",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_char(pg_catalog.char,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_cidr(pg_catalog.cidr,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.cidr_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.cidr_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "cidr",
        },
        right: {
          namespace: "pg_catalog",
          name: "cidr",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_cidr(pg_catalog.cidr,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_date(pg_catalog.date,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.date_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.date_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "date",
        },
        right: {
          namespace: "pg_catalog",
          name: "date",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_date(pg_catalog.date,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_float4(pg_catalog.float4,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.float4_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.float4_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "float4",
        },
        right: {
          namespace: "pg_catalog",
          name: "float4",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_float4(pg_catalog.float4,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_float8(pg_catalog.float8,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.float8_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.float8_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "float8",
        },
        right: {
          namespace: "pg_catalog",
          name: "float8",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_float8(pg_catalog.float8,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_inet(pg_catalog.inet,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.inet_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.inet_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "inet",
        },
        right: {
          namespace: "pg_catalog",
          name: "inet",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_inet(pg_catalog.inet,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_int2(pg_catalog.int2,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.int2_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.int2_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "int2",
        },
        right: {
          namespace: "pg_catalog",
          name: "int2",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_int2(pg_catalog.int2,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_int4(pg_catalog.int4,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.int4_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.int4_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "int4",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_int4(pg_catalog.int4,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_int8(pg_catalog.int8,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.int8_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.int8_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "int8",
        },
        right: {
          namespace: "pg_catalog",
          name: "int8",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_int8(pg_catalog.int8,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_interval(pg_catalog.interval,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.interval_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.interval_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "interval",
        },
        right: {
          namespace: "pg_catalog",
          name: "interval",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_interval(pg_catalog.interval,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_macaddr(pg_catalog.macaddr,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.macaddr_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.macaddr_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "macaddr",
        },
        right: {
          namespace: "pg_catalog",
          name: "macaddr",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_macaddr(pg_catalog.macaddr,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_macaddr8(pg_catalog.macaddr8,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.macaddr8_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.macaddr8_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "macaddr8",
        },
        right: {
          namespace: "pg_catalog",
          name: "macaddr8",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_macaddr8(pg_catalog.macaddr8,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_money(pg_catalog.money,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.money_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.money_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "money",
        },
        right: {
          namespace: "pg_catalog",
          name: "money",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_money(pg_catalog.money,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_name(pg_catalog.name,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.name_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.name_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "name",
        },
        right: {
          namespace: "pg_catalog",
          name: "name",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_name(pg_catalog.name,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_numeric(pg_catalog.numeric,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.numeric_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.numeric_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "numeric",
        },
        right: {
          namespace: "pg_catalog",
          name: "numeric",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_numeric(pg_catalog.numeric,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_oid(pg_catalog.oid,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.oid_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.oid_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "oid",
        },
        right: {
          namespace: "pg_catalog",
          name: "oid",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_oid(pg_catalog.oid,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_text(pg_catalog.text,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.text_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.text_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "text",
        },
        right: {
          namespace: "pg_catalog",
          name: "text",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_text(pg_catalog.text,pg_catalog.internal)",
      },
    },
    {
      from: "opclass:$extension:btree_gin.varchar_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.varchar_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "varchar",
        },
        right: {
          namespace: "pg_catalog",
          name: "varchar",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_text(pg_catalog.text,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_time(pg_catalog.time,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.time_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.time_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "time",
        },
        right: {
          namespace: "pg_catalog",
          name: "time",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_time(pg_catalog.time,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_timestamp(pg_catalog.timestamp,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.timestamp_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.timestamp_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "timestamp",
        },
        right: {
          namespace: "pg_catalog",
          name: "timestamp",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_timestamp(pg_catalog.timestamp,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_timestamptz(pg_catalog.timestamptz,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.timestamptz_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.timestamptz_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "timestamptz",
        },
        right: {
          namespace: "pg_catalog",
          name: "timestamptz",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_timestamptz(pg_catalog.timestamptz,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_timetz(pg_catalog.timetz,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.timetz_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.timetz_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "timetz",
        },
        right: {
          namespace: "pg_catalog",
          name: "timetz",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_timetz(pg_catalog.timetz,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_uuid(pg_catalog.uuid,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.uuid_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.uuid_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "uuid",
        },
        right: {
          namespace: "pg_catalog",
          name: "uuid",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_uuid(pg_catalog.uuid,pg_catalog.internal)",
      },
    },
  ],
  "routine:$extension:btree_gin.gin_extract_value_varbit(pg_catalog.varbit,pg_catalog.internal)": [
    {
      from: "opclass:$extension:btree_gin.varbit_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:btree_gin.varbit_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "varbit",
        },
        right: {
          namespace: "pg_catalog",
          name: "varbit",
        },
        number: 2,
        procedure: "$extension:btree_gin.gin_extract_value_varbit(pg_catalog.varbit,pg_catalog.internal)",
      },
    },
  ],
} satisfies Readonly<Record<string, readonly { from: string; relation: Relation }[]>>;
