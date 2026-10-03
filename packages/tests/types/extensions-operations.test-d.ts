import {
  withExtensionOperation,
  type ExtensionOperationContext,
} from "../../../apps/loom/src/tooling/extensions/operations";

const createSession = ({ run }: ExtensionOperationContext) =>
  Object.freeze({
    count: () => run(async () => 1),
  });
const result: Promise<{ readonly completion: "committed"; readonly value: number }> = withExtensionOperation(
  "postgresql://operator@localhost/fixture",
  createSession,
  async (session) => {
    const count: number = await session.count();
    // @ts-expect-error A callback receives only the closed family surface.
    void session.client;
    // @ts-expect-error No raw SQL runner enters the callback.
    void session.query("COMMIT");
    // @ts-expect-error The owner's work tracker is private to trusted construction.
    void session.run(async () => 1);
    // @ts-expect-error Family methods have their declared argument contract.
    void session.count("wrong");
    return count;
  },
);
void result;
