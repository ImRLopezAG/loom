import { describe, expect, it, vi } from "vite-plus/test";
import { createRpcTransport } from "@loom/core/client";

describe("native browser transport lifetime", () => {
  it("does not send asynchronous cancellation frames to a closed socket", async () => {
    const sent = Promise.withResolvers<void>();
    const send = vi.fn(() => sent.resolve());
    class Socket extends EventTarget {
      static OPEN = 1;
      readyState = 1;
      send() {
        expect(this.readyState).toBe(1);
        send();
      }
      close() {
        this.readyState = 3;
        this.dispatchEvent(new CloseEvent("close", { code: 1000 }));
      }
    }
    vi.stubGlobal("WebSocket", Socket);
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ ticket: "a".repeat(43), expiresAt: Date.now() / 1000 + 30 }));
    const transport = createRpcTransport({
      url: "https://example.test",
      version: "a".repeat(64),
      getToken: async () => "token",
    });
    try {
      const pending = transport.link.call(["watch"], {}, { context: {} });
      const rejected = expect(pending).rejects.toThrow();
      await sent.promise;
      transport.dispose();
      await rejected;
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(send).toHaveBeenCalledTimes(1);
    } finally {
      transport.dispose();
      fetchSpy.mockRestore();
      vi.unstubAllGlobals();
    }
  });

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

it("cancels a stalled ticket body when its transport is disposed", async () => {
  const started = Promise.withResolvers<void>();
  let cancelled = false;
  const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
    started.resolve();
    return new Response(
      new ReadableStream({
        cancel() {
          cancelled = true;
        },
      }),
    );
  });
  const transport = createRpcTransport({
    url: "https://example.test",
    version: "a".repeat(64),
    getToken: async () => "token",
  });
  try {
    const pending = transport.link.call(["write"], {}, { context: {} });
    const rejected = expect(pending).rejects.toThrow();
    await started.promise;
    await new Promise((resolve) => setTimeout(resolve, 10));
    transport.dispose();
    await rejected;
    await vi.waitFor(() => expect(cancelled).toBe(true));
  } finally {
    transport.dispose();
    fetchSpy.mockRestore();
  }
});

it("rejects oversized, malformed and expired ticket bodies before opening a socket", async () => {
  const socket = vi.spyOn(globalThis, "WebSocket");
  try {
    for (const value of [
      "x".repeat(1025),
      JSON.stringify({ ticket: "secret", expiresAt: Date.now() / 1000 + 30 }),
      JSON.stringify({ ticket: "a".repeat(43), expiresAt: 1 }),
      JSON.stringify({ ticket: "a".repeat(43), expiresAt: "future" }),
    ]) {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockImplementation(async () => new Response(value, { headers: { "content-length": "1" } }));
      const transport = createRpcTransport({
        url: "https://example.test",
        version: "a".repeat(64),
        getToken: async () => "token",
      });
      try {
        await expect(transport.link.call(["write"], {}, { context: {} })).rejects.toThrow();
        expect(socket).not.toHaveBeenCalled();
      } finally {
        transport.dispose();
        fetchSpy.mockRestore();
      }
    }
  } finally {
    socket.mockRestore();
  }
}, 15_000);
