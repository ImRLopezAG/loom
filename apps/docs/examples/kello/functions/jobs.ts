import { os } from "../_generated/rpc";
import tasks from "../internal/tasks";

export default os.jobs.router({
  createTaskLater: os.jobs.createTaskLater.handler(async ({ context, input, errors }) => {
    if (!context.identity) throw errors.UNAUTHORIZED();
    const jobId = await context.scheduler.runAfter(
      10_000,
      tasks.create,
      {
        title: input.title,
        ownerId: context.identity.subject,
        ownerIssuer: context.identity.issuer,
      },
      { maxAttempts: 3, retryDelaySeconds: 2 },
    );
    return { jobId };
  }),
});
