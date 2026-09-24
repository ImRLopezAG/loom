import { OpenAPIGenerator, OpenAPIGeneratorError } from "@orpc/openapi";
import type { OpenAPIGeneratorOptions, OpenAPIGeneratorGenerateOptions, OpenAPIDocument } from "@orpc/openapi";
import { ValibotToJsonSchemaConverter } from "@orpc/valibot";
import { Schema } from "effect";
import type { AnyRouter } from "@orpc/server";
import * as v from "valibot";

type Converter = NonNullable<OpenAPIGeneratorOptions["converters"]>[number];

/** Precise OpenAPI export requires explicit output schemas. Native generation
 * supplies path-aware diagnostics; its permissive unknown-schema fallback is disabled. */
export function generateRpcOpenAPI(
  router: AnyRouter,
  options: OpenAPIGeneratorGenerateOptions<"3.2.0"> = {},
): Promise<OpenAPIDocument<"3.2.0">> {
  const converters: Converter[] = [
    new ValibotToJsonSchemaConverter({ errorMode: "throw" }),
    {
      condition: (schema) => Schema.isSchema(schema),
      convert(schema, direction) {
        if (!Schema.isSchema(schema)) throw new TypeError("Expected Effect Schema");
        // The upstream wrapper swallows conversion errors into {}. Invoke Effect's
        // public converter directly so unsupported schemas fail generation.
        const standard = Schema.toStandardJSONSchemaV1(schema)["~standard"];
        const result = standard.jsonSchema[direction]({ target: "draft-2020-12" });
        const validation = schema["~standard"].validate(undefined);
        const optional = !(validation instanceof Promise) && !validation.issues;
        return [result, optional];
      },
    },
  ];
  const strict: Converter = {
    condition: () => true,
    convert(schema, direction) {
      if (schema === undefined) return [{}, true];
      const converter = converters.find((candidate) => candidate.condition(schema, direction));
      if (!converter)
        throw new OpenAPIGeneratorError(`Unsupported ${direction} schema vendor: ${schema["~standard"].vendor}`);
      try {
        return converter.convert(schema, direction);
      } catch {
        throw new OpenAPIGeneratorError(
          `Unsupported ${direction} schema conversion; supply a representable public contract`,
        );
      }
    },
  };
  return new OpenAPIGenerator({ converters: [strict] }).generate(router, {
    ...options,
    filter(contract, path) {
      const include = v.is(v.function(), options.filter) ? options.filter(contract, path) : options.filter;
      if (include === false) return false;
      const outputs = contract["~orpc"].outputSchemas;
      if (!outputs || (Array.isArray(outputs) && outputs.length === 0)) {
        throw new OpenAPIGeneratorError(`Procedure at ${path.join(".") || "(root)"}: explicit output schema required`);
      }
      return true;
    },
  });
}
