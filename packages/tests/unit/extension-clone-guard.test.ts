import { expect, test } from "vite-plus/test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  recordCloneGuard,
  withTargetCloneGuard,
} from "../../../apps/loom/src/tooling/deploy/neon/extension-quarantine";
import { provisionProjectBranch } from "../../../apps/loom/src/tooling/deploy/neon/provision-project";

const provenance = {
  createdAt: "2026-10-02T00:00:00Z",
  projectCreatedAt: "2026-10-01T00:00:00Z",
  resetAt: null,
  restoreId: null,
  initSource: "parent-data",
};
const target = { projectId: "project", branchId: "clone" };

async function fixture(operation: (root: string) => Promise<void>) {
  const root = await mkdtemp(join(tmpdir(), "loom-clone-proof-"));
  try {
    await mkdir(join(root, ".loom/provision", "a".repeat(64)), { recursive: true });
    await operation(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function provider(parentId = "parent") {
  return {
    async listBranches() {
      return [{ id: "clone", name: "clone", isDefault: false, protected: false, parentId, provenance }];
    },
  };
}

test("an external clone is refused before its operation even when its parent is now idle", async () => {
  await fixture(async (root) => {
    let connections = 0;
    await expect(withTargetCloneGuard(provider(), target, async () => connections++, root)).rejects.toThrow(
      "Clone creation safety is unproven",
    );
    expect(connections).toBe(0);
  });
});

test("an owned clone retains creation proof without inspecting its parent's current schedules", async () => {
  await fixture(async (root) => {
    const api = provider();
    const provisionedTarget = { ...target, endpointId: "endpoint", branchName: "clone" };
    await recordCloneGuard(root, "a".repeat(64), api, provisionedTarget, "parent");
    expect(await withTargetCloneGuard(api, target, async () => "connected", root)).toBe("connected");
    await expect(withTargetCloneGuard(api, { ...target, projectId: "other" }, async () => {}, root)).rejects.toThrow(
      "Clone creation safety is unproven",
    );
    await expect(withTargetCloneGuard(provider("other"), target, async () => {}, root)).rejects.toThrow(
      "Clone creation safety is unproven",
    );
  });
});

test("a reset or restore invalidates the owned creation proof", async () => {
  await fixture(async (root) => {
    const api = provider();
    await recordCloneGuard(root, "a".repeat(64), api, target, "parent");
    for (const change of [{ resetAt: "2026-10-03T00:00:00Z" }, { restoreId: "snapshot" }]) {
      const changed = {
        async listBranches() {
          return (await api.listBranches()).map((branch) => ({ ...branch, provenance: { ...provenance, ...change } }));
        },
      };
      await expect(withTargetCloneGuard(changed, target, async () => {}, root)).rejects.toThrow(
        "Clone creation safety is unproven",
      );
      await expect(recordCloneGuard(root, "a".repeat(64), changed, target, "parent")).rejects.toThrow(
        "reset or restored",
      );
    }
  });
});

test("schema-only copies without parent IDs require proof and original project roots remain usable", async () => {
  await fixture(async (root) => {
    const api = {
      async listBranches() {
        return [
          {
            id: "clone",
            name: "clone",
            isDefault: false,
            protected: false,
            provenance: { ...provenance, initSource: "parent-schema" },
          },
        ];
      },
    };
    await expect(withTargetCloneGuard(api, target, async () => {}, root)).rejects.toThrow(
      "Clone creation safety is unproven",
    );
    await recordCloneGuard(root, "a".repeat(64), api, target, "parent");
    expect(await withTargetCloneGuard(api, target, async () => "connected", root)).toBe("connected");
    const primary = {
      async listBranches() {
        return [
          {
            id: "root",
            name: "main",
            isDefault: true,
            protected: false,
            provenance: { ...provenance, createdAt: provenance.projectCreatedAt },
          },
        ];
      },
    };
    expect(await withTargetCloneGuard(primary, { ...target, branchId: "root" }, async () => "root", root)).toBe("root");
  });
});

test("a linked project without loom.config.ts uses guarded provisioning for parent-data copies", async () => {
  await fixture(async (root) => {
    await writeFile(
      join(root, ".loom/project.json"),
      JSON.stringify({
        format: 1,
        projectId: "project",
        branchId: "parent",
        branchName: "main",
        protected: false,
        isDefault: true,
        databaseName: "neondb",
        migrationRole: "owner",
        public: {},
      }),
    );
    await writeFile(
      join(root, "branch.json"),
      JSON.stringify({
        format: 1,
        key: "a".repeat(64),
        projectId: "project",
        parentBranchId: "parent",
        branchName: "preview",
        environment: "preview",
        initSource: "parent-data",
      }),
    );
    let creates = 0;
    const api = {
      async getProject() {
        return { id: "project", name: "project", regionId: "test", pgVersion: 18 };
      },
      async listBranches() {
        return [{ id: "parent", name: "main", isDefault: true, protected: false }];
      },
      async listEndpoints() {
        return [];
      },
      async listBranchDatabases() {
        return [{ name: "neondb", ownerName: "owner", branchId: "parent" }];
      },
      async getConnectionUri() {
        throw new Error("Unexpected source connection");
      },
      async createBranch() {
        creates++;
        return { branch: { id: "clone" } };
      },
    };
    await expect(provisionProjectBranch(root, "branch.json", api)).rejects.toThrow(
      "Schema source branch or endpoint is ambiguous",
    );
    expect(creates).toBe(0);
  });
});
