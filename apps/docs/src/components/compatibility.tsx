import { RootProvider } from "fumadocs-ui/provider/astro";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { DocsPage } from "fumadocs-ui/layouts/docs/page";

export function Compatibility() {
  return (
    <RootProvider pathname="/" params={{}} theme={{ enabled: false }} search={{ enabled: false }}>
      <DocsLayout tree={{ name: "Loom", children: [] }} nav={{ title: "Loom" }} themeSwitch={{ enabled: false }}>
        <DocsPage>
          <h1>Loom</h1>
          <p>Framework implementation in progress. This page verifies the Astro and Fumadocs integration.</p>
        </DocsPage>
      </DocsLayout>
    </RootProvider>
  );
}
