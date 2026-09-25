import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./style.css";
export const metadata = { title: "Loom · Next.js" };
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
