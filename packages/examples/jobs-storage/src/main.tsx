import { SignIn } from "./sign-in";
import type { Session } from "./sign-in";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient, createLiveQueryClient } from "@loom/core/client";
import { createLoomQueryClient, LoomProvider, useLoomClient, useQuery } from "@loom/core/react";
import * as v from "valibot";
import { api } from "../loom/_generated/api";
import "./style.css";

const sessionSchema = v.strictObject({
  token: v.string(),
  identityKey: v.string(),
  url: v.string(),
  deployment: v.string(),
});
function connect(session: v.InferOutput<typeof sessionSchema>) {
  const client = createClient({
    url: session.url,
    getAuth: async () => ({ token: session.token, identityKey: session.identityKey }),
  });
  const live = createLiveQueryClient({ ...session, client });
  return {
    client,
    live,
    queryClient: createLoomQueryClient({ client, live }),
    name: session.identityKey === "alice" ? "Alice" : "Bob",
  };
}

function Processing({ intentId }: { intentId: string }) {
  const client = useLoomClient();
  const [status, setStatus] = useState<{ state: string; attempts: number } | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function poll() {
      let complete = false;
      try {
        const next = await client.call(api["files:status"], { intentId }, { signal: abort.signal });
        if (abort.signal.aborted) return;
        setStatus((current) =>
          current?.state === next?.state && current?.attempts === next?.attempts ? current : next,
        );
        setError(false);
        complete = next !== null && ["succeeded", "failed", "cancelled"].includes(next.state);
      } catch {
        if (!abort.signal.aborted) setError(true);
      } finally {
        if (!abort.signal.aborted && !complete)
          timer = setTimeout(() => {
            void poll();
          }, 500);
      }
    }
    void poll();
    return () => {
      abort.abort();
      if (timer) clearTimeout(timer);
    };
  }, [client, intentId]);
  let label = "Queued";
  if (status?.state === "succeeded") label = "Completed";
  else if (status?.state === "failed") label = `Failed after ${status.attempts} attempts`;
  else if (status?.state === "cancelled") label = "Cancelled";
  else if (status?.state === "running") label = "Processing";
  else if (status && status.attempts > 0) label = "Waiting to retry";
  return (
    <div className="processing" aria-live="polite">
      <strong data-state={status?.state}>{label}</strong>
      {status && status.attempts > 0 && (
        <span>
          {status.attempts} {status.attempts === 1 ? "attempt" : "attempts"}
        </span>
      )}
      {error && <small role="status">Status unavailable; reconnecting…</small>}
    </div>
  );
}

function UploadForm() {
  const client = useLoomClient();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const values = new FormData(form);
        const file = values.get("file");
        const bucket = v.parse(v.picklist(["uploads", "retry-demo", "failure-demo"]), values.get("bucket"));
        if (!(file instanceof File) || pending) return;
        if (file.size < 1 || file.size > 10 * 1024 * 1024) {
          setError("Choose a non-empty file up to 10 MiB.");
          return;
        }
        setPending(true);
        setError("");
        setMessage("");
        try {
          const bytes = await file.arrayBuffer();
          const hash = await crypto.subtle.digest("SHA-256", bytes);
          const sha256 = Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0")).join("");
          const intent = await client.storage.create({
            bucket,
            size: file.size,
            contentType: file.type || "application/octet-stream",
            sha256,
          });
          const signed = await client.storage.signUpload(intent.id);
          const response = await fetch(signed.url, { method: signed.method, headers: signed.headers, body: bytes });
          if (!response.ok) throw new Error("Upload failed");
          setMessage(`${file.name} uploaded. Waiting for verification and processing.`);
          form.reset();
        } catch {
          setError("Could not upload this file. Check your connection and try again.");
        } finally {
          setPending(false);
        }
      }}
    >
      <h2>Add a file</h2>
      <p>Files stay private to your workspace. We verify every byte before cataloging the upload.</p>
      <label>
        Choose a file
        <input name="file" type="file" required disabled={pending} />
      </label>
      <small>Up to 10 MiB per file. Verified uploads appear in your catalog after processing starts.</small>
      <label>
        Processing mode
        <select name="bucket" disabled={pending} defaultValue="uploads">
          <option value="uploads">Normal processing</option>
          <option value="retry-demo">Demo: retry once</option>
          <option value="failure-demo">Demo: fail three times</option>
        </select>
      </label>
      <p className="hint">
        The demo modes intentionally fail processing so you can see retries and exhausted attempts.
      </p>
      <button type="submit" className="primary" disabled={pending}>
        {pending ? "Uploading file…" : "Upload file"}
      </button>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
    </form>
  );
}

function Download({ intentId }: { intentId: string }) {
  const client = useLoomClient();
  const [error, setError] = useState(false);
  const [pending, setPending] = useState(false);
  return (
    <div>
      <button
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setError(false);
          try {
            const signed = await client.storage.signDownload(intentId);
            const response = await fetch(signed.url, { credentials: "omit", signal: AbortSignal.timeout(30000) });
            if (!response.ok) throw new Error("Download unavailable");
            const url = URL.createObjectURL(await response.blob());
            const link = document.createElement("a");
            try {
              link.href = url;
              link.download = "upload";
              document.body.append(link);
              link.click();
            } finally {
              link.remove();
              URL.revokeObjectURL(url);
            }
          } catch {
            setError(true);
          } finally {
            setPending(false);
          }
        }}
      >
        {pending ? "Preparing…" : "Download"}
      </button>
      {error && <p role="alert">Download unavailable. Try again.</p>}
    </div>
  );
}

function Catalog({ name, signOut }: { name: string; signOut: () => void }) {
  const files = useQuery(api.files.list({ input: {} }));
  return (
    <>
      <header className="topbar">
        <a href="/">Loom upload catalog</a>
        <div>
          <span>{name}'s workspace</span>
          <button onClick={signOut}>Sign out</button>
        </div>
      </header>
      <main>
        <header className="intro">
          <h1>From upload to verified record.</h1>
          <p>
            Follow each file through verification and durable processing. The catalog summarizes file metadata; it does
            not analyze the contents.
          </p>
        </header>
        <div className="workspace">
          <aside>
            <UploadForm />
          </aside>
          <section aria-label="Upload catalog">
            <h2>Your uploads</h2>
            {files.status === "success" ? (
              files.data.length === 0 ? (
                <div className="empty">
                  <h3>No uploads yet</h3>
                  <p>Choose a file to watch it move through the queue.</p>
                </div>
              ) : (
                files.data.map((file) => (
                  <article key={file._id} aria-label={file.bucket}>
                    <div className="file-heading">
                      <h3>{file.contentType}</h3>
                      <Processing intentId={file.intentId} />
                    </div>
                    <p>
                      {file.size.toLocaleString()} bytes{" "}
                      <span className="mode">
                        {file.bucket === "uploads"
                          ? "Normal processing"
                          : file.bucket === "retry-demo"
                            ? "Retry demonstration"
                            : "Failure demonstration"}
                      </span>
                    </p>
                    <details>
                      <summary>Verified fingerprint</summary>
                      <code>{file.sha256}</code>
                    </details>
                    {file.summary && (
                      <p className="report">
                        Catalog record ready. File type, byte count and fingerprint have been recorded.
                      </p>
                    )}
                    <Download intentId={file.intentId} />
                  </article>
                ))
              )
            ) : (
              <p role="status">
                {files.status === "error"
                  ? "Cannot load uploads. Sign in again to retry."
                  : "Connecting to your uploads…"}
              </p>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
function AcceptanceApp() {
  const [session, setSession] = useState<ReturnType<typeof connect> | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  if (!session)
    return (
      <main className="sign-in">
        <h1>A record for every upload.</h1>
        <p>Try private uploads and durable processing in a local workspace.</p>
        <div className="choices">
          {(["alice", "bob"] as const).map((subject) => (
            <button
              key={subject}
              disabled={pending}
              onClick={async () => {
                setPending(true);
                setError(false);
                try {
                  const response = await fetch("/session", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ subject }),
                  });
                  if (!response.ok) throw new Error("Session unavailable");
                  setSession(connect(v.parse(sessionSchema, await response.json())));
                } catch {
                  setError(true);
                } finally {
                  setPending(false);
                }
              }}
            >
              Continue as {subject === "alice" ? "Alice" : "Bob"}
            </button>
          ))}
        </div>
        {error && <p role="alert">Could not sign in. Check that the local server is running.</p>}
        <small>Local demo. Alice and Bob have separate workspaces. Stopping the server removes all data.</small>
      </main>
    );
  return (
    <LoomProvider client={session.client} live={session.live} queryClient={session.queryClient}>
      <Catalog
        name={session.name}
        signOut={() => {
          session.live.stop();
          setSession(null);
        }}
      />
    </LoomProvider>
  );
}
function App() {
  const [session, setSession] = useState<ReturnType<typeof connectNeon> | null>(null);
  const [signOutError, setSignOutError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  if (!session) return <SignIn onSession={(value) => setSession(connectNeon(value))} />;
  return (
    <>
      {signOutError && <p role="alert">{signOutError}</p>}
      <LoomProvider client={session.client} live={session.live} queryClient={session.queryClient}>
        <Catalog
          name={session.name}
          signOut={async () => {
            if (signingOut) return;
            setSigningOut(true);
            setSignOutError("");
            try {
              await session.signOut();
              session.live.stop();
              session.queryClient.clear();
              setSession(null);
            } catch {
              setSignOutError("Could not sign out. Try again.");
            } finally {
              setSigningOut(false);
            }
          }}
        />
      </LoomProvider>
    </>
  );
}
function connectNeon(session: Session) {
  const client = createClient({ url: session.url, getAuth: session.getAuth });
  const live = createLiveQueryClient({
    url: session.url,
    deployment: session.deployment,
    identityKey: session.identityKey,
    client,
  });
  return { ...session, client, live, queryClient: createLoomQueryClient({ client, live }) };
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing application root");
createRoot(root).render(import.meta.env.VITE_LOOM_ACCEPTANCE === "1" ? <AcceptanceApp /> : <App />);
