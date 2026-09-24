import { SignIn } from "./sign-in";
import type { Session } from "./sign-in";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { createRpcTransport } from "@loom/core/client";
import { QueryClientProvider, useMutation, useQuery } from "@tanstack/react-query";
import * as v from "valibot";
import type { Id } from "@loom/core/server";
import { createApi, version } from "../loom/_generated/api";
import "./style.css";

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

type Api = ReturnType<typeof createApi>["api"];

function Tasks({ projectId, name, api }: { projectId: Id<"projects">; name: string; api: Api }) {
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

function Workspace({ name, signOut, api }: { name: string; signOut: () => void; api: Api }) {
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
          <Tasks api={api} key={active._id} projectId={active._id} name={active.name} />
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
  const [session, setSession] = useState<ReturnType<typeof connectNeon> | null>(null);
  const [signOutError, setSignOutError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  if (!session) return <SignIn onSession={(value) => setSession(connectNeon(value))} />;
  return (
    <>
      {signOutError && <p role="alert">{signOutError}</p>}
      <QueryClientProvider client={session.queryClient}>
        <Workspace
          api={session.api}
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
  const transport = createRpcTransport({
    url: session.url,
    version,
    getToken: async () => (await session.getAuth())?.token ?? null,
  });
  const client = createApi({
    link: transport.link,
    deployment: session.url,
    version,
    identity: { issuer: session.issuer, subject: session.identityKey },
  });
  return {
    ...session,
    ...client,
    dispose() {
      client.dispose();
      transport.dispose();
    },
  };
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing application root");
createRoot(root).render(<App />);
