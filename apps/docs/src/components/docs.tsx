import { navigate } from "astro:transitions/client";
import type { Root } from "fumadocs-core/page-tree";
import type { TOCItemType } from "fumadocs-core/toc";
import { DocsLayout } from "fumadocs-ui/layouts/notebook";
import { DocsPage } from "fumadocs-ui/layouts/notebook/page";
import { RootProvider } from "fumadocs-ui/provider/astro";
import type { ReactNode } from "react";
import { DocumentationSearch } from "./search";
import { Brand } from "./brand";

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
      theme={{ defaultTheme: "system", enableSystem: true }}
      search={{ SearchDialog: DocumentationSearch }}
    >
      <DocsLayout tree={tree} nav={{ title: <Brand />, url: "/" }} themeSwitch={{ enabled: true }}>
        <DocsPage toc={toc} tableOfContent={{ style: "clerk" }} tableOfContentPopover={{ style: "clerk" }}>
          {children}
        </DocsPage>
      </DocsLayout>
    </RootProvider>
  );
}
