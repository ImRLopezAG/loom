import * as v from "valibot";
import { connectServer } from "./queries";
const tokenSchema = v.pipe(v.string(), v.minLength(1), v.maxLength(3800), v.regex(/^[A-Za-z0-9._-]+$/));
export function readToken(request: Request) {
  const value = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("loom_session="))
    ?.slice(13);
  const parsed = v.safeParse(tokenSchema, value);
  return parsed.success ? parsed.output : null;
}
// A digest binds a rendered page to its token without serializing the credential.
export async function sessionFingerprint(token: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
export function backendUrl() {
  return v.parse(v.pipe(v.string(), v.url()), process.env.LOOM_SERVICE_URL);
}
// Demonstration session bridge. An application's identity-provider callback can
// establish this cookie instead. Tokens are never placed in HTML or query data.
export async function session(request: Request) {
  const headers = { "cache-control": "no-store", vary: "Cookie" };
  if (request.method === "GET") {
    if (request.headers.get("x-loom-session") !== "1") return new Response(null, { status: 403, headers });
    const token = readToken(request);
    if (!token || request.headers.get("x-loom-session-id") !== (await sessionFingerprint(token)))
      return new Response(null, { status: 401, headers });
    return Response.json({ token }, { headers });
  }
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return new Response(null, { status: 403, headers });
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  if (request.method === "DELETE")
    return new Response(null, {
      status: 204,
      headers: { ...headers, "set-cookie": `loom_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}` },
    });
  if (request.method !== "POST") return new Response(null, { status: 405, headers });
  const reader = request.body?.getReader();
  if (!reader) return new Response("Invalid token", { status: 400, headers });
  let body = "";
  let bytesRead = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      // Accepted tokens are ASCII, so bytes and characters have the same bound.
      bytesRead += value.byteLength;
      if (bytesRead > 3800) {
        await reader.cancel();
        return new Response("Token too large", { status: 413, headers });
      }
      body += new TextDecoder().decode(value);
    }
  } finally {
    reader.releaseLock();
  }
  const input = v.safeParse(tokenSchema, body);
  if (!input.success) return new Response("Invalid token", { status: 400, headers });
  const connection = connectServer(backendUrl(), async () => input.output);
  try {
    await connection.client.examples.greeting({ name: "Session" }, { signal: AbortSignal.timeout(10_000) });
    return new Response(null, {
      status: 204,
      headers: {
        ...headers,
        "set-cookie": `loom_session=${input.output}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600${secure}`,
      },
    });
  } catch {
    return new Response("Sign-in failed", { status: 401, headers });
  } finally {
    connection.dispose();
  }
}
