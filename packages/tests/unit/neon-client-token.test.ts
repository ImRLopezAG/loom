import { expect, test, vi } from "vite-plus/test";
import { createAuthClient } from "@neondatabase/auth/next";
import { neonClientToken } from "../../../apps/loom/src/core/client/neon-token";

test("proxy credentials use the signed token endpoint and reject a different provider session", async () => {
  let tokenRequests = 0;
  let unavailable = false;
  let malformed = false;
  const now = new Date().toISOString();
  const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input instanceof Request ? input.url : input);
    if (new URL(url, "http://localhost").pathname.endsWith("/token")) {
      tokenRequests++;
      return Response.json(malformed ? { token: 42 } : { token: "signed-backend-jwt" }, {
        status: unavailable ? 503 : 200,
      });
    }
    return Response.json({
      session: {
        id: "session",
        userId: "user",
        token: "opaque-cookie",
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
        createdAt: now,
        updatedAt: now,
      },
      user: {
        id: "user",
        name: "Example",
        email: "user@example.test",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    });
  });
  try {
    const auth = createAuthClient();
    expect(await neonClientToken(auth, "user", "session", true)).toBe("signed-backend-jwt");
    expect(await neonClientToken(auth, "other-user", "session", true)).toBeNull();
    expect(await neonClientToken(auth, "user", "other-session", true)).toBeNull();
    expect(tokenRequests).toBe(1);
    unavailable = true;
    await expect(neonClientToken(auth, "user", "session", true)).rejects.toThrow("Neon token refresh failed");
    unavailable = false;
    malformed = true;
    await expect(neonClientToken(auth, "user", "session", true)).rejects.toThrow("Neon token refresh failed");
  } finally {
    fetchSpy.mockRestore();
  }
});
