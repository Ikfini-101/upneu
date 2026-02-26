import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center sm:p-20 font-[family-name:var(--font-outfit)]">
      <main className="flex flex-col gap-8 items-center max-w-md w-full">
        <h1 className="text-5xl font-bold tracking-tighter bg-gradient-to-br from-white to-white/50 bg-clip-text text-transparent">
          ANO
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          La parole est libérée quand le visage est masqué.
        </p>

        <div className="flex gap-4 w-full">
          <Link href="/login" className="w-full">
            <Button className="w-full transition-all hover:scale-105 shadow-[0_0_20px_rgba(var(--primary),0.3)]" size="lg">
              Commencer
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
