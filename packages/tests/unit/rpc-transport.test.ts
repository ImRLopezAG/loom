import { describe, expect, it, vi } from "vite-plus/test";
import { createRpcTransport } from "@loom/core/client";

describe("native browser transport lifetime", () => {
  it("rejects credential-bearing URLs and stale version formats before connecting", () => {
    const getToken = async () => "token";
    for (const url of ["https://user:password@example.test", "https://example.test/?token=x", "ftp://example.test"]) {
      expect(() => createRpcTransport({ url, version: "a".repeat(64), getToken })).toThrow("Invalid RPC service URL");
    }
    expect(() => createRpcTransport({ url: "https://example.test", version: "old", getToken })).toThrow(
      "Invalid RPC version",
    );
  });

  it("surfaces a version refusal without retrying credentials or the procedure", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 409 }));
    const transport = createRpcTransport({
      url: "https://example.test",
      version: "a".repeat(64),
      getToken: async () => "token",
    });
    try {
      await expect(transport.link.call(["write"], {}, { context: {} })).rejects.toMatchObject({
        code: "RPC_VERSION_MISMATCH",
      });
      await expect(transport.link.call(["write"], {}, { context: {} })).rejects.toMatchObject({
        code: "RPC_VERSION_MISMATCH",
      });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    } finally {
      transport.dispose();
      fetchSpy.mockRestore();
    }
  });

  it("aborts a pending credential lookup and refuses calls after disposal", async () => {
    let resolveToken: (token: string) => void = () => {};
    let started: () => void = () => {};
    const ready = new Promise<void>((resolve) => {
      started = resolve;
    });
    const transport = createRpcTransport({
      url: "https://example.test",
      version: "a".repeat(64),
      getToken: () => {
        started();
        return new Promise<string>((resolve) => {
          resolveToken = resolve;
        });
      },
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    try {
      const pending = transport.link.call(["write"], {}, { context: {} });
      const rejected = expect(pending).rejects.toThrow();
      await ready;
      transport.dispose();
      resolveToken("secret");
      await rejected;
      await expect(transport.link.call(["write"], {}, { context: {} })).rejects.toThrow();
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      transport.dispose();
      fetchSpy.mockRestore();
    }
  });
});
