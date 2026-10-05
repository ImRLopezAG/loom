import { arrayCodec, type ExtensionCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { int4Codec } from "../../../apps/loom/src/core/extensions/native-codecs";
import {
  pgtapParameter,
  pgtapRoutineSpecs,
  type PgtapMember,
} from "../../../apps/loom/src/core/extensions/adapters/pgtap";
import { pgtapCodecs } from "../../../apps/loom/src/core/extensions/adapters/pgtap-codecs";
import native from "./pgtap-native-characterization.json";

export const pgtapNativeCases = native.observations;
const patterns = /^(?:alike|ialike|unalike|unialike|matches|imatches|doesnt_match|doesnt_imatch)$/;
/** Convert independent native fixture text using each public input codec; no asserted result generic. */
export function pgtapCaseArguments(id: PgtapMember, raw: readonly unknown[]) {
  const spec = pgtapRoutineSpecs[id];
  const codecs = pgtapCodecs("tap");
  return spec.args.map((arg, index) => {
    const type = arg.replace(/\?$/, "");
    const value = raw[index];
    if (type === "anyelement" || type === "anyarray") {
      const codec =
        type === "anyarray"
          ? arrayCodec(int4Codec)
          : spec.name === "row_eq"
            ? codecs._time_trial_type
            : patterns.test(spec.name)
              ? codecs.text
              : int4Codec;
      // SAFETY: the exact native fixture's concrete cast chooses this input codec; decode validates its fixture text.
      return pgtapParameter(codec as ExtensionCodec<unknown, unknown>, codec.decode(value));
    }
    // SAFETY: native fixtures establish this argument concrete codec name.
    const codec = codecs[type as keyof typeof codecs];
    if (!codec) throw new Error(`Missing pgTAP fixture codec ${type}`);
    return codec.decode(value);
  });
}
