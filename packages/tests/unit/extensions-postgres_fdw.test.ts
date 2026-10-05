import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import {
  postgresFdwUnitProofCases,
  postgresFdwMemberProofs,
  postgresFdwDatabaseProofCases,
  postgresFdwDatabaseFixtureCount,
  postgresFdwDatabaseRoleCount,
} from "../../e2e/fixtures/postgres_fdw-proof-cases";
import { expect } from "vite-plus/test";
import { createPostgresFdw_1_2 } from "../../../apps/loom/src/core/extensions/adapters/postgres_fdw";
import { postgresFdwConnectionFields } from "../../../apps/loom/src/core/extensions/adapters/postgres_fdw-codecs";
import {
  postgresFdwDisconnectValidator,
  withPostgresFdw,
} from "../../../apps/loom/src/tooling/extensions/operations/postgres_fdw";
import { postgresFdwAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/postgres_fdw";
import { extensionExpressionContract } from "../../../apps/loom/src/core/extensions/sql";
import * as v from "valibot";
import source from "../../../apps/loom/src/tooling/extensions/manifests/postgres_fdw.json";

const descriptor = {
  name: "postgres_fdw",
  version: "1.2",
  schema: 'fdw"cache',
  apiSupport: { status: "verified", digest: source.digest },
} as const;

extensionProofUnitTest(postgresFdwUnitProofCases[0]!, () => {
  const binding = createPostgresFdw_1_2(descriptor);
  expect(Object.keys(binding.sql.functions)).toEqual(["postgres_fdw_get_connections"]);
  expect(binding.sql.functions).not.toHaveProperty("postgres_fdw_disconnect");
  expect(binding.sql.functions).not.toHaveProperty("postgres_fdw_disconnect_all");
  expect(binding.sql.functions).not.toHaveProperty("postgres_fdw_handler");
  expect(binding.sql.functions).not.toHaveProperty("postgres_fdw_validator");
  expect(binding.disconnect.authority).toBe("session");
  expect(binding.disconnectAll.authority).toBe("session");
  expect(binding.handler.authority).toBe("schema");
  expect(binding.validator.authority).toBe("schema");
  for (const member of [binding.foreignDataWrapper.member, binding.handler.member, binding.validator.member])
    expect(postgresFdwAnnotations.find((annotation) => annotation.id === member)?.disposition).toBe("schema");
  expect(extensionExpressionContract(binding.sql.functions.postgres_fdw_get_connections())?.observability).toBe(
    "session",
  );
  expect(() => createPostgresFdw_1_2({ ...descriptor, apiSupport: { status: "unverified" } })).toThrow(
    /exact verified contract/,
  );
});

extensionProofUnitTest(postgresFdwUnitProofCases[1]!, async () => {
  expect(postgresFdwAnnotations.map((annotation) => annotation.id).sort()).toEqual(
    source.contract.members.map((member) => member.id).sort(),
  );
  expect(postgresFdwMemberProofs.map((proof) => proof.id).sort()).toEqual(
    source.contract.members.map((member) => member.id).sort(),
  );
  for (const proof of postgresFdwMemberProofs) {
    expect(proof.cases.length).toBeGreaterThan(0);
    expect(proof.transfers).toEqual([]);
  }
  expect(
    [
      ...new Set(postgresFdwDatabaseProofCases.flatMap((definition) => definition.claims.map((claim) => claim.member))),
    ].sort(),
  ).toEqual(source.contract.members.map((member) => member.id).sort());
  expect(postgresFdwDatabaseProofCases.map((definition) => definition.id)).toEqual(["postgres_fdw.native"]);
  expect(postgresFdwDatabaseFixtureCount).toBe(2);
  expect(postgresFdwDatabaseRoleCount).toBe(0);
  await expect(
    withPostgresFdw(
      "postgresql://operator@127.0.0.1:1/fixture",
      { ...descriptor, apiSupport: { status: "unverified" } },
      async () => undefined,
    ),
  ).rejects.toThrow(/exact verified contract/);
});

extensionProofUnitTest(postgresFdwUnitProofCases[2]!, () => {
  const member = source.contract.members.find((entry) => entry.name === "postgres_fdw_get_connections")!;
  expect("arguments" in member).toBe(true);
  if (!("arguments" in member) || !member.arguments) throw new Error("get_connections must capture arguments");
  expect(Object.keys(postgresFdwConnectionFields)).toEqual(
    member.arguments.filter((argument) => argument.mode === "out").map((argument) => argument.name),
  );
  for (const argument of member.arguments.filter((argument) => argument.mode === "out")) {
    const codec = Object.entries(postgresFdwConnectionFields).find(([name]) => name === argument.name)![1];
    expect(codec.sqlType).toEqual({ schema: argument.type.namespace, name: argument.type.name });
  }
  expect(postgresFdwConnectionFields.closed.decode(null)).toBeNull();
  expect(postgresFdwConnectionFields.user_name.decode(null)).toBeNull();
  expect(postgresFdwConnectionFields.valid.decode("t")).toBe(true);
  expect(postgresFdwConnectionFields.used_in_xact.decode("f")).toBe(false);
  expect(v.parse(postgresFdwDisconnectValidator, { serverName: "loopback" })).toEqual({ serverName: "loopback" });
  for (const request of [{ serverName: "" }, { serverName: "x\0y" }, { serverName: 1 }, {}])
    expect(() => v.parse(postgresFdwDisconnectValidator, request)).toThrow();
});

extensionProofUnitTest(postgresFdwUnitProofCases[3]!, async () => {
  const controller = new AbortController();
  const reason = new Error("FDW cancelled before connection acquisition");
  controller.abort(reason);
  let admitted = false;
  await expect(
    withPostgresFdw(
      "postgresql://operator@127.0.0.1:1/fixture",
      descriptor,
      async () => {
        admitted = true;
      },
      controller.signal,
    ),
  ).rejects.toBe(reason);
  expect(admitted).toBe(false);
});
