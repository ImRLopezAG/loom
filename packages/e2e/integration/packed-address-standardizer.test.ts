import { test } from "bun:test";

test("cold Node24 address_standardizer public frozen wave35 consumer: generation, RPC/Effect and unchanged artifact", async () => {
  await import("../scripts/run-address-standardizer-packed-node24");
}, 240000);
