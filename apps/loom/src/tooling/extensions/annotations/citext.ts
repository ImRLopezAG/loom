const sources = [
  "https://www.postgresql.org/docs/18/citext.html",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/citext/citext.c",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/citext/citext--1.4.sql",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/src/include/utils/array.h: MAXDIM 6",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/src/backend/utils/adt/arrayutils.c: exclusive upper bound fits int32",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/citext/citext--1.4--1.5.sql",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/citext/citext--1.5--1.6.sql",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/citext/citext--1.6--1.7.sql",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/citext/citext--1.7--1.8.sql",
] as const;
const common = {
  authority: "query",
  observability: "tables",
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
  locale:
    "Case conversion uses database LC_CTYPE; comparison honors expression collation. Not Unicode case folding. Regex executes PostgreSQL ARE semantics and resource limits; callers can use c for case-sensitive regex. No JavaScript normalization or session mutation.",
} as const;
const unit =
  "packages/tests/unit/extensions-citext.test.ts: citext.qualifiedBindingsPreserveCase; citext.fieldContractsAndArrayBounds; citext.exactCoverageAndOverloadContracts";
const types =
  "packages/tests/types/extensions-citext.test-d.ts: exact version, native text conversion, branded results, captured overload arity, arrays and class contracts";
const database = "packages/e2e/integration/extensions-citext.test.ts: ";
/** Every captured identity is bound to an executable family case. Provider and package acceptance are host gates. */
export const citextAnnotations = [
  {
    id: "cast:$extension:citext.citext->pg_catalog.bpchar",
    disposition: "query",
    reason:
      "sql.casts.citext_to_bpchar emits an explicitly qualified source/target cast with this required member identity; native text columns use fromText.",
    evidence: [...sources, unit, types, database + "citext.allEightCastsRegexEdgesAggregatesAndComposition"],
    semantics: {
      ...common,
      context: "assignment",
      method: "binary",
      procedure: "binary representation; no routine",
      nulls: "SQL NULL remains SQL NULL; no JS case conversion",
    },
  },
  {
    id: "cast:$extension:citext.citext->pg_catalog.text",
    disposition: "query",
    reason:
      "sql.casts.citext_to_text emits an explicitly qualified source/target cast with this required member identity; native text columns use fromText.",
    evidence: [...sources, unit, types, database + "citext.allEightCastsRegexEdgesAggregatesAndComposition"],
    semantics: {
      ...common,
      context: "implicit",
      method: "binary",
      procedure: "binary representation; no routine",
      nulls: "SQL NULL remains SQL NULL; no JS case conversion",
    },
  },
  {
    id: "cast:$extension:citext.citext->pg_catalog.varchar",
    disposition: "query",
    reason:
      "sql.casts.citext_to_varchar emits an explicitly qualified source/target cast with this required member identity; native text columns use fromText.",
    evidence: [...sources, unit, types, database + "citext.allEightCastsRegexEdgesAggregatesAndComposition"],
    semantics: {
      ...common,
      context: "implicit",
      method: "binary",
      procedure: "binary representation; no routine",
      nulls: "SQL NULL remains SQL NULL; no JS case conversion",
    },
  },
  {
    id: "cast:pg_catalog.bool->$extension:citext.citext",
    disposition: "query",
    reason:
      "sql.casts.bool_to_citext emits an explicitly qualified source/target cast with this required member identity; native text columns use fromText.",
    evidence: [...sources, unit, types, database + "citext.allEightCastsRegexEdgesAggregatesAndComposition"],
    semantics: {
      ...common,
      context: "assignment",
      method: "function",
      procedure: "$extension:citext.citext(pg_catalog.bool)",
      nulls: "SQL NULL remains SQL NULL; no JS case conversion",
    },
  },
  {
    id: "cast:pg_catalog.bpchar->$extension:citext.citext",
    disposition: "query",
    reason:
      "sql.casts.bpchar_to_citext emits an explicitly qualified source/target cast with this required member identity; native text columns use fromText.",
    evidence: [...sources, unit, types, database + "citext.allEightCastsRegexEdgesAggregatesAndComposition"],
    semantics: {
      ...common,
      context: "assignment",
      method: "function",
      procedure: "$extension:citext.citext(pg_catalog.bpchar)",
      nulls: "SQL NULL remains SQL NULL; no JS case conversion",
    },
  },
  {
    id: "cast:pg_catalog.inet->$extension:citext.citext",
    disposition: "query",
    reason:
      "sql.casts.inet_to_citext emits an explicitly qualified source/target cast with this required member identity; native text columns use fromText.",
    evidence: [...sources, unit, types, database + "citext.allEightCastsRegexEdgesAggregatesAndComposition"],
    semantics: {
      ...common,
      context: "assignment",
      method: "function",
      procedure: "$extension:citext.citext(pg_catalog.inet)",
      nulls: "SQL NULL remains SQL NULL; no JS case conversion",
    },
  },
  {
    id: "cast:pg_catalog.text->$extension:citext.citext",
    disposition: "query",
    reason:
      "sql.casts.text_to_citext emits an explicitly qualified source/target cast with this required member identity; native text columns use fromText.",
    evidence: [...sources, unit, types, database + "citext.allEightCastsRegexEdgesAggregatesAndComposition"],
    semantics: {
      ...common,
      context: "assignment",
      method: "binary",
      procedure: "binary representation; no routine",
      nulls: "SQL NULL remains SQL NULL; no JS case conversion",
    },
  },
  {
    id: "cast:pg_catalog.varchar->$extension:citext.citext",
    disposition: "query",
    reason:
      "sql.casts.varchar_to_citext emits an explicitly qualified source/target cast with this required member identity; native text columns use fromText.",
    evidence: [...sources, unit, types, database + "citext.allEightCastsRegexEdgesAggregatesAndComposition"],
    semantics: {
      ...common,
      context: "assignment",
      method: "binary",
      procedure: "binary representation; no routine",
      nulls: "SQL NULL remains SQL NULL; no JS case conversion",
    },
  },
  {
    id: 'function of access method:function 1 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING btree',
    disposition: "internal",
    reason:
      'Exact function of access method attachment function 1 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING btree belongs to opclass:$extension:citext.citext_ops/btree; parent index execution is required for callback proof and remains pending; hash partition routing must prove support function 2.',
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      parent: "opclass:$extension:citext.citext_ops/btree",
    },
  },
  {
    id: 'function of access method:function 1 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING hash',
    disposition: "internal",
    reason:
      'Exact function of access method attachment function 1 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING hash belongs to opclass:$extension:citext.citext_ops/hash; parent index execution is required for callback proof and remains pending; hash partition routing must prove support function 2.',
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      parent: "opclass:$extension:citext.citext_ops/hash",
    },
  },
  {
    id: 'function of access method:function 1 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_pattern_ops USING btree',
    disposition: "internal",
    reason:
      'Exact function of access method attachment function 1 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_pattern_ops USING btree belongs to opclass:$extension:citext.citext_pattern_ops/btree; parent index execution is required for callback proof and remains pending; hash partition routing must prove support function 2.',
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      parent: "opclass:$extension:citext.citext_pattern_ops/btree",
    },
  },
  {
    id: 'function of access method:function 2 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING hash',
    disposition: "internal",
    reason:
      'Exact function of access method attachment function 2 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING hash belongs to opclass:$extension:citext.citext_ops/hash; parent index execution is required for callback proof and remains pending; hash partition routing must prove support function 2.',
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      parent: "opclass:$extension:citext.citext_ops/hash",
    },
  },
  {
    id: "opclass:$extension:citext.citext_ops/btree",
    disposition: "schema",
    reason:
      "indexes.btree binds this native method/class, exact input citext and installation namespace; EXPLAIN ANALYZE plus result oracle executes all strategies.",
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      method: "btree",
      family: "opfamily:$extension:citext.citext_ops/btree",
      default: "True",
    },
  },
  {
    id: "opclass:$extension:citext.citext_ops/hash",
    disposition: "schema",
    reason:
      "indexes.hash binds this native method/class, exact input citext and installation namespace; EXPLAIN ANALYZE plus result oracle executes all strategies.",
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      method: "hash",
      family: "opfamily:$extension:citext.citext_ops/hash",
      default: "True",
    },
  },
  {
    id: "opclass:$extension:citext.citext_pattern_ops/btree",
    disposition: "schema",
    reason:
      "indexes.pattern binds this native method/class, exact input citext and installation namespace; EXPLAIN ANALYZE plus result oracle executes all strategies.",
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      method: "btree",
      family: "opfamily:$extension:citext.citext_pattern_ops/btree",
      default: "False",
    },
  },
  {
    id: 'operator of access method:operator 1 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING btree',
    disposition: "internal",
    reason:
      'Exact operator of access method attachment operator 1 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING btree belongs to opclass:$extension:citext.citext_ops/btree; parent index execution is required for callback proof and remains pending; hash partition routing must prove support function 2.',
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      parent: "opclass:$extension:citext.citext_ops/btree",
    },
  },
  {
    id: 'operator of access method:operator 1 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING hash',
    disposition: "internal",
    reason:
      'Exact operator of access method attachment operator 1 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING hash belongs to opclass:$extension:citext.citext_ops/hash; parent index execution is required for callback proof and remains pending; hash partition routing must prove support function 2.',
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      parent: "opclass:$extension:citext.citext_ops/hash",
    },
  },
  {
    id: 'operator of access method:operator 1 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_pattern_ops USING btree',
    disposition: "internal",
    reason:
      'Exact operator of access method attachment operator 1 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_pattern_ops USING btree belongs to opclass:$extension:citext.citext_pattern_ops/btree; parent index execution is required for callback proof and remains pending; hash partition routing must prove support function 2.',
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      parent: "opclass:$extension:citext.citext_pattern_ops/btree",
    },
  },
  {
    id: 'operator of access method:operator 2 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING btree',
    disposition: "internal",
    reason:
      'Exact operator of access method attachment operator 2 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING btree belongs to opclass:$extension:citext.citext_ops/btree; parent index execution is required for callback proof and remains pending; hash partition routing must prove support function 2.',
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      parent: "opclass:$extension:citext.citext_ops/btree",
    },
  },
  {
    id: 'operator of access method:operator 2 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_pattern_ops USING btree',
    disposition: "internal",
    reason:
      'Exact operator of access method attachment operator 2 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_pattern_ops USING btree belongs to opclass:$extension:citext.citext_pattern_ops/btree; parent index execution is required for callback proof and remains pending; hash partition routing must prove support function 2.',
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      parent: "opclass:$extension:citext.citext_pattern_ops/btree",
    },
  },
  {
    id: 'operator of access method:operator 3 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING btree',
    disposition: "internal",
    reason:
      'Exact operator of access method attachment operator 3 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING btree belongs to opclass:$extension:citext.citext_ops/btree; parent index execution is required for callback proof and remains pending; hash partition routing must prove support function 2.',
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      parent: "opclass:$extension:citext.citext_ops/btree",
    },
  },
  {
    id: 'operator of access method:operator 3 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_pattern_ops USING btree',
    disposition: "internal",
    reason:
      'Exact operator of access method attachment operator 3 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_pattern_ops USING btree belongs to opclass:$extension:citext.citext_pattern_ops/btree; parent index execution is required for callback proof and remains pending; hash partition routing must prove support function 2.',
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      parent: "opclass:$extension:citext.citext_pattern_ops/btree",
    },
  },
  {
    id: 'operator of access method:operator 4 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING btree',
    disposition: "internal",
    reason:
      'Exact operator of access method attachment operator 4 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING btree belongs to opclass:$extension:citext.citext_ops/btree; parent index execution is required for callback proof and remains pending; hash partition routing must prove support function 2.',
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      parent: "opclass:$extension:citext.citext_ops/btree",
    },
  },
  {
    id: 'operator of access method:operator 4 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_pattern_ops USING btree',
    disposition: "internal",
    reason:
      'Exact operator of access method attachment operator 4 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_pattern_ops USING btree belongs to opclass:$extension:citext.citext_pattern_ops/btree; parent index execution is required for callback proof and remains pending; hash partition routing must prove support function 2.',
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      parent: "opclass:$extension:citext.citext_pattern_ops/btree",
    },
  },
  {
    id: 'operator of access method:operator 5 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING btree',
    disposition: "internal",
    reason:
      'Exact operator of access method attachment operator 5 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_ops USING btree belongs to opclass:$extension:citext.citext_ops/btree; parent index execution is required for callback proof and remains pending; hash partition routing must prove support function 2.',
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      parent: "opclass:$extension:citext.citext_ops/btree",
    },
  },
  {
    id: 'operator of access method:operator 5 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_pattern_ops USING btree',
    disposition: "internal",
    reason:
      'Exact operator of access method attachment operator 5 ("$extension:citext".citext, "$extension:citext".citext) of "$extension:citext".citext_pattern_ops USING btree belongs to opclass:$extension:citext.citext_pattern_ops/btree; parent index execution is required for callback proof and remains pending; hash partition routing must prove support function 2.',
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      parent: "opclass:$extension:citext.citext_pattern_ops/btree",
    },
  },
  {
    id: "operator:$extension:citext.!~($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.!~($extension:citext.citext,$extension:citext.citext)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.texticregexne($extension:citext.citext,$extension:citext.citext)",
    },
  },
  {
    id: "operator:$extension:citext.!~($extension:citext.citext,pg_catalog.text)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.!~($extension:citext.citext,pg_catalog.text)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.texticregexne($extension:citext.citext,pg_catalog.text)",
    },
  },
  {
    id: "operator:$extension:citext.!~*($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.!~*($extension:citext.citext,$extension:citext.citext)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.texticregexne($extension:citext.citext,$extension:citext.citext)",
    },
  },
  {
    id: "operator:$extension:citext.!~*($extension:citext.citext,pg_catalog.text)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.!~*($extension:citext.citext,pg_catalog.text)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.texticregexne($extension:citext.citext,pg_catalog.text)",
    },
  },
  {
    id: "operator:$extension:citext.!~~($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.!~~($extension:citext.citext,$extension:citext.citext)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.texticnlike($extension:citext.citext,$extension:citext.citext)",
    },
  },
  {
    id: "operator:$extension:citext.!~~($extension:citext.citext,pg_catalog.text)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.!~~($extension:citext.citext,pg_catalog.text)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.texticnlike($extension:citext.citext,pg_catalog.text)",
    },
  },
  {
    id: "operator:$extension:citext.!~~*($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.!~~*($extension:citext.citext,$extension:citext.citext)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.texticnlike($extension:citext.citext,$extension:citext.citext)",
    },
  },
  {
    id: "operator:$extension:citext.!~~*($extension:citext.citext,pg_catalog.text)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.!~~*($extension:citext.citext,pg_catalog.text)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.texticnlike($extension:citext.citext,pg_catalog.text)",
    },
  },
  {
    id: "operator:$extension:citext.<($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.<($extension:citext.citext,$extension:citext.citext)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.citext_lt($extension:citext.citext,$extension:citext.citext)",
    },
  },
  {
    id: "operator:$extension:citext.<=($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.<=($extension:citext.citext,$extension:citext.citext)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.citext_le($extension:citext.citext,$extension:citext.citext)",
    },
  },
  {
    id: "operator:$extension:citext.<>($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.<>($extension:citext.citext,$extension:citext.citext)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.citext_ne($extension:citext.citext,$extension:citext.citext)",
    },
  },
  {
    id: "operator:$extension:citext.=($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.=($extension:citext.citext,$extension:citext.citext)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.citext_eq($extension:citext.citext,$extension:citext.citext)",
    },
  },
  {
    id: "operator:$extension:citext.>($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.>($extension:citext.citext,$extension:citext.citext)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.citext_gt($extension:citext.citext,$extension:citext.citext)",
    },
  },
  {
    id: "operator:$extension:citext.>=($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.>=($extension:citext.citext,$extension:citext.citext)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.citext_ge($extension:citext.citext,$extension:citext.citext)",
    },
  },
  {
    id: "operator:$extension:citext.~($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.~($extension:citext.citext,$extension:citext.citext)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.texticregexeq($extension:citext.citext,$extension:citext.citext)",
    },
  },
  {
    id: "operator:$extension:citext.~($extension:citext.citext,pg_catalog.text)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.~($extension:citext.citext,pg_catalog.text)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.texticregexeq($extension:citext.citext,pg_catalog.text)",
    },
  },
  {
    id: "operator:$extension:citext.~*($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.~*($extension:citext.citext,$extension:citext.citext)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.texticregexeq($extension:citext.citext,$extension:citext.citext)",
    },
  },
  {
    id: "operator:$extension:citext.~*($extension:citext.citext,pg_catalog.text)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.~*($extension:citext.citext,pg_catalog.text)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.texticregexeq($extension:citext.citext,pg_catalog.text)",
    },
  },
  {
    id: "operator:$extension:citext.~<=~($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.~<=~($extension:citext.citext,$extension:citext.citext)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.citext_pattern_le($extension:citext.citext,$extension:citext.citext)",
    },
  },
  {
    id: "operator:$extension:citext.~<~($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.~<~($extension:citext.citext,$extension:citext.citext)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.citext_pattern_lt($extension:citext.citext,$extension:citext.citext)",
    },
  },
  {
    id: "operator:$extension:citext.~>=~($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.~>=~($extension:citext.citext,$extension:citext.citext)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.citext_pattern_ge($extension:citext.citext,$extension:citext.citext)",
    },
  },
  {
    id: "operator:$extension:citext.~>~($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.~>~($extension:citext.citext,$extension:citext.citext)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.citext_pattern_gt($extension:citext.citext,$extension:citext.citext)",
    },
  },
  {
    id: "operator:$extension:citext.~~($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.~~($extension:citext.citext,$extension:citext.citext)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.texticlike($extension:citext.citext,$extension:citext.citext)",
    },
  },
  {
    id: "operator:$extension:citext.~~($extension:citext.citext,pg_catalog.text)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.~~($extension:citext.citext,pg_catalog.text)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.texticlike($extension:citext.citext,pg_catalog.text)",
    },
  },
  {
    id: "operator:$extension:citext.~~*($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.~~*($extension:citext.citext,$extension:citext.citext)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.texticlike($extension:citext.citext,$extension:citext.citext)",
    },
  },
  {
    id: "operator:$extension:citext.~~*($extension:citext.citext,pg_catalog.text)",
    disposition: "query",
    reason:
      "sql.overloads[operator:$extension:citext.~~*($extension:citext.citext,pg_catalog.text)] qualifies the captured operator and its exact citext/text operand direction, distinct from pg_catalog text operators.",
    evidence: [...sources, unit, types, database + "citext.all26OperatorsBothDirectionsAndNull"],
    semantics: {
      ...common,
      nulls: "SQL NULL for either NULL operand",
      procedure: "$extension:citext.texticlike($extension:citext.citext,pg_catalog.text)",
    },
  },
  {
    id: "opfamily:$extension:citext.citext_ops/btree",
    disposition: "internal",
    reason:
      "Captured family operators/support procedures are subordinate to opclass:$extension:citext.citext_ops/btree; native index strategy execution and hash partition routing execute its support, with exact catalogue links verified.",
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      parent: "opclass:$extension:citext.citext_ops/btree",
    },
  },
  {
    id: "opfamily:$extension:citext.citext_ops/hash",
    disposition: "internal",
    reason:
      "Captured family operators/support procedures are subordinate to opclass:$extension:citext.citext_ops/hash; native index strategy execution and hash partition routing execute its support, with exact catalogue links verified.",
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      parent: "opclass:$extension:citext.citext_ops/hash",
    },
  },
  {
    id: "opfamily:$extension:citext.citext_pattern_ops/btree",
    disposition: "internal",
    reason:
      "Captured family operators/support procedures are subordinate to opclass:$extension:citext.citext_pattern_ops/btree; native index strategy execution and hash partition routing execute its support, with exact catalogue links verified.",
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      parent: "opclass:$extension:citext.citext_pattern_ops/btree",
    },
  },
  {
    id: "routine:$extension:citext.citext_cmp($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.citext_cmp($extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL int4 via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.citext_eq($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.citext_eq($extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL bool via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.citext_ge($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.citext_ge($extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL bool via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.citext_gt($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.citext_gt($extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL bool via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.citext_hash_extended($extension:citext.citext,pg_catalog.int8)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.citext_hash_extended($extension:citext.citext,pg_catalog.int8)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL int8 via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.citext_hash($extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.citext_hash($extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL int4 via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.citext_larger($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.citext_larger($extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL citext via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.citext_le($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.citext_le($extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL bool via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.citext_lt($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.citext_lt($extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL bool via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.citext_ne($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.citext_ne($extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL bool via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.citext_pattern_cmp($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.citext_pattern_cmp($extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL int4 via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.citext_pattern_ge($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.citext_pattern_ge($extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL bool via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.citext_pattern_gt($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.citext_pattern_gt($extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL bool via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.citext_pattern_le($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.citext_pattern_le($extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL bool via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.citext_pattern_lt($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.citext_pattern_lt($extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL bool via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.citext_smaller($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.citext_smaller($extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL citext via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.citext(pg_catalog.bool)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.citext(pg_catalog.bool)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL citext via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.citext(pg_catalog.bpchar)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.citext(pg_catalog.bpchar)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL citext via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.citext(pg_catalog.inet)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.citext(pg_catalog.inet)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL citext via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.citextin(pg_catalog.cstring)",
    disposition: "internal",
    reason:
      "Native type cstring input callback, linked by captured type definition to type:$extension:citext.citext; actual text/binary parameter and native field round trips exercise it. cstring/internal are PostgreSQL pseudo-type IO contracts, not portable request inputs.",
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      result: "Native citext type input callback; application values pass through the Citext codec",
      nulls: "SQL NULL bypasses native type input/output callbacks",
      parent: "type:$extension:citext.citext",
    },
  },
  {
    id: "routine:$extension:citext.citextout($extension:citext.citext)",
    disposition: "internal",
    reason:
      "Native type cstring output callback, linked by captured type definition to type:$extension:citext.citext; actual text/binary parameter and native field round trips exercise it. cstring/internal are PostgreSQL pseudo-type IO contracts, not portable request inputs.",
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      result: "Native cstring output callback used by scalar/array text transport; no application cstring codec",
      nulls: "SQL NULL bypasses native type input/output callbacks",
      parent: "type:$extension:citext.citext",
    },
  },
  {
    id: "routine:$extension:citext.citextrecv(pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Native type internal binary receive callback, linked by captured type definition to type:$extension:citext.citext; actual text/binary parameter and native field round trips exercise it. cstring/internal are PostgreSQL pseudo-type IO contracts, not portable request inputs.",
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      result: "Native binary receive callback exercised by real scalar and dimensional array parameter buffers",
      nulls: "SQL NULL bypasses native type input/output callbacks",
      parent: "type:$extension:citext.citext",
    },
  },
  {
    id: "routine:$extension:citext.citextsend($extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.citextsend($extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "bytea checked portable {hex}; native UTF8 bytes, also type SEND callback",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.max($extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.max($extension:citext.citext)] binds the exact captured aggregate; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allEightCastsRegexEdgesAggregatesAndComposition"],
    semantics: {
      ...common,
      result: "PostgreSQL citext via its checked codec, nullable",
      nulls:
        "min/max ignore NULLs; empty or all-NULL input returns SQL NULL; case spelling of equal extrema depends on input order/parallel aggregation",
    },
  },
  {
    id: "routine:$extension:citext.min($extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.min($extension:citext.citext)] binds the exact captured aggregate; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allEightCastsRegexEdgesAggregatesAndComposition"],
    semantics: {
      ...common,
      result: "PostgreSQL citext via its checked codec, nullable",
      nulls:
        "min/max ignore NULLs; empty or all-NULL input returns SQL NULL; case spelling of equal extrema depends on input order/parallel aggregation",
    },
  },
  {
    id: "routine:$extension:citext.regexp_match($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.regexp_match($extension:citext.citext,$extension:citext.citext,pg_catalog.text)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL _text via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
      matching:
        "PostgreSQL ARE; default i unless supplied flags contain c; match can return NULL for no match, matches returns no rows; captures retain original case; invalid expressions/unsupported flags raise native errors",
    },
  },
  {
    id: "routine:$extension:citext.regexp_match($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.regexp_match($extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL _text via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
      matching:
        "PostgreSQL ARE; default i unless supplied flags contain c; match can return NULL for no match, matches returns no rows; captures retain original case; invalid expressions/unsupported flags raise native errors",
    },
  },
  {
    id: "routine:$extension:citext.regexp_matches($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.regexp_matches($extension:citext.citext,$extension:citext.citext,pg_catalog.text)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL _text via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
      matching:
        "PostgreSQL ARE; default i unless supplied flags contain c; match can return NULL for no match, matches returns no rows; captures retain original case; invalid expressions/unsupported flags raise native errors",
    },
  },
  {
    id: "routine:$extension:citext.regexp_matches($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.regexp_matches($extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL _text via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
      matching:
        "PostgreSQL ARE; default i unless supplied flags contain c; match can return NULL for no match, matches returns no rows; captures retain original case; invalid expressions/unsupported flags raise native errors",
    },
  },
  {
    id: "routine:$extension:citext.regexp_replace($extension:citext.citext,$extension:citext.citext,pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.regexp_replace($extension:citext.citext,$extension:citext.citext,pg_catalog.text,pg_catalog.text)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL text via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
      matching:
        "PostgreSQL ARE; default i unless supplied flags contain c; match can return NULL for no match, matches returns no rows; captures retain original case; invalid expressions/unsupported flags raise native errors",
    },
  },
  {
    id: "routine:$extension:citext.regexp_replace($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.regexp_replace($extension:citext.citext,$extension:citext.citext,pg_catalog.text)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL text via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
      matching:
        "PostgreSQL ARE; default i unless supplied flags contain c; match can return NULL for no match, matches returns no rows; captures retain original case; invalid expressions/unsupported flags raise native errors",
    },
  },
  {
    id: "routine:$extension:citext.regexp_split_to_array($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.regexp_split_to_array($extension:citext.citext,$extension:citext.citext,pg_catalog.text)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL _text via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
      matching:
        "PostgreSQL ARE; default i unless supplied flags contain c; match can return NULL for no match, matches returns no rows; captures retain original case; invalid expressions/unsupported flags raise native errors",
    },
  },
  {
    id: "routine:$extension:citext.regexp_split_to_array($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.regexp_split_to_array($extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL _text via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
      matching:
        "PostgreSQL ARE; default i unless supplied flags contain c; match can return NULL for no match, matches returns no rows; captures retain original case; invalid expressions/unsupported flags raise native errors",
    },
  },
  {
    id: "routine:$extension:citext.regexp_split_to_table($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.regexp_split_to_table($extension:citext.citext,$extension:citext.citext,pg_catalog.text)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL text via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
      matching:
        "PostgreSQL ARE; default i unless supplied flags contain c; match can return NULL for no match, matches returns no rows; captures retain original case; invalid expressions/unsupported flags raise native errors",
    },
  },
  {
    id: "routine:$extension:citext.regexp_split_to_table($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.regexp_split_to_table($extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL text via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
      matching:
        "PostgreSQL ARE; default i unless supplied flags contain c; match can return NULL for no match, matches returns no rows; captures retain original case; invalid expressions/unsupported flags raise native errors",
    },
  },
  {
    id: "routine:$extension:citext.replace($extension:citext.citext,$extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.replace($extension:citext.citext,$extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL text via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.split_part($extension:citext.citext,$extension:citext.citext,pg_catalog.int4)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.split_part($extension:citext.citext,$extension:citext.citext,pg_catalog.int4)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL text via its checked codec, nullable",
      nulls:
        "SQL NULL for NULL input or out-of-range captured SQL array subscript; uses case-insensitive literal delimiter matching",
    },
  },
  {
    id: "routine:$extension:citext.strpos($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.strpos($extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL int4 via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.texticlike($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.texticlike($extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL bool via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.texticlike($extension:citext.citext,pg_catalog.text)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.texticlike($extension:citext.citext,pg_catalog.text)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL bool via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.texticnlike($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.texticnlike($extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL bool via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.texticnlike($extension:citext.citext,pg_catalog.text)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.texticnlike($extension:citext.citext,pg_catalog.text)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL bool via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.texticregexeq($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.texticregexeq($extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL bool via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.texticregexeq($extension:citext.citext,pg_catalog.text)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.texticregexeq($extension:citext.citext,pg_catalog.text)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL bool via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.texticregexne($extension:citext.citext,$extension:citext.citext)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.texticregexne($extension:citext.citext,$extension:citext.citext)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL bool via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.texticregexne($extension:citext.citext,pg_catalog.text)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.texticregexne($extension:citext.citext,pg_catalog.text)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL bool via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "routine:$extension:citext.translate($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
    disposition: "query",
    reason:
      "sql.overloads[routine:$extension:citext.translate($extension:citext.citext,$extension:citext.citext,pg_catalog.text)] binds the exact captured function; all public C and internal-language SQL-callable implementations remain query APIs.",
    evidence: [...sources, unit, types, database + "citext.allCallableRoutinesAndStrictNull"],
    semantics: {
      ...common,
      result: "PostgreSQL text via its checked codec, nullable",
      nulls: "Strict SQL NULL propagation; SRFs return zero rows for SQL NULL",
    },
  },
  {
    id: "type:$extension:citext._citext",
    disposition: "schema",
    reason:
      "arrayField/arrayCodec preserve PostgreSqlArray<Citext> dimensions, lower bounds, nested values and NULL elements, up to native MAXDIM 6; portable RPC retains the same shape",
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      nulls: "Nullable fields remain SQL NULL; array NULL elements remain distinct from string NULL",
    },
  },
  {
    id: "type:$extension:citext.citext",
    disposition: "schema",
    reason: "field/codec preserves original-case branded string",
    evidence: [...sources, unit, types, database + "citext.nativeFieldsArraysUniqueSnapshotsAndAllClasses"],
    semantics: {
      ...common,
      nulls: "Nullable fields remain SQL NULL; array NULL elements remain distinct from string NULL",
    },
  },
] as const;
