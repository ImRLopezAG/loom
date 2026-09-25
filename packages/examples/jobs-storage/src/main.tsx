import { SignIn } from "./sign-in";
import type { Session } from "./sign-in";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { createStorageClient } from "@loom/core/client";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import * as v from "valibot";
import { createClient } from "../loom/_generated/api";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import "./style.css";

type Api = ReturnType<typeof connectNeon>["api"];
type Storage = ReturnType<typeof createStorageClient>;

function Processing({ intentId, api }: { intentId: string; api: Api }) {
  const query = useQuery(
    api.files.status.queryOptions({
      input: { intentId },
      refetchInterval: (query) => {
        const state = query.state.data?.state;
        return state && ["succeeded", "failed", "cancelled"].includes(state) ? false : 500;
      },
    }),
  );
  const status = query.data;
  const error = query.isError;
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

function UploadForm({ storage }: { storage: Storage }) {
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
          const intent = await storage.create({
            bucket,
            size: file.size,
            contentType: file.type || "application/octet-stream",
            sha256,
          });
          const signed = await storage.signUpload(intent.id);
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

function Download({ intentId, storage }: { intentId: string; storage: Storage }) {
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
            const signed = await storage.signDownload(intentId);
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

function Catalog({ name, signOut, api, storage }: { name: string; signOut: () => void; api: Api; storage: Storage }) {
  const files = useQuery(api.files.list.liveOptions({ input: {} }));
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
            <UploadForm storage={storage} />
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
                      <Processing api={api} intentId={file.intentId} />
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
                    <Download storage={storage} intentId={file.intentId} />
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
function App() {
  const [session, setSession] = useState<ReturnType<typeof connectNeon> | null>(null);
  const [signOutError, setSignOutError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  if (!session) return <SignIn onSession={(value) => setSession(connectNeon(value))} />;
  return (
    <>
      {signOutError && <p role="alert">{signOutError}</p>}
      <QueryClientProvider client={session.queryClient}>
        <Catalog
          api={session.api}
          storage={session.storage}
          name={session.name}
          signOut={async () => {
            if (signingOut) return;
            setSigningOut(true);
            setSignOutError("");
            try {
              await session.signOut();
              session.dispose();
              setSession(null);
            } catch {
              setSignOutError("Could not sign out. Try again.");
            } finally {
              setSigningOut(false);
            }
          }}
        />
      </QueryClientProvider>
    </>
  );
}
function connectNeon(session: Session) {
  const transport = createClient({
    url: session.url,
    getToken: async () => (await session.getAuth())?.token ?? null,
  });
  const queryClient = new QueryClient();
  const shutdown = new AbortController();
  const storage = createStorageClient({
    url: session.url,
    getAuth: session.getAuth,
    fetch: (url, init) =>
      fetch(url, { ...init, signal: init.signal ? AbortSignal.any([shutdown.signal, init.signal]) : shutdown.signal }),
  });
  return {
    ...session,
    api: createTanstackQueryUtils(transport.client),
    queryClient,
    storage,
    dispose() {
      shutdown.abort();
      queryClient.clear();
      transport.dispose();
    },
  };
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing application root");
createRoot(root).render(<App />);
