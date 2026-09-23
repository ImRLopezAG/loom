import assert from "node:assert/strict";
import { test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRealNeonApi } from "@neon/config-runtime/v1";
import { planNeonBranchProvision, provisionNeonBranch } from "@loom/tooling";

test("branch provisioning uses the pinned SDK HTTP adapter and resumes the acknowledged branch", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-neon-provision-http-"));
  const input = {
    key: "a".repeat(64),
    projectId: "project",
    parentBranchId: "br-parent",
    branchName: "preview/test",
    environment: "preview" as const,
  };
  const parent = { id: "br-parent", name: "production", protected: true, default: true };
  const branch = { id: "br-created", name: input.branchName, parent_id: parent.id, protected: false, default: false };
  let creates = 0;
  let endpointAvailable = false;
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      assert.equal(request.headers.get("authorization"), "Bearer fixture-api-key");
      const path = new URL(request.url).pathname;
      if (request.method === "GET" && path === "/projects/project")
        return Response.json({ project: { id: "project", name: "test", pg_version: 18, region_id: "aws-us-east-2" } });
      if (request.method === "GET" && path === "/projects/project/branches")
        return Response.json({ branches: creates ? [parent, branch] : [parent] });
      if (request.method === "GET" && path === "/projects/project/endpoints")
        return Response.json({
          endpoints: endpointAvailable
            ? [
                {
                  id: "ep-created",
                  branch_id: branch.id,
                  type: "read_write",
                  autoscaling_limit_min_cu: 0.25,
                  autoscaling_limit_max_cu: 1,
                  suspend_timeout_seconds: 300,
                },
              ]
            : [],
        });
      if (request.method === "POST" && path === "/projects/project/branches") {
        assert.equal(creates, 0);
        assert.deepEqual(await request.json(), {
          branch: { name: input.branchName, parent_id: parent.id, protected: false },
          endpoints: [{ type: "read_write" }],
        });
        creates++;
        return Response.json({ branch, endpoints: [] });
      }
      throw new Error("Unexpected provider request");
    },
  });
  const api = createRealNeonApi({ apiKey: "fixture-api-key", baseUrl: server.url.origin });
  try {
    assert.equal((await planNeonBranchProvision(input, api)).parentBranchId, parent.id);
    assert.equal(creates, 0);
    await assert.rejects(provisionNeonBranch(root, input, api), /endpoint/);
    assert.equal(creates, 1);
    endpointAvailable = true;
    const receipt = await provisionNeonBranch(root, input, api);
    assert.equal(receipt.branchId, branch.id);
    assert.equal(receipt.endpointId, "ep-created");
    assert.deepEqual(await provisionNeonBranch(root, input, api), receipt);
    assert.equal(creates, 1);
    branch.protected = true;
    await assert.rejects(provisionNeonBranch(root, input, api), /identity changed/);
    assert.equal(creates, 1);
    const saved = await readFile(join(root, ".loom/provision", input.key, "branch.json"), "utf8");
    assert.ok(!saved.includes("fixture-api-key"));
  } finally {
    await server.stop(true);
    await rm(root, { recursive: true, force: true });
  }
});
