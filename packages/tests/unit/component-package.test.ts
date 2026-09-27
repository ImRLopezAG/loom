import { expect, test } from "vite-plus/test";
import { defineComponent, defineComponentPackage, getComponentPackage } from "loom/server";

const descriptor = {
  formatVersion: 1,
  definitionVersion: "1.0.0",
  entry: "@fixture/service",
  contractRegistry: "@fixture/service/contracts",
  contracts: [],
  procedures: [],
  bindings: {},
} as const;

test("compiled descriptors preserve definition identity and reject unsupported formats", () => {
  const component = defineComponent({ name: "service", services: () => ({ greet: () => "hello" }) });
  expect(defineComponentPackage(component, descriptor)).toBe(component);
  expect(getComponentPackage(component)?.definitionVersion).toBe("1.0.0");
  expect(Object.isFrozen(getComponentPackage(component)?.contracts)).toBe(true);
  expect(() => defineComponentPackage(component, descriptor)).toThrow("already has");
  expect(() =>
    defineComponentPackage(defineComponent({ name: "future" }), {
      ...descriptor,
      // @ts-expect-error Future formats must be rejected at runtime as well as compilation.
      formatVersion: 2,
    }),
  ).toThrow("Unsupported");
});

test("compiled descriptors reject source paths and traversal in public entries", () => {
  for (const entry of ["../source", "/private/module", "file:///source", "@fixture/service/../secret"]) {
    expect(() => defineComponentPackage(defineComponent({ name: "invalid" }), { ...descriptor, entry })).toThrow();
  }
});
