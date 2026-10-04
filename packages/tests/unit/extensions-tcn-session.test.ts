import { EventEmitter } from "node:events";
import { beforeEach, expect, vi } from "vite-plus/test";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { tcnSessionUnitCases } from "../../e2e/fixtures/tcn-proof-cases";
import {
  decodeTcnPayload,
  TcnNotificationError,
  withTcnNotifications,
  type TcnNotificationSession,
} from "../../../apps/loom/src/tooling/extensions/tcn";

const fixture = vi.hoisted(() => ({ run: vi.fn() }));
vi.mock("../../../apps/loom/src/tooling/migrations/connection", () => ({ withMigrationConnection: fixture.run }));
let client: EventEmitter & { query: ReturnType<typeof vi.fn> };
let close: ReturnType<typeof vi.fn<() => Promise<void>>>;
beforeEach(() => {
  client = Object.assign(new EventEmitter(), { query: vi.fn(async () => ({ command: "LISTEN", rows: [] })) });
  close = vi.fn(async () => undefined);
  fixture.run.mockImplementation(
    async <Result>(_url: string, operation: (connection: typeof client) => Promise<Result>) => {
      try {
        return await operation(client);
      } finally {
        await close();
      }
    },
  );
});

extensionProofUnitTest(tcnSessionUnitCases[0]!, () => {
  expect(decodeTcnPayload(`"Ta""ble,λ",U,"Ke""y,1"='O''Reilly,\\λ',"id"='9007199254740993'`)).toEqual({
    table: 'Ta"ble,λ',
    operation: "update",
    keys: [
      { column: 'Ke"y,1', value: "O'Reilly,\\λ" },
      { column: "id", value: "9007199254740993" },
    ],
  });
  for (const payload of ["", `"t",I`, `"t",X,"k"='1'`, `"t",I,"k"='unterminated`, `"t",I,"k"='1'junk`])
    expect(() => decodeTcnPayload(payload)).toThrow();
});

extensionProofUnitTest(tcnSessionUnitCases[1]!, async () => {
  let escaped: TcnNotificationSession | undefined;
  let detached: Promise<unknown> | undefined;
  const result = await withTcnNotifications("postgres://operator/db", { channel: 'Chan"ge' }, async (session) => {
    escaped = session;
    expect(client.query).toHaveBeenCalledWith('LISTEN "Chan""ge"');
    expect(session.automaticLive).toBe(false);
    const next = session.next();
    client.emit("notification", { channel: "other", processId: 1, payload: `"p",I,"id"='1'` });
    client.emit("notification", { channel: 'Chan"ge', processId: 7, payload: `"p",I,"id"='2'` });
    const notification = await next;
    expect(notification).toMatchObject({
      channel: 'Chan"ge',
      processId: 7,
      operation: "insert",
      keys: [{ column: "id", value: "2" }],
    });
    detached = session.next();
    return notification.table;
  });
  expect(result).toEqual({ completion: "closed", value: "p" });
  expect(client.query).toHaveBeenLastCalledWith('UNLISTEN "Chan""ge"');
  await expect(detached).rejects.toThrow("inactive");
  await expect(escaped!.next()).rejects.toThrow("inactive");
  expect(client.listenerCount("notification")).toBe(0);
  expect(client.listenerCount("error")).toBe(0);
  expect(close).toHaveBeenCalledTimes(1);
});

extensionProofUnitTest(tcnSessionUnitCases[2]!, async () => {
  const controller = new AbortController();
  const cause = new Error("cancel notification wait");
  const result = withTcnNotifications("postgres://operator/db", { signal: controller.signal }, async (session) => {
    const notification = session.next();
    controller.abort(cause);
    return await notification;
  });
  const error = await result.catch((cause) => cause);
  expect(error).toBeInstanceOf(TcnNotificationError);
  expect(error.cause).toBe(cause);
  expect(error.cleanupFailures).toEqual([]);
  expect(client.query).toHaveBeenLastCalledWith('UNLISTEN "tcn"');
  expect(close).toHaveBeenCalledTimes(1);
});

extensionProofUnitTest(tcnSessionUnitCases[3]!, async () => {
  const unlisten = new Error("UNLISTEN failed");
  const end = new Error("close failed");
  client.query.mockImplementation(async (sql: string) => {
    if (sql.startsWith("UNLISTEN")) throw unlisten;
    return { rows: [] };
  });
  close.mockRejectedValue(end);
  const error = await withTcnNotifications("postgres://operator/db", {}, async () => {
    throw undefined;
  }).catch((cause) => cause);
  expect(error).toBeInstanceOf(TcnNotificationError);
  expect(error.cause).toBeUndefined();
  expect(error.cleanupFailures.map((entry: { cause: unknown }) => entry.cause)).toEqual([unlisten, end]);
  expect(close).toHaveBeenCalledTimes(1);
});

extensionProofUnitTest(tcnSessionUnitCases[4]!, async () => {
  const disconnected = new Error("disconnected");
  const result = await withTcnNotifications("postgres://operator/db", {}, async (session) => {
    const next = session.next();
    client.emit("error", disconnected);
    await next.catch(() => undefined);
    return "caught";
  }).catch((cause) => cause);
  expect(result.cause).toBe(disconnected);
  expect(client.query.mock.calls.map(([sql]) => sql)).toEqual(['LISTEN "tcn"']);
  expect(close).toHaveBeenCalledTimes(1);
  const malformed = await withTcnNotifications("postgres://operator/db", {}, async (session) => {
    const next = session.next();
    client.emit("notification", { channel: "tcn", processId: 1, payload: "bad" });
    return await next;
  }).catch((cause) => cause);
  expect(malformed).toBeInstanceOf(TcnNotificationError);
});

extensionProofUnitTest(tcnSessionUnitCases[5]!, async () => {
  await expect(
    withTcnNotifications("postgres://operator@ep-example-pooler.neon.tech/db", {}, async () => 1),
  ).rejects.toThrow("direct dedicated session");
  await expect(withTcnNotifications("postgres://operator/db", { channel: "x\0" }, async () => 1)).rejects.toThrow();
  expect(fixture.run).not.toHaveBeenCalled();
});
