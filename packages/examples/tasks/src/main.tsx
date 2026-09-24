import { useState } from "react";
import { createRoot } from "react-dom/client";
import { createClient, createLiveQueryClient } from "@loom/core/client";
import { createLoomQueryClient, LoomProvider, useMutation, useQuery } from "@loom/core/react";
import * as v from "valibot";
import type { Id } from "@loom/core/server";
import { api } from "../backend/_generated/api";
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

function AddForm({
  label,
  button,
  submit,
}: {
  label: string;
  button: string;
  submit: (value: string) => Promise<void>;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const value = new FormData(form).get("title");
        if (!v.is(v.string(), value) || !value.trim() || pending) return;
        setPending(true);
        setError("");
        try {
          await submit(value);
          form.reset();
        } catch {
          setError("Could not save. Check your connection and try again.");
        } finally {
          setPending(false);
        }
      }}
    >
      <label>
        {label}
        <input
          name="title"
          maxLength={200}
          required
          placeholder={label === "Task title" ? "What needs to get done?" : "Name your project"}
        />
      </label>
      <button disabled={pending} type="submit">
        {pending ? "Saving…" : button}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}

function Tasks({ projectId, name }: { projectId: Id<"projects">; name: string }) {
  const tasks = useQuery(api.tasks.list({ input: { projectId } }));
  const add = useMutation(api.tasks.create());
  const setDone = useMutation(api.tasks.setDone());
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  return (
    <section className="tasks" aria-label="Project tasks">
      <header>
        <h2>{name}</h2>
        <p>Keep the next step in sight.</p>
      </header>
      <AddForm
        label="Task title"
        button="Add task"
        submit={async (title) => {
          await add.mutateAsync({ projectId, title });
        }}
      />
      {error && <p role="alert">{error}</p>}
      {tasks.status === "success" ? (
        <>
          <p className="count">
            {tasks.data.filter((task) => task.done).length} of {tasks.data.length} completed
          </p>
          {tasks.data.length === 0 && <p className="empty">Add a task to start this project.</p>}
          <ul className="task-list">
            {tasks.data.map((task) => (
              <li key={task._id}>
                <label className={task.done ? "done" : ""}>
                  <input
                    type="checkbox"
                    checked={task.done}
                    disabled={pending}
                    onChange={async (event) => {
                      const done = event.currentTarget.checked;
                      setPending(true);
                      setError("");
                      try {
                        await setDone.mutateAsync({ id: task._id, done });
                      } catch {
                        setError("Could not update this task. Try again.");
                      } finally {
                        setPending(false);
                      }
                    }}
                  />
                  <span>{task.title}</span>
                </label>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p role="status">
          {tasks.status === "error" ? "Cannot load tasks. Sign in again to retry." : "Connecting to your tasks…"}
        </p>
      )}
    </section>
  );
}

function Workspace({ name, signOut }: { name: string; signOut: () => void }) {
  const projects = useQuery(api.projects.list({ input: {} }));
  const create = useMutation(api.projects.create());
  const [selected, setSelected] = useState<string | null>(null);
  const active =
    projects.status === "success"
      ? (projects.data.find((project) => project._id === selected) ?? projects.data[0])
      : undefined;
  return (
    <>
      <header className="topbar">
        <a href="/" aria-label="Loom tasks home">
          <span className="mark" aria-hidden="true">
            L
          </span>{" "}
          Loom tasks
        </a>
        <div>
          <span>{name}'s workspace</span>
          <button onClick={signOut}>Sign out</button>
        </div>
      </header>
      <main className="workspace">
        <aside aria-label="Projects">
          <h1>Projects</h1>
          {projects.status === "success" ? (
            <nav aria-label="Project selection">
              {projects.data.map((project) => (
                <button
                  key={project._id}
                  aria-current={active?._id === project._id ? "page" : undefined}
                  onClick={() => setSelected(project._id)}
                >
                  {project.name}
                </button>
              ))}
            </nav>
          ) : (
            <p role="status">
              {projects.status === "error" ? "Cannot load projects. Sign in again to retry." : "Connecting…"}
            </p>
          )}
          <AddForm
            label="Project name"
            button="Create project"
            submit={async (title) => {
              const project = await create.mutateAsync({ name: title });
              setSelected(project._id);
            }}
          />
        </aside>
        {active ? (
          <Tasks key={active._id} projectId={active._id} name={active.name} />
        ) : (
          <section className="welcome">
            {projects.status === "success" && (
              <>
                <h2>Create your first project</h2>
                <p>A place for the work you want to finish. Name a project, then add its next steps.</p>
              </>
            )}
          </section>
        )}
      </main>
    </>
  );
}

function App() {
  const [session, setSession] = useState<ReturnType<typeof connect> | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  async function signIn(subject: "alice" | "bob") {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subject }),
      });
      if (!response.ok) throw new Error("Session unavailable");
      setSession(connect(v.parse(sessionSchema, await response.json())));
    } catch {
      setError("Could not sign in. Check that the local server is running.");
    } finally {
      setPending(false);
    }
  }
  if (!session)
    return (
      <main className="sign-in">
        <span className="mark" aria-hidden="true">
          L
        </span>
        <h1>
          A little less
          <br />
          left to do.
        </h1>
        <p>
          Choose a local workspace to try Loom tasks. Open another window as the same person to see changes appear live.
        </p>
        <div className="choices">
          {(["alice", "bob"] as const).map((subject) => (
            <button
              key={subject}
              disabled={pending}
              onClick={() => {
                void signIn(subject);
              }}
            >
              Continue as {subject === "alice" ? "Alice" : "Bob"}
            </button>
          ))}
        </div>
        {error && <p role="alert">{error}</p>}
        <small>Local demo. Each person has a separate workspace. Data is removed when the server stops.</small>
      </main>
    );
  return (
    <LoomProvider client={session.client} live={session.live} queryClient={session.queryClient}>
      <Workspace
        name={session.name}
        signOut={() => {
          session.live.stop();
          setSession(null);
        }}
      />
    </LoomProvider>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing application root");
createRoot(root).render(<App />);
