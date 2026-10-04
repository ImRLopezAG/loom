import type { SQL } from "drizzle-orm";
import { createIsn_1_3 } from "../../../apps/loom/src/core/extensions/adapters/isn";
export const isnProofSchema = 'Isn"日本';
export const isnDescriptor = {
  name: "isn",
  version: "1.3",
  schema: isnProofSchema,
  apiSupport: { status: "verified", digest: "570342dc61cc815ae91896f43c59a79150643b22f540681e6c82d89db6a5e9be" },
} as const;
export const isnApi = createIsn_1_3(isnDescriptor);
export interface IsnNativeCase {
  readonly member: string;
  readonly expression: SQL;
  readonly nullExpression: SQL;
  readonly native: string;
}
export function isnNativeCases(api = isnApi): readonly IsnNativeCase[] {
  const namespace = '"Isn""日本"';
  return [
    {
      member: "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ean13,$extension:isn.ean13)"](
        api.ean13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ean13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.isbn)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ean13,$extension:isn.isbn)"](
        api.ean13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ean13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<) '9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.isbn13)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ean13,$extension:isn.isbn13)"](
        api.ean13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ean13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<) '9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.ismn)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ean13,$extension:isn.ismn)"](
        api.ean13.value("9780123456786"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ean13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<) '9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.ismn13)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ean13,$extension:isn.ismn13)"](
        api.ean13.value("9780123456786"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ean13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<) '9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.issn)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ean13,$extension:isn.issn)"](
        api.ean13.value("9780123456786"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ean13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<) '9771234567898'::${namespace}.issn)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.issn13)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ean13,$extension:isn.issn13)"](
        api.ean13.value("9780123456786"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ean13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<) '9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.ean13,$extension:isn.upc)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ean13,$extension:isn.upc)"](
        api.ean13.value("9780123456786"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ean13,$extension:isn.upc)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<) '123456789012'::${namespace}.upc)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.isbn,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.isbn,$extension:isn.ean13)"](
        api.isbn.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.isbn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn OPERATOR(${namespace}.<) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.isbn,$extension:isn.isbn)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.isbn,$extension:isn.isbn)"](
        api.isbn.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.isbn,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn OPERATOR(${namespace}.<) '9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.isbn,$extension:isn.isbn13)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.isbn,$extension:isn.isbn13)"](
        api.isbn.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.isbn,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn OPERATOR(${namespace}.<) '9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.isbn13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.isbn13,$extension:isn.ean13)"](
        api.isbn13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.isbn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn13 OPERATOR(${namespace}.<) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.isbn13,$extension:isn.isbn)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.isbn13,$extension:isn.isbn)"](
        api.isbn13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.isbn13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn13 OPERATOR(${namespace}.<) '9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.isbn13,$extension:isn.isbn13)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.isbn13,$extension:isn.isbn13)"](
        api.isbn13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.isbn13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn13 OPERATOR(${namespace}.<) '9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.ismn,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ismn,$extension:isn.ean13)"](
        api.ismn.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ismn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn OPERATOR(${namespace}.<) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.ismn,$extension:isn.ismn)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ismn,$extension:isn.ismn)"](
        api.ismn.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ismn,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn OPERATOR(${namespace}.<) '9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.ismn,$extension:isn.ismn13)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ismn,$extension:isn.ismn13)"](
        api.ismn.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ismn,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn OPERATOR(${namespace}.<) '9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.ismn13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ismn13,$extension:isn.ean13)"](
        api.ismn13.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ismn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn13 OPERATOR(${namespace}.<) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.ismn13,$extension:isn.ismn)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ismn13,$extension:isn.ismn)"](
        api.ismn13.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ismn13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn13 OPERATOR(${namespace}.<) '9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.ismn13,$extension:isn.ismn13)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ismn13,$extension:isn.ismn13)"](
        api.ismn13.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.ismn13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn13 OPERATOR(${namespace}.<) '9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.issn,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.issn,$extension:isn.ean13)"](
        api.issn.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.issn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn OPERATOR(${namespace}.<) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.issn,$extension:isn.issn)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.issn,$extension:isn.issn)"](
        api.issn.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.issn,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn OPERATOR(${namespace}.<) '9771234567898'::${namespace}.issn)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.issn,$extension:isn.issn13)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.issn,$extension:isn.issn13)"](
        api.issn.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.issn,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn OPERATOR(${namespace}.<) '9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.issn13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.issn13,$extension:isn.ean13)"](
        api.issn13.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.issn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn13 OPERATOR(${namespace}.<) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.issn13,$extension:isn.issn)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.issn13,$extension:isn.issn)"](
        api.issn13.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.issn13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn13 OPERATOR(${namespace}.<) '9771234567898'::${namespace}.issn)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.issn13,$extension:isn.issn13)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.issn13,$extension:isn.issn13)"](
        api.issn13.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.issn13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn13 OPERATOR(${namespace}.<) '9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.upc,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.upc,$extension:isn.ean13)"](
        api.upc.value("123456789012"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.upc,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('123456789012'::${namespace}.upc OPERATOR(${namespace}.<) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<($extension:isn.upc,$extension:isn.upc)",
      expression: api.sql.overloads["operator:$extension:isn.<($extension:isn.upc,$extension:isn.upc)"](
        api.upc.value("123456789012"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<($extension:isn.upc,$extension:isn.upc)"](null, null),
      native: `('123456789012'::${namespace}.upc OPERATOR(${namespace}.<) '123456789012'::${namespace}.upc)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.ean13)"](
        api.ean13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.isbn)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.isbn)"](
        api.ean13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<=) '9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.isbn13)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.isbn13)"](
        api.ean13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<=) '9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.ismn)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.ismn)"](
        api.ean13.value("9780123456786"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<=) '9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.ismn13)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.ismn13)"](
        api.ean13.value("9780123456786"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<=) '9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.issn)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.issn)"](
        api.ean13.value("9780123456786"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<=) '9771234567898'::${namespace}.issn)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.issn13)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.issn13)"](
        api.ean13.value("9780123456786"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<=) '9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.upc)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.upc)"](
        api.ean13.value("9780123456786"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ean13,$extension:isn.upc)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<=) '123456789012'::${namespace}.upc)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.isbn,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.isbn,$extension:isn.ean13)"](
        api.isbn.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.isbn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn OPERATOR(${namespace}.<=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.isbn,$extension:isn.isbn)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.isbn,$extension:isn.isbn)"](
        api.isbn.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.isbn,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn OPERATOR(${namespace}.<=) '9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.isbn,$extension:isn.isbn13)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.isbn,$extension:isn.isbn13)"](
        api.isbn.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.isbn,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn OPERATOR(${namespace}.<=) '9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.isbn13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.isbn13,$extension:isn.ean13)"](
        api.isbn13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.isbn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn13 OPERATOR(${namespace}.<=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.isbn13,$extension:isn.isbn)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.isbn13,$extension:isn.isbn)"](
        api.isbn13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.isbn13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn13 OPERATOR(${namespace}.<=) '9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.isbn13,$extension:isn.isbn13)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.isbn13,$extension:isn.isbn13)"](
        api.isbn13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.isbn13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn13 OPERATOR(${namespace}.<=) '9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.ismn,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ismn,$extension:isn.ean13)"](
        api.ismn.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ismn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn OPERATOR(${namespace}.<=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.ismn,$extension:isn.ismn)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ismn,$extension:isn.ismn)"](
        api.ismn.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ismn,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn OPERATOR(${namespace}.<=) '9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.ismn,$extension:isn.ismn13)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ismn,$extension:isn.ismn13)"](
        api.ismn.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ismn,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn OPERATOR(${namespace}.<=) '9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.ismn13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ismn13,$extension:isn.ean13)"](
        api.ismn13.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ismn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn13 OPERATOR(${namespace}.<=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.ismn13,$extension:isn.ismn)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ismn13,$extension:isn.ismn)"](
        api.ismn13.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ismn13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn13 OPERATOR(${namespace}.<=) '9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.ismn13,$extension:isn.ismn13)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ismn13,$extension:isn.ismn13)"](
        api.ismn13.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.ismn13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn13 OPERATOR(${namespace}.<=) '9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.issn,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.issn,$extension:isn.ean13)"](
        api.issn.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.issn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn OPERATOR(${namespace}.<=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.issn,$extension:isn.issn)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.issn,$extension:isn.issn)"](
        api.issn.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.issn,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn OPERATOR(${namespace}.<=) '9771234567898'::${namespace}.issn)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.issn,$extension:isn.issn13)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.issn,$extension:isn.issn13)"](
        api.issn.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.issn,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn OPERATOR(${namespace}.<=) '9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.issn13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.issn13,$extension:isn.ean13)"](
        api.issn13.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.issn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn13 OPERATOR(${namespace}.<=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.issn13,$extension:isn.issn)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.issn13,$extension:isn.issn)"](
        api.issn13.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.issn13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn13 OPERATOR(${namespace}.<=) '9771234567898'::${namespace}.issn)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.issn13,$extension:isn.issn13)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.issn13,$extension:isn.issn13)"](
        api.issn13.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.issn13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn13 OPERATOR(${namespace}.<=) '9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.upc,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.upc,$extension:isn.ean13)"](
        api.upc.value("123456789012"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.upc,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('123456789012'::${namespace}.upc OPERATOR(${namespace}.<=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<=($extension:isn.upc,$extension:isn.upc)",
      expression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.upc,$extension:isn.upc)"](
        api.upc.value("123456789012"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<=($extension:isn.upc,$extension:isn.upc)"](
        null,
        null,
      ),
      native: `('123456789012'::${namespace}.upc OPERATOR(${namespace}.<=) '123456789012'::${namespace}.upc)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.ean13)"](
        api.ean13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<>) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.isbn)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.isbn)"](
        api.ean13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<>) '9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.isbn13)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.isbn13)"](
        api.ean13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<>) '9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.ismn)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.ismn)"](
        api.ean13.value("9780123456786"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<>) '9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.ismn13)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.ismn13)"](
        api.ean13.value("9780123456786"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<>) '9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.issn)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.issn)"](
        api.ean13.value("9780123456786"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<>) '9771234567898'::${namespace}.issn)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.issn13)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.issn13)"](
        api.ean13.value("9780123456786"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<>) '9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.upc)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.upc)"](
        api.ean13.value("9780123456786"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ean13,$extension:isn.upc)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.<>) '123456789012'::${namespace}.upc)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.isbn,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.isbn,$extension:isn.ean13)"](
        api.isbn.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.isbn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn OPERATOR(${namespace}.<>) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.isbn,$extension:isn.isbn)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.isbn,$extension:isn.isbn)"](
        api.isbn.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.isbn,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn OPERATOR(${namespace}.<>) '9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.isbn,$extension:isn.isbn13)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.isbn,$extension:isn.isbn13)"](
        api.isbn.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.isbn,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn OPERATOR(${namespace}.<>) '9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.isbn13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.isbn13,$extension:isn.ean13)"](
        api.isbn13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.isbn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn13 OPERATOR(${namespace}.<>) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.isbn13,$extension:isn.isbn)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.isbn13,$extension:isn.isbn)"](
        api.isbn13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.isbn13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn13 OPERATOR(${namespace}.<>) '9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.isbn13,$extension:isn.isbn13)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.isbn13,$extension:isn.isbn13)"](
        api.isbn13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.isbn13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn13 OPERATOR(${namespace}.<>) '9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.ismn,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ismn,$extension:isn.ean13)"](
        api.ismn.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ismn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn OPERATOR(${namespace}.<>) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.ismn,$extension:isn.ismn)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ismn,$extension:isn.ismn)"](
        api.ismn.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ismn,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn OPERATOR(${namespace}.<>) '9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.ismn,$extension:isn.ismn13)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ismn,$extension:isn.ismn13)"](
        api.ismn.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ismn,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn OPERATOR(${namespace}.<>) '9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.ismn13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ismn13,$extension:isn.ean13)"](
        api.ismn13.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ismn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn13 OPERATOR(${namespace}.<>) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.ismn13,$extension:isn.ismn)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ismn13,$extension:isn.ismn)"](
        api.ismn13.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ismn13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn13 OPERATOR(${namespace}.<>) '9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.ismn13,$extension:isn.ismn13)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ismn13,$extension:isn.ismn13)"](
        api.ismn13.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.ismn13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn13 OPERATOR(${namespace}.<>) '9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.issn,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.issn,$extension:isn.ean13)"](
        api.issn.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.issn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn OPERATOR(${namespace}.<>) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.issn,$extension:isn.issn)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.issn,$extension:isn.issn)"](
        api.issn.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.issn,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn OPERATOR(${namespace}.<>) '9771234567898'::${namespace}.issn)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.issn,$extension:isn.issn13)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.issn,$extension:isn.issn13)"](
        api.issn.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.issn,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn OPERATOR(${namespace}.<>) '9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.issn13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.issn13,$extension:isn.ean13)"](
        api.issn13.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.issn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn13 OPERATOR(${namespace}.<>) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.issn13,$extension:isn.issn)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.issn13,$extension:isn.issn)"](
        api.issn13.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.issn13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn13 OPERATOR(${namespace}.<>) '9771234567898'::${namespace}.issn)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.issn13,$extension:isn.issn13)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.issn13,$extension:isn.issn13)"](
        api.issn13.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.issn13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn13 OPERATOR(${namespace}.<>) '9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.upc,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.upc,$extension:isn.ean13)"](
        api.upc.value("123456789012"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.upc,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('123456789012'::${namespace}.upc OPERATOR(${namespace}.<>) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.<>($extension:isn.upc,$extension:isn.upc)",
      expression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.upc,$extension:isn.upc)"](
        api.upc.value("123456789012"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.<>($extension:isn.upc,$extension:isn.upc)"](
        null,
        null,
      ),
      native: `('123456789012'::${namespace}.upc OPERATOR(${namespace}.<>) '123456789012'::${namespace}.upc)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ean13,$extension:isn.ean13)"](
        api.ean13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ean13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.isbn)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ean13,$extension:isn.isbn)"](
        api.ean13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ean13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.=) '9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.isbn13)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ean13,$extension:isn.isbn13)"](
        api.ean13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ean13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.=) '9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.ismn)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ean13,$extension:isn.ismn)"](
        api.ean13.value("9780123456786"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ean13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.=) '9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.ismn13)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ean13,$extension:isn.ismn13)"](
        api.ean13.value("9780123456786"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ean13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.=) '9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.issn)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ean13,$extension:isn.issn)"](
        api.ean13.value("9780123456786"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ean13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.=) '9771234567898'::${namespace}.issn)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.issn13)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ean13,$extension:isn.issn13)"](
        api.ean13.value("9780123456786"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ean13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.=) '9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.ean13,$extension:isn.upc)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ean13,$extension:isn.upc)"](
        api.ean13.value("9780123456786"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ean13,$extension:isn.upc)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.=) '123456789012'::${namespace}.upc)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.isbn,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.isbn,$extension:isn.ean13)"](
        api.isbn.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.isbn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn OPERATOR(${namespace}.=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.isbn,$extension:isn.isbn)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.isbn,$extension:isn.isbn)"](
        api.isbn.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.isbn,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn OPERATOR(${namespace}.=) '9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.isbn,$extension:isn.isbn13)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.isbn,$extension:isn.isbn13)"](
        api.isbn.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.isbn,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn OPERATOR(${namespace}.=) '9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.isbn13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.isbn13,$extension:isn.ean13)"](
        api.isbn13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.isbn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn13 OPERATOR(${namespace}.=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.isbn13,$extension:isn.isbn)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.isbn13,$extension:isn.isbn)"](
        api.isbn13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.isbn13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn13 OPERATOR(${namespace}.=) '9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.isbn13,$extension:isn.isbn13)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.isbn13,$extension:isn.isbn13)"](
        api.isbn13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.isbn13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn13 OPERATOR(${namespace}.=) '9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.ismn,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ismn,$extension:isn.ean13)"](
        api.ismn.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ismn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn OPERATOR(${namespace}.=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.ismn,$extension:isn.ismn)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ismn,$extension:isn.ismn)"](
        api.ismn.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ismn,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn OPERATOR(${namespace}.=) '9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.ismn,$extension:isn.ismn13)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ismn,$extension:isn.ismn13)"](
        api.ismn.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ismn,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn OPERATOR(${namespace}.=) '9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.ismn13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ismn13,$extension:isn.ean13)"](
        api.ismn13.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ismn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn13 OPERATOR(${namespace}.=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.ismn13,$extension:isn.ismn)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ismn13,$extension:isn.ismn)"](
        api.ismn13.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ismn13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn13 OPERATOR(${namespace}.=) '9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.ismn13,$extension:isn.ismn13)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ismn13,$extension:isn.ismn13)"](
        api.ismn13.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.ismn13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn13 OPERATOR(${namespace}.=) '9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.issn,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.issn,$extension:isn.ean13)"](
        api.issn.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.issn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn OPERATOR(${namespace}.=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.issn,$extension:isn.issn)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.issn,$extension:isn.issn)"](
        api.issn.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.issn,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn OPERATOR(${namespace}.=) '9771234567898'::${namespace}.issn)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.issn,$extension:isn.issn13)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.issn,$extension:isn.issn13)"](
        api.issn.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.issn,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn OPERATOR(${namespace}.=) '9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.issn13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.issn13,$extension:isn.ean13)"](
        api.issn13.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.issn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn13 OPERATOR(${namespace}.=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.issn13,$extension:isn.issn)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.issn13,$extension:isn.issn)"](
        api.issn13.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.issn13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn13 OPERATOR(${namespace}.=) '9771234567898'::${namespace}.issn)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.issn13,$extension:isn.issn13)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.issn13,$extension:isn.issn13)"](
        api.issn13.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.issn13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn13 OPERATOR(${namespace}.=) '9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.upc,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.upc,$extension:isn.ean13)"](
        api.upc.value("123456789012"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.upc,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('123456789012'::${namespace}.upc OPERATOR(${namespace}.=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.=($extension:isn.upc,$extension:isn.upc)",
      expression: api.sql.overloads["operator:$extension:isn.=($extension:isn.upc,$extension:isn.upc)"](
        api.upc.value("123456789012"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.=($extension:isn.upc,$extension:isn.upc)"](null, null),
      native: `('123456789012'::${namespace}.upc OPERATOR(${namespace}.=) '123456789012'::${namespace}.upc)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ean13,$extension:isn.ean13)"](
        api.ean13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ean13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.>) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.isbn)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ean13,$extension:isn.isbn)"](
        api.ean13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ean13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.>) '9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.isbn13)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ean13,$extension:isn.isbn13)"](
        api.ean13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ean13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.>) '9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.ismn)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ean13,$extension:isn.ismn)"](
        api.ean13.value("9780123456786"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ean13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.>) '9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.ismn13)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ean13,$extension:isn.ismn13)"](
        api.ean13.value("9780123456786"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ean13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.>) '9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.issn)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ean13,$extension:isn.issn)"](
        api.ean13.value("9780123456786"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ean13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.>) '9771234567898'::${namespace}.issn)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.issn13)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ean13,$extension:isn.issn13)"](
        api.ean13.value("9780123456786"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ean13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.>) '9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.ean13,$extension:isn.upc)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ean13,$extension:isn.upc)"](
        api.ean13.value("9780123456786"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ean13,$extension:isn.upc)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.>) '123456789012'::${namespace}.upc)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.isbn,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.isbn,$extension:isn.ean13)"](
        api.isbn.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.isbn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn OPERATOR(${namespace}.>) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.isbn,$extension:isn.isbn)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.isbn,$extension:isn.isbn)"](
        api.isbn.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.isbn,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn OPERATOR(${namespace}.>) '9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.isbn,$extension:isn.isbn13)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.isbn,$extension:isn.isbn13)"](
        api.isbn.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.isbn,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn OPERATOR(${namespace}.>) '9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.isbn13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.isbn13,$extension:isn.ean13)"](
        api.isbn13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.isbn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn13 OPERATOR(${namespace}.>) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.isbn13,$extension:isn.isbn)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.isbn13,$extension:isn.isbn)"](
        api.isbn13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.isbn13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn13 OPERATOR(${namespace}.>) '9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.isbn13,$extension:isn.isbn13)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.isbn13,$extension:isn.isbn13)"](
        api.isbn13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.isbn13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn13 OPERATOR(${namespace}.>) '9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.ismn,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ismn,$extension:isn.ean13)"](
        api.ismn.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ismn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn OPERATOR(${namespace}.>) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.ismn,$extension:isn.ismn)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ismn,$extension:isn.ismn)"](
        api.ismn.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ismn,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn OPERATOR(${namespace}.>) '9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.ismn,$extension:isn.ismn13)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ismn,$extension:isn.ismn13)"](
        api.ismn.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ismn,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn OPERATOR(${namespace}.>) '9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.ismn13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ismn13,$extension:isn.ean13)"](
        api.ismn13.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ismn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn13 OPERATOR(${namespace}.>) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.ismn13,$extension:isn.ismn)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ismn13,$extension:isn.ismn)"](
        api.ismn13.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ismn13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn13 OPERATOR(${namespace}.>) '9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.ismn13,$extension:isn.ismn13)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ismn13,$extension:isn.ismn13)"](
        api.ismn13.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.ismn13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn13 OPERATOR(${namespace}.>) '9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.issn,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.issn,$extension:isn.ean13)"](
        api.issn.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.issn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn OPERATOR(${namespace}.>) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.issn,$extension:isn.issn)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.issn,$extension:isn.issn)"](
        api.issn.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.issn,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn OPERATOR(${namespace}.>) '9771234567898'::${namespace}.issn)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.issn,$extension:isn.issn13)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.issn,$extension:isn.issn13)"](
        api.issn.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.issn,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn OPERATOR(${namespace}.>) '9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.issn13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.issn13,$extension:isn.ean13)"](
        api.issn13.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.issn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn13 OPERATOR(${namespace}.>) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.issn13,$extension:isn.issn)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.issn13,$extension:isn.issn)"](
        api.issn13.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.issn13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn13 OPERATOR(${namespace}.>) '9771234567898'::${namespace}.issn)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.issn13,$extension:isn.issn13)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.issn13,$extension:isn.issn13)"](
        api.issn13.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.issn13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn13 OPERATOR(${namespace}.>) '9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.upc,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.upc,$extension:isn.ean13)"](
        api.upc.value("123456789012"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.upc,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('123456789012'::${namespace}.upc OPERATOR(${namespace}.>) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.>($extension:isn.upc,$extension:isn.upc)",
      expression: api.sql.overloads["operator:$extension:isn.>($extension:isn.upc,$extension:isn.upc)"](
        api.upc.value("123456789012"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>($extension:isn.upc,$extension:isn.upc)"](null, null),
      native: `('123456789012'::${namespace}.upc OPERATOR(${namespace}.>) '123456789012'::${namespace}.upc)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.ean13)"](
        api.ean13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.>=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.isbn)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.isbn)"](
        api.ean13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.>=) '9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.isbn13)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.isbn13)"](
        api.ean13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.>=) '9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.ismn)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.ismn)"](
        api.ean13.value("9780123456786"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.>=) '9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.ismn13)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.ismn13)"](
        api.ean13.value("9780123456786"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.>=) '9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.issn)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.issn)"](
        api.ean13.value("9780123456786"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.>=) '9771234567898'::${namespace}.issn)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.issn13)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.issn13)"](
        api.ean13.value("9780123456786"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.>=) '9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.upc)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.upc)"](
        api.ean13.value("9780123456786"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ean13,$extension:isn.upc)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.ean13 OPERATOR(${namespace}.>=) '123456789012'::${namespace}.upc)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.isbn,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.isbn,$extension:isn.ean13)"](
        api.isbn.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.isbn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn OPERATOR(${namespace}.>=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.isbn,$extension:isn.isbn)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.isbn,$extension:isn.isbn)"](
        api.isbn.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.isbn,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn OPERATOR(${namespace}.>=) '9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.isbn,$extension:isn.isbn13)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.isbn,$extension:isn.isbn13)"](
        api.isbn.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.isbn,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn OPERATOR(${namespace}.>=) '9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.isbn13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.isbn13,$extension:isn.ean13)"](
        api.isbn13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.isbn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn13 OPERATOR(${namespace}.>=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.isbn13,$extension:isn.isbn)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.isbn13,$extension:isn.isbn)"](
        api.isbn13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.isbn13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn13 OPERATOR(${namespace}.>=) '9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.isbn13,$extension:isn.isbn13)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.isbn13,$extension:isn.isbn13)"](
        api.isbn13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.isbn13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `('9780123456786'::${namespace}.isbn13 OPERATOR(${namespace}.>=) '9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.ismn,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ismn,$extension:isn.ean13)"](
        api.ismn.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ismn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn OPERATOR(${namespace}.>=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.ismn,$extension:isn.ismn)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ismn,$extension:isn.ismn)"](
        api.ismn.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ismn,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn OPERATOR(${namespace}.>=) '9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.ismn,$extension:isn.ismn13)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ismn,$extension:isn.ismn13)"](
        api.ismn.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ismn,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn OPERATOR(${namespace}.>=) '9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.ismn13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ismn13,$extension:isn.ean13)"](
        api.ismn13.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ismn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn13 OPERATOR(${namespace}.>=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.ismn13,$extension:isn.ismn)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ismn13,$extension:isn.ismn)"](
        api.ismn13.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ismn13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn13 OPERATOR(${namespace}.>=) '9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.ismn13,$extension:isn.ismn13)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ismn13,$extension:isn.ismn13)"](
        api.ismn13.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.ismn13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `('9790123456785'::${namespace}.ismn13 OPERATOR(${namespace}.>=) '9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.issn,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.issn,$extension:isn.ean13)"](
        api.issn.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.issn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn OPERATOR(${namespace}.>=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.issn,$extension:isn.issn)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.issn,$extension:isn.issn)"](
        api.issn.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.issn,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn OPERATOR(${namespace}.>=) '9771234567898'::${namespace}.issn)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.issn,$extension:isn.issn13)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.issn,$extension:isn.issn13)"](
        api.issn.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.issn,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn OPERATOR(${namespace}.>=) '9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.issn13,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.issn13,$extension:isn.ean13)"](
        api.issn13.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.issn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn13 OPERATOR(${namespace}.>=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.issn13,$extension:isn.issn)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.issn13,$extension:isn.issn)"](
        api.issn13.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.issn13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn13 OPERATOR(${namespace}.>=) '9771234567898'::${namespace}.issn)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.issn13,$extension:isn.issn13)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.issn13,$extension:isn.issn13)"](
        api.issn13.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.issn13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `('9771234567898'::${namespace}.issn13 OPERATOR(${namespace}.>=) '9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.upc,$extension:isn.ean13)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.upc,$extension:isn.ean13)"](
        api.upc.value("123456789012"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.upc,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `('123456789012'::${namespace}.upc OPERATOR(${namespace}.>=) '9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "operator:$extension:isn.>=($extension:isn.upc,$extension:isn.upc)",
      expression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.upc,$extension:isn.upc)"](
        api.upc.value("123456789012"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["operator:$extension:isn.>=($extension:isn.upc,$extension:isn.upc)"](
        null,
        null,
      ),
      native: `('123456789012'::${namespace}.upc OPERATOR(${namespace}.>=) '123456789012'::${namespace}.upc)`,
    },
    {
      member: "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.ean13)"](
        api.ean13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.btean13cmp('9780123456786'::${namespace}.ean13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.isbn)"](
        api.ean13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `${namespace}.btean13cmp('9780123456786'::${namespace}.ean13,'9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.isbn13)"](
        api.ean13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads[
        "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.isbn13)"
      ](null, null),
      native: `${namespace}.btean13cmp('9780123456786'::${namespace}.ean13,'9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.ismn)"](
        api.ean13.value("9780123456786"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `${namespace}.btean13cmp('9780123456786'::${namespace}.ean13,'9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.ismn13)"](
        api.ean13.value("9780123456786"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads[
        "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.ismn13)"
      ](null, null),
      native: `${namespace}.btean13cmp('9780123456786'::${namespace}.ean13,'9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.issn)"](
        api.ean13.value("9780123456786"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `${namespace}.btean13cmp('9780123456786'::${namespace}.ean13,'9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.issn13)"](
        api.ean13.value("9780123456786"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads[
        "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.issn13)"
      ](null, null),
      native: `${namespace}.btean13cmp('9780123456786'::${namespace}.ean13,'9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.upc)",
      expression: api.sql.overloads["routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.upc)"](
        api.ean13.value("9780123456786"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.btean13cmp($extension:isn.ean13,$extension:isn.upc)"](
        null,
        null,
      ),
      native: `${namespace}.btean13cmp('9780123456786'::${namespace}.ean13,'123456789012'::${namespace}.upc)`,
    },
    {
      member: "routine:$extension:isn.btisbn13cmp($extension:isn.isbn13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.btisbn13cmp($extension:isn.isbn13,$extension:isn.ean13)"](
        api.isbn13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads[
        "routine:$extension:isn.btisbn13cmp($extension:isn.isbn13,$extension:isn.ean13)"
      ](null, null),
      native: `${namespace}.btisbn13cmp('9780123456786'::${namespace}.isbn13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.btisbn13cmp($extension:isn.isbn13,$extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.btisbn13cmp($extension:isn.isbn13,$extension:isn.isbn)"](
        api.isbn13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads[
        "routine:$extension:isn.btisbn13cmp($extension:isn.isbn13,$extension:isn.isbn)"
      ](null, null),
      native: `${namespace}.btisbn13cmp('9780123456786'::${namespace}.isbn13,'9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.btisbn13cmp($extension:isn.isbn13,$extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.btisbn13cmp($extension:isn.isbn13,$extension:isn.isbn13)"](
        api.isbn13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads[
        "routine:$extension:isn.btisbn13cmp($extension:isn.isbn13,$extension:isn.isbn13)"
      ](null, null),
      native: `${namespace}.btisbn13cmp('9780123456786'::${namespace}.isbn13,'9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.btisbncmp($extension:isn.isbn,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.btisbncmp($extension:isn.isbn,$extension:isn.ean13)"](
        api.isbn.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.btisbncmp($extension:isn.isbn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.btisbncmp('9780123456786'::${namespace}.isbn,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.btisbncmp($extension:isn.isbn,$extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.btisbncmp($extension:isn.isbn,$extension:isn.isbn)"](
        api.isbn.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.btisbncmp($extension:isn.isbn,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `${namespace}.btisbncmp('9780123456786'::${namespace}.isbn,'9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.btisbncmp($extension:isn.isbn,$extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.btisbncmp($extension:isn.isbn,$extension:isn.isbn13)"](
        api.isbn.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.btisbncmp($extension:isn.isbn,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `${namespace}.btisbncmp('9780123456786'::${namespace}.isbn,'9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.btismn13cmp($extension:isn.ismn13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.btismn13cmp($extension:isn.ismn13,$extension:isn.ean13)"](
        api.ismn13.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads[
        "routine:$extension:isn.btismn13cmp($extension:isn.ismn13,$extension:isn.ean13)"
      ](null, null),
      native: `${namespace}.btismn13cmp('9790123456785'::${namespace}.ismn13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.btismn13cmp($extension:isn.ismn13,$extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.btismn13cmp($extension:isn.ismn13,$extension:isn.ismn)"](
        api.ismn13.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads[
        "routine:$extension:isn.btismn13cmp($extension:isn.ismn13,$extension:isn.ismn)"
      ](null, null),
      native: `${namespace}.btismn13cmp('9790123456785'::${namespace}.ismn13,'9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.btismn13cmp($extension:isn.ismn13,$extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.btismn13cmp($extension:isn.ismn13,$extension:isn.ismn13)"](
        api.ismn13.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads[
        "routine:$extension:isn.btismn13cmp($extension:isn.ismn13,$extension:isn.ismn13)"
      ](null, null),
      native: `${namespace}.btismn13cmp('9790123456785'::${namespace}.ismn13,'9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.btismncmp($extension:isn.ismn,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.btismncmp($extension:isn.ismn,$extension:isn.ean13)"](
        api.ismn.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.btismncmp($extension:isn.ismn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.btismncmp('9790123456785'::${namespace}.ismn,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.btismncmp($extension:isn.ismn,$extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.btismncmp($extension:isn.ismn,$extension:isn.ismn)"](
        api.ismn.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.btismncmp($extension:isn.ismn,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `${namespace}.btismncmp('9790123456785'::${namespace}.ismn,'9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.btismncmp($extension:isn.ismn,$extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.btismncmp($extension:isn.ismn,$extension:isn.ismn13)"](
        api.ismn.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.btismncmp($extension:isn.ismn,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `${namespace}.btismncmp('9790123456785'::${namespace}.ismn,'9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.btissn13cmp($extension:isn.issn13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.btissn13cmp($extension:isn.issn13,$extension:isn.ean13)"](
        api.issn13.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads[
        "routine:$extension:isn.btissn13cmp($extension:isn.issn13,$extension:isn.ean13)"
      ](null, null),
      native: `${namespace}.btissn13cmp('9771234567898'::${namespace}.issn13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.btissn13cmp($extension:isn.issn13,$extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.btissn13cmp($extension:isn.issn13,$extension:isn.issn)"](
        api.issn13.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads[
        "routine:$extension:isn.btissn13cmp($extension:isn.issn13,$extension:isn.issn)"
      ](null, null),
      native: `${namespace}.btissn13cmp('9771234567898'::${namespace}.issn13,'9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.btissn13cmp($extension:isn.issn13,$extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.btissn13cmp($extension:isn.issn13,$extension:isn.issn13)"](
        api.issn13.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads[
        "routine:$extension:isn.btissn13cmp($extension:isn.issn13,$extension:isn.issn13)"
      ](null, null),
      native: `${namespace}.btissn13cmp('9771234567898'::${namespace}.issn13,'9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.btissncmp($extension:isn.issn,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.btissncmp($extension:isn.issn,$extension:isn.ean13)"](
        api.issn.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.btissncmp($extension:isn.issn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.btissncmp('9771234567898'::${namespace}.issn,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.btissncmp($extension:isn.issn,$extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.btissncmp($extension:isn.issn,$extension:isn.issn)"](
        api.issn.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.btissncmp($extension:isn.issn,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `${namespace}.btissncmp('9771234567898'::${namespace}.issn,'9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.btissncmp($extension:isn.issn,$extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.btissncmp($extension:isn.issn,$extension:isn.issn13)"](
        api.issn.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.btissncmp($extension:isn.issn,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `${namespace}.btissncmp('9771234567898'::${namespace}.issn,'9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.btupccmp($extension:isn.upc,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.btupccmp($extension:isn.upc,$extension:isn.ean13)"](
        api.upc.value("123456789012"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.btupccmp($extension:isn.upc,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.btupccmp('123456789012'::${namespace}.upc,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.btupccmp($extension:isn.upc,$extension:isn.upc)",
      expression: api.sql.overloads["routine:$extension:isn.btupccmp($extension:isn.upc,$extension:isn.upc)"](
        api.upc.value("123456789012"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.btupccmp($extension:isn.upc,$extension:isn.upc)"](
        null,
        null,
      ),
      native: `${namespace}.btupccmp('123456789012'::${namespace}.upc,'123456789012'::${namespace}.upc)`,
    },
    {
      member: "routine:$extension:isn.hashean13($extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.hashean13($extension:isn.ean13)"](
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.hashean13($extension:isn.ean13)"](null),
      native: `${namespace}.hashean13('9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.hashisbn($extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.hashisbn($extension:isn.isbn)"](
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.hashisbn($extension:isn.isbn)"](null),
      native: `${namespace}.hashisbn('9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.hashisbn13($extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.hashisbn13($extension:isn.isbn13)"](
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.hashisbn13($extension:isn.isbn13)"](null),
      native: `${namespace}.hashisbn13('9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.hashismn($extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.hashismn($extension:isn.ismn)"](
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.hashismn($extension:isn.ismn)"](null),
      native: `${namespace}.hashismn('9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.hashismn13($extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.hashismn13($extension:isn.ismn13)"](
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.hashismn13($extension:isn.ismn13)"](null),
      native: `${namespace}.hashismn13('9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.hashissn($extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.hashissn($extension:isn.issn)"](
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.hashissn($extension:isn.issn)"](null),
      native: `${namespace}.hashissn('9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.hashissn13($extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.hashissn13($extension:isn.issn13)"](
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.hashissn13($extension:isn.issn13)"](null),
      native: `${namespace}.hashissn13('9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.hashupc($extension:isn.upc)",
      expression: api.sql.overloads["routine:$extension:isn.hashupc($extension:isn.upc)"](
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.hashupc($extension:isn.upc)"](null),
      native: `${namespace}.hashupc('123456789012'::${namespace}.upc)`,
    },
    {
      member: "routine:$extension:isn.is_valid($extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.is_valid($extension:isn.ean13)"](
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.is_valid($extension:isn.ean13)"](null),
      native: `${namespace}.is_valid('9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.is_valid($extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.is_valid($extension:isn.isbn)"](
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.is_valid($extension:isn.isbn)"](null),
      native: `${namespace}.is_valid('9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.is_valid($extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.is_valid($extension:isn.isbn13)"](
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.is_valid($extension:isn.isbn13)"](null),
      native: `${namespace}.is_valid('9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.is_valid($extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.is_valid($extension:isn.ismn)"](
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.is_valid($extension:isn.ismn)"](null),
      native: `${namespace}.is_valid('9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.is_valid($extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.is_valid($extension:isn.ismn13)"](
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.is_valid($extension:isn.ismn13)"](null),
      native: `${namespace}.is_valid('9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.is_valid($extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.is_valid($extension:isn.issn)"](
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.is_valid($extension:isn.issn)"](null),
      native: `${namespace}.is_valid('9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.is_valid($extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.is_valid($extension:isn.issn13)"](
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.is_valid($extension:isn.issn13)"](null),
      native: `${namespace}.is_valid('9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.is_valid($extension:isn.upc)",
      expression: api.sql.overloads["routine:$extension:isn.is_valid($extension:isn.upc)"](
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.is_valid($extension:isn.upc)"](null),
      native: `${namespace}.is_valid('123456789012'::${namespace}.upc)`,
    },
    {
      member: "routine:$extension:isn.isbn($extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isbn($extension:isn.ean13)"](
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isbn($extension:isn.ean13)"](null),
      native: `${namespace}.isbn('9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isbn13($extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isbn13($extension:isn.ean13)"](
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isbn13($extension:isn.ean13)"](null),
      native: `${namespace}.isbn13('9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.ismn($extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.ismn($extension:isn.ean13)"](
        api.ean13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.ismn($extension:isn.ean13)"](null),
      native: `${namespace}.ismn('9790123456785'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.ismn13($extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.ismn13($extension:isn.ean13)"](
        api.ean13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.ismn13($extension:isn.ean13)"](null),
      native: `${namespace}.ismn13('9790123456785'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.ean13)"](
        api.ean13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9780123456786'::${namespace}.ean13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.isbn)"](
        api.ean13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9780123456786'::${namespace}.ean13,'9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.isbn13)"](
        api.ean13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9780123456786'::${namespace}.ean13,'9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.ismn)"](
        api.ean13.value("9780123456786"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9780123456786'::${namespace}.ean13,'9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.ismn13)"](
        api.ean13.value("9780123456786"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9780123456786'::${namespace}.ean13,'9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.issn)"](
        api.ean13.value("9780123456786"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9780123456786'::${namespace}.ean13,'9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.issn13)"](
        api.ean13.value("9780123456786"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9780123456786'::${namespace}.ean13,'9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.upc)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.upc)"](
        api.ean13.value("9780123456786"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ean13,$extension:isn.upc)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9780123456786'::${namespace}.ean13,'123456789012'::${namespace}.upc)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.isbn,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.isbn,$extension:isn.ean13)"](
        api.isbn.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.isbn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9780123456786'::${namespace}.isbn,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.isbn,$extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.isbn,$extension:isn.isbn)"](
        api.isbn.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.isbn,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9780123456786'::${namespace}.isbn,'9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.isbn,$extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.isbn,$extension:isn.isbn13)"](
        api.isbn.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.isbn,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9780123456786'::${namespace}.isbn,'9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.isbn13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.isbn13,$extension:isn.ean13)"](
        api.isbn13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.isbn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9780123456786'::${namespace}.isbn13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.isbn13,$extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.isbn13,$extension:isn.isbn)"](
        api.isbn13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.isbn13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9780123456786'::${namespace}.isbn13,'9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.isbn13,$extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.isbn13,$extension:isn.isbn13)"](
        api.isbn13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.isbn13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9780123456786'::${namespace}.isbn13,'9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.ismn,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ismn,$extension:isn.ean13)"](
        api.ismn.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ismn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9790123456785'::${namespace}.ismn,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.ismn,$extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ismn,$extension:isn.ismn)"](
        api.ismn.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ismn,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9790123456785'::${namespace}.ismn,'9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.ismn,$extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ismn,$extension:isn.ismn13)"](
        api.ismn.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ismn,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9790123456785'::${namespace}.ismn,'9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.ismn13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ismn13,$extension:isn.ean13)"](
        api.ismn13.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ismn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9790123456785'::${namespace}.ismn13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.ismn13,$extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ismn13,$extension:isn.ismn)"](
        api.ismn13.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ismn13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9790123456785'::${namespace}.ismn13,'9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.ismn13,$extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ismn13,$extension:isn.ismn13)"](
        api.ismn13.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.ismn13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9790123456785'::${namespace}.ismn13,'9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.issn,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.issn,$extension:isn.ean13)"](
        api.issn.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.issn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9771234567898'::${namespace}.issn,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.issn,$extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.issn,$extension:isn.issn)"](
        api.issn.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.issn,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9771234567898'::${namespace}.issn,'9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.issn,$extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.issn,$extension:isn.issn13)"](
        api.issn.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.issn,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9771234567898'::${namespace}.issn,'9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.issn13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.issn13,$extension:isn.ean13)"](
        api.issn13.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.issn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9771234567898'::${namespace}.issn13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.issn13,$extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.issn13,$extension:isn.issn)"](
        api.issn13.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.issn13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9771234567898'::${namespace}.issn13,'9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.issn13,$extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.issn13,$extension:isn.issn13)"](
        api.issn13.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.issn13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('9771234567898'::${namespace}.issn13,'9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.upc,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.upc,$extension:isn.ean13)"](
        api.upc.value("123456789012"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.upc,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('123456789012'::${namespace}.upc,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isneq($extension:isn.upc,$extension:isn.upc)",
      expression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.upc,$extension:isn.upc)"](
        api.upc.value("123456789012"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isneq($extension:isn.upc,$extension:isn.upc)"](
        null,
        null,
      ),
      native: `${namespace}.isneq('123456789012'::${namespace}.upc,'123456789012'::${namespace}.upc)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.ean13)"](
        api.ean13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9780123456786'::${namespace}.ean13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.isbn)"](
        api.ean13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9780123456786'::${namespace}.ean13,'9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.isbn13)"](
        api.ean13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9780123456786'::${namespace}.ean13,'9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.ismn)"](
        api.ean13.value("9780123456786"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9780123456786'::${namespace}.ean13,'9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.ismn13)"](
        api.ean13.value("9780123456786"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9780123456786'::${namespace}.ean13,'9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.issn)"](
        api.ean13.value("9780123456786"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9780123456786'::${namespace}.ean13,'9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.issn13)"](
        api.ean13.value("9780123456786"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9780123456786'::${namespace}.ean13,'9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.upc)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.upc)"](
        api.ean13.value("9780123456786"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ean13,$extension:isn.upc)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9780123456786'::${namespace}.ean13,'123456789012'::${namespace}.upc)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.isbn,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.isbn,$extension:isn.ean13)"](
        api.isbn.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.isbn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9780123456786'::${namespace}.isbn,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.isbn,$extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.isbn,$extension:isn.isbn)"](
        api.isbn.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.isbn,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9780123456786'::${namespace}.isbn,'9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.isbn,$extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.isbn,$extension:isn.isbn13)"](
        api.isbn.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.isbn,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9780123456786'::${namespace}.isbn,'9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.isbn13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.isbn13,$extension:isn.ean13)"](
        api.isbn13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.isbn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9780123456786'::${namespace}.isbn13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.isbn13,$extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.isbn13,$extension:isn.isbn)"](
        api.isbn13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.isbn13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9780123456786'::${namespace}.isbn13,'9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.isbn13,$extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.isbn13,$extension:isn.isbn13)"](
        api.isbn13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.isbn13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9780123456786'::${namespace}.isbn13,'9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.ismn,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ismn,$extension:isn.ean13)"](
        api.ismn.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ismn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9790123456785'::${namespace}.ismn,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.ismn,$extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ismn,$extension:isn.ismn)"](
        api.ismn.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ismn,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9790123456785'::${namespace}.ismn,'9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.ismn,$extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ismn,$extension:isn.ismn13)"](
        api.ismn.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ismn,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9790123456785'::${namespace}.ismn,'9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.ismn13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ismn13,$extension:isn.ean13)"](
        api.ismn13.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ismn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9790123456785'::${namespace}.ismn13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.ismn13,$extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ismn13,$extension:isn.ismn)"](
        api.ismn13.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ismn13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9790123456785'::${namespace}.ismn13,'9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.ismn13,$extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ismn13,$extension:isn.ismn13)"](
        api.ismn13.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.ismn13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9790123456785'::${namespace}.ismn13,'9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.issn,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.issn,$extension:isn.ean13)"](
        api.issn.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.issn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9771234567898'::${namespace}.issn,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.issn,$extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.issn,$extension:isn.issn)"](
        api.issn.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.issn,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9771234567898'::${namespace}.issn,'9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.issn,$extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.issn,$extension:isn.issn13)"](
        api.issn.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.issn,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9771234567898'::${namespace}.issn,'9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.issn13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.issn13,$extension:isn.ean13)"](
        api.issn13.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.issn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9771234567898'::${namespace}.issn13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.issn13,$extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.issn13,$extension:isn.issn)"](
        api.issn13.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.issn13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9771234567898'::${namespace}.issn13,'9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.issn13,$extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.issn13,$extension:isn.issn13)"](
        api.issn13.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.issn13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('9771234567898'::${namespace}.issn13,'9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.upc,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.upc,$extension:isn.ean13)"](
        api.upc.value("123456789012"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.upc,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('123456789012'::${namespace}.upc,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnge($extension:isn.upc,$extension:isn.upc)",
      expression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.upc,$extension:isn.upc)"](
        api.upc.value("123456789012"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnge($extension:isn.upc,$extension:isn.upc)"](
        null,
        null,
      ),
      native: `${namespace}.isnge('123456789012'::${namespace}.upc,'123456789012'::${namespace}.upc)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.ean13)"](
        api.ean13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9780123456786'::${namespace}.ean13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.isbn)"](
        api.ean13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9780123456786'::${namespace}.ean13,'9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.isbn13)"](
        api.ean13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9780123456786'::${namespace}.ean13,'9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.ismn)"](
        api.ean13.value("9780123456786"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9780123456786'::${namespace}.ean13,'9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.ismn13)"](
        api.ean13.value("9780123456786"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9780123456786'::${namespace}.ean13,'9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.issn)"](
        api.ean13.value("9780123456786"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9780123456786'::${namespace}.ean13,'9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.issn13)"](
        api.ean13.value("9780123456786"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9780123456786'::${namespace}.ean13,'9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.upc)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.upc)"](
        api.ean13.value("9780123456786"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ean13,$extension:isn.upc)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9780123456786'::${namespace}.ean13,'123456789012'::${namespace}.upc)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.isbn,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.isbn,$extension:isn.ean13)"](
        api.isbn.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.isbn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9780123456786'::${namespace}.isbn,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.isbn,$extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.isbn,$extension:isn.isbn)"](
        api.isbn.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.isbn,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9780123456786'::${namespace}.isbn,'9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.isbn,$extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.isbn,$extension:isn.isbn13)"](
        api.isbn.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.isbn,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9780123456786'::${namespace}.isbn,'9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.isbn13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.isbn13,$extension:isn.ean13)"](
        api.isbn13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.isbn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9780123456786'::${namespace}.isbn13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.isbn13,$extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.isbn13,$extension:isn.isbn)"](
        api.isbn13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.isbn13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9780123456786'::${namespace}.isbn13,'9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.isbn13,$extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.isbn13,$extension:isn.isbn13)"](
        api.isbn13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.isbn13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9780123456786'::${namespace}.isbn13,'9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.ismn,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ismn,$extension:isn.ean13)"](
        api.ismn.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ismn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9790123456785'::${namespace}.ismn,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.ismn,$extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ismn,$extension:isn.ismn)"](
        api.ismn.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ismn,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9790123456785'::${namespace}.ismn,'9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.ismn,$extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ismn,$extension:isn.ismn13)"](
        api.ismn.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ismn,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9790123456785'::${namespace}.ismn,'9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.ismn13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ismn13,$extension:isn.ean13)"](
        api.ismn13.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ismn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9790123456785'::${namespace}.ismn13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.ismn13,$extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ismn13,$extension:isn.ismn)"](
        api.ismn13.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ismn13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9790123456785'::${namespace}.ismn13,'9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.ismn13,$extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ismn13,$extension:isn.ismn13)"](
        api.ismn13.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.ismn13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9790123456785'::${namespace}.ismn13,'9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.issn,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.issn,$extension:isn.ean13)"](
        api.issn.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.issn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9771234567898'::${namespace}.issn,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.issn,$extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.issn,$extension:isn.issn)"](
        api.issn.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.issn,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9771234567898'::${namespace}.issn,'9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.issn,$extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.issn,$extension:isn.issn13)"](
        api.issn.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.issn,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9771234567898'::${namespace}.issn,'9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.issn13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.issn13,$extension:isn.ean13)"](
        api.issn13.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.issn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9771234567898'::${namespace}.issn13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.issn13,$extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.issn13,$extension:isn.issn)"](
        api.issn13.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.issn13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9771234567898'::${namespace}.issn13,'9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.issn13,$extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.issn13,$extension:isn.issn13)"](
        api.issn13.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.issn13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('9771234567898'::${namespace}.issn13,'9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.upc,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.upc,$extension:isn.ean13)"](
        api.upc.value("123456789012"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.upc,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('123456789012'::${namespace}.upc,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isngt($extension:isn.upc,$extension:isn.upc)",
      expression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.upc,$extension:isn.upc)"](
        api.upc.value("123456789012"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isngt($extension:isn.upc,$extension:isn.upc)"](
        null,
        null,
      ),
      native: `${namespace}.isngt('123456789012'::${namespace}.upc,'123456789012'::${namespace}.upc)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.ean13)"](
        api.ean13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9780123456786'::${namespace}.ean13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.isbn)"](
        api.ean13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9780123456786'::${namespace}.ean13,'9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.isbn13)"](
        api.ean13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9780123456786'::${namespace}.ean13,'9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.ismn)"](
        api.ean13.value("9780123456786"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9780123456786'::${namespace}.ean13,'9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.ismn13)"](
        api.ean13.value("9780123456786"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9780123456786'::${namespace}.ean13,'9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.issn)"](
        api.ean13.value("9780123456786"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9780123456786'::${namespace}.ean13,'9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.issn13)"](
        api.ean13.value("9780123456786"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9780123456786'::${namespace}.ean13,'9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.upc)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.upc)"](
        api.ean13.value("9780123456786"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ean13,$extension:isn.upc)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9780123456786'::${namespace}.ean13,'123456789012'::${namespace}.upc)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.isbn,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.isbn,$extension:isn.ean13)"](
        api.isbn.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.isbn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9780123456786'::${namespace}.isbn,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.isbn,$extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.isbn,$extension:isn.isbn)"](
        api.isbn.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.isbn,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9780123456786'::${namespace}.isbn,'9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.isbn,$extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.isbn,$extension:isn.isbn13)"](
        api.isbn.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.isbn,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9780123456786'::${namespace}.isbn,'9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.isbn13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.isbn13,$extension:isn.ean13)"](
        api.isbn13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.isbn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9780123456786'::${namespace}.isbn13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.isbn13,$extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.isbn13,$extension:isn.isbn)"](
        api.isbn13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.isbn13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9780123456786'::${namespace}.isbn13,'9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.isbn13,$extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.isbn13,$extension:isn.isbn13)"](
        api.isbn13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.isbn13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9780123456786'::${namespace}.isbn13,'9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.ismn,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ismn,$extension:isn.ean13)"](
        api.ismn.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ismn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9790123456785'::${namespace}.ismn,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.ismn,$extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ismn,$extension:isn.ismn)"](
        api.ismn.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ismn,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9790123456785'::${namespace}.ismn,'9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.ismn,$extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ismn,$extension:isn.ismn13)"](
        api.ismn.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ismn,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9790123456785'::${namespace}.ismn,'9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.ismn13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ismn13,$extension:isn.ean13)"](
        api.ismn13.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ismn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9790123456785'::${namespace}.ismn13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.ismn13,$extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ismn13,$extension:isn.ismn)"](
        api.ismn13.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ismn13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9790123456785'::${namespace}.ismn13,'9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.ismn13,$extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ismn13,$extension:isn.ismn13)"](
        api.ismn13.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.ismn13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9790123456785'::${namespace}.ismn13,'9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.issn,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.issn,$extension:isn.ean13)"](
        api.issn.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.issn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9771234567898'::${namespace}.issn,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.issn,$extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.issn,$extension:isn.issn)"](
        api.issn.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.issn,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9771234567898'::${namespace}.issn,'9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.issn,$extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.issn,$extension:isn.issn13)"](
        api.issn.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.issn,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9771234567898'::${namespace}.issn,'9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.issn13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.issn13,$extension:isn.ean13)"](
        api.issn13.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.issn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9771234567898'::${namespace}.issn13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.issn13,$extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.issn13,$extension:isn.issn)"](
        api.issn13.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.issn13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9771234567898'::${namespace}.issn13,'9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.issn13,$extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.issn13,$extension:isn.issn13)"](
        api.issn13.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.issn13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('9771234567898'::${namespace}.issn13,'9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.upc,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.upc,$extension:isn.ean13)"](
        api.upc.value("123456789012"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.upc,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('123456789012'::${namespace}.upc,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnle($extension:isn.upc,$extension:isn.upc)",
      expression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.upc,$extension:isn.upc)"](
        api.upc.value("123456789012"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnle($extension:isn.upc,$extension:isn.upc)"](
        null,
        null,
      ),
      native: `${namespace}.isnle('123456789012'::${namespace}.upc,'123456789012'::${namespace}.upc)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.ean13)"](
        api.ean13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9780123456786'::${namespace}.ean13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.isbn)"](
        api.ean13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9780123456786'::${namespace}.ean13,'9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.isbn13)"](
        api.ean13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9780123456786'::${namespace}.ean13,'9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.ismn)"](
        api.ean13.value("9780123456786"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9780123456786'::${namespace}.ean13,'9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.ismn13)"](
        api.ean13.value("9780123456786"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9780123456786'::${namespace}.ean13,'9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.issn)"](
        api.ean13.value("9780123456786"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9780123456786'::${namespace}.ean13,'9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.issn13)"](
        api.ean13.value("9780123456786"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9780123456786'::${namespace}.ean13,'9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.upc)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.upc)"](
        api.ean13.value("9780123456786"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ean13,$extension:isn.upc)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9780123456786'::${namespace}.ean13,'123456789012'::${namespace}.upc)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.isbn,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.isbn,$extension:isn.ean13)"](
        api.isbn.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.isbn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9780123456786'::${namespace}.isbn,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.isbn,$extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.isbn,$extension:isn.isbn)"](
        api.isbn.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.isbn,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9780123456786'::${namespace}.isbn,'9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.isbn,$extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.isbn,$extension:isn.isbn13)"](
        api.isbn.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.isbn,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9780123456786'::${namespace}.isbn,'9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.isbn13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.isbn13,$extension:isn.ean13)"](
        api.isbn13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.isbn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9780123456786'::${namespace}.isbn13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.isbn13,$extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.isbn13,$extension:isn.isbn)"](
        api.isbn13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.isbn13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9780123456786'::${namespace}.isbn13,'9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.isbn13,$extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.isbn13,$extension:isn.isbn13)"](
        api.isbn13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.isbn13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9780123456786'::${namespace}.isbn13,'9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.ismn,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ismn,$extension:isn.ean13)"](
        api.ismn.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ismn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9790123456785'::${namespace}.ismn,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.ismn,$extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ismn,$extension:isn.ismn)"](
        api.ismn.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ismn,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9790123456785'::${namespace}.ismn,'9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.ismn,$extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ismn,$extension:isn.ismn13)"](
        api.ismn.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ismn,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9790123456785'::${namespace}.ismn,'9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.ismn13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ismn13,$extension:isn.ean13)"](
        api.ismn13.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ismn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9790123456785'::${namespace}.ismn13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.ismn13,$extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ismn13,$extension:isn.ismn)"](
        api.ismn13.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ismn13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9790123456785'::${namespace}.ismn13,'9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.ismn13,$extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ismn13,$extension:isn.ismn13)"](
        api.ismn13.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.ismn13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9790123456785'::${namespace}.ismn13,'9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.issn,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.issn,$extension:isn.ean13)"](
        api.issn.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.issn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9771234567898'::${namespace}.issn,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.issn,$extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.issn,$extension:isn.issn)"](
        api.issn.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.issn,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9771234567898'::${namespace}.issn,'9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.issn,$extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.issn,$extension:isn.issn13)"](
        api.issn.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.issn,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9771234567898'::${namespace}.issn,'9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.issn13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.issn13,$extension:isn.ean13)"](
        api.issn13.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.issn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9771234567898'::${namespace}.issn13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.issn13,$extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.issn13,$extension:isn.issn)"](
        api.issn13.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.issn13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9771234567898'::${namespace}.issn13,'9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.issn13,$extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.issn13,$extension:isn.issn13)"](
        api.issn13.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.issn13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('9771234567898'::${namespace}.issn13,'9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.upc,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.upc,$extension:isn.ean13)"](
        api.upc.value("123456789012"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.upc,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('123456789012'::${namespace}.upc,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnlt($extension:isn.upc,$extension:isn.upc)",
      expression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.upc,$extension:isn.upc)"](
        api.upc.value("123456789012"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnlt($extension:isn.upc,$extension:isn.upc)"](
        null,
        null,
      ),
      native: `${namespace}.isnlt('123456789012'::${namespace}.upc,'123456789012'::${namespace}.upc)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.ean13)"](
        api.ean13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9780123456786'::${namespace}.ean13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.isbn)"](
        api.ean13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9780123456786'::${namespace}.ean13,'9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.isbn13)"](
        api.ean13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9780123456786'::${namespace}.ean13,'9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.ismn)"](
        api.ean13.value("9780123456786"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9780123456786'::${namespace}.ean13,'9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.ismn13)"](
        api.ean13.value("9780123456786"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9780123456786'::${namespace}.ean13,'9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.issn)"](
        api.ean13.value("9780123456786"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9780123456786'::${namespace}.ean13,'9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.issn13)"](
        api.ean13.value("9780123456786"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9780123456786'::${namespace}.ean13,'9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.upc)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.upc)"](
        api.ean13.value("9780123456786"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ean13,$extension:isn.upc)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9780123456786'::${namespace}.ean13,'123456789012'::${namespace}.upc)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.isbn,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.isbn,$extension:isn.ean13)"](
        api.isbn.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.isbn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9780123456786'::${namespace}.isbn,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.isbn,$extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.isbn,$extension:isn.isbn)"](
        api.isbn.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.isbn,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9780123456786'::${namespace}.isbn,'9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.isbn,$extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.isbn,$extension:isn.isbn13)"](
        api.isbn.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.isbn,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9780123456786'::${namespace}.isbn,'9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.isbn13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.isbn13,$extension:isn.ean13)"](
        api.isbn13.value("9780123456786"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.isbn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9780123456786'::${namespace}.isbn13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.isbn13,$extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.isbn13,$extension:isn.isbn)"](
        api.isbn13.value("9780123456786"),
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.isbn13,$extension:isn.isbn)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9780123456786'::${namespace}.isbn13,'9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.isbn13,$extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.isbn13,$extension:isn.isbn13)"](
        api.isbn13.value("9780123456786"),
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.isbn13,$extension:isn.isbn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9780123456786'::${namespace}.isbn13,'9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.ismn,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ismn,$extension:isn.ean13)"](
        api.ismn.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ismn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9790123456785'::${namespace}.ismn,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.ismn,$extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ismn,$extension:isn.ismn)"](
        api.ismn.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ismn,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9790123456785'::${namespace}.ismn,'9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.ismn,$extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ismn,$extension:isn.ismn13)"](
        api.ismn.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ismn,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9790123456785'::${namespace}.ismn,'9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.ismn13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ismn13,$extension:isn.ean13)"](
        api.ismn13.value("9790123456785"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ismn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9790123456785'::${namespace}.ismn13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.ismn13,$extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ismn13,$extension:isn.ismn)"](
        api.ismn13.value("9790123456785"),
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ismn13,$extension:isn.ismn)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9790123456785'::${namespace}.ismn13,'9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.ismn13,$extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ismn13,$extension:isn.ismn13)"](
        api.ismn13.value("9790123456785"),
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.ismn13,$extension:isn.ismn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9790123456785'::${namespace}.ismn13,'9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.issn,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.issn,$extension:isn.ean13)"](
        api.issn.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.issn,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9771234567898'::${namespace}.issn,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.issn,$extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.issn,$extension:isn.issn)"](
        api.issn.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.issn,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9771234567898'::${namespace}.issn,'9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.issn,$extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.issn,$extension:isn.issn13)"](
        api.issn.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.issn,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9771234567898'::${namespace}.issn,'9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.issn13,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.issn13,$extension:isn.ean13)"](
        api.issn13.value("9771234567898"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.issn13,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9771234567898'::${namespace}.issn13,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.issn13,$extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.issn13,$extension:isn.issn)"](
        api.issn13.value("9771234567898"),
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.issn13,$extension:isn.issn)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9771234567898'::${namespace}.issn13,'9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.issn13,$extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.issn13,$extension:isn.issn13)"](
        api.issn13.value("9771234567898"),
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.issn13,$extension:isn.issn13)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('9771234567898'::${namespace}.issn13,'9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.upc,$extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.upc,$extension:isn.ean13)"](
        api.upc.value("123456789012"),
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.upc,$extension:isn.ean13)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('123456789012'::${namespace}.upc,'9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.isnne($extension:isn.upc,$extension:isn.upc)",
      expression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.upc,$extension:isn.upc)"](
        api.upc.value("123456789012"),
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.isnne($extension:isn.upc,$extension:isn.upc)"](
        null,
        null,
      ),
      native: `${namespace}.isnne('123456789012'::${namespace}.upc,'123456789012'::${namespace}.upc)`,
    },
    {
      member: "routine:$extension:isn.issn($extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.issn($extension:isn.ean13)"](
        api.ean13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.issn($extension:isn.ean13)"](null),
      native: `${namespace}.issn('9771234567898'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.issn13($extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.issn13($extension:isn.ean13)"](
        api.ean13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.issn13($extension:isn.ean13)"](null),
      native: `${namespace}.issn13('9771234567898'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.make_valid($extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.make_valid($extension:isn.ean13)"](
        api.ean13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.make_valid($extension:isn.ean13)"](null),
      native: `${namespace}.make_valid('9780123456786'::${namespace}.ean13)`,
    },
    {
      member: "routine:$extension:isn.make_valid($extension:isn.isbn)",
      expression: api.sql.overloads["routine:$extension:isn.make_valid($extension:isn.isbn)"](
        api.isbn.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.make_valid($extension:isn.isbn)"](null),
      native: `${namespace}.make_valid('9780123456786'::${namespace}.isbn)`,
    },
    {
      member: "routine:$extension:isn.make_valid($extension:isn.isbn13)",
      expression: api.sql.overloads["routine:$extension:isn.make_valid($extension:isn.isbn13)"](
        api.isbn13.value("9780123456786"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.make_valid($extension:isn.isbn13)"](null),
      native: `${namespace}.make_valid('9780123456786'::${namespace}.isbn13)`,
    },
    {
      member: "routine:$extension:isn.make_valid($extension:isn.ismn)",
      expression: api.sql.overloads["routine:$extension:isn.make_valid($extension:isn.ismn)"](
        api.ismn.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.make_valid($extension:isn.ismn)"](null),
      native: `${namespace}.make_valid('9790123456785'::${namespace}.ismn)`,
    },
    {
      member: "routine:$extension:isn.make_valid($extension:isn.ismn13)",
      expression: api.sql.overloads["routine:$extension:isn.make_valid($extension:isn.ismn13)"](
        api.ismn13.value("9790123456785"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.make_valid($extension:isn.ismn13)"](null),
      native: `${namespace}.make_valid('9790123456785'::${namespace}.ismn13)`,
    },
    {
      member: "routine:$extension:isn.make_valid($extension:isn.issn)",
      expression: api.sql.overloads["routine:$extension:isn.make_valid($extension:isn.issn)"](
        api.issn.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.make_valid($extension:isn.issn)"](null),
      native: `${namespace}.make_valid('9771234567898'::${namespace}.issn)`,
    },
    {
      member: "routine:$extension:isn.make_valid($extension:isn.issn13)",
      expression: api.sql.overloads["routine:$extension:isn.make_valid($extension:isn.issn13)"](
        api.issn13.value("9771234567898"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.make_valid($extension:isn.issn13)"](null),
      native: `${namespace}.make_valid('9771234567898'::${namespace}.issn13)`,
    },
    {
      member: "routine:$extension:isn.make_valid($extension:isn.upc)",
      expression: api.sql.overloads["routine:$extension:isn.make_valid($extension:isn.upc)"](
        api.upc.value("123456789012"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.make_valid($extension:isn.upc)"](null),
      native: `${namespace}.make_valid('123456789012'::${namespace}.upc)`,
    },
    {
      member: "routine:$extension:isn.upc($extension:isn.ean13)",
      expression: api.sql.overloads["routine:$extension:isn.upc($extension:isn.ean13)"](
        api.ean13.value("0123456789012"),
      ),
      nullExpression: api.sql.overloads["routine:$extension:isn.upc($extension:isn.ean13)"](null),
      native: `${namespace}.upc('0123456789012'::${namespace}.ean13)`,
    },
  ];
}
export function isnCastCases(api = isnApi): readonly IsnNativeCase[] {
  const namespace = '"Isn""日本"';
  return [
    {
      member: "cast:$extension:isn.ean13->$extension:isn.isbn",
      expression: api.sql.casts["cast:$extension:isn.ean13->$extension:isn.isbn"](api.ean13.value("9780123456786")),
      nullExpression: api.sql.casts["cast:$extension:isn.ean13->$extension:isn.isbn"](null),
      native: `('9780123456786'::${namespace}.ean13)::${namespace}.isbn`,
    },
    {
      member: "cast:$extension:isn.ean13->$extension:isn.isbn13",
      expression: api.sql.casts["cast:$extension:isn.ean13->$extension:isn.isbn13"](api.ean13.value("9780123456786")),
      nullExpression: api.sql.casts["cast:$extension:isn.ean13->$extension:isn.isbn13"](null),
      native: `('9780123456786'::${namespace}.ean13)::${namespace}.isbn13`,
    },
    {
      member: "cast:$extension:isn.ean13->$extension:isn.ismn",
      expression: api.sql.casts["cast:$extension:isn.ean13->$extension:isn.ismn"](api.ean13.value("9790123456785")),
      nullExpression: api.sql.casts["cast:$extension:isn.ean13->$extension:isn.ismn"](null),
      native: `('9790123456785'::${namespace}.ean13)::${namespace}.ismn`,
    },
    {
      member: "cast:$extension:isn.ean13->$extension:isn.ismn13",
      expression: api.sql.casts["cast:$extension:isn.ean13->$extension:isn.ismn13"](api.ean13.value("9790123456785")),
      nullExpression: api.sql.casts["cast:$extension:isn.ean13->$extension:isn.ismn13"](null),
      native: `('9790123456785'::${namespace}.ean13)::${namespace}.ismn13`,
    },
    {
      member: "cast:$extension:isn.ean13->$extension:isn.issn",
      expression: api.sql.casts["cast:$extension:isn.ean13->$extension:isn.issn"](api.ean13.value("9771234567898")),
      nullExpression: api.sql.casts["cast:$extension:isn.ean13->$extension:isn.issn"](null),
      native: `('9771234567898'::${namespace}.ean13)::${namespace}.issn`,
    },
    {
      member: "cast:$extension:isn.ean13->$extension:isn.issn13",
      expression: api.sql.casts["cast:$extension:isn.ean13->$extension:isn.issn13"](api.ean13.value("9771234567898")),
      nullExpression: api.sql.casts["cast:$extension:isn.ean13->$extension:isn.issn13"](null),
      native: `('9771234567898'::${namespace}.ean13)::${namespace}.issn13`,
    },
    {
      member: "cast:$extension:isn.ean13->$extension:isn.upc",
      expression: api.sql.casts["cast:$extension:isn.ean13->$extension:isn.upc"](api.ean13.value("0123456789012")),
      nullExpression: api.sql.casts["cast:$extension:isn.ean13->$extension:isn.upc"](null),
      native: `('0123456789012'::${namespace}.ean13)::${namespace}.upc`,
    },
    {
      member: "cast:$extension:isn.isbn->$extension:isn.ean13",
      expression: api.sql.casts["cast:$extension:isn.isbn->$extension:isn.ean13"](api.isbn.value("9780123456786")),
      nullExpression: api.sql.casts["cast:$extension:isn.isbn->$extension:isn.ean13"](null),
      native: `('9780123456786'::${namespace}.isbn)::${namespace}.ean13`,
    },
    {
      member: "cast:$extension:isn.isbn->$extension:isn.isbn13",
      expression: api.sql.casts["cast:$extension:isn.isbn->$extension:isn.isbn13"](api.isbn.value("9780123456786")),
      nullExpression: api.sql.casts["cast:$extension:isn.isbn->$extension:isn.isbn13"](null),
      native: `('9780123456786'::${namespace}.isbn)::${namespace}.isbn13`,
    },
    {
      member: "cast:$extension:isn.isbn13->$extension:isn.ean13",
      expression: api.sql.casts["cast:$extension:isn.isbn13->$extension:isn.ean13"](api.isbn13.value("9780123456786")),
      nullExpression: api.sql.casts["cast:$extension:isn.isbn13->$extension:isn.ean13"](null),
      native: `('9780123456786'::${namespace}.isbn13)::${namespace}.ean13`,
    },
    {
      member: "cast:$extension:isn.isbn13->$extension:isn.isbn",
      expression: api.sql.casts["cast:$extension:isn.isbn13->$extension:isn.isbn"](api.isbn13.value("9780123456786")),
      nullExpression: api.sql.casts["cast:$extension:isn.isbn13->$extension:isn.isbn"](null),
      native: `('9780123456786'::${namespace}.isbn13)::${namespace}.isbn`,
    },
    {
      member: "cast:$extension:isn.ismn->$extension:isn.ean13",
      expression: api.sql.casts["cast:$extension:isn.ismn->$extension:isn.ean13"](api.ismn.value("9790123456785")),
      nullExpression: api.sql.casts["cast:$extension:isn.ismn->$extension:isn.ean13"](null),
      native: `('9790123456785'::${namespace}.ismn)::${namespace}.ean13`,
    },
    {
      member: "cast:$extension:isn.ismn->$extension:isn.ismn13",
      expression: api.sql.casts["cast:$extension:isn.ismn->$extension:isn.ismn13"](api.ismn.value("9790123456785")),
      nullExpression: api.sql.casts["cast:$extension:isn.ismn->$extension:isn.ismn13"](null),
      native: `('9790123456785'::${namespace}.ismn)::${namespace}.ismn13`,
    },
    {
      member: "cast:$extension:isn.ismn13->$extension:isn.ean13",
      expression: api.sql.casts["cast:$extension:isn.ismn13->$extension:isn.ean13"](api.ismn13.value("9790123456785")),
      nullExpression: api.sql.casts["cast:$extension:isn.ismn13->$extension:isn.ean13"](null),
      native: `('9790123456785'::${namespace}.ismn13)::${namespace}.ean13`,
    },
    {
      member: "cast:$extension:isn.ismn13->$extension:isn.ismn",
      expression: api.sql.casts["cast:$extension:isn.ismn13->$extension:isn.ismn"](api.ismn13.value("9790123456785")),
      nullExpression: api.sql.casts["cast:$extension:isn.ismn13->$extension:isn.ismn"](null),
      native: `('9790123456785'::${namespace}.ismn13)::${namespace}.ismn`,
    },
    {
      member: "cast:$extension:isn.issn->$extension:isn.ean13",
      expression: api.sql.casts["cast:$extension:isn.issn->$extension:isn.ean13"](api.issn.value("9771234567898")),
      nullExpression: api.sql.casts["cast:$extension:isn.issn->$extension:isn.ean13"](null),
      native: `('9771234567898'::${namespace}.issn)::${namespace}.ean13`,
    },
    {
      member: "cast:$extension:isn.issn->$extension:isn.issn13",
      expression: api.sql.casts["cast:$extension:isn.issn->$extension:isn.issn13"](api.issn.value("9771234567898")),
      nullExpression: api.sql.casts["cast:$extension:isn.issn->$extension:isn.issn13"](null),
      native: `('9771234567898'::${namespace}.issn)::${namespace}.issn13`,
    },
    {
      member: "cast:$extension:isn.issn13->$extension:isn.ean13",
      expression: api.sql.casts["cast:$extension:isn.issn13->$extension:isn.ean13"](api.issn13.value("9771234567898")),
      nullExpression: api.sql.casts["cast:$extension:isn.issn13->$extension:isn.ean13"](null),
      native: `('9771234567898'::${namespace}.issn13)::${namespace}.ean13`,
    },
    {
      member: "cast:$extension:isn.issn13->$extension:isn.issn",
      expression: api.sql.casts["cast:$extension:isn.issn13->$extension:isn.issn"](api.issn13.value("9771234567898")),
      nullExpression: api.sql.casts["cast:$extension:isn.issn13->$extension:isn.issn"](null),
      native: `('9771234567898'::${namespace}.issn13)::${namespace}.issn`,
    },
    {
      member: "cast:$extension:isn.upc->$extension:isn.ean13",
      expression: api.sql.casts["cast:$extension:isn.upc->$extension:isn.ean13"](api.upc.value("123456789012")),
      nullExpression: api.sql.casts["cast:$extension:isn.upc->$extension:isn.ean13"](null),
      native: `('123456789012'::${namespace}.upc)::${namespace}.ean13`,
    },
  ];
}
