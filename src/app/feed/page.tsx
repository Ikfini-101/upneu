'use client';

import { useEffect } from "react";
import { ConfessionCard } from "@/components/confessions/ConfessionCard";
import { SatirEmptyState } from "@/components/satir";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { useFeed } from "@/contexts/FeedContext";

export default function FeedPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const { confessions, followedMaskIds, loading, scrollPosition, setScrollPosition } = useFeed();

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login');
            return;
        }

        if (user) {
            const checkMask = async () => {
                const { data: mask } = await supabase.from('masks').select('id').eq('user_id', user.id).single();
                if (!mask) {
                    router.replace('/wizard');
                }
            };
            checkMask();
        }
    }, [user, authLoading, router, supabase]);

    // Restore scroll position when data is available
    useEffect(() => {
        if (!loading && confessions.length > 0) {
            // Use setTimeout to ensure the browser paints the DOM first before attempting horizontal/vertical scroll
            const timeoutId = setTimeout(() => {
                window.scrollTo({ top: scrollPosition, behavior: 'instant' });
            }, 0);
            return () => clearTimeout(timeoutId);
        }
    }, [loading, confessions.length, scrollPosition]);

    // Track scroll position
    useEffect(() => {
        const handleScroll = () => {
            setScrollPosition(window.scrollY);
        };

        // Throttling could be added here, but passive: true helps
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [setScrollPosition]);

    if (authLoading || loading) {
        return <div className="flex h-screen items-center justify-center p-4">Chargement...</div>;
    }

    if (!user) {
        return null; // Will redirect
    }

    return (
        <div className="bg-background relative">
            {/* Background Elements */}
            <div className="fixed top-0 left-0 w-full h-[300px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

            <main className="max-w-2xl mx-auto p-4 pb-24 space-y-8 relative z-10">
                <header className="pt-4 pb-4">
                    <p className="text-muted-foreground mt-2 text-center text-sm">
                        Écoutes, soutiens et conseils anonymes.
                    </p>
                </header>

                <section className="space-y-6">
                    {confessions.length === 0 ? (
                        <SatirEmptyState
                            message="Aucune confession pour le moment"
                            submessage="Soyez le premier à partager"
                        />
                    ) : (
                        confessions.map((confession, index) => (
                            <ConfessionCard
                                key={confession.id}
                                confession={confession}
                                index={index}
                                currentUserId={user.id}
                                isFollowed={confession.mask ? followedMaskIds.has(confession.mask.id) : false}
                            />
                        ))
                    )}
                </section>
            </main>
        </div>
    );
}
