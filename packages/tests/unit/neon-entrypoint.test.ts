import { expect, test, vi } from "vite-plus/test";
import { createNeonEntrypoint } from "@loom/core/neon";

test("entrypoint joins startup and preserves the application's response", async () => {
  const response = new Response("ready");
  let starts = 0;
  const application = { fetch: async () => response, stop: async () => {} };
  const startup = Promise.withResolvers<typeof application>();
  const entry = createNeonEntrypoint(async () => {
    starts++;
    return startup.promise;
  });
  const first = entry.fetch(new Request("https://app.test"));
  const second = entry.fetch(new Request("https://app.test"));
  startup.resolve(application);
  expect(await first).toBe(response);
  expect(await second).toBe(response);
  expect(starts).toBe(1);
  await entry.stop();
});

test("quarantined startup is redacted and retried after a bounded cooldown", async () => {
  const clock = vi.spyOn(performance, "now").mockReturnValue(0);
  let starts = 0;
  const entry = createNeonEntrypoint(async () => {
    if (++starts === 1) throw new Error("secret database credential");
    return { fetch: async () => new Response("active"), stop: async () => {} };
  });
  try {
    const unavailable = await entry.fetch(new Request("https://app.test"));
    expect(unavailable.status).toBe(503);
    expect(await unavailable.text()).toBe("Service unavailable");
    expect(unavailable.headers.get("retry-after")).toBe("1");
    expect((await entry.fetch(new Request("https://app.test"))).status).toBe(503);
    expect(starts).toBe(1);
    clock.mockReturnValue(1001);
    expect(await (await entry.fetch(new Request("https://app.test"))).text()).toBe("active");
    expect(starts).toBe(2);
  } finally {
    clock.mockRestore();
    await entry.stop();
  }
});

test("shutdown drains an in-progress startup and never serves its completed application", async () => {
  let closed = 0;
  let served = 0;
  const application = {
    fetch: async () => {
      served++;
      return new Response("active");
    },
    stop: async () => {
      closed++;
    },
  };
  const startup = Promise.withResolvers<typeof application>();
  const entry = createNeonEntrypoint(async () => startup.promise);
  const pending = entry.fetch(new Request("https://app.test"));
  const stopping = entry.stop();
  expect(entry.stop()).toBe(stopping);
  startup.resolve(application);
  expect((await pending).status).toBe(503);
  await stopping;
  expect(closed).toBe(1);
  expect(served).toBe(0);
  expect((await entry.fetch(new Request("https://app.test"))).status).toBe(503);
});
