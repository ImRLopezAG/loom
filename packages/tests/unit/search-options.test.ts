import { describe, expect, it } from "vite-plus/test";
import { createORPCClient } from "@orpc/client";
import type { Client } from "@orpc/client";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { keepPreviousData, QueryClient, QueryObserver } from "@tanstack/react-query";
import type { DonePage, TitlePage, titleSelection, doneSelection } from "../fixtures/search-schema";
import * as v from "valibot";

type Page = TitlePage | DonePage;
type Input = (typeof titleSelection | typeof doneSelection) & { cursor?: string };
type SearchClient = { search: Client<object, Input, Page, Error> };
const titleInput = v.strictObject({
  columns: v.strictObject({ title: v.literal(true) }),
  cursor: v.optional(v.string()),
});
const doneInput = v.strictObject({
  columns: v.strictObject({ done: v.literal(true) }),
  cursor: v.optional(v.string()),
});

describe("search U1 native placeholder boundary", () => {
  for (const defaults of ["global", "key", "utility"] as const) {
    it(`reuses a title-only result through ${defaults} defaults while done-only is pending`, async () => {
      let finish: ((page: Page) => void) | undefined;
      const pending = new Promise<Page>((resolve) => {
        finish = resolve;
      });
      const client = createORPCClient<SearchClient>({
        async call(_path, input) {
          if (v.is(titleInput, input)) return { rows: [{ title: "previous" }], nextCursor: null };
          if (v.is(doneInput, input)) return pending;
          throw new Error("Unexpected proof input");
        },
      });
      const rpc = createTanstackQueryUtils(client, {
        prefix: "search-proof",
        scoped: defaults === "utility" ? { search: { queryOptions: { placeholderData: keepPreviousData } } } : {},
      });
      const cache = new QueryClient({
        defaultOptions: {
          queries: defaults === "global" ? { retry: false, placeholderData: keepPreviousData } : { retry: false },
        },
      });
      if (defaults === "key") cache.setQueryDefaults(["search-proof"], { placeholderData: keepPreviousData });
      const title = rpc.search.queryOptions({ input: { columns: { title: true } }, staleTime: Infinity });
      const done = rpc.search.queryOptions({ input: { columns: { done: true } } });
      const observer = new QueryObserver(cache, title);
      const stop = observer.subscribe(() => {});
      try {
        await cache.query(title);
        expect(observer.getCurrentResult().data).toEqual({ rows: [{ title: "previous" }], nextCursor: null });
        expect(done.queryKey).not.toEqual(title.queryKey);
        observer.setOptions(done);
        const current = observer.getCurrentResult();
        expect(current.fetchStatus).toBe("fetching");
        expect(current.isPlaceholderData).toBe(true);
        expect(current.data).toEqual({ rows: [{ title: "previous" }], nextCursor: null });
        expect(Object.hasOwn(current.data?.rows[0] ?? {}, "done")).toBe(false);
        // A stable default callback is reused while both new requests are pending.
        const next = rpc.search.queryOptions({ input: { columns: { done: true }, cursor: "another-page" } });
        observer.setOptions(next);
        expect(observer.getCurrentResult().isPlaceholderData).toBe(true);
        expect(observer.getCurrentResult().data).toEqual(current.data);
        expect(Object.hasOwn(observer.getCurrentResult().data?.rows[0] ?? {}, "done")).toBe(false);
        finish?.({ rows: [{ done: true }], nextCursor: null });
        await cache.query(next);
        expect(observer.getCurrentResult().data).toEqual({ rows: [{ done: true }], nextCursor: null });
        expect(observer.getCurrentResult().isPlaceholderData).toBe(false);
      } finally {
        finish?.({ rows: [{ done: true }], nextCursor: null });
        stop();
        observer.destroy();
        cache.clear();
      }
    });

    it(`accepts title-only initial data through ${defaults} defaults for a done-only request`, () => {
      const client = createORPCClient<SearchClient>({
        call: async () => ({ rows: [{ done: true }], nextCursor: null }),
      });
      const initialData: TitlePage = { rows: [{ title: "initial" }], nextCursor: null };
      const rpc = createTanstackQueryUtils(client, {
        prefix: "search-proof",
        scoped: defaults === "utility" ? { search: { queryOptions: { initialData } } } : {},
      });
      const cache = new QueryClient({
        defaultOptions: { queries: defaults === "global" ? { initialData } : {} },
      });
      if (defaults === "key") cache.setQueryDefaults(["search-proof"], { initialData });
      const options = rpc.search.queryOptions({ input: { columns: { done: true } } });
      const observer = new QueryObserver(cache, options);
      try {
        expect(observer.getCurrentResult().data).toEqual(initialData);
        expect(observer.getCurrentResult().isPlaceholderData).toBe(false);
        expect(Object.hasOwn(observer.getCurrentResult().data?.rows[0] ?? {}, "done")).toBe(false);
      } finally {
        observer.destroy();
        cache.clear();
      }
    });
  }
});
