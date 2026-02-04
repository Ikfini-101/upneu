import { getFeedConfessions } from "./actions";
import { ConfessionCard } from "@/components/confessions/ConfessionCard";
import { ConfessionComposer } from "@/components/confessions/ConfessionComposer";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";


// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic';

export default async function FeedPage() {
    // Check if user has a mask
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        const { data: mask } = await supabase.from('masks').select('id').eq('user_id', user.id).single();
        if (!mask) {
            redirect('/wizard');
        }
    } else {
        redirect('/login');
    }

    const confessions = await getFeedConfessions();

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Background Elements */}
            <div className="fixed top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            <main className="max-w-2xl mx-auto p-4 pb-24 space-y-8 relative z-10">
                <header className="pt-4 pb-4">
                    {/* Header is now global, but we can keep a page title */}
                    {/* <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                        Fil de Confessions
                    </h1> */}
                    <p className="text-muted-foreground mt-2 text-center text-sm">
                        Écoutes, soutiens et conseils anonymes.
                    </p>
                </header>

                <section className="space-y-6">
                    {confessions.length === 0 ? (
                        <div className="text-center py-20 opacity-50">
                            <p>Aucune confession pour le moment.</p>
                            <p className="text-sm">Soyez le premier à parler.</p>
                        </div>
                    ) : (
                        confessions.map((confession, index) => (
                            <ConfessionCard key={confession.id} confession={confession} index={index} />
                        ))
                    )}
                </section>
            </main>

            <ConfessionComposer />
        </div>
    );
}
