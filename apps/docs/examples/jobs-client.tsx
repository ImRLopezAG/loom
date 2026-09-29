import { useMutation } from "@tanstack/react-query";
import type { createClient } from "./loom/_generated/api";

/** Pass the connection already owned by your application provider. */
export function ScheduleTask({ connection }: { connection: ReturnType<typeof createClient> }) {
  const schedule = useMutation(connection.rpc.jobs.createTaskLater.mutationOptions());
  return (
    <div>
      <button disabled={schedule.isPending} onClick={() => schedule.mutate({ title: "Review the proposal" })}>
        Create a task in ten seconds
      </button>
      {schedule.data && <p>Queued job: {schedule.data.jobId}</p>}
      {schedule.error && <p role="alert">Scheduling failed: {schedule.error.message}</p>}
    </div>
  );
}
