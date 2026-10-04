import { expectTypeOf, test } from "vite-plus/test";
import { createPostgisSfcgal_3_6_4 } from "../../../apps/loom/src/core/extensions/adapters/postgis-sfcgal";
import { geometryEwkt } from "../../../apps/loom/src/core/extensions/adapters/postgis-codecs";

declare const api: ReturnType<typeof createPostgisSfcgal_3_6_4<{ name: "postgis_sfcgal"; version: "3.6.4"; schema: "s"; apiSupport: { status: "verified"; digest: string } }>>;
const g = geometryEwkt("POINT Z (0 0 0)");
test("postgis_sfcgal exact arities and defaults", () => {
  expectTypeOf(api.cgAlphashape).toBeCallableWith(g);
  expectTypeOf(api.cgAlphashape).toBeCallableWith(g, 2, true);
  expectTypeOf(api.cgUnion).toBeCallableWith(g);
  expectTypeOf(api.cgUnion).toBeCallableWith(g, g);
  expectTypeOf(api.cg3dbuffer).toBeCallableWith(g, 1, 8, 0);
  // @ts-expect-error buffer_type has no default
  api.cg3dbuffer(g, 1, 8);
  // @ts-expect-error text is not a geometry
  api.cgVolume("POINT(0 0)");
  expectTypeOf(api.postgisSfcgalVersion).toBeCallableWith();
});
