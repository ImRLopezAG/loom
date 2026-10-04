import assert from "node:assert/strict";
import { test } from "bun:test";
import { runPgtapConsumer } from "../scripts/run-pgtap-consumer";

test("parent-built frozen pgTAP consumer: genuine first-load/disk generation, Node24 native RPC/Effect bundle", async () => {
  const root = process.env.PGTAP_CONSUMER_ROOT;
  const tarball = process.env.PGTAP_CONSUMER_TARBALL;
  const output = process.env.PGTAP_CONSUMER_RECEIPT;
  assert(
    root && tarball && output,
    "Parent must authorize and supply the integrated tarball and frozen consumer; absence is a pending gate, never a skip/pass",
  );
  await runPgtapConsumer(root, tarball, output);
}, 600_000);
