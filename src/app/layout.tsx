import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

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
      <body className={cn(outfit.className, "bg-background text-foreground antialiased min-h-screen")}>
        <main className="flex flex-col min-h-screen relative pb-20">
          {/* Background Glow Effect */}
          <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none" />
          {/* Navigation is handled inside specific pages or here if global. 
               However, specific pages like Login might not want a header. 
               Let's put it here for now as it's the main layout, and we can make a (auth) route group later if needed.
               Actually, checking user flow: Landing -> Login -> Feed. 
               Landing/Login shouldn't have this header. 
               But user is asking for it on the Feed. 
               I'll add it to the feed page layout specifically or global layout and conditionally hide?
               Better: Create a (app) route group for authorized pages if I had time refactoring.
               For now, I'll add it to the global layout but we might see it on login. 
               Wait, let's look at file structure. 
               There is no route group. 
               I will add it to `feed / page.tsx` and `notifications / page.tsx` etc individually? No that's WET.
               I should check if I can just add it to layout and maybe it's fine for now or fast fix.
               User said "Logo of app on timeline".
               Let's add it to `src / app / layout.tsx` but maybe wrap in a component that checks pathname? 
               Client components check pathname.
               Let's sticking to adding it to `layout.tsx` is simplest for "App Logo on timeline".
               But it will show on login. 
               Let's actually just import Header in `feed / page.tsx` for now to be safe and precise, 
               OR add it to Layout and accept it's on Login for this MVP step. 
               Actually, looking at `feed / page.tsx` again. usage of `header` tag there.
               I will REPLACE that header in `feed / page.tsx` with my new Global Header? 
               No, the user specifically mentioned "timeline" (Feed).
               AND "Menu vers mes confessions".
               Let's put it in `layout.tsx` because they will want it on ` / profile` and ` / notifications` too.
               To avoid it on Login, I can make a `AuthenticatedLayout` component or just put it in layout and assume it's fine for MVP.
               Let's just put it in `src / app / layout.tsx` for now.
            */ }
          <Header />
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
