import type { Metadata } from "next";
import "@fontsource/outfit/latin-400.css";
import "@fontsource/outfit/latin-ext-400.css";
import "@fontsource/outfit/latin-500.css";
import "@fontsource/outfit/latin-ext-500.css";
import "@fontsource/outfit/latin-600.css";
import "@fontsource/outfit/latin-ext-600.css";
import "@fontsource/outfit/latin-700.css";
import "@fontsource/outfit/latin-ext-700.css";
import "@fontsource/outfit/latin-800.css";
import "@fontsource/outfit/latin-ext-800.css";
import "./globals.css";
import { AppShell } from "@/components/shell/AppShell";
import { StudioProvider } from "@/components/providers/StudioProvider";

export const metadata: Metadata = {
  title: "SwapFace — Adım Adım Video Yüz Değiştirme",
  description:
    "Trend kliplerde veya kendi videonda seçtiğin yüzü, kendi fotoğrafınla değiştiren stüdyo.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <StudioProvider>
          <AppShell>{children}</AppShell>
        </StudioProvider>
      </body>
    </html>
  );
}
