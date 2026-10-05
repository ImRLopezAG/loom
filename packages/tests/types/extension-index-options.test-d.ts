import type { ExtensionIndexContract } from "../../../apps/loom/src/core/extensions/fields";
const options: NonNullable<ExtensionIndexContract["options"]> = { siglen: 32 };
// @ts-expect-error Class options use numeric literals; SQL text is not a public option.
const stringValue: NonNullable<ExtensionIndexContract["options"]> = { siglen: "32); drop table documents" };
// @ts-expect-error Class options remain immutable.
options.siglen = 64;
void [options, stringValue];
