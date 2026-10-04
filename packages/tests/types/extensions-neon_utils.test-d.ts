import { expectTypeOf, test } from "vite-plus/test";
import type { SQL } from "drizzle-orm";
import { createNeonUtils_1_1 } from "../../../apps/loom/src/core/extensions/adapters/neon_utils";

const api = createNeonUtils_1_1({
  name: "neon_utils",
  version: "1.1",
  schema: "cpu_observation",
  apiSupport: { status: "verified", digest: "4ceac79f87c6c16fa8dea371b441d6a150f9d25db3244b9bac4cce0275f74cec" },
});
test("neon_utils literal descriptor and zero-argument number result", () => {
  expectTypeOf(api.name).toEqualTypeOf<"neon_utils">();
  expectTypeOf(api.version).toEqualTypeOf<"1.1">();
  expectTypeOf(api.schema).toEqualTypeOf<"cpu_observation">();
  expectTypeOf(api.numCpus()).toEqualTypeOf<SQL<number>>();
  expectTypeOf(api.sql.functions.num_cpus()).toEqualTypeOf<SQL<number>>();
  // @ts-expect-error Captured function accepts no arguments, including NULL.
  api.numCpus(null);
  // @ts-expect-error No text overload exists.
  api.sql.functions.num_cpus("cpu");
  // @ts-expect-error No extension-owned types are captured.
  void api.fields;
  // @ts-expect-error No administrator or session mutations are captured.
  void api.session;
  // @ts-expect-error Selected version is exactly 1.1.
  createNeonUtils_1_1({ ...api, version: "1.0" });
});
