'use client';

import { useEffect, useState } from "react";
import { getFeedConfessions, Confession } from "./actions";
import { ConfessionCard } from "@/components/confessions/ConfessionCard";
import { SatirEmptyState } from "@/components/satir";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";

export default function FeedPage() {
    const { user, isLoading: authLoading } = useAuth();
    const router = useRouter();
    const supabase = createClient();

    const [confessions, setConfessions] = useState<Confession[]>([]);
    const [followedMaskIds, setFollowedMaskIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        const fetchFeed = async () => {
            if (!user) return;
            setLoading(true);
            const data = await getFeedConfessions();
            setConfessions(data);

            const { data: userVeilles } = await supabase
                .from('veilles')
                .select('mask_id')
                .eq('user_id', user.id);

            setFollowedMaskIds(new Set(userVeilles?.map((v: any) => v.mask_id) || []));
            setLoading(false);
        };

        if (user) {
            fetchFeed();
        }
    }, [user, supabase]);

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
