import { expect, test } from "vite-plus/test";
import { z } from "zod";
import { defineApplication, defineComponent, sealComponentGraph } from "loom/server";

const application = () => defineApplication({ rpc: ({ os }) => ({ os }) });

test("mounting is explicit and never initializes services during graph compilation", () => {
  let acquisitions = 0;
  const sdk = defineComponent({
    name: "identity",
    services: () => {
      acquisitions++;
      return { client: { users: () => [] } };
    },
  });
  expect(sealComponentGraph(application()).nodes).toEqual([]);
  const app = application();
  const first = app.use(sdk);
  const second = app.use(sdk, { name: "staffIdentity" });
  const graph = sealComponentGraph(app);
  expect(graph.nodes.map((node) => node.path)).toEqual(["identity", "staffIdentity"]);
  expect(graph.nodes.map((node) => node.reference)).toEqual([first, second]);
  expect(acquisitions).toBe(0);
  expect(sealComponentGraph(app)).toBe(graph);
  expect(() => app.use(sdk, { name: "late" })).toThrow(/sealed/);
});

test("component instances preserve separate options and explicit dependencies", () => {
  const sdk = defineComponent({ name: "sdk", options: z.object({ region: z.string() }) });
  const worker = defineComponent({ name: "worker" });
  const app = application();
  const eu = app.use(sdk, { options: { region: "eu" } });
  app.use(sdk, { name: "us", options: { region: "us" } });
  app.use(worker, { dependencies: { identity: eu } });
  const graph = sealComponentGraph(app);
  expect(graph.nodes.map((node) => node.options)).toEqual([{ region: "eu" }, { region: "us" }, undefined]);
  expect(graph.nodes[2]?.dependencies.identity).toBe(eu);
});

test("duplicate and reserved mount names are rejected", () => {
  const app = application();
  const child = defineComponent({ name: "child" });
  app.use(child);
  expect(() => app.use(child)).toThrow(/Duplicate.*child/);
  for (const name of ["__proto__", "constructor", "prototype", "internal", "rpc", "a/b", ""]) {
    expect(() => app.use(child, { name })).toThrow(/name/);
  }
});

test("cycles, forged definitions and references, and foreign dependencies fail closed", () => {
  const first = defineComponent({ name: "first" });
  const second = defineComponent({ name: "second" });
  first.use(second);
  second.use(first);
  const cyclic = application();
  cyclic.use(first);
  expect(() => sealComponentGraph(cyclic)).toThrow(/cycle.*first\/second\/first/i);
  // Compilation failure must not seal unrelated definitions or the root.
  const recovery = defineComponent({ name: "recovery" });
  cyclic.use(recovery);
  first.use(recovery);
  const app = application();
  // @ts-expect-error A component must originate from defineComponent.
  expect(() => app.use({ name: "forged" })).toThrow(/defineComponent/);
  const child = defineComponent({ name: "child" });
  // @ts-expect-error Structural objects cannot forge mount references.
  expect(() => app.use(child, { dependencies: { invalid: { name: "fake" } } })).toThrow(/reference/);
  const foreign = application().use(child);
  app.use(child, { dependencies: { foreign } });
  expect(() => sealComponentGraph(app)).toThrow(/outside.*child/);
  const forged = { ...child };
  expect(() => application().use(forged)).toThrow(/defineComponent/);
});

test("nested mounts expand per instance and declarations seal atomically", () => {
  const parent = defineComponent({ name: "parent" });
  const child = defineComponent({ name: "child" });
  parent.use(child);
  const app = application();
  app.use(parent);
  app.use(parent, { name: "other" });
  expect(sealComponentGraph(app).nodes.map((node) => node.path)).toEqual([
    "parent",
    "parent/child",
    "other",
    "other/child",
  ]);
  expect(() => parent.use(child, { name: "later" })).toThrow(/sealed/);
});
