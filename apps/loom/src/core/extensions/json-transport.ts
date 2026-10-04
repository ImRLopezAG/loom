import { AsyncLocalStorage } from "node:async_hooks";

const mappedQuery = new AsyncLocalStorage<boolean>();
// oxlint-disable-next-line anti-slop/no-unknown-returns -- Drizzle mapper output is generic; this private identity registry never invokes or exposes a mapper.
type JsonTransportMapper = (...values: never[]) => unknown;
const mappedRows = new WeakSet<JsonTransportMapper>();
export const extensionTextProjection = "loom:extension:text";
class DriverJsonText {
  constructor(readonly text: string) {}
}

/** Only mapper-owned queries may carry private driver values. */
export function withMappedJsonTransport<Result>(enabled: boolean, work: () => Result): Result {
  return mappedQuery.run(enabled, work);
}
export function usesMappedJsonTransport(): boolean {
  return mappedQuery.getStore() === true;
}
/** Recognize only Kello's generators; caller-supplied mappers retain native driver values. */
export function markJsonTransportMapper<Mapper extends JsonTransportMapper>(mapper: Mapper): Mapper {
  mappedRows.add(mapper);
  return mapper;
}
export function isJsonTransportMapper(mapper: JsonTransportMapper | undefined): boolean {
  return mapper !== undefined && mappedRows.has(mapper);
}
export function preserveDriverJsonText(text: string): object {
  return Object.freeze(new DriverJsonText(text));
}
// oxlint-disable-next-line anti-slop/no-unknown-parameters, anti-slop/no-unknown-returns -- Mapper inputs are untrusted driver values; only private envelopes are decoded here.
export function unwrapDriverJson(value: unknown, exactText: boolean): unknown {
  if (!(value instanceof DriverJsonText)) return value;
  return exactText ? value.text : JSON.parse(value.text);
}
