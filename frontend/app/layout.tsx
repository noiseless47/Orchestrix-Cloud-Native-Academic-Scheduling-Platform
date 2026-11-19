import "@/styles/globals.css";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import { Metadata } from "next";
import AppShell from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Orchestrix | Cloud-Native Academic Scheduling Platform",
  description: "Plan and manage academic schedules with Orchestrix.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="min-h-screen bg-background text-foreground">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
