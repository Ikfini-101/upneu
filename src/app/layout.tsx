import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/layout/AppLayout";

const outfit = Outfit({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ANO",
  description: "Réseau social à masques et anonymat structuré",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className={cn(outfit.className, "satir-bg-weave bg-background text-foreground antialiased min-h-screen")}>
        <AppLayout>
          <main className="flex flex-col min-h-screen relative pb-20">
            {/* Background Glow Effect */}
            <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none" />

            {children}
          </main>
        </AppLayout>
      </body>
    </html>
  );
}
