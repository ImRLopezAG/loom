import { navigate } from "astro:transitions/client";
import type { Root } from "fumadocs-core/page-tree";
import type { TOCItemType } from "fumadocs-core/toc";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { DocsPage } from "fumadocs-ui/layouts/docs/page";
import { RootProvider } from "fumadocs-ui/provider/astro";
import type { ReactNode } from "react";
import { DocumentationSearch } from "./search";

export function Docs({
  tree,
  pathname,
  toc,
  children,
}: {
  tree: Root;
  pathname: string;
  toc: TOCItemType[];
  children: ReactNode;
}) {
  return (
    <RootProvider
      pathname={pathname}
      navigate={navigate}
      theme={{ enabled: false }}
      search={{ SearchDialog: DocumentationSearch }}
    >
      <DocsLayout tree={tree} nav={{ title: "Loom", url: "/" }} themeSwitch={{ enabled: false }}>
        <DocsPage toc={toc}>{children}</DocsPage>
      </DocsLayout>
    </RootProvider>
  );
}
