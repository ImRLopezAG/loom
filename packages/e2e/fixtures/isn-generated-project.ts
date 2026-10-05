/** Parent runs generation, packed consumer compilation, and bundle isolation after shared integration. */
export const isnGeneratedSelection = { isn: { version: "1.3", schema: 'Isn"日本' } } as const;
export const isnGeneratedSchema = `
import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
export default defineSchema(() => ({ books: defineTable({
  isbn: extensions.isn.isbn.field().notNull(),
  editions: extensions.isn.isbn.arrayField(),
}, { indexes: [{ fields: ["isbn"], extension: extensions.isn.isbn.indexes.btree() }] }) }));
`;
export const isnGeneratedTypeProof = `
import { sql, type SQL } from "drizzle-orm";
import { extensions } from "./_generated/extensions";
import type { IsnValue } from "kello/extensions/isn";
const value = extensions.isn.isbn.value("0-12-345678-9!");
const valid: SQL<boolean | null> = extensions.isn.isbn.isValid(value);
const corrected: SQL<IsnValue<"isbn"> | null> = extensions.isn.isbn.makeValid(value);
// @ts-expect-error Only explicitly selected keys exist.
extensions.vector;
// @ts-expect-error SQL native subtype cannot be silently changed.
extensions.isn.isbn.equal(extensions.isn.ismn.value("M-1234-5678-5"), value);
// @ts-expect-error Caller-selected return casts are not available.
extensions.isn.isbn.isValid<string>(value);
// @ts-expect-error Weak-mode session mutation stays outside request context.
extensions.isn.sql.functions.isn_weak(true);
// @ts-expect-error Boolean columns are not identifier columns.
extensions.isn.isbn.equal(sql<boolean>\`true\`, value);
void [valid, corrected];
`;
