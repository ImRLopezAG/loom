// Exact captured 60-member dispositions; local source SQL is not Neon acceptance.
const evidence = [
  "apps/loom/src/tooling/extensions/manifests/address_standardizer_data_us.json",
  "https://github.com/postgis/postgis/tree/3.6.4/extensions/address_standardizer",
  "apps/loom/src/core/extensions/adapters/address-standardizer-data-us.ts",
  "packages/tests/unit/extensions-address-standardizer-data-us.test.ts",
  "packages/e2e/scripts/run-address-standardizer-data-us-native.ts",
] as const;
const acceptance = {
  nativeAcceptance: "local-characterized",
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
} as const;

export const addressStandardizerDataUsAnnotations = [
  {
    id: 'default value:for "$extension:address_standardizer_data_us".us_gaz.id',
    disposition: "schema",
    reason:
      "Native extension installation owns this default, primary-key/not-null constraint or backing index; preserved without request-time DDL or duplicate application objects.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: 'default value:for "$extension:address_standardizer_data_us".us_gaz.is_custom',
    disposition: "schema",
    reason:
      "Native extension installation owns this default, primary-key/not-null constraint or backing index; preserved without request-time DDL or duplicate application objects.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: 'default value:for "$extension:address_standardizer_data_us".us_lex.id',
    disposition: "schema",
    reason:
      "Native extension installation owns this default, primary-key/not-null constraint or backing index; preserved without request-time DDL or duplicate application objects.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: 'default value:for "$extension:address_standardizer_data_us".us_lex.is_custom',
    disposition: "schema",
    reason:
      "Native extension installation owns this default, primary-key/not-null constraint or backing index; preserved without request-time DDL or duplicate application objects.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: 'default value:for "$extension:address_standardizer_data_us".us_rules.id',
    disposition: "schema",
    reason:
      "Native extension installation owns this default, primary-key/not-null constraint or backing index; preserved without request-time DDL or duplicate application objects.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: 'default value:for "$extension:address_standardizer_data_us".us_rules.is_custom',
    disposition: "schema",
    reason:
      "Native extension installation owns this default, primary-key/not-null constraint or backing index; preserved without request-time DDL or duplicate application objects.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: 'index:"$extension:address_standardizer_data_us".pk_us_gaz',
    disposition: "schema",
    reason:
      "Native extension installation owns this default, primary-key/not-null constraint or backing index; preserved without request-time DDL or duplicate application objects.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: 'index:"$extension:address_standardizer_data_us".pk_us_lex',
    disposition: "schema",
    reason:
      "Native extension installation owns this default, primary-key/not-null constraint or backing index; preserved without request-time DDL or duplicate application objects.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: 'index:"$extension:address_standardizer_data_us".pk_us_rules',
    disposition: "schema",
    reason:
      "Native extension installation owns this default, primary-key/not-null constraint or backing index; preserved without request-time DDL or duplicate application objects.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: 'index:pg_toast."$toast-index:us_gaz"',
    disposition: "internal",
    reason:
      "PostgreSQL-owned TOAST storage and index supporting the native parent table. Not an application relation or user-created declaration.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: 'index:pg_toast."$toast-index:us_lex"',
    disposition: "internal",
    reason:
      "PostgreSQL-owned TOAST storage and index supporting the native parent table. Not an application relation or user-created declaration.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: 'index:pg_toast."$toast-index:us_rules"',
    disposition: "internal",
    reason:
      "PostgreSQL-owned TOAST storage and index supporting the native parent table. Not an application relation or user-created declaration.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: 'sequence column:"$extension:address_standardizer_data_us".us_gaz_id_seq.is_called',
    disposition: "query",
    reason:
      "Native sequence observation exposes int8 bigint and bool columns under current SELECT grants; external state is not table-revision live observable.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "external", nativeOwner: "direct" },
  },
  {
    id: 'sequence column:"$extension:address_standardizer_data_us".us_gaz_id_seq.last_value',
    disposition: "query",
    reason:
      "Native sequence observation exposes int8 bigint and bool columns under current SELECT grants; external state is not table-revision live observable.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "external", nativeOwner: "direct" },
  },
  {
    id: 'sequence column:"$extension:address_standardizer_data_us".us_gaz_id_seq.log_cnt',
    disposition: "query",
    reason:
      "Native sequence observation exposes int8 bigint and bool columns under current SELECT grants; external state is not table-revision live observable.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "external", nativeOwner: "direct" },
  },
  {
    id: 'sequence column:"$extension:address_standardizer_data_us".us_lex_id_seq.is_called',
    disposition: "query",
    reason:
      "Native sequence observation exposes int8 bigint and bool columns under current SELECT grants; external state is not table-revision live observable.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "external", nativeOwner: "direct" },
  },
  {
    id: 'sequence column:"$extension:address_standardizer_data_us".us_lex_id_seq.last_value',
    disposition: "query",
    reason:
      "Native sequence observation exposes int8 bigint and bool columns under current SELECT grants; external state is not table-revision live observable.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "external", nativeOwner: "direct" },
  },
  {
    id: 'sequence column:"$extension:address_standardizer_data_us".us_lex_id_seq.log_cnt',
    disposition: "query",
    reason:
      "Native sequence observation exposes int8 bigint and bool columns under current SELECT grants; external state is not table-revision live observable.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "external", nativeOwner: "direct" },
  },
  {
    id: 'sequence column:"$extension:address_standardizer_data_us".us_rules_id_seq.is_called',
    disposition: "query",
    reason:
      "Native sequence observation exposes int8 bigint and bool columns under current SELECT grants; external state is not table-revision live observable.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "external", nativeOwner: "direct" },
  },
  {
    id: 'sequence column:"$extension:address_standardizer_data_us".us_rules_id_seq.last_value',
    disposition: "query",
    reason:
      "Native sequence observation exposes int8 bigint and bool columns under current SELECT grants; external state is not table-revision live observable.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "external", nativeOwner: "direct" },
  },
  {
    id: 'sequence column:"$extension:address_standardizer_data_us".us_rules_id_seq.log_cnt',
    disposition: "query",
    reason:
      "Native sequence observation exposes int8 bigint and bool columns under current SELECT grants; external state is not table-revision live observable.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "external", nativeOwner: "direct" },
  },
  {
    id: 'sequence:"$extension:address_standardizer_data_us".us_gaz_id_seq',
    disposition: "query",
    reason:
      "Native sequence observation exposes int8 bigint and bool columns under current SELECT grants; external state is not table-revision live observable.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "external", nativeOwner: "direct" },
  },
  {
    id: 'sequence:"$extension:address_standardizer_data_us".us_lex_id_seq',
    disposition: "query",
    reason:
      "Native sequence observation exposes int8 bigint and bool columns under current SELECT grants; external state is not table-revision live observable.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "external", nativeOwner: "direct" },
  },
  {
    id: 'sequence:"$extension:address_standardizer_data_us".us_rules_id_seq',
    disposition: "query",
    reason:
      "Native sequence observation exposes int8 bigint and bool columns under current SELECT grants; external state is not table-revision live observable.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "external", nativeOwner: "direct" },
  },
  {
    id: 'table column:"$extension:address_standardizer_data_us".us_gaz.id',
    disposition: "query",
    reason:
      "Typed table rows preserve native int4/text/bool columns, NULLs and normal SELECT privileges. Extension installation owns packaged seed rows.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "tables", nativeOwner: "direct" },
  },
  {
    id: 'table column:"$extension:address_standardizer_data_us".us_gaz.is_custom',
    disposition: "query",
    reason:
      "Typed table rows preserve native int4/text/bool columns, NULLs and normal SELECT privileges. Extension installation owns packaged seed rows.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "tables", nativeOwner: "direct" },
  },
  {
    id: 'table column:"$extension:address_standardizer_data_us".us_gaz.seq',
    disposition: "query",
    reason:
      "Typed table rows preserve native int4/text/bool columns, NULLs and normal SELECT privileges. Extension installation owns packaged seed rows.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "tables", nativeOwner: "direct" },
  },
  {
    id: 'table column:"$extension:address_standardizer_data_us".us_gaz.stdword',
    disposition: "query",
    reason:
      "Typed table rows preserve native int4/text/bool columns, NULLs and normal SELECT privileges. Extension installation owns packaged seed rows.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "tables", nativeOwner: "direct" },
  },
  {
    id: 'table column:"$extension:address_standardizer_data_us".us_gaz.token',
    disposition: "query",
    reason:
      "Typed table rows preserve native int4/text/bool columns, NULLs and normal SELECT privileges. Extension installation owns packaged seed rows.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "tables", nativeOwner: "direct" },
  },
  {
    id: 'table column:"$extension:address_standardizer_data_us".us_gaz.word',
    disposition: "query",
    reason:
      "Typed table rows preserve native int4/text/bool columns, NULLs and normal SELECT privileges. Extension installation owns packaged seed rows.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "tables", nativeOwner: "direct" },
  },
  {
    id: 'table column:"$extension:address_standardizer_data_us".us_lex.id',
    disposition: "query",
    reason:
      "Typed table rows preserve native int4/text/bool columns, NULLs and normal SELECT privileges. Extension installation owns packaged seed rows.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "tables", nativeOwner: "direct" },
  },
  {
    id: 'table column:"$extension:address_standardizer_data_us".us_lex.is_custom',
    disposition: "query",
    reason:
      "Typed table rows preserve native int4/text/bool columns, NULLs and normal SELECT privileges. Extension installation owns packaged seed rows.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "tables", nativeOwner: "direct" },
  },
  {
    id: 'table column:"$extension:address_standardizer_data_us".us_lex.seq',
    disposition: "query",
    reason:
      "Typed table rows preserve native int4/text/bool columns, NULLs and normal SELECT privileges. Extension installation owns packaged seed rows.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "tables", nativeOwner: "direct" },
  },
  {
    id: 'table column:"$extension:address_standardizer_data_us".us_lex.stdword',
    disposition: "query",
    reason:
      "Typed table rows preserve native int4/text/bool columns, NULLs and normal SELECT privileges. Extension installation owns packaged seed rows.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "tables", nativeOwner: "direct" },
  },
  {
    id: 'table column:"$extension:address_standardizer_data_us".us_lex.token',
    disposition: "query",
    reason:
      "Typed table rows preserve native int4/text/bool columns, NULLs and normal SELECT privileges. Extension installation owns packaged seed rows.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "tables", nativeOwner: "direct" },
  },
  {
    id: 'table column:"$extension:address_standardizer_data_us".us_lex.word',
    disposition: "query",
    reason:
      "Typed table rows preserve native int4/text/bool columns, NULLs and normal SELECT privileges. Extension installation owns packaged seed rows.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "tables", nativeOwner: "direct" },
  },
  {
    id: 'table column:"$extension:address_standardizer_data_us".us_rules.id',
    disposition: "query",
    reason:
      "Typed table rows preserve native int4/text/bool columns, NULLs and normal SELECT privileges. Extension installation owns packaged seed rows.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "tables", nativeOwner: "direct" },
  },
  {
    id: 'table column:"$extension:address_standardizer_data_us".us_rules.is_custom',
    disposition: "query",
    reason:
      "Typed table rows preserve native int4/text/bool columns, NULLs and normal SELECT privileges. Extension installation owns packaged seed rows.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "tables", nativeOwner: "direct" },
  },
  {
    id: 'table column:"$extension:address_standardizer_data_us".us_rules.rule',
    disposition: "query",
    reason:
      "Typed table rows preserve native int4/text/bool columns, NULLs and normal SELECT privileges. Extension installation owns packaged seed rows.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "tables", nativeOwner: "direct" },
  },
  {
    id: 'table constraint:pk_us_gaz on "$extension:address_standardizer_data_us".us_gaz',
    disposition: "schema",
    reason:
      "Native extension installation owns this default, primary-key/not-null constraint or backing index; preserved without request-time DDL or duplicate application objects.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: 'table constraint:pk_us_lex on "$extension:address_standardizer_data_us".us_lex',
    disposition: "schema",
    reason:
      "Native extension installation owns this default, primary-key/not-null constraint or backing index; preserved without request-time DDL or duplicate application objects.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: 'table constraint:pk_us_rules on "$extension:address_standardizer_data_us".us_rules',
    disposition: "schema",
    reason:
      "Native extension installation owns this default, primary-key/not-null constraint or backing index; preserved without request-time DDL or duplicate application objects.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: 'table constraint:us_gaz_id_not_null on "$extension:address_standardizer_data_us".us_gaz',
    disposition: "schema",
    reason:
      "Native extension installation owns this default, primary-key/not-null constraint or backing index; preserved without request-time DDL or duplicate application objects.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: 'table constraint:us_gaz_is_custom_not_null on "$extension:address_standardizer_data_us".us_gaz',
    disposition: "schema",
    reason:
      "Native extension installation owns this default, primary-key/not-null constraint or backing index; preserved without request-time DDL or duplicate application objects.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: 'table constraint:us_lex_id_not_null on "$extension:address_standardizer_data_us".us_lex',
    disposition: "schema",
    reason:
      "Native extension installation owns this default, primary-key/not-null constraint or backing index; preserved without request-time DDL or duplicate application objects.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: 'table constraint:us_lex_is_custom_not_null on "$extension:address_standardizer_data_us".us_lex',
    disposition: "schema",
    reason:
      "Native extension installation owns this default, primary-key/not-null constraint or backing index; preserved without request-time DDL or duplicate application objects.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: 'table constraint:us_rules_id_not_null on "$extension:address_standardizer_data_us".us_rules',
    disposition: "schema",
    reason:
      "Native extension installation owns this default, primary-key/not-null constraint or backing index; preserved without request-time DDL or duplicate application objects.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: 'table constraint:us_rules_is_custom_not_null on "$extension:address_standardizer_data_us".us_rules',
    disposition: "schema",
    reason:
      "Native extension installation owns this default, primary-key/not-null constraint or backing index; preserved without request-time DDL or duplicate application objects.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: 'table:"$extension:address_standardizer_data_us".us_gaz',
    disposition: "query",
    reason:
      "Typed table rows preserve native int4/text/bool columns, NULLs and normal SELECT privileges. Extension installation owns packaged seed rows.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "tables", nativeOwner: "direct" },
  },
  {
    id: 'table:"$extension:address_standardizer_data_us".us_lex',
    disposition: "query",
    reason:
      "Typed table rows preserve native int4/text/bool columns, NULLs and normal SELECT privileges. Extension installation owns packaged seed rows.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "tables", nativeOwner: "direct" },
  },
  {
    id: 'table:"$extension:address_standardizer_data_us".us_rules',
    disposition: "query",
    reason:
      "Typed table rows preserve native int4/text/bool columns, NULLs and normal SELECT privileges. Extension installation owns packaged seed rows.",
    evidence,
    semantics: { ...acceptance, authority: "query", observability: "tables", nativeOwner: "direct" },
  },
  {
    id: 'toast table:pg_toast."$toast:us_gaz"',
    disposition: "internal",
    reason:
      "PostgreSQL-owned TOAST storage and index supporting the native parent table. Not an application relation or user-created declaration.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: 'toast table:pg_toast."$toast:us_lex"',
    disposition: "internal",
    reason:
      "PostgreSQL-owned TOAST storage and index supporting the native parent table. Not an application relation or user-created declaration.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: 'toast table:pg_toast."$toast:us_rules"',
    disposition: "internal",
    reason:
      "PostgreSQL-owned TOAST storage and index supporting the native parent table. Not an application relation or user-created declaration.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "subordinate" },
  },
  {
    id: "type:$extension:address_standardizer_data_us._us_gaz",
    disposition: "schema",
    reason:
      "Exact native table composite or array codec and field; record values allow NULL attributes independently of table constraints. Native record/array I/O, no address algorithms.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "direct" },
  },
  {
    id: "type:$extension:address_standardizer_data_us._us_lex",
    disposition: "schema",
    reason:
      "Exact native table composite or array codec and field; record values allow NULL attributes independently of table constraints. Native record/array I/O, no address algorithms.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "direct" },
  },
  {
    id: "type:$extension:address_standardizer_data_us._us_rules",
    disposition: "schema",
    reason:
      "Exact native table composite or array codec and field; record values allow NULL attributes independently of table constraints. Native record/array I/O, no address algorithms.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "direct" },
  },
  {
    id: "type:$extension:address_standardizer_data_us.us_gaz",
    disposition: "schema",
    reason:
      "Exact native table composite or array codec and field; record values allow NULL attributes independently of table constraints. Native record/array I/O, no address algorithms.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "direct" },
  },
  {
    id: "type:$extension:address_standardizer_data_us.us_lex",
    disposition: "schema",
    reason:
      "Exact native table composite or array codec and field; record values allow NULL attributes independently of table constraints. Native record/array I/O, no address algorithms.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "direct" },
  },
  {
    id: "type:$extension:address_standardizer_data_us.us_rules",
    disposition: "schema",
    reason:
      "Exact native table composite or array codec and field; record values allow NULL attributes independently of table constraints. Native record/array I/O, no address algorithms.",
    evidence,
    semantics: { ...acceptance, authority: "installation", observability: "tables", nativeOwner: "direct" },
  },
] as const;
