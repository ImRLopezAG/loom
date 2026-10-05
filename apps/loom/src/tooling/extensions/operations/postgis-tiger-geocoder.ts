import * as v from "valibot";
import { createPostgisTigerGeocoder_3_6_4 } from "../../../core/extensions/adapters/postgis-tiger-geocoder";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { ExtensionOperationError, withExtensionOperation } from "../operations";

type Descriptor = ExtensionDescriptor<"postgis_tiger_geocoder", { readonly version: "3.6.4"; readonly schema: string }>;

export class PostgisTigerGeocoderOperationError extends ExtensionOperationError {
  constructor(failure: ExtensionOperationError) {
    super(failure.cause, failure.completion, failure.cleanupFailures);
    this.name = "PostgisTigerGeocoderOperationError";
  }
}

export interface PostgisTigerGeocoderOperatorSession {
  readonly generateNationScript: (os: string) => Promise<readonly string[]>;
  readonly generateScript: (states: readonly string[], os: string) => Promise<readonly string[]>;
  readonly generateCensusScript: (states: readonly string[], os: string) => Promise<readonly string[]>;
  readonly macroReplace: (input: string, keys: readonly string[], values: readonly string[]) => Promise<string>;
  readonly missingIndexesScript: () => Promise<string | null>;
  readonly dropIndexesScript: (schema?: string) => Promise<string | null>;
  readonly setGeocodeSetting: (name: string, value: string) => Promise<string | null>;
  readonly installMissingIndexes: () => Promise<boolean>;
}

function assertNoFetch(script: string): string {
  if (/\b(wget|curl)\b/i.test(script) && /executed|downloaded/i.test(script))
    throw new Error("postgis_tiger_geocoder loader scripts must not be executed");
  return script;
}

/** Operator plans return native script text. They never fetch census.gov or other geodata. */
export async function withPostgisTigerGeocoderOperations<Result>(
  directOperatorUrl: string,
  descriptor: Descriptor,
  postgis: { readonly schema: string },
  operation: (session: PostgisTigerGeocoderOperatorSession) => Promise<Result>,
  signal?: AbortSignal,
) {
  createPostgisTigerGeocoder_3_6_4(descriptor, postgis);
  try {
    return await withExtensionOperation(
      directOperatorUrl,
      (context) => context,
      async (context) => {
        const quote = (value: string) => '"' + value.replaceAll('"', '""') + '"';
        const schema = quote(descriptor.schema);
        const session: PostgisTigerGeocoderOperatorSession = {
          async generateNationScript(os) {
            const rows = await context.client.query<{ value: string }>(`SELECT ${schema}.loader_generate_nation_script($1) AS value`, [os]);
            return Object.freeze(rows.rows.map((row) => assertNoFetch(v.parse(v.string(), row.value))));
          },
          async generateScript(states, os) {
            const rows = await context.client.query<{ value: string }>(`SELECT ${schema}.loader_generate_script($1::text[], $2) AS value`, [states, os]);
            return Object.freeze(rows.rows.map((row) => assertNoFetch(v.parse(v.string(), row.value))));
          },
          async generateCensusScript(states, os) {
            const rows = await context.client.query<{ value: string }>(`SELECT ${schema}.loader_generate_census_script($1::text[], $2) AS value`, [states, os]);
            return Object.freeze(rows.rows.map((row) => assertNoFetch(v.parse(v.string(), row.value))));
          },
          async macroReplace(input, keys, values) {
            const rows = await context.client.query<{ value: string }>(`SELECT ${schema}.loader_macro_replace($1, $2::text[], $3::text[]) AS value`, [input, keys, values]);
            return v.parse(v.string(), rows.rows[0]?.value);
          },
          async missingIndexesScript() {
            const rows = await context.client.query<{ value: string | null }>(`SELECT ${schema}.missing_indexes_generate_script() AS value`);
            const value = rows.rows[0]?.value;
            return value == null ? null : v.parse(v.string(), value);
          },
          async dropIndexesScript(targetSchema = "tiger_data") {
            const rows = await context.client.query<{ value: string | null }>(`SELECT ${schema}.drop_indexes_generate_script($1) AS value`, [targetSchema]);
            const value = rows.rows[0]?.value;
            return value == null ? null : v.parse(v.string(), value);
          },
          async setGeocodeSetting(name, value) {
            const rows = await context.client.query<{ value: string | null }>(`SELECT ${schema}.set_geocode_setting($1, $2) AS value`, [name, value]);
            const setting = rows.rows[0]?.value;
            return setting == null ? null : v.parse(v.string(), setting);
          },
          async installMissingIndexes() {
            const rows = await context.client.query<{ value: boolean }>(`SELECT ${schema}.install_missing_indexes() AS value`);
            return v.parse(v.boolean(), rows.rows[0]?.value);
          },
        };
        return operation(session);
      },
      signal,
    );
  } catch (cause) {
    if (cause instanceof ExtensionOperationError) throw new PostgisTigerGeocoderOperationError(cause);
    throw cause;
  }
}
