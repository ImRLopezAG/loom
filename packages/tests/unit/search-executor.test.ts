import { describe, it, expect } from "vite-plus/test";
import {
  createSearchContext,
  validateSelectedSearchOutput,
  validateSearchHandlerOutput,
} from "../../../apps/loom/src/core/search/executor";
import { createSearchValidators } from "../../../apps/loom/src/core/search/contract";
import { oc } from "loom/contract";
import { searchSchema, searchRelations } from "../fixtures/search-schema";
import { searchContractDescriptor } from "../../../apps/loom/src/core/search/metadata";

const validators = { tables: createSearchValidators(searchSchema, searchRelations) };
const search = validators.tables.tasks.search({ scope: "public", columns: ["title", "done"] });
const descriptor = searchContractDescriptor(oc.input(search.input).output(search.output));
if (!descriptor) throw new Error("Missing search descriptor");

describe("invocation-bound search", () => {
  it("rejects escaped calls before database acquisition", async () => {
    const context = createSearchContext(searchRelations);
    // Runtime caller has no validated invocation, regardless of structurally valid input.
    const input = await search.input["~standard"].validate({});
    if (input.issues) throw new Error("Invalid fixture input");
    expect(() => context.tasks.paginate(input.value)).toThrow("active search");
  });
  it("validates a manual result against the exact selection and preserves count strings", () => {
    const input = { columns: { title: true }, count: true };
    const page = { rows: [{ title: "visible" }], count: "9007199254740993", nextCursor: null, previousCursor: null };
    expect(validateSelectedSearchOutput(descriptor, input, page)).toBe(page);
    for (const invalid of [
      { ...page, rows: [{ title: "visible", done: false }] },
      { ...page, rows: [{ title: 1 }] },
      { ...page, rows: [{}] },
      { ...page, count: 9007199254740992 },
      { ...page, count: undefined },
    ])
      expect(() => validateSelectedSearchOutput(descriptor, input, invalid)).toThrow("selected search");
  });
  it("rejects missing fields and wrong nested cardinality without running the executor", () => {
    const selection = validators.tables.tasks.search({
      scope: "public",
      columns: ["title"],
      relations: {
        project: { scope: "public", columns: ["name"] },
      },
    });
    const nested = searchContractDescriptor(oc.input(selection.input).output(selection.output));
    if (!nested) throw new Error("Missing descriptor");
    const input = { with: { project: {} } };
    const page = { rows: [{ title: "visible", project: { name: "Project" } }], nextCursor: null, previousCursor: null };
    expect(validateSelectedSearchOutput(nested, input, page)).toBe(page);
    for (const project of [[], { name: 2 }, { name: "Project", private: "secret" }])
      expect(() =>
        validateSelectedSearchOutput(nested, input, { ...page, rows: [{ title: "visible", project }] }),
      ).toThrow("selected search");
  });
  it("closes a manual stream on an invalid first or later yield", async () => {
    const selection = validators.tables.tasks.liveSearch({ scope: "public", columns: ["title", "done"] });
    const live = searchContractDescriptor(oc.input(selection.input).output(selection.output));
    if (!live) throw new Error("Missing descriptor");
    for (const firstValid of [false, true]) {
      let closed = false;
      const source = (async function* () {
        try {
          if (firstValid) yield { pages: [[{ title: "visible" }]], nextCursor: null, previousCursor: null };
          yield { pages: [[{ title: "visible", done: true }]], nextCursor: null, previousCursor: null };
        } finally {
          closed = true;
        }
      })();
      const stream = validateSearchHandlerOutput(live, { columns: { title: true } }, source);
      if (!(Symbol.asyncIterator in stream)) throw new Error("Missing stream");
      if (firstValid) expect((await stream.next()).value).toMatchObject({ pages: [[{ title: "visible" }]] });
      await expect(stream.next()).rejects.toThrow("selected search");
      expect(closed).toBe(true);
      expect((await stream.next()).done).toBe(true);
    }
  });
});
