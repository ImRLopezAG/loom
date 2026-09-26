import { expect, test, vi } from "vite-plus/test";
import { renderToString } from "react-dom/server";
import { createLoomNeonReact } from "loom/react/neon";

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
