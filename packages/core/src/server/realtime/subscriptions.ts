import type { InvocationIdentity } from "../auth/context";
import type { VerifiedSession } from "../auth/verify";
import type { EvaluationResponse, FunctionCall } from "../dispatch";
import { createRevisionCoordinator } from "./coordinator";
import type { RevisionCoordinatorOptions, SubscriptionCloseReason } from "./coordinator";
export type { SubscriptionCloseReason } from "./coordinator";
export interface SubscriptionUpdate {
  readonly sequence: number;
  readonly response: EvaluationResponse;
}
export interface SubscriptionSink {
  readonly publish: (update: SubscriptionUpdate) => boolean;
  readonly close: (reason: SubscriptionCloseReason) => void;
}
export interface SubscriptionPollerOptions extends RevisionCoordinatorOptions {
  readonly evaluate: (
    call: FunctionCall,
    identity: InvocationIdentity,
    signal: AbortSignal,
  ) => Promise<EvaluationResponse>;
}

/** Compatibility adapter while the legacy envelope is removed. */
export function createSubscriptionPoller(options: SubscriptionPollerOptions) {
  const coordinator = createRevisionCoordinator(options);
  return {
    poll: coordinator.poll,
    stop: () => coordinator.stop(),
    subscribe(call: FunctionCall, session: VerifiedSession, sink: SubscriptionSink) {
      if (call.kind !== "query") throw new Error("Only queries can be subscribed");
      const capturedCall = structuredClone(call);
      const capturedSession = structuredClone(session);
      let sequence = 0;
      const subscription = coordinator.subscribe(capturedSession, {
        evaluate: async (signal) => {
          const response = await options.evaluate(capturedCall, capturedSession.identity, signal);
          if (!response.ok) {
            sink.publish({ sequence: ++sequence, response });
            throw new Error("Query failed");
          }
          return { value: response, revisions: response.revisions };
        },
        publish: (response) => sink.publish({ sequence: ++sequence, response }),
        close: sink.close,
      });
      return {
        unsubscribe: () => {
          void subscription.unsubscribe();
        },
      };
    },
  };
}
