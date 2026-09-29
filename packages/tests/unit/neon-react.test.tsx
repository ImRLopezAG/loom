import { expect, test, vi } from "vite-plus/test";
import { renderToString } from "react-dom/server";
import { createLoomNeonReact } from "../../../apps/loom/src/core/react/neon";

test("Neon bindings expose official SDK methods and render without opening authenticated connections", () => {
  const createClient = vi.fn(() => {
    throw new Error("Unexpected authenticated connection");
  });
  const fetchSpy = vi.spyOn(globalThis, "fetch");
  try {
    const { auth, LoomProvider } = createLoomNeonReact(createClient, {
      authUrl: "https://auth.example.test/neondb/auth",
    });
    expect(auth.signIn.email).toBeInstanceOf(Function);
    expect(auth.signOut).toBeInstanceOf(Function);
    expect(
      renderToString(
        <LoomProvider url="https://functions.example.test" fallback={<p>Sign in</p>}>
          <p>Private</p>
        </LoomProvider>,
      ),
    ).toBe("");
    expect(createClient).not.toHaveBeenCalled();
    expect(fetchSpy).not.toHaveBeenCalled();
  } finally {
    fetchSpy.mockRestore();
  }
});

test("Neon binding refuses credential-bearing or insecure provider URLs", () => {
  for (const authUrl of [
    "http://example.test",
    "https://user:secret@example.test",
    "https://example.test?token=secret",
  ])
    expect(() =>
      createLoomNeonReact(
        () => {
          throw new Error("unused");
        },
        { authUrl },
      ),
    ).toThrow("HTTPS service URL");
});

test("Loom-hosted auth sends session requests to the service with credentials", async () => {
  const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(null));
  try {
    const { auth } = createLoomNeonReact(
      () => {
        throw new Error("unused");
      },
      { serviceUrl: "https://loom.example.test" },
    );
    await auth.getSession();
    const [request, options] = fetchSpy.mock.calls[0]!;
    expect(request).toEqual(new URL("https://loom.example.test/api/auth/get-session"));
    expect(options?.credentials).toBe("include");
  } finally {
    fetchSpy.mockRestore();
  }
});
