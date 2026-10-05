import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { dictionaryReference, type DictionaryReference } from "../dictionary-reference";
import { dictIntDefaultOptions, encodeDictIntOptions, parseDictIntOptions } from "./dict_int-codecs";

export { dictionaryReference, type DictionaryReference } from "../dictionary-reference";
export {
  dictIntDefaultOptions,
  dictIntOptionsCodec,
  dictIntOptionsValidator,
  encodeDictIntOptions,
  parseDictIntOptions,
  type DictIntOptions,
  type DictIntResolvedOptions,
} from "./dict_int-codecs";

const digest = "1a745014cc5c4e94724c34d742b8fb154fe0852306dca4163cc307b8dca9e5da";
const initId = "routine:$extension:dict_int.dintdict_init(pg_catalog.internal)";
const lexizeId =
  "routine:$extension:dict_int.dintdict_lexize(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)";
const dictionaryId = 'text search dictionary:"$extension:dict_int".intdict';
const templateId = 'text search template:"$extension:dict_int".intdict_template';
type Descriptor = ExtensionDescriptor<"dict_int", { readonly version: "1.0"; readonly schema: string }>;

export interface DictIntTemplate {
  readonly schema: string;
  readonly name: "intdict_template";
  readonly member: typeof templateId;
  readonly init: typeof initId;
  readonly lexize: typeof lexizeId;
}

/** Dictionary identities and option types only. Init/lexize are template callbacks, not SQL helpers. */
export function createDictInt_1_0<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "dict_int" ||
    descriptor.version !== "1.0" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("dict_int 1.0 requires its exact verified contract");
  const dictionary: DictionaryReference = dictionaryReference({ schema: descriptor.schema, name: "intdict" });
  const template: DictIntTemplate = Object.freeze({
    schema: descriptor.schema,
    name: "intdict_template",
    member: templateId,
    init: initId,
    lexize: lexizeId,
  });
  return bindExtension(descriptor, {
    dictionary,
    intdict: dictionary,
    template,
    dictionaryMember: dictionaryId,
    options: Object.freeze({
      defaults: dictIntDefaultOptions,
      parse: parseDictIntOptions,
      encode: encodeDictIntOptions,
    }),
    sql: Object.freeze({
      functions: Object.freeze({}),
      operators: Object.freeze({}),
      overloads: Object.freeze({}),
    }),
  });
}
